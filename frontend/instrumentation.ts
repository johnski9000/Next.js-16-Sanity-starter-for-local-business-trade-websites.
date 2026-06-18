import * as Sentry from '@sentry/nextjs'

// Next.js loads this automatically. register() picks the right Sentry init per
// runtime; onRequestError forwards nested server/RSC errors to Sentry.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
