/**
 * TradePack — the typed home for EVERY trade-varying value in the seed.
 *
 * A "trade pack" is the complete content payload for one trade vertical
 * (plumber, electrician, roofer, …). The seed scripts (seed-dev.ts,
 * seed-site.ts) own the seeding LOGIC — asset upload, createOrReplace,
 * deterministic _ids, references — and pull every piece of trade-specific
 * DATA from a pack via `getPack(process.env.SEED_TRADE)`.
 *
 * The interface is deliberately broad: it mirrors the exact shapes the seed
 * scripts already build, so extraction is a verbatim move of data, not a
 * rewrite. Tuple shapes (e.g. `[icon, title, description]`) match the local
 * helper functions in seed-dev.ts so nothing about the produced documents
 * changes.
 *
 * NOTE: genuinely trade-NEUTRAL data is intentionally NOT in here and stays
 * in the seed scripts — the UK GDPR privacy-policy copy and the two
 * deliberately-invalid serviceArea QA fixtures are shared test/legal content,
 * not per-trade content.
 */

// ---------------------------------------------------------------------------
// Primitive / shared tuple shapes (mirror the seed-dev.ts helpers)
// ---------------------------------------------------------------------------

/** `[title, description]` — fed to `inclusion()` and FAQ `faq(q, a)` helpers. */
export type Pair = [string, string]

/** `[icon, title, description]` — fed to the `step()` helper. */
export type StepTuple = [string, string, string]

/** `[icon, label]` — fed to trustSignal / trustBadge builders. */
export type IconLabel = [string, string]

export type GeoPoint = {latitude: number; longitude: number}

// ---------------------------------------------------------------------------
// Services  (matches ServiceSeed in seed-dev.ts)
// ---------------------------------------------------------------------------

export type ServiceSeed = {
  slug: string
  name: string
  /** Hero H1 override. Falls back to `name` if omitted. */
  h1?: string
  icon: string
  order: number
  summary: string
  overview: string[]
  pricingIndication: string
  whatsIncluded: Pair[]
  steps: StepTuple[]
  faqs: Pair[]
  /** Slug list of area docs to link out to. Omit to default to all areas. */
  areasServed?: string[]
  metaTitle: string
  metaDescription: string
}

// ---------------------------------------------------------------------------
// Areas  (matches AreaSeed in seed-dev.ts)
// ---------------------------------------------------------------------------

export type AreaSeed = {
  slug: string
  name: string
  /** Hero H1 override. */
  h1?: string
  order: number
  /** Single string for thin areas, or string[] of paragraphs for richer pages. */
  intro: string | string[]
  coverageNote: string
  geo?: GeoPoint
  faqs: Pair[]
  metaTitle: string
  metaDescription: string
}

// ---------------------------------------------------------------------------
// Projects  (matches ProjectSeed in seed-dev.ts)
// ---------------------------------------------------------------------------

export type ProjectSeed = {
  slug: string
  title: string
  services: string[]
  area: string
  summary: string
  body: string
  completedAt: string
  metaTitle: string
  metaDescription: string
}

// ---------------------------------------------------------------------------
// Blog posts  (matches PostSeed in seed-dev.ts)
// ---------------------------------------------------------------------------

export type PostSeed = {
  slug: string
  title: string
  date: string
  excerpt: string
  content: string[]
}

// ---------------------------------------------------------------------------
// Person (blog author)
// ---------------------------------------------------------------------------

export type PersonSeed = {
  id: string
  firstName: string
  lastName: string
  slug: string
}

// ---------------------------------------------------------------------------
// Business identity + structured data (matches the settings singleton)
// ---------------------------------------------------------------------------

export type OpeningHoursSpec = {
  dayOfWeek: string[]
  opens: string
  closes: string
}

export type BusinessIdentity = {
  /** Display name / siteTitle / Organization & WebSite name. */
  siteTitle: string
  legalName: string
  /** Canonical fully-qualified URL (www host). */
  url: string
  phoneDisplay: string
  phoneTel: string
  email: string
  whatsappNumber: string
  address: {
    street: string
    locality: string
    region: string
    postcode: string
    country: string
  }
  geo: GeoPoint
  foundingDate: string
  founder: {name: string; jobTitle: string}
  /** Third-party profiles representing the same entity (GBP, Facebook, …). */
  sameAs: string[]
  priceRange: string
  currency: string
  areaServed: string
  /** Organization-level description for structured data. */
  description: string
  openingHours: OpeningHoursSpec[]
}

export type SeoPair = {title: string; description: string}

export type ReviewsAggregate = {
  enabled: boolean
  ratingValue: number
  reviewCount: number
  bestRating: number
  worstRating: number
}

export type StructuredData = {
  /** Service titles emitted as schemaService entries. */
  services: string[]
  /** City names emitted as servedCity entries. */
  areaServedCities: string[]
  reviews: ReviewsAggregate
  /** SearchAction URL template (relative to the canonical URL). */
  searchUrlTemplate?: string
  localBusinessServiceAreaOnly: boolean
}

// ---------------------------------------------------------------------------
// Section copy used across the home + marketing pages
// ---------------------------------------------------------------------------

export type ButtonCopy = {text: string; href: string}

export type ChecklistSection = {
  eyebrow: string
  heading: string
  body: string[]
  checklist: string[]
}

export type ServiceCardCopy = {title: string; description: string; href: string}

export type ReasonCopy = {title: string; description: string}

export type ProcessStepCopy = {icon: string; title: string; description: string}

export type TestimonialCopy = {
  quote: string
  authorName: string
  rating: number
}

export type FaqCopy = {question: string; answer: string}

export type HeroCopy = {
  eyebrow: string
  heading: string
  subheading: string
}

export type SectionCopy = {
  /** Trust badges shown beneath each hero. */
  trustBadges: Array<{icon: string; label: string}>

  /** Home hero. */
  homeHero: HeroCopy
  /** Home intro / overview section (intro paragraphs + checklist). */
  homeIntro: ChecklistSection
  /** Home service cards section. */
  serviceCards: {
    eyebrow: string
    heading: string
    subheading: string
    cards: ServiceCardCopy[]
  }
  /** Home "why choose us" section. */
  whyChooseUs: {
    eyebrow: string
    heading: string
    subheading: string
    reasons: ReasonCopy[]
  }
  /** Home process section. */
  process: {
    eyebrow: string
    heading: string
    subheading: string
    steps: ProcessStepCopy[]
  }
  /** Home testimonials section. */
  testimonials: {
    eyebrow: string
    heading: string
    items: TestimonialCopy[]
    aggregateRatingValue: number
    aggregateReviewCount: number
    aggregateSourceName: string
    reviewsUrl: string
    leaveReviewUrl: string
  }
  /** Home blog teaser. */
  blogSection: {eyebrow: string; heading: string}
  /** Home CTA. */
  homeCta: {eyebrow: string; heading: string; subheading: string}
  /** Home contact-form title. */
  homeContactFormTitle: string

  /** About page hero + sections. */
  aboutHero: HeroCopy
  aboutIntro: ChecklistSection
  aboutWhyChooseUs: {
    eyebrow: string
    heading: string
    subheading: string
    reasons: ReasonCopy[]
  }
  aboutFaq: {
    eyebrow: string
    heading: string
    subheading: string
    items: FaqCopy[]
  }
  aboutCta: {eyebrow: string; heading: string; subheading: string}

  /** Contact page. */
  contactHero: HeroCopy
  contactFormTitle: string

  /** Privacy-policy hero (the body copy itself is trade-neutral, in the seed). */
  privacyHero: HeroCopy

  /**
   * Alt-text prefix for area hero images, e.g. "Plumbing & heating" →
   * "Plumbing & heating in Altrincham". Trade-varying microcopy.
   */
  areaHeroAltPrefix: string

  /** Per-marketing-page SEO meta (home + about + contact). Trade-specific copy. */
  pageSeo: {
    home: SeoPair
    /** About page description (title is the literal "About"). */
    aboutDescription: string
    /**
     * Contact page description. May include `{site}` which is replaced with
     * the business siteTitle at seed time (title is the literal "Contact").
     */
    contactDescription: string
  }
}

// ---------------------------------------------------------------------------
// Navigation + footer
// ---------------------------------------------------------------------------

export type NavItemCopy = {label: string; href: string}

export type NavigationCopy = {
  items: NavItemCopy[]
  cta: {label: string; href: string; variant?: 'primary' | 'secondary'}
}

export type FooterColumnCopy = {title: string; links: NavItemCopy[]}

export type FooterCopy = {
  columns: FooterColumnCopy[]
  legal: NavItemCopy[]
}

// ---------------------------------------------------------------------------
// Shared content used by multiple service docs (kept in the pack, not the seed)
// ---------------------------------------------------------------------------

export type SharedServiceContent = {
  /** Trust signals shown on every service page. */
  trustSignals: IconLabel[]
  /** Default process steps reused by services that don't override them. */
  steps: StepTuple[]
  /** Default areasServed slug list used by the services. */
  serviceAreaSlugs: string[]
}

// ---------------------------------------------------------------------------
// SEO keyword seeds (trade keyword themes used to shape research)
// ---------------------------------------------------------------------------

export type SeoSeeds = {
  /** Seed keyword themes for this trade. */
  keywords: string[]
}

// ---------------------------------------------------------------------------
// Per-trade seed imagery (optional)
// ---------------------------------------------------------------------------

/**
 * Real photo filenames for a trade, resolved against
 * frontend/public/images/<trade>-seed-images/ (falling back to the plumber set
 * for any file not present). OMIT this whole block to use the plumber defaults
 * (what plumber/electrician do today). When present, ONLY the listed slots are
 * overridden; anything omitted still falls back to the plumber filename.
 *
 * `service` MUST be keyed by this pack's service slugs so the seeded heroImage
 * lands on `service-<slug>` — which the brief overlay (onboard-client) preserves
 * via createIfNotExists, so the client's real services keep these photos.
 */
export type TradeImages = {
  homeHero: string
  aboutHero: string
  contactHero: string
  /** Home + about intro-section photo. */
  intro: string
  /** Why-choose-us section photo. */
  why: string
  /** Single shared area-page hero. */
  areaHero: string
  /** Home info-section / featured-service photo. */
  infoImage: string
  /** Blog-author headshot. Omit to fall back to the plumber headshot. */
  person?: string
  /** Service slug -> hero photo filename. */
  service: Record<string, string>
  /** Project before/after pairs `[before, after]`. Omit -> plumber defaults. */
  beforeAfter?: Pair[]
  /** Blog post cover filenames (cycled). Omit -> plumber defaults. */
  postCovers?: string[]
}

// ---------------------------------------------------------------------------
// The TradePack itself
// ---------------------------------------------------------------------------

export interface TradePack {
  /** Pack key, e.g. "plumber". Matches the tenant `theme` value. */
  trade: string

  business: BusinessIdentity
  /** Settings-level SEO (the sitewide title/description). */
  seo: SeoPair
  structuredData: StructuredData

  /** Shared bits reused across multiple service docs. */
  shared: SharedServiceContent

  services: ServiceSeed[]
  areas: AreaSeed[]
  projects: ProjectSeed[]
  posts: PostSeed[]
  person: PersonSeed

  /** All marketing-page section copy (home, about, contact, privacy heroes). */
  sections: SectionCopy

  navigation: NavigationCopy
  footer: FooterCopy

  seoSeeds: SeoSeeds

  /** Per-trade real photos. Omit to use the plumber image set (plumber/electrician). */
  images?: TradeImages
}
