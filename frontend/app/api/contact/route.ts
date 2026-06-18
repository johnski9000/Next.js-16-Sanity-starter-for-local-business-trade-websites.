import {NextResponse} from 'next/server'
import nodemailer from 'nodemailer'
import {z} from 'zod'
import * as Sentry from '@sentry/nextjs'

import {
  getTenantMail,
  getTenantLeadStore,
  persistLead,
  persistDeadLetter,
} from '@/sanity/lib/tenant-client'
import {normaliseHost} from '@/sanity/lib/tenants'
import {buildDeliveryRoutes, deliveryStatus, type DeliveryRoute} from '@/lib/leads-routing'

export const runtime = 'nodejs'

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(160),
  phone: z.string().min(1).max(40),
  service: z.string().min(1).max(80),
  message: z.string().min(10).max(5000),
  // GDPR consent flag from the form (forms enforce it; kept optional here so a
  // stale cached page can't 400 and lose a lead — the value is recorded below).
  consent: z.boolean().optional(),
  // Optional context / quote fields
  area: z.string().max(120).optional(),
  propertyType: z.string().max(80).optional(),
  sourceUrl: z.string().max(300).optional(),
  turnstileToken: z.string().max(4000).optional(),
  // Client-generated idempotency key (UUID) — dedupes the stored lead if the same
  // submission is replayed. Optional so older cached pages still submit.
  idempotencyKey: z.string().uuid().optional(),
  // Honeypot — `website_url`, not `company`. Password managers and browser
  // autofill recognise "company" as a business-name field and fill it,
  // silently triggering the spam guard for legit users. A non-standard
  // name leaves autofill alone.
  website_url: z.string().max(300).optional(),
  _context: z
    .object({
      area: z.string().max(120).optional(),
      sourceUrl: z.string().max(300).optional(),
    })
    .optional(),
})

const escapeHtml = (str: string) =>
  str.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      default: return '&#39;'
    }
  })

async function verifyTurnstile(token: string | undefined, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  // Turnstile is OPTIONAL. With no secret configured we skip it and rely on the
  // honeypot + per-IP rate limit for spam defence. Set TURNSTILE_SECRET_KEY +
  // NEXT_PUBLIC_TURNSTILE_SITE_KEY to enforce a CAPTCHA challenge.
  if (!secret) return true
  if (!token) return false
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({
        secret,
        response: token,
        ...(ip ? {remoteip: ip} : {}),
      }),
    })
    const data = (await res.json()) as {success?: boolean}
    return Boolean(data.success)
  } catch {
    return false
  }
}

// Per-(tenant+IP) rate limit. Uses Upstash Redis (cross-instance — correct on
// serverless) when UPSTASH_REDIS_REST_URL/_TOKEN are set; otherwise falls back to a
// best-effort in-memory limiter (per server instance). Fails OPEN on an Upstash
// error so a limiter outage never drops genuine leads.
const RATE_LIMIT = {max: 5, windowMs: 10 * 60 * 1000}
const rateHits = new Map<string, number[]>()
function isRateLimitedMemory(key: string): boolean {
  const now = Date.now()
  const recent = (rateHits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs)
  recent.push(now)
  rateHits.set(key, recent)
  if (rateHits.size > 5000) {
    for (const [k, v] of rateHits) {
      if (v.every((t) => now - t >= RATE_LIMIT.windowMs)) rateHits.delete(k)
    }
  }
  return recent.length > RATE_LIMIT.max
}

async function isRateLimited(key: string): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const tok = process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && tok) {
    try {
      const headers = {Authorization: `Bearer ${tok}`}
      const k = encodeURIComponent(`rl:contact:${key}`)
      const res = await fetch(`${url}/incr/${k}`, {method: 'POST', headers})
      const {result} = (await res.json()) as {result: number}
      if (result === 1) {
        // Set the window TTL on first hit (fixed window).
        await fetch(`${url}/expire/${k}/${Math.ceil(RATE_LIMIT.windowMs / 1000)}`, {
          method: 'POST',
          headers,
        })
      }
      return result > RATE_LIMIT.max
    } catch {
      // Upstash unreachable → fall back to in-memory rather than block.
    }
  }
  return isRateLimitedMemory(key)
}

// Optional out-of-band alert (Slack / Discord / generic webhook) so the agency
// hears IMMEDIATELY when a client's lead delivery breaks — independent of email,
// which is exactly what's failing. The payload carries the full enquiry, so a
// lead is recoverable even if every email route is down. Set LEAD_ALERT_WEBHOOK_URL.
async function sendLeadAlert(opts: {
  severity: 'critical' | 'warning'
  reason: string
  business: string
  host: string
  lead: Record<string, string | undefined>
}): Promise<void> {
  const url = process.env.LEAD_ALERT_WEBHOOK_URL
  if (!url) return
  const icon = opts.severity === 'critical' ? '🚨' : '⚠️'
  const text =
    `${icon} Lead delivery ${opts.severity} — ${opts.business || opts.host}\n` +
    `${opts.reason}\n` +
    `${opts.lead.name ?? ''} · ${opts.lead.email ?? ''} · ${opts.lead.phone ?? ''}\n` +
    `Service: ${opts.lead.service ?? ''}${opts.lead.area ? ` · ${opts.lead.area}` : ''}\n` +
    `Message: ${opts.lead.message ?? ''}`
  try {
    // `text` (Slack) + `content` (Discord) + structured fields (generic consumers).
    await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({text, content: text, ...opts}),
    })
  } catch (err) {
    console.error('Contact form: lead alert webhook failed', err)
  }
}

export async function POST(req: Request) {
  // Per-tenant SMTP (the client's own mailbox) is the primary path; the agency
  // Gmail (NODEMAILER_*) is an optional dead-letter fallback. So neither is
  // required up front — we only fail if NO delivery route exists (checked below).
  const {NODEMAILER_EMAIL, NODEMAILER_PASSWORD} = process.env

  // Same-origin guard: reject cross-site POSTs (the Origin must match the host
  // this request was served on). Browsers always send Origin on POST; a missing
  // Origin (non-browser/server-to-server) is allowed, with the honeypot + per-IP
  // rate limit as backstops.
  const reqHost = normaliseHost(req.headers.get('x-tenant-host') || req.headers.get('host') || '')
  const originHeader = req.headers.get('origin')
  if (originHeader) {
    let originHost = ''
    try {
      originHost = normaliseHost(new URL(originHeader).host)
    } catch {
      originHost = ''
    }
    if (originHost && reqHost && originHost !== reqHost) {
      return NextResponse.json({error: 'Cross-origin request rejected'}, {status: 403})
    }
  }

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({error: 'Invalid JSON'}, {status: 400})
  }

  // Honeypot: hidden "website_url" field. Bots fill it; humans never see it.
  // Pretend success so bots get no signal — but log it so we can spot the
  // case where autofill triggers the trap on a real user.
  const honeypot = (payload as {website_url?: unknown; company?: unknown} | null)
  const hpValue =
    (typeof honeypot?.website_url === 'string' && honeypot.website_url) ||
    (typeof honeypot?.company === 'string' && honeypot.company) ||
    ''
  if (hpValue.trim() !== '') {
    console.warn(
      `Contact form: honeypot tripped (value=${JSON.stringify(hpValue).slice(0, 80)}). ` +
        'No email sent. If this is legit user traffic, autofill is filling the hidden field.',
    )
    return NextResponse.json({ok: true})
  }

  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      {error: 'Validation failed', issues: parsed.error.flatten()},
      {status: 400},
    )
  }

  const ip =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null

  if (await isRateLimited(`${reqHost}:${ip ?? 'noip'}`)) {
    return NextResponse.json(
      {error: 'Too many requests — please try again in a few minutes.'},
      {status: 429},
    )
  }

  const human = await verifyTurnstile(parsed.data.turnstileToken, ip)
  if (!human) {
    return NextResponse.json({error: 'Verification failed'}, {status: 400})
  }

  const {name, email, phone, service, message, consent} = parsed.data
  const area = parsed.data.area || parsed.data._context?.area
  const sourceUrl = parsed.data.sourceUrl || parsed.data._context?.sourceUrl
  const propertyType = parsed.data.propertyType
  const submittedAt = new Date().toISOString()

  // Resolve which client this enquiry belongs to (from the request host) and
  // look up their own SMTP config. Never throws into the request — a lookup
  // failure just means we fall back to the agency inbox.
  const host = req.headers.get('x-tenant-host') || req.headers.get('host') || ''
  let mailCfg: Awaited<ReturnType<typeof getTenantMail>> = null
  try {
    mailCfg = await getTenantMail(host)
  } catch (err) {
    console.error('Contact form: tenant mail lookup failed', err)
  }
  const business = mailCfg?.siteName || mailCfg?.key || ''
  const tenantHost = host.replace(/:\d+$/, '')

  const subject =
    `New enquiry${business ? ` — ${business}` : ''} — ${service}` +
    `${area ? ` — ${area}` : ''} — ${name}`

  const lines = [
    business ? `Business: ${business}` : null,
    tenantHost ? `Site: ${tenantHost}` : null,
    business || tenantHost ? '' : null,
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Service: ${service}`,
    area ? `Area: ${area}` : null,
    propertyType ? `Property: ${propertyType}` : null,
    sourceUrl ? `Submitted from: ${sourceUrl}` : null,
    `Submitted: ${submittedAt}`,
    `Consent to contact: ${consent ? 'yes (ticked on web form)' : 'not recorded'}`,
    '',
    'Message:',
    message,
  ].filter((l) => l !== null)

  const row = (label: string, value: string) =>
    `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>`

  const html = `
    <div style="font-family:system-ui,sans-serif;font-size:14px;color:#111">
      <h2 style="margin:0 0 12px">New website enquiry${business ? ` — ${escapeHtml(business)}` : ''}</h2>
      ${tenantHost ? row('Site', tenantHost) : ''}
      ${row('Name', name)}
      <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
      <p><strong>Phone:</strong> <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></p>
      ${row('Service', service)}
      ${area ? row('Area', area) : ''}
      ${propertyType ? row('Property', propertyType) : ''}
      ${sourceUrl ? row('Submitted from', sourceUrl) : ''}
      ${row('Submitted', submittedAt)}
      ${row('Consent to contact', consent ? 'yes (ticked on web form)' : 'not recorded')}
      <p style="margin-top:16px"><strong>Message:</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    </div>
  `

  // Delivery routes, in priority order (client's own SMTP, then the agency
  // dead-letter fallback). Pure logic lives in @/lib/leads-routing (tested).
  const m = mailCfg?.mail
  const routes = buildDeliveryRoutes({
    mail: m,
    tenantKey: mailCfg?.key,
    business,
    agencyEmail: NODEMAILER_EMAIL,
    agencyPassword: NODEMAILER_PASSWORD,
    agencyTo: process.env.NODEMAILER_TO,
  })

  if (routes.length === 0) {
    console.error(
      `Contact form: no delivery route for host "${tenantHost}" ` +
        '(tenant has no SMTP configured and no agency NODEMAILER_* fallback set).',
    )
    // No email route exists, but the enquiry must still be CAPTURED — never
    // silently lost. Persist into the site's own dataset first; the dead-letter is
    // a no-op on single-tenant (the own-project store is the durable backup).
    // Best-effort (never throw the request).
    let noRoutePersisted = false
    try {
      const store = await getTenantLeadStore(host)
      const result = await persistLead(store, {
        ...(parsed.data.idempotencyKey ? {_id: parsed.data.idempotencyKey} : {}),
        name,
        email,
        phone,
        service,
        area: area || undefined,
        propertyType: propertyType || undefined,
        message,
        sourceUrl: sourceUrl || undefined,
        submittedAt,
        consent: Boolean(consent),
        deliveryStatus: 'failed',
        handled: false,
      })
      noRoutePersisted = result.ok
      if (result.ok) {
        console.log(
          JSON.stringify({
            event: 'lead_persisted',
            tenant: mailCfg?.key ?? null,
            id: result.id,
            deliveryStatus: 'failed',
          }),
        )
      } else if (result.error !== 'no-store') {
        console.error(
          JSON.stringify({
            event: 'lead_persist_failed',
            tenant: mailCfg?.key ?? null,
            error: result.error,
          }),
        )
      }
    } catch (err) {
      console.error(
        JSON.stringify({
          event: 'lead_persist_failed',
          tenant: mailCfg?.key ?? null,
          error: String(err).slice(0, 200),
        }),
      )
    }
    if (!noRoutePersisted) {
      const dl = await persistDeadLetter({
        name,
        email,
        phone,
        service,
        area: area || undefined,
        propertyType: propertyType || undefined,
        message,
        sourceUrl: sourceUrl || undefined,
        submittedAt,
        consent: Boolean(consent),
        deliveryStatus: 'failed',
        tenantKey: mailCfg?.key ?? null,
      })
      console.log(
        JSON.stringify({
          event: dl.ok ? 'lead_deadletter_stored' : 'lead_deadletter_skipped',
          tenant: mailCfg?.key ?? null,
          note: dl.error ?? null,
        }),
      )
    }
    return NextResponse.json({error: 'Server email configuration missing'}, {status: 500})
  }

  const leadData: Record<string, string | undefined> = {
    name,
    email,
    phone,
    service,
    area,
    message,
    submittedAt,
    host: tenantHost,
    business,
  }

  let sent = false
  let deliveredDeadLetter = false
  let deliveredRoute: DeliveryRoute | null = null
  let lastErr: unknown = null
  for (const route of routes) {
    // The agency route used AFTER a tenant attempt already failed is a
    // dead-letter — flag it so the agency knows to forward to the client.
    const deadLetter = Boolean(route.isAgency && lastErr)
    try {
      const transporter = nodemailer.createTransport(
        route.transport as Parameters<typeof nodemailer.createTransport>[0],
      )
      const info = await transporter.sendMail({
        from: route.from,
        to: route.to,
        replyTo: `${name} <${email}>`,
        subject: deadLetter ? `[LEAD FALLBACK — forward to client] ${subject}` : subject,
        text: lines.join('\n'),
        html,
      })
      deliveredDeadLetter = deadLetter
      deliveredRoute = route
      console.log(
        JSON.stringify({
          event: 'lead_sent',
          tenant: mailCfg?.key ?? null,
          host: tenantHost,
          via: route.label,
          to: route.to,
          deadLetter,
          messageId: info.messageId ?? null,
          accepted: info.accepted?.length ?? 0,
          rejected: info.rejected?.length ?? 0,
        }),
      )
      sent = true
      break
    } catch (err) {
      lastErr = err
      console.error(
        JSON.stringify({
          event: 'lead_route_failed',
          tenant: mailCfg?.key ?? null,
          host: tenantHost,
          via: route.label,
          // Truncate so SMTP host/user embedded in transport errors can't leak.
          error: String(err).slice(0, 200),
        }),
      )
    }
  }

  const status = deliveryStatus(sent, deliveredDeadLetter)

  // Persist the enquiry into the client's own dataset (best-effort; never fails
  // the request). Stored for ALL outcomes — especially a failed send, where this
  // is the durable record alongside the alert.
  let persistedOk = false
  try {
    const store = await getTenantLeadStore(host)
    const result = await persistLead(store, {
      // Stable _id from the client idempotency key → a replayed submit is a no-op,
      // not a duplicate lead. Omitted when absent (Sanity generates an _id).
      ...(parsed.data.idempotencyKey ? {_id: parsed.data.idempotencyKey} : {}),
      name,
      email,
      phone,
      service,
      area: area || undefined,
      propertyType: propertyType || undefined,
      message,
      sourceUrl: sourceUrl || undefined,
      submittedAt,
      consent: Boolean(consent),
      deliveryStatus: status,
      handled: false,
    })
    persistedOk = result.ok
    if (result.ok) {
      console.log(
        JSON.stringify({
          event: 'lead_persisted',
          tenant: mailCfg?.key ?? null,
          id: result.id,
          deliveryStatus: status,
        }),
      )
    } else if (result.error !== 'no-store') {
      console.error(
        JSON.stringify({
          event: 'lead_persist_failed',
          tenant: mailCfg?.key ?? null,
          error: result.error,
        }),
      )
    }
  } catch (err) {
    console.error(
      JSON.stringify({event: 'lead_persist_failed', tenant: mailCfg?.key ?? null, error: String(err)}),
    )
  }

  if (!sent) {
    console.error(
      JSON.stringify({
        event: 'lead_delivery_failed',
        tenant: mailCfg?.key ?? null,
        host: tenantHost,
        error: String(lastErr),
      }),
    )
    // Surface to Sentry too (scoped tag only — no cross-request leakage).
    Sentry.withScope((scope) => {
      scope.setTag('tenant', mailCfg?.key ?? 'unknown')
      scope.setTag('lead_event', 'delivery_failed')
      scope.setContext('lead', {host: tenantHost, business, service})
      Sentry.captureException(
        lastErr instanceof Error ? lastErr : new Error('Lead delivery failed (all routes)'),
      )
    })
    // Out-of-band alert with the full enquiry so the lead is recoverable even
    // though every email route is down.
    await sendLeadAlert({
      severity: 'critical',
      reason: 'All delivery routes failed (client SMTP + agency fallback). Lead NOT delivered by email.',
      business,
      host: tenantHost,
      lead: leadData,
    })

    // Last resort: if the own-project store also failed, persistDeadLetter runs — a
    // no-op on single-tenant (no separate control dataset; the own-project store is
    // the durable backup).
    if (!persistedOk) {
      const dl = await persistDeadLetter({
        name,
        email,
        phone,
        service,
        area: area || undefined,
        propertyType: propertyType || undefined,
        message,
        sourceUrl: sourceUrl || undefined,
        submittedAt,
        consent: Boolean(consent),
        deliveryStatus: 'failed',
        tenantKey: mailCfg?.key ?? null,
      })
      console.log(
        JSON.stringify({
          event: dl.ok ? 'lead_deadletter_stored' : 'lead_deadletter_skipped',
          tenant: mailCfg?.key ?? null,
          note: dl.error ?? null,
        }),
      )
    }

    return NextResponse.json({error: 'Failed to send email'}, {status: 502})
  }

  // Lead is safe, but the client's own SMTP failed and the agency fallback
  // caught it — flag it so the client's delivery gets fixed.
  if (deliveredDeadLetter) {
    await sendLeadAlert({
      severity: 'warning',
      reason: `Client SMTP failed; lead caught by the agency fallback (forward to client). Fix SMTP for ${mailCfg?.key ?? tenantHost}.`,
      business,
      host: tenantHost,
      lead: leadData,
    })
  }

  // Branded auto-acknowledgement to the enquirer — only when delivered via the
  // client's OWN SMTP (so it's correctly from their domain) and not opted out.
  // Deliberately NOT sent on the agency-fallback route: acking from a shared/fallback
  // Gmail to public addresses reads as spoofing and risks its sender reputation.
  // (Single-tenant: the NODEMAILER_* route is flagged agency, so branded auto-replies
  // need a per-site SMTP.) Best-effort.
  if (deliveredRoute && !deliveredRoute.isAgency && m?.autoReply !== false) {
    const sign = business || 'The team'
    const ackBody =
      m?.autoReplyMessage?.trim() ||
      `Thanks for getting in touch about ${service}. We’ve received your enquiry and will get back to you as soon as we can.`
    const ackText = `Hi ${name},\n\n${ackBody}\n\nFor reference, here’s what you sent:\n${message}\n\n— ${sign}`
    const ackHtml = `
      <div style="font-family:system-ui,sans-serif;font-size:14px;color:#111">
        <p>Hi ${escapeHtml(name)},</p>
        <p>${escapeHtml(ackBody)}</p>
        <p style="margin-top:12px;color:#555"><strong>Your message:</strong></p>
        <p style="white-space:pre-wrap;color:#555">${escapeHtml(message)}</p>
        <p style="margin-top:12px">— ${escapeHtml(sign)}</p>
      </div>`
    try {
      const ackTransporter = nodemailer.createTransport(
        deliveredRoute.transport as Parameters<typeof nodemailer.createTransport>[0],
      )
      await ackTransporter.sendMail({
        from: deliveredRoute.from,
        to: email,
        subject: `We’ve received your enquiry${business ? ` — ${business}` : ''}`,
        text: ackText,
        html: ackHtml,
      })
      console.log(
        JSON.stringify({event: 'lead_ack_sent', tenant: mailCfg?.key ?? null, to: email}),
      )
    } catch (err) {
      console.error(
        JSON.stringify({event: 'lead_ack_failed', tenant: mailCfg?.key ?? null, error: String(err)}),
      )
    }
  }

  return NextResponse.json({ok: true})
}
