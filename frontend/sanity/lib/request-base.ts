/**
 * Request-scoped base URL = the current tenant's canonical site URL.
 *
 * Why: JSON-LD @ids / URLs, breadcrumbs and robots are built from `absoluteUrl()`,
 * which used to default to the single global NEXT_PUBLIC_SITE_URL — so in
 * multi-tenant mode every tenant but one emitted structured data on the WRONG
 * domain. Threading `baseUrl` through every builder + caller (21 files) is
 * error-prone. Instead the layout sets the current tenant's siteUrl here once per
 * request, and `absoluteUrl()` reads it as the default base — so the whole JSON-LD
 * layer resolves on the right domain automatically.
 *
 * `cache()` from React returns the SAME object for the duration of one request and
 * a FRESH one per request, so this can never leak a base URL across requests /
 * tenants. Called OUTSIDE a render scope (tests, non-request code) cache() returns
 * a fresh holder each call, so set/get degrade to `undefined` and absoluteUrl falls
 * back to NEXT_PUBLIC_SITE_URL — never throws. (No `server-only` import: it would
 * throw in the vitest/node test env that imports seo.ts. All importers are server
 * components today, and a stray client import degrades to undefined, not a crash.)
 */
import {cache} from 'react'

const holder = cache((): {value: string | undefined} => ({value: undefined}))

/** Set the current request's base URL (called once in the root layout). */
export function setRequestBaseUrl(url: string | undefined | null): void {
  try {
    holder().value = url ? String(url).replace(/\/+$/, '') : undefined
  } catch {
    // no request scope (e.g. unexpected client call) — ignore
  }
}

/** The current request's base URL, or undefined if not set in this scope. */
export function getRequestBaseUrl(): string | undefined {
  try {
    return holder().value
  } catch {
    return undefined
  }
}
