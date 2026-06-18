// Sentry — edge runtime init (middleware/proxy, edge routes). Loaded by
// instrumentation.ts register(). No-op unless a DSN is configured.
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
})
