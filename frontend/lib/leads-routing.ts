/**
 * PURE lead-delivery routing — no server-only / nodemailer / next imports, so it's
 * unit-testable. The contact route turns these descriptors into real transporters
 * and sends; keeping the *decision* (which mailbox, in what order) here means the
 * "where does a lead go" logic — the heart of the product — is covered by tests.
 */

export type DeliveryRoute = {
  label: string
  /** nodemailer transport options (passed verbatim to createTransport). */
  transport: Record<string, unknown>
  from: string
  to: string
  /** true for the agency dead-letter fallback (vs the client's own SMTP). */
  isAgency?: boolean
}

export type MailConfig = {
  host?: string
  user?: string
  pass?: string
  port?: number
  secure?: boolean
  fromName?: string
  leadEmail?: string
}

/**
 * Build the ordered list of delivery routes for an enquiry:
 *   1. the client's own SMTP (if host + user + pass are ALL present), then
 *   2. the agency Gmail dead-letter fallback (if agency creds are present).
 * Empty array → the caller should 500 (no way to deliver).
 */
export function buildDeliveryRoutes(opts: {
  mail?: MailConfig | null
  tenantKey?: string
  business?: string
  agencyEmail?: string
  agencyPassword?: string
  /** Global fallback recipient (NODEMAILER_TO) used when the tenant has no leadEmail. */
  agencyTo?: string
}): DeliveryRoute[] {
  const routes: DeliveryRoute[] = []

  const m = opts.mail
  if (m?.host && m?.user && m?.pass) {
    const port = m.port || 465
    routes.push({
      label: `tenant:${opts.tenantKey ?? 'unknown'}`,
      transport: {
        host: m.host,
        port,
        secure: typeof m.secure === 'boolean' ? m.secure : port === 465,
        auth: {user: m.user, pass: m.pass},
      },
      from: `"${m.fromName || opts.business || 'Website enquiry'}" <${m.user}>`,
      to: m.leadEmail || m.user,
    })
  }

  if (opts.agencyEmail && opts.agencyPassword) {
    // The agency Gmail AUTHENTICATES + SENDS, but the lead is delivered to the
    // BUSINESS: the tenant's own leadEmail first, then a global NODEMAILER_TO
    // fallback, then (last resort, if neither is set) the agency inbox itself.
    routes.push({
      label: 'agency-fallback',
      transport: {service: 'gmail', auth: {user: opts.agencyEmail, pass: opts.agencyPassword}},
      from: `"${m?.fromName || opts.business || 'Website enquiry'}" <${opts.agencyEmail}>`,
      to: m?.leadEmail || opts.agencyTo || opts.agencyEmail,
      isAgency: true,
    })
  }

  return routes
}

/** Delivery status for a stored lead, given the send outcome. */
export function deliveryStatus(sent: boolean, deadLetter: boolean): 'sent' | 'dead-letter' | 'failed' {
  if (!sent) return 'failed'
  return deadLetter ? 'dead-letter' : 'sent'
}
