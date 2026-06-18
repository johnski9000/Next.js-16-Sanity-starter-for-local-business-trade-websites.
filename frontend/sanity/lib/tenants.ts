/**
 * The site's branding/config shape + a small host helper. (The multi-tenant registry —
 * host resolution, control-dataset GROQ, per-tenant token overrides — lives on `main`.)
 */

export type TenantBranding = {
  siteName?: string
  /** Design preset key (see frontend/lib/themes.ts) — trade-neutral palette. */
  design?: string
  /** Optional hex; overrides the design preset's brand colour. */
  primaryColor?: string
  logoUrl?: string
}

export type Tenant = {
  key: string
  hosts: string[]
  projectId: string
  dataset: string
  readToken: string
  siteUrl: string
  theme: string
  branding?: TenantBranding
  /** GA4 measurement id (G-XXXX) for the on-site analytics tag, if configured. */
  ga4MeasurementId?: string
}

/** Lower-case, strip port and a leading `www.` so matches are forgiving.
 *  (Used by the contact route's same-origin guard.) */
export function normaliseHost(host: string | null | undefined): string {
  return (host || '')
    .toLowerCase()
    .split(':')[0]
    .replace(/^www\./, '')
    .trim()
}
