import {absoluteUrl} from './seo'

/**
 * Canonical @id URIs for the entity graph. Same constants used by every
 * JSON-LD builder + template so cross-references resolve cleanly across
 * pages (Google merges entities by @id across all <script> tags on the
 * site as it crawls).
 *
 * All of these need NEXT_PUBLIC_SITE_URL to match
 * settings.structuredData.organization.url (handover checklist).
 */
export const localBusinessId = () => absoluteUrl('/#localbusiness')
export const webSiteId = () => absoluteUrl('/#website')
export const blogId = () => absoluteUrl('/blog#blog')
export const logoId = () => absoluteUrl('/#logo')

/** Per-typed-doc @ids — used so hasOfferCatalog → Service and
 *  areaServed → Place cross-references resolve in one knowledge graph. */
export const serviceIdForSlug = (slug: string) => `${absoluteUrl(`/services/${slug}`)}#service`
export const placeIdForArea = (slug: string) => `${absoluteUrl(`/areas/${slug}`)}#place`
