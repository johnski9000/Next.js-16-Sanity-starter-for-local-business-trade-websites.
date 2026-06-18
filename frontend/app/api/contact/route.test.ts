import {describe, it, expect, vi, beforeEach, afterAll} from 'vitest'

// The /api/contact POST handler is the revenue engine: honeypot/validation/origin
// guards + the SMTP -> agency dead-letter -> control-sink failover. This locks that
// orchestration so a refactor can't silently start losing leads. The pure routing
// math lives in leads-routing.ts (used real here); we mock the I/O edges.
const h = vi.hoisted(() => ({
  sendMail: vi.fn(),
  getTenantMail: vi.fn(),
  getTenantLeadStore: vi.fn(),
  persistLead: vi.fn(),
  persistDeadLetter: vi.fn(),
  captureException: vi.fn(),
}))

vi.mock('nodemailer', () => ({default: {createTransport: () => ({sendMail: h.sendMail})}}))
vi.mock('@/sanity/lib/tenant-client', () => ({
  getTenantMail: h.getTenantMail,
  getTenantLeadStore: h.getTenantLeadStore,
  persistLead: h.persistLead,
  persistDeadLetter: h.persistDeadLetter,
}))
vi.mock('@sentry/nextjs', () => ({
  withScope: (fn: (s: {setTag: () => void; setContext: () => void}) => void) =>
    fn({setTag: () => {}, setContext: () => {}}),
  captureException: h.captureException,
}))

import {POST} from './route'

const CLIENT_MAIL = {
  key: 't-key',
  siteName: 'Acme Plumbing',
  mail: {host: 'smtp.acme.test', port: 465, secure: true, user: 'u', pass: 'p'},
}
const STORE = {key: 't-key', projectId: 'proj', dataset: 'production', writeToken: 'w'}
const validBody = {
  name: 'Jo Bloggs',
  email: 'jo@example.com',
  phone: '01234 567890',
  service: 'Boiler repair',
  message: 'My boiler has stopped working, please can you help this week.',
  consent: true,
}

let hostCounter = 0
function makeReq(body: Record<string, unknown>): Request {
  // Unique host per call so the in-memory per-(host:ip) rate limiter never bleeds
  // across tests; origin === host so the same-origin guard passes.
  const host = `t${hostCounter++}.example.com`
  return new Request(`https://${host}/api/contact`, {
    method: 'POST',
    headers: {'content-type': 'application/json', origin: `https://${host}`, host},
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('NODEMAILER_EMAIL', 'agency@jw.test')
  vi.stubEnv('NODEMAILER_PASSWORD', 'agencypass')
  // Defaults: a fully-working client (overridden per test).
  h.getTenantMail.mockResolvedValue(CLIENT_MAIL)
  h.getTenantLeadStore.mockResolvedValue(STORE)
  h.persistLead.mockResolvedValue({ok: true, id: 'lead-1'})
  h.persistDeadLetter.mockResolvedValue({ok: true})
  h.sendMail.mockResolvedValue({messageId: 'm1', accepted: ['x'], rejected: []})
})
afterAll(() => vi.unstubAllEnvs())

describe('POST /api/contact', () => {
  it('rejects spam via the honeypot with a fake 200 and no email', async () => {
    const res = await POST(makeReq({...validBody, website_url: 'http://spam'}))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ok: true})
    expect(h.sendMail).not.toHaveBeenCalled()
  })

  it('400s invalid input (missing fields / short message)', async () => {
    const res = await POST(makeReq({name: '', email: 'nope', phone: '', service: '', message: 'hi'}))
    expect(res.status).toBe(400)
    expect(h.sendMail).not.toHaveBeenCalled()
  })

  it('delivers via client SMTP and persists the lead, keyed by idempotencyKey', async () => {
    const key = '11111111-1111-4111-8111-111111111111'
    const res = await POST(makeReq({...validBody, idempotencyKey: key}))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ok: true})
    expect(h.sendMail).toHaveBeenCalled() // lead (+ branded auto-ack on client SMTP)
    expect(h.persistLead).toHaveBeenCalledTimes(1)
    const [, doc] = h.persistLead.mock.calls[0]
    expect(doc._id).toBe(key)
    expect(doc.deliveryStatus).toBeTruthy()
    expect(h.persistDeadLetter).not.toHaveBeenCalled()
  })

  it('falls back to the agency dead-letter when client SMTP fails (still 200)', async () => {
    h.sendMail.mockRejectedValueOnce(new Error('client smtp down')) // client route
    h.sendMail.mockResolvedValueOnce({messageId: 'm2', accepted: ['x'], rejected: []}) // agency route
    const res = await POST(makeReq(validBody))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ok: true})
    expect(h.sendMail).toHaveBeenCalledTimes(2) // client (fail) -> agency (ok); no auto-ack on agency
    expect(h.persistDeadLetter).not.toHaveBeenCalled()
  })

  it('502s when ALL routes fail, and captures the lead in the control sink + Sentry', async () => {
    h.sendMail.mockRejectedValue(new Error('all smtp down'))
    h.persistLead.mockResolvedValue({ok: false, error: 'no-store'})
    const res = await POST(makeReq(validBody))
    expect(res.status).toBe(502)
    expect(h.persistDeadLetter).toHaveBeenCalledTimes(1)
    expect(h.captureException).toHaveBeenCalled()
  })

  it('502s with no delivery route at all (no client SMTP, no agency creds)', async () => {
    vi.stubEnv('NODEMAILER_EMAIL', '')
    vi.stubEnv('NODEMAILER_PASSWORD', '')
    h.getTenantMail.mockResolvedValue({key: 't-key', siteName: 'Acme'}) // no .mail
    const res = await POST(makeReq(validBody))
    expect(res.status).toBe(500)
    expect(h.sendMail).not.toHaveBeenCalled()
  })
})
