/**
 * JSON-LD builders. Pure functions returning schema.org objects (or null
 * to skip emission). Per-entity `@id`s come from sanity/lib/siteIds so
 * cross-references resolve consistently across pages — Google merges
 * entities by @id, turning the per-page nodes into one knowledge graph.
 */
import {localBusinessId, logoId, placeIdForArea, serviceIdForSlug, webSiteId} from './siteIds'
import {absoluteUrl} from './seo'

type Img = {asset?: {url?: string | null} | null} | null | undefined

type StructuredData = {
  enabled?: boolean | null
  language?: string | null
  website?: {
    name?: string | null
    url?: string | null
    enableSearchAction?: boolean | null
    searchUrlTemplate?: string | null
  } | null
  organization?: {
    name?: string | null
    legalName?: string | null
    url?: string | null
    description?: string | null
    slogan?: string | null
    foundingDate?: string | null
    awards?: string[] | null
    sameAs?: string[] | null
    logo?: Img
    image?: Img
    contact?: {phone?: string | null; email?: string | null; contactType?: string | null} | null
    address?: {
      streetAddress?: string | null
      addressLocality?: string | null
      addressRegion?: string | null
      postalCode?: string | null
      addressCountry?: string | null
    } | null
    geo?: {latitude?: number | null; longitude?: number | null} | null
    areaServed?: string | null
  } | null
  localBusiness?: {
    enabled?: boolean | null
    serviceAreaOnly?: boolean | null
    priceRange?: string | null
    currency?: string | null
    openingHours?: Array<{
      dayOfWeek?: string[] | null
      opens?: string | null
      closes?: string | null
    }> | null
  } | null
  services?: Array<{
    title?: string | null
    description?: string | null
    url?: string | null
  }> | null
  areaServedCities?: Array<{title?: string | null}> | null
}

const clean = <T extends Record<string, unknown>>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null && v !== '')) as T

export function webSiteJsonLd(sd: StructuredData | null | undefined) {
  if (!sd?.enabled || !sd.website?.url) return null
  const url = sd.website.url
  const node: Record<string, unknown> = clean({
    '@type': 'WebSite',
    '@id': webSiteId(),
    url,
    name: sd.website.name || sd.organization?.name || undefined,
    inLanguage: sd.language || 'en-GB',
    publisher: {'@id': localBusinessId()},
  })
  if (sd.website.enableSearchAction && sd.website.searchUrlTemplate) {
    node.potentialAction = {
      '@type': 'SearchAction',
      target: {'@type': 'EntryPoint', urlTemplate: sd.website.searchUrlTemplate},
      'query-input': 'required name=search_term_string',
    }
  }
  return {'@context': 'https://schema.org', ...node}
}

/**
 * Dev-only nudge: log the LocalBusiness fields most commonly missed
 * (and most damaging to local SEO when absent). Silent in production.
 * Called once from layout on each request; throttling via a module set
 * to avoid log spam during dev navigation.
 */
const _warned = new Set<string>()
export function warnIfLocalBusinessIncomplete(sd: StructuredData | null | undefined) {
  if (process.env.NODE_ENV === 'production') return
  const org = sd?.organization
  const lb = sd?.localBusiness
  const missing: string[] = []
  if (!org?.contact?.phone) missing.push('organization.contact.phone')
  if (!org?.contact?.email) missing.push('organization.contact.email')
  if (!org?.sameAs?.length) missing.push('organization.sameAs (social URLs)')
  if (!org?.image?.asset?.url && !org?.logo?.asset?.url) missing.push('organization.image / logo')
  if (lb?.serviceAreaOnly === false && !org?.address?.addressLocality) {
    missing.push('organization.address')
  }
  if (!sd?.areaServedCities?.length && !org?.address?.addressLocality) {
    missing.push('areaServedCities or organization.address')
  }
  if (!lb?.openingHours?.length) missing.push('localBusiness.openingHours')
  if (!lb?.priceRange) missing.push('localBusiness.priceRange')

  if (missing.length === 0) return
  const key = missing.join('|')
  if (_warned.has(key)) return
  _warned.add(key)
  console.warn(
    `[LocalBusiness schema] missing fields (set in Sanity Settings → Structured Data):\n  - ${missing.join('\n  - ')}`,
  )
}

export type LocalBusinessOpts = {
  aggregateRating?: AggregateRatingInput
  /** Typed service docs — used to build hasOfferCatalog with Offer.itemOffered → Service @id. */
  services?: Array<{slug: string; name: string}>
  /** Typed area docs — areaServed switches from City names to Place @id refs for areas with docs. */
  areas?: Array<{slug: string; name: string}>
}

export function localBusinessJsonLd(
  sd: StructuredData | null | undefined,
  opts: LocalBusinessOpts = {},
) {
  if (!sd?.enabled || sd.localBusiness?.enabled === false) return null
  const org = sd.organization
  if (!org?.name || !org.url) return null

  // areaServed: Place @id refs for areas that have docs; City names for any
  // extras from settings.areaServedCities that don't map to an area doc.
  const areaDocNames = new Set((opts.areas ?? []).map((a) => a.name.toLowerCase()))
  const placeRefs = (opts.areas ?? []).map((a) => ({'@id': placeIdForArea(a.slug)}))
  const cityFallbacks = (sd.areaServedCities ?? [])
    .map((c) => c?.title)
    .filter((t): t is string => typeof t === 'string' && t.length > 0)
    .filter((t) => !areaDocNames.has(t.toLowerCase()))
    .map((name) => ({'@type': 'City', name}))
  const areaServed = [...placeRefs, ...cityFallbacks]
  const areaServedField =
    areaServed.length > 0 ? areaServed : org.areaServed || undefined

  // hasOfferCatalog: Offer.itemOffered → Service @id refs for each typed service.
  const hasOfferCatalog =
    opts.services && opts.services.length
      ? {
          '@type': 'OfferCatalog',
          name: `${org.name} — Services`,
          itemListElement: opts.services.map((s) => ({
            '@type': 'Offer',
            itemOffered: {'@id': serviceIdForSlug(s.slug), '@type': 'Service', name: s.name},
          })),
        }
      : undefined

  const address = org.address
    ? clean({
        '@type': 'PostalAddress',
        streetAddress: org.address.streetAddress || undefined,
        addressLocality: org.address.addressLocality || undefined,
        addressRegion: org.address.addressRegion || undefined,
        postalCode: org.address.postalCode || undefined,
        addressCountry: org.address.addressCountry || undefined,
      })
    : undefined

  const geo =
    org.geo?.latitude != null && org.geo?.longitude != null
      ? {'@type': 'GeoCoordinates', latitude: org.geo.latitude, longitude: org.geo.longitude}
      : undefined

  const openingHoursSpecification = (sd.localBusiness?.openingHours || [])
    .filter((h) => h?.opens && h?.closes && h?.dayOfWeek?.length)
    .map((h) =>
      clean({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: h.dayOfWeek,
        opens: h.opens || undefined,
        closes: h.closes || undefined,
      }),
    )

  const makesOffer = (sd.services || [])
    .filter((s) => s?.title)
    .map((s) =>
      clean({
        '@type': 'Offer',
        itemOffered: clean({
          '@type': 'Service',
          name: s.title || undefined,
          description: s.description || undefined,
          url: s.url || undefined,
        }),
      }),
    )

  return {
    '@context': 'https://schema.org',
    ...clean({
      '@type': 'LocalBusiness',
      '@id': localBusinessId(),
      name: org.name,
      legalName: org.legalName || undefined,
      url: org.url,
      description: org.description || undefined,
      slogan: org.slogan || undefined,
      foundingDate: org.foundingDate || undefined,
      telephone: org.contact?.phone || undefined,
      email: org.contact?.email || undefined,
      priceRange: sd.localBusiness?.priceRange || undefined,
      currenciesAccepted: sd.localBusiness?.currency || undefined,
      image: org.image?.asset?.url || org.logo?.asset?.url || undefined,
      // logo references the ImageObject node by @id (layout emits the node
      // alongside in the same @graph) — Google's logo rich result wants
      // ImageObject, not a plain URL.
      logo: org.logo?.asset?.url ? {'@id': logoId()} : undefined,
      sameAs: org.sameAs?.length ? org.sameAs : undefined,
      award: org.awards?.length ? org.awards : undefined,
      areaServed: areaServedField,
      address,
      geo,
      openingHoursSpecification: openingHoursSpecification.length
        ? openingHoursSpecification
        : undefined,
      hasOfferCatalog,
      makesOffer: makesOffer.length ? makesOffer : undefined,
      aggregateRating:
        opts.aggregateRating && opts.aggregateRating.reviewCount > 0
          ? {
              '@type': 'AggregateRating',
              ratingValue: Number(opts.aggregateRating.ratingValue.toFixed(1)),
              reviewCount: opts.aggregateRating.reviewCount,
              bestRating: 5,
              worstRating: 1,
            }
          : undefined,
    }),
  }
}

export function serviceJsonLd(args: {
  name: string
  description?: string | null
  url: string
  /** Typed area docs — emitted as Place @id refs so they share identity
   *  with the Place entities defined on each Area page and with
   *  LocalBusiness.areaServed. Falls back to City names if only strings. */
  areasServed?: Array<{slug: string; name: string} | string>
  providerId?: string
  imageId?: string
  dateModified?: string | null
}) {
  if (!args.name) return null
  const areaServed = args.areasServed?.length
    ? args.areasServed.map((a) =>
        typeof a === 'string'
          ? {'@type': 'City', name: a}
          : {'@id': placeIdForArea(a.slug)},
      )
    : undefined
  return {
    '@context': 'https://schema.org',
    ...clean({
      '@type': 'Service',
      '@id': `${args.url}#service`,
      name: args.name,
      serviceType: args.name,
      description: args.description || undefined,
      url: args.url,
      dateModified: args.dateModified || undefined,
      areaServed,
      provider: args.providerId ? {'@id': args.providerId} : undefined,
      image: args.imageId ? {'@id': args.imageId} : undefined,
    }),
  }
}

export function blogPostingJsonLd(args: {
  title: string
  url: string
  description?: string | null
  datePublished?: string | null
  dateModified?: string | null
  /** Either a raw URL (legacy) or an ImageObject @id (preferred — emit the
   *  ImageObject node alongside in the page's @graph). */
  imageId?: string
  imageUrl?: string | null
  authorName?: string | null
  publisherId?: string
  isPartOfId?: string
}) {
  if (!args.title) return null
  return {
    '@context': 'https://schema.org',
    ...clean({
      '@type': 'BlogPosting',
      '@id': `${args.url}#blogposting`,
      headline: args.title,
      description: args.description || undefined,
      datePublished: args.datePublished || undefined,
      dateModified: args.dateModified || args.datePublished || undefined,
      image: args.imageId ? {'@id': args.imageId} : args.imageUrl || undefined,
      author: args.authorName
        ? {'@type': 'Person', name: args.authorName}
        : undefined,
      publisher: args.publisherId ? {'@id': args.publisherId} : undefined,
      isPartOf: args.isPartOfId ? {'@id': args.isPartOfId, '@type': 'Blog'} : undefined,
      mainEntityOfPage: {'@type': 'WebPage', '@id': args.url},
    }),
  }
}

export function imageGalleryJsonLd(args: {name: string; url: string; images: string[]}) {
  if (!args.images.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: args.name,
    url: args.url,
    image: args.images,
  }
}

/**
 * Project case study. CreativeWork sits better than ImageGallery for a
 * brief + outcome — and `about: Service` ties the project back into the
 * service silo, reinforcing the parent service page's topical authority.
 */
export function creativeWorkJsonLd(args: {
  name: string
  url: string
  description?: string | null
  dateCreated?: string | null
  dateModified?: string | null
  locationCreated?: string | null
  about?: string[]
  images?: string[]
  creatorId?: string
}) {
  if (!args.name) return null
  return {
    '@context': 'https://schema.org',
    ...clean({
      '@type': 'CreativeWork',
      '@id': `${args.url}#project`,
      name: args.name,
      description: args.description || undefined,
      url: args.url,
      dateCreated: args.dateCreated || undefined,
      dateModified: args.dateModified || args.dateCreated || undefined,
      locationCreated: args.locationCreated
        ? {'@type': 'Place', name: args.locationCreated}
        : undefined,
      about: args.about?.length
        ? args.about.map((name) => ({'@type': 'Service', name}))
        : undefined,
      image: args.images?.length ? args.images : undefined,
      creator: args.creatorId ? {'@id': args.creatorId} : undefined,
    }),
  }
}

/** Hub / index pages — CollectionPage wrapping an ItemList of children. */
export function collectionPageJsonLd(args: {
  name: string
  url: string
  description?: string | null
  items: Array<{name: string; url: string; description?: string | null}>
}) {
  if (!args.items.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: args.name,
    url: args.url,
    ...(args.description ? {description: args.description} : {}),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: args.items.length,
      itemListElement: args.items.map((it, i) =>
        clean({
          '@type': 'ListItem',
          position: i + 1,
          url: it.url,
          name: it.name,
          ...(it.description ? {description: it.description} : {}),
        }),
      ),
    },
  }
}

/**
 * Flatten Portable Text (or a plain string) to a single plain-text string.
 * Used for FAQPage JSON-LD where Google's spec mandates a plain string in
 * `acceptedAnswer.text` — no HTML, no markup, no URLs from link annotations.
 * Visible rendering still emits real `<a>` tags from the same PT input.
 */
function flattenPortableText(value: unknown): string {
  if (typeof value === 'string') return value
  if (!Array.isArray(value)) return ''
  return value
    .map((block) => {
      if (typeof block !== 'object' || block === null) return ''
      const children = (block as {children?: unknown}).children
      if (!Array.isArray(children)) return ''
      return children
        .map((child) => {
          if (typeof child !== 'object' || child === null) return ''
          const text = (child as {text?: unknown}).text
          return typeof text === 'string' ? text : ''
        })
        .join('')
    })
    .filter((para) => para.length > 0)
    .join('\n\n')
}

export function faqPageJsonLd(
  items: Array<{question?: string | null; answer?: unknown}>,
  opts: {isPartOfId?: string} = {},
) {
  const mainEntity = items
    .map((i) => ({question: i?.question, answer: flattenPortableText(i?.answer)}))
    .filter((i) => i.question && i.answer)
    .map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: {'@type': 'Answer', text: i.answer},
    }))
  if (!mainEntity.length) return null
  return {
    '@context': 'https://schema.org',
    ...clean({
      '@type': 'FAQPage',
      mainEntity,
      isPartOf: opts.isPartOfId ? {'@id': opts.isPartOfId} : undefined,
    }),
  }
}

/**
 * Single Review. Only emit when the testimonial is real — we never seed
 * fabricated reviews. Returns null if the bare minimum (quote + author)
 * isn't there, so accidental empties don't pollute schema.
 */
export function reviewJsonLd(args: {
  body: string
  authorName?: string | null
  rating?: number | null
  itemReviewedId?: string
}) {
  if (!args.body || !args.authorName) return null
  return {
    '@context': 'https://schema.org',
    ...clean({
      '@type': 'Review',
      reviewBody: args.body,
      author: {'@type': 'Person', name: args.authorName},
      reviewRating:
        args.rating != null
          ? {'@type': 'Rating', ratingValue: args.rating, bestRating: 5, worstRating: 1}
          : undefined,
      itemReviewed: args.itemReviewedId ? {'@id': args.itemReviewedId} : undefined,
    }),
  }
}

export type AggregateRatingInput = {ratingValue: number; reviewCount: number} | null

/**
 * ImageObject. Logo + per-page hero/cover live in the page's @graph so
 * primary entities can reference by @id (LocalBusiness.logo, Service.image,
 * BlogPosting.image). Plain string URL is valid for `image` but the logo
 * rich result specifically wants an ImageObject.
 */
export function imageObjectJsonLd(args: {
  id: string
  url: string
  width?: number
  height?: number
  caption?: string | null
}) {
  if (!args.url) return null
  return {
    '@context': 'https://schema.org',
    ...clean({
      '@type': 'ImageObject',
      '@id': args.id,
      url: args.url,
      contentUrl: args.url,
      width: args.width,
      height: args.height,
      caption: args.caption || undefined,
    }),
  }
}

/**
 * Place per Area. Emitted on each Area page (geo + PostalAddress). Both
 * LocalBusiness.areaServed and Service.areaServed reference by @id, so
 * Google sees the service × area matrix materialised in the graph even
 * while individual combo pages stay gated.
 */
export function placeJsonLd(args: {
  slug: string
  name: string
  addressRegion?: string
  addressCountry?: string
  latitude?: number | null
  longitude?: number | null
  url?: string
}) {
  if (!args.slug || !args.name) return null
  return {
    '@context': 'https://schema.org',
    ...clean({
      '@type': 'Place',
      '@id': placeIdForArea(args.slug),
      name: args.name,
      url: args.url || undefined,
      address: {
        '@type': 'PostalAddress',
        addressLocality: args.name,
        // Omit when unknown rather than defaulting to a specific county — the
        // caller passes the client's real region from settings when available.
        addressRegion: args.addressRegion || undefined,
        addressCountry: args.addressCountry || 'GB',
      },
      geo:
        args.latitude != null && args.longitude != null
          ? {
              '@type': 'GeoCoordinates',
              latitude: args.latitude,
              longitude: args.longitude,
            }
          : undefined,
    }),
  }
}

export type BreadcrumbItem = {label: string; href: string}

export function breadcrumbJsonLd(items: BreadcrumbItem[], baseUrl?: string) {
  if (!items.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.label,
      // Google expects fully-qualified URLs; default to an absolute URL built
      // from NEXT_PUBLIC_SITE_URL when the caller doesn't pass an explicit base.
      item: baseUrl ? `${baseUrl.replace(/\/$/, '')}${it.href}` : absoluteUrl(it.href),
    })),
  }
}
