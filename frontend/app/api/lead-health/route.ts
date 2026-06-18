import {NextResponse} from 'next/server'
import nodemailer from 'nodemailer'

import {getTenantMail} from '@/sanity/lib/tenant-client'
import {tokensMatch} from '@/lib/safe-token'

export const runtime = 'nodejs'

/**
 * Non-intrusive lead-path health check for the requested tenant (resolved from the
 * Host). It verifies the client's SMTP CONNECTION + AUTH (nodemailer verify) without
 * sending any email or creating a lead — so the canary can catch the #1 silent
 * failure (an expired/wrong SMTP password) before a real enquiry is lost.
 *
 * Secret-gated by LEAD_HEALTH_TOKEN (?token= or x-health-token header); returns 404
 * when unset/mismatched so the route isn't discoverable. Never returns secrets.
 */
export async function GET(req: Request) {
  const token = process.env.LEAD_HEALTH_TOKEN
  const url = new URL(req.url)
  const provided = url.searchParams.get('token') || req.headers.get('x-health-token')
  if (!tokensMatch(provided, token)) {
    return NextResponse.json({error: 'Not found'}, {status: 404})
  }

  const host = (req.headers.get('x-tenant-host') || req.headers.get('host') || '').replace(/:\d+$/, '')

  let mailCfg: Awaited<ReturnType<typeof getTenantMail>> = null
  try {
    mailCfg = await getTenantMail(host)
  } catch (err) {
    console.error('lead-health: tenant mail lookup failed', err)
  }
  const m = mailCfg?.mail
  const agencyFallback = Boolean(process.env.NODEMAILER_EMAIL && process.env.NODEMAILER_PASSWORD)

  // Safety net: is a failed lead guaranteed to be captured + alerted? A failed
  // enquiry is captured if there's an agency fallback inbox (NODEMAILER_*) OR the
  // own-project lead store (SANITY_WRITE_TOKEN persists every enquiry as a `lead`
  // doc); the operator is notified if an alert webhook is set. Surfaced so a silent
  // gap is visible before a lead is lost.
  const leadStore = Boolean(process.env.SANITY_WRITE_TOKEN)
  const alertWebhook = Boolean(process.env.LEAD_ALERT_WEBHOOK_URL)
  const errorMonitor = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)
  const captureOk = agencyFallback || leadStore
  const safetyNet: 'ok' | 'capture-only' | 'none' = captureOk
    ? alertWebhook
      ? 'ok'
      : 'capture-only'
    : 'none'

  let tenantSmtp: 'ok' | 'fail' | 'none' = 'none'
  let smtpError: string | undefined
  if (m?.host && m?.user && m?.pass) {
    const port = m.port || 465
    try {
      const transporter = nodemailer.createTransport({
        host: m.host,
        port,
        secure: typeof m.secure === 'boolean' ? m.secure : port === 465,
        auth: {user: m.user, pass: m.pass},
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
      })
      await transporter.verify()
      tenantSmtp = 'ok'
    } catch (err) {
      tenantSmtp = 'fail'
      smtpError = String(err).slice(0, 200)
    }
  }

  const deliverable = tenantSmtp === 'ok' || agencyFallback
  const degraded = tenantSmtp === 'fail' && agencyFallback

  return NextResponse.json({
    host,
    tenant: mailCfg?.key ?? null,
    tenantSmtp,
    agencyFallback: agencyFallback ? 'configured' : 'none',
    deliverable,
    degraded,
    // Safety net: 'ok' = a failed lead is captured AND you're alerted; 'capture-only'
    // = captured but no alert; 'none' = no capture — configure NODEMAILER_* and/or
    // SANITY_WRITE_TOKEN (the own-project lead store) + LEAD_ALERT_WEBHOOK_URL.
    safetyNet,
    net: {agencyFallback, leadStore, alertWebhook, errorMonitor},
    ...(smtpError ? {smtpError} : {}),
  })
}
