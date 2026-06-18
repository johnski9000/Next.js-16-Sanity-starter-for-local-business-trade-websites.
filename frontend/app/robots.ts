import type {MetadataRoute} from 'next'
import {headers} from 'next/headers'

import {absoluteUrl} from '@/sanity/lib/seo'
import {getTenantByHost} from '@/sanity/lib/tenant-client'

// Per-request, per-tenant robots: resolve the request host → that tenant so the
// Sitemap directive points at THEIR domain, not the global NEXT_PUBLIC_SITE_URL.
// (robots.ts runs as its own route — the layout that pins the request base URL
// doesn't run here — so resolve + pass the base explicitly.) force-dynamic so it's
// never prerendered at build with a missing host.
export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers()
  const host = h.get('x-tenant-host') || h.get('host') || ''
  const tenant = await getTenantByHost(host)

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/quote/thanks', '/search', '/api/', '/test'],
    },
    sitemap: absoluteUrl('/sitemap.xml', tenant?.siteUrl || undefined),
  }
}
