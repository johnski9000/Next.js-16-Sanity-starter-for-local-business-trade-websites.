import {MetadataRoute} from 'next'
import {headers} from 'next/headers'

import {tenantFetch} from '@/sanity/lib/tenant-client'
import {sitemapData} from '@/sanity/lib/queries'

/**
 * Per-request, per-TENANT sitemap. Resolves the request host → that tenant's
 * project, so each client's /sitemap.xml lists THEIR pages on THEIR domain.
 * force-dynamic so it's never prerendered at build (which would bake one tenant's
 * data and require a live Sanity connection during CI builds).
 */
export const dynamic = 'force-dynamic'

type SitemapDoc = {_type: string; slug: string | null; _updatedAt?: string | null}

const isHomeSlug = (slug: string | null | undefined) =>
  !slug || slug === '/' || slug === 'homepage' || slug === 'home' || slug === 'index'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const {data, tenant} = await tenantFetch<SitemapDoc[]>({query: sitemapData})
  const pages = data ?? []

  // Prefer the tenant's canonical site URL, then env, then the request host.
  const headersList = await headers()
  const host = headersList.get('host') as string
  const baseUrl = (tenant.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || `https://${host}`).replace(
    /\/+$/,
    '',
  )

  const sitemap: MetadataRoute.Sitemap = []
  const homepage = pages.find((p) => p._type === 'page' && isHomeSlug(p.slug))
  sitemap.push({
    url: baseUrl,
    lastModified: homepage?._updatedAt || new Date(),
    priority: 1,
    changeFrequency: 'monthly',
  })

  for (const p of pages) {
    if (isHomeSlug(p.slug)) continue
    const slug = String(p.slug).replace(/^\/+/, '')
    let priority: number
    let changeFrequency: 'monthly' | 'yearly' | 'never'
    let url: string
    switch (p._type) {
      case 'page':
        priority = 0.8
        changeFrequency = 'monthly'
        url = `${baseUrl}/${slug}`
        break
      case 'service':
        priority = 0.9
        changeFrequency = 'monthly'
        url = `${baseUrl}/services/${slug}`
        break
      case 'area':
        priority = 0.8
        changeFrequency = 'monthly'
        url = `${baseUrl}/areas/${slug}`
        break
      case 'project':
        priority = 0.6
        changeFrequency = 'yearly'
        url = `${baseUrl}/projects/${slug}`
        break
      case 'post':
        priority = 0.5
        changeFrequency = 'never'
        url = `${baseUrl}/blog/${slug}`
        break
      default:
        continue
    }
    sitemap.push({lastModified: p._updatedAt || new Date(), priority, changeFrequency, url})
  }

  // Hub / index routes (not Sanity docs). serviceArea combos intentionally excluded.
  const seen = new Set(sitemap.map((e) => e.url))
  for (const path of ['/services', '/areas', '/projects', '/gallery', '/blog', '/quote']) {
    const u = `${baseUrl}${path}`
    if (seen.has(u)) continue
    sitemap.push({url: u, lastModified: new Date(), priority: 0.7, changeFrequency: 'monthly'})
  }

  return sitemap
}
