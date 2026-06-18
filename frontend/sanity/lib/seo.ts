import type {Metadata} from 'next'

import {resolveOpenGraphImage} from '@/sanity/lib/utils'
import {getRequestBaseUrl} from '@/sanity/lib/request-base'

/**
 * Shared metadata builder. Every routable template (page, service, area,
 * project, serviceArea, post) feeds the doc's `seo` object through this so
 * title/description/canonical/robots/OG behave identically everywhere.
 *
 * Mirrors the shared `seo` Sanity object (studio/.../objects/seo.ts).
 */
/** Absolute URL from a root-relative path. Base precedence: explicit `base` arg →
 *  the current request's tenant base (set by the layout via request-base) →
 *  NEXT_PUBLIC_SITE_URL. So in multi-tenant mode JSON-LD / breadcrumbs / robots
 *  resolve on the CURRENT tenant's domain, not a single global one. Falls back to
 *  the relative path when no base is available. */
export function absoluteUrl(path: string, base?: string): string {
  const b = (base || getRequestBaseUrl() || process.env.NEXT_PUBLIC_SITE_URL)?.replace(/\/$/, '')
  return b ? `${b}${path}` : path
}

export type SeoInput =
  | {
      title?: string | null
      description?: string | null
      canonical?: string | null
      noIndex?: boolean | null
      noFollow?: boolean | null
      ogTitle?: string | null
      ogDescription?: string | null
      keywords?: string[] | null
      ogImage?: unknown
    }
  | null
  | undefined

export function buildMetadata(args: {
  seo?: SeoInput
  /** Used when seo.title is empty (e.g. the doc name/title). */
  fallbackTitle?: string | null
  fallbackDescription?: string | null
  /** Absolute or root-relative canonical path for this route, e.g. `/services/interior-painting`. */
  path?: string
  /** Per-tenant base URL (the tenant's siteUrl) — overrides NEXT_PUBLIC_SITE_URL for canonical + OG. */
  baseUrl?: string
  /** Per-tenant Sanity project for resolving `seo.ogImage` URLs. Without this the
   *  OG image is built from the env-default project and 404s for any tenant whose
   *  projectId ≠ the env default. */
  imageOpts?: {projectId?: string; dataset?: string}
  /** @yourbusiness handle for `twitter:site`. */
  twitterSite?: string | null
  /** Adds OG `article:*` fields. Use on BlogPosting / news routes. */
  article?: {
    publishedTime?: string | null
    modifiedTime?: string | null
    authors?: string[]
    section?: string | null
  }
}): Metadata {
  const {seo, fallbackTitle, fallbackDescription, path, baseUrl, imageOpts, twitterSite, article} =
    args

  const title = seo?.title || fallbackTitle || undefined
  const description = seo?.description || fallbackDescription || undefined
  const ogImage = resolveOpenGraphImage(seo?.ogImage as never, imageOpts)

  const ogImages = ogImage
    ? [ogImage]
    : [
        {
          url: absoluteUrl(`/api/og?title=${encodeURIComponent(title ?? '')}`, baseUrl),
          width: 1200,
          height: 630,
        },
      ]

  // Always emit an absolute canonical URL. Building it via `absoluteUrl`
  // bypasses Next.js's metadataBase resolution and produces the same value
  // regardless of which host the page is rendered/crawled from — so a
  // crawl against any preview/staging URL still sees the production
  // canonical. Note: this only matters for SEO when production is correctly
  // mapped to NEXT_PUBLIC_SITE_URL; for non-production crawls the canonical
  // host will (correctly) differ from the crawl host, which Screaming Frog
  // flags as informational.
  const canonical = seo?.canonical || (path ? absoluteUrl(path, baseUrl) : undefined)

  return {
    // Plain string — flows through the root-layout title.template
    // (`%s | {siteTitle}`, where siteTitle comes from Sanity settings) so every
    // page automatically picks up the full brand suffix. Per-page seeded titles
    // should NOT carry their own brand suffix — the template adds it, and a
    // manual one produces a duplicate.
    title,
    description,
    // Single-language UK site — no hreflang. The previous `languages:
    // {'en-GB': canonical}` was a self-referential annotation that added no
    // value and amplified canonical-host mismatches (every page emitting an
    // alternate to the production host even when crawled from staging).
    alternates: canonical ? {canonical} : undefined,
    robots: {
      index: !seo?.noIndex,
      follow: !seo?.noFollow,
    },
    keywords: seo?.keywords ?? undefined,
    openGraph: {
      title: seo?.ogTitle || title || undefined,
      description: seo?.ogDescription || description || undefined,
      images: ogImages,
      ...(article
        ? {
            type: 'article',
            publishedTime: article.publishedTime ?? undefined,
            modifiedTime: article.modifiedTime ?? undefined,
            authors: article.authors?.length ? article.authors : undefined,
            section: article.section ?? undefined,
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      ...(twitterSite || process.env.NEXT_PUBLIC_TWITTER_HANDLE
        ? {site: twitterSite || process.env.NEXT_PUBLIC_TWITTER_HANDLE}
        : {}),
      title: seo?.ogTitle || title || undefined,
      description: seo?.ogDescription || description || undefined,
      images: ogImages.map((i) => i.url),
    },
  } satisfies Metadata
}
