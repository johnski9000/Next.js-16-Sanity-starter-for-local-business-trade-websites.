import type {NextConfig} from 'next'
import {withSentryConfig} from '@sentry/nextjs'

const nextConfig: NextConfig = {
  // Canonical URL policy: no trailing slash on any route. Next.js
  // automatically redirects `/path/` -> `/path` (308) with this set.
  trailingSlash: false,
  env: {
    SC_DISABLE_SPEEDY: 'false',
  },

  images: {
    remotePatterns: [new URL('https://cdn.sanity.io/**')],
  },

  async redirects() {
    return [
      {
        source: '/homepage',
        destination: '/',
        permanent: true, // 301
      },
      {
        // Blog moved from /posts -> /blog (Phase 3d)
        source: '/posts/:slug*',
        destination: '/blog/:slug*',
        permanent: true, // 301
      },
    ]
  },

  // Baseline security headers. Only the non-breaking ones are enabled by default.
  //
  // NOT enabled here on purpose (they need browser testing first on a real clone):
  //   - X-Frame-Options / CSP `frame-ancestors`: the Sanity Presentation tool
  //     iframes this site from the Studio origin during Draft Mode, so a blanket
  //     `SAMEORIGIN`/`'self'` would break Visual Editing. Allowlist the Studio origin.
  //   - A full `Content-Security-Policy`: must allowlist Sanity (cdn.sanity.io,
  //     *.api.sanity.io), Cloudflare Turnstile (challenges.cloudflare.com), and any
  //     analytics before enabling, or it will block them. Starter below — test, then turn on.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {key: 'X-Content-Type-Options', value: 'nosniff'},
          {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
          {key: 'X-DNS-Prefetch-Control', value: 'on'},
          {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'},
          // CSP in REPORT-ONLY mode: it never blocks anything, it just surfaces
          // violations (browser console / report endpoint) so the policy can be
          // tuned against real traffic before flipping to the enforcing
          // `Content-Security-Policy` header. Covers the known third parties:
          // Sanity (cdn/api), Cloudflare Turnstile, GA4/Tag Manager, Vercel
          // Insights/Analytics, Sentry. `frame-ancestors 'self'` is report-only
          // here because the Sanity Presentation tool iframes the site in draft
          // mode — allowlist the Studio origin before enforcing.
          {
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "img-src 'self' data: blob: https://cdn.sanity.io https://www.google-analytics.com",
              "media-src 'self' https://cdn.sanity.io",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com https://va.vercel-scripts.com",
              "frame-src 'self' https://challenges.cloudflare.com",
              // GA4 beacons to regional hosts (region1.*, *.analytics.google.com); Sentry
              // DSNs are regional (oXXX.ingest.us.sentry.io) so allow *.sentry.io.
              "connect-src 'self' https://*.api.sanity.io https://*.apicdn.sanity.io https://*.google-analytics.com https://*.analytics.google.com https://*.sentry.io https://va.vercel-scripts.com https://vitals.vercel-insights.com",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

// Wrap with Sentry. Runtime error capture comes from the instrumentation files;
// this wrapper adds Next-specific instrumentation + (optional) source-map upload.
// Source maps upload only when SENTRY_AUTH_TOKEN is present, so local/Turbopack
// builds without a token stay clean.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  disableLogger: true,
})
