// Sentry — server runtime init. Loaded by instrumentation.ts register().
// No-op unless a DSN is configured (SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN), so it's
// safe to ship before the DSN is set.
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  // Errors only by default — turn up tracing later if you want performance data.
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
})
