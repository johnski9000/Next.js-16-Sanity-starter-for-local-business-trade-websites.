import {describe, expect, it} from 'vitest'

import {buildDeliveryRoutes, deliveryStatus, type MailConfig} from './leads-routing'

const fullMail: MailConfig = {
  host: 'smtp.acme.co.uk',
  user: 'enquiries@acme.co.uk',
  pass: 'secret',
  port: 587,
  fromName: 'Acme Plumbing',
  leadEmail: 'leads@acme.co.uk',
}

describe('buildDeliveryRoutes', () => {
  it('builds the client SMTP route when host+user+pass are all present', () => {
    const routes = buildDeliveryRoutes({mail: fullMail, tenantKey: 'acme', business: 'Acme'})
    expect(routes).toHaveLength(1)
    expect(routes[0].label).toBe('tenant:acme')
    expect(routes[0].isAgency).toBeUndefined()
    expect(routes[0].from).toBe('"Acme Plumbing" <enquiries@acme.co.uk>')
    expect(routes[0].to).toBe('leads@acme.co.uk')
    expect(routes[0].transport).toMatchObject({
      host: 'smtp.acme.co.uk',
      port: 587,
      secure: false, // 587 → STARTTLS
      auth: {user: 'enquiries@acme.co.uk', pass: 'secret'},
    })
  })

  it('orders client SMTP first, then the agency dead-letter fallback', () => {
    const routes = buildDeliveryRoutes({
      mail: fullMail,
      tenantKey: 'acme',
      agencyEmail: 'agency@gmail.com',
      agencyPassword: 'app-pw',
    })
    expect(routes.map((r) => r.label)).toEqual(['tenant:acme', 'agency-fallback'])
    expect(routes[1].isAgency).toBe(true)
    // The agency relay SENDS via Gmail but DELIVERS to the business (the tenant's
    // leadEmail), not to the agency inbox.
    expect(routes[1].to).toBe('leads@acme.co.uk')
    expect(routes[1].from).toContain('agency@gmail.com')
    expect(routes[1].transport).toMatchObject({service: 'gmail'})
  })

  it('uses ONLY the agency fallback when the tenant has no mail config', () => {
    const routes = buildDeliveryRoutes({
      mail: null,
      agencyEmail: 'agency@gmail.com',
      agencyPassword: 'app-pw',
    })
    expect(routes).toHaveLength(1)
    expect(routes[0].isAgency).toBe(true)
  })

  it('agency relay delivery target: leadEmail > NODEMAILER_TO > agency inbox', () => {
    const base = {agencyEmail: 'agency@gmail.com', agencyPassword: 'app-pw'}
    // leadEmail wins
    expect(
      buildDeliveryRoutes({...base, mail: {leadEmail: 'leads@acme.co.uk'}, agencyTo: 'owner@biz.co.uk'})[0].to,
    ).toBe('leads@acme.co.uk')
    // no leadEmail → NODEMAILER_TO
    expect(buildDeliveryRoutes({...base, mail: null, agencyTo: 'owner@biz.co.uk'})[0].to).toBe('owner@biz.co.uk')
    // neither → the agency inbox itself
    expect(buildDeliveryRoutes({...base, mail: null})[0].to).toBe('agency@gmail.com')
  })

  it('returns [] when there is no client SMTP and no agency fallback', () => {
    expect(buildDeliveryRoutes({mail: null})).toEqual([])
    expect(buildDeliveryRoutes({mail: {host: 'x', user: 'y'} /* no pass */})).toEqual([])
  })

  it('skips the tenant route on a partial mail block (missing pass) but keeps the fallback', () => {
    const routes = buildDeliveryRoutes({
      mail: {host: 'smtp.x', user: 'u@x'}, // no pass
      agencyEmail: 'agency@gmail.com',
      agencyPassword: 'pw',
    })
    expect(routes.map((r) => r.label)).toEqual(['agency-fallback'])
  })

  it('defaults secure=true on port 465 and defaults port to 465', () => {
    const r465 = buildDeliveryRoutes({mail: {host: 'h', user: 'u', pass: 'p', port: 465}})
    expect(r465[0].transport).toMatchObject({port: 465, secure: true})
    const rDefault = buildDeliveryRoutes({mail: {host: 'h', user: 'u', pass: 'p'}})
    expect(rDefault[0].transport).toMatchObject({port: 465, secure: true})
  })

  it('honours an explicit secure flag over the port heuristic', () => {
    const routes = buildDeliveryRoutes({mail: {host: 'h', user: 'u', pass: 'p', port: 465, secure: false}})
    expect(routes[0].transport).toMatchObject({secure: false})
  })

  it('falls back to=user when leadEmail is blank, and a generic From when no names', () => {
    const routes = buildDeliveryRoutes({mail: {host: 'h', user: 'u@x', pass: 'p'}})
    expect(routes[0].to).toBe('u@x')
    expect(routes[0].from).toBe('"Website enquiry" <u@x>')
  })

  it('uses the business name in From when fromName is absent', () => {
    const routes = buildDeliveryRoutes({mail: {host: 'h', user: 'u@x', pass: 'p'}, business: 'Beta Co'})
    expect(routes[0].from).toBe('"Beta Co" <u@x>')
  })
})

describe('deliveryStatus', () => {
  it('maps send outcomes to a status', () => {
    expect(deliveryStatus(true, false)).toBe('sent')
    expect(deliveryStatus(true, true)).toBe('dead-letter')
    expect(deliveryStatus(false, false)).toBe('failed')
    expect(deliveryStatus(false, true)).toBe('failed')
  })
})
