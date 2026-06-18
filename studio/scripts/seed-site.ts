/**
 * SITE SEED — settings, navigation, footer + marketing/hub page docs,
 * parameterised by TRADE.
 *
 *   cd studio
 *   npx sanity exec scripts/seed-site.ts --with-user-token
 *   # or: npm run seed:site
 *
 * The DATA (business identity, structured data, all section copy, nav + footer
 * labels) comes from the trade pack resolved by `getPack(process.env.SEED_TRADE)`
 * — see scripts/trade-packs/. The default pack is `plumber` (the fictional
 * "Vanguard Plumbing & Heating" demo). The seeding LOGIC and the design-level
 * theme defaults live here and are trade-agnostic.
 *
 * Idempotent (fixed _ids + createOrReplace). Run AFTER seed-dev.ts so
 * nav/footer/menus have services & areas to surface.
 *
 * ═══ AI AGENT CONTENT REQUIREMENTS ═══
 *
 * HOMEPAGE (page doc, slug "/"):
 *   Component order matches optimal-page-structures.md §2:
 *   Hero → Intro → WhyChooseUs → ServiceCards → Process →
 *   Testimonials → BlogSection → CTA → ContactForm
 *   Total word count: ≥300 across all blocks (optimal: 500-800)
 *   Hero H1: front-loads primary service + city
 *   Testimonials: attributable reviews (in this demo they are the
 *                 pre-approved fictional reviews from the content brief)
 *   ServiceCards: link to real service pages, each card has 1-sentence
 *                 description (not thin/generic)
 *   ProcessSection: 3-4 steps, each with ≥10-word description
 *   FAQ (on About page): ≥4 questions, answers 50-100 words
 *   TrustBadges: 4 items (insured, fast response, 5-star, free quotes)
 *
 * ABOUT PAGE (page doc, slug "about"):
 *   Intro: ≥100 words, founder story / approach
 *   WhyChooseUs: 3 reasons with ≥15-word descriptions
 *   FAQ: ≥4 questions (who, insured, quotes, areas, paint, tidiness)
 *
 * CONTACT PAGE (page doc, slug "contact"):
 *   Hero: includes phone + quote CTA
 *   Page builder: hero + contact form only (keep it tight)
 *   The /quote route is dedicated (app/quote/page.tsx), not a page doc
 *
 * STRUCTURED DATA (settings singleton):
 *   Organization: NAP + sameAs (GBP, Facebook URLs)
 *   LocalBusiness: enabled, serviceAreaOnly=true, openingHours,
 *                  priceRange (£/££/£££), aggregateRating
 *   WebSite: SearchAction enabled for site search
 *   All @id values must match the canonical domain in NEXT_PUBLIC_SITE_URL
 *
 * NAVIGATION:
 *   Top-level items: linked pages + auto-generated Services/Areas
 *   dropdowns (Header.tsx injects these from Sanity typed docs)
 *   CTA button: "Get a Quote" → /quote
 *
 * FOOTER:
 *   Columns: auto-generated Services + Areas from Sanity typed docs
 *            (Header/Footer inject these — don't duplicate here)
 *   Legal: Privacy Policy link (page doc must exist)
 *
 * ═══════════════════════════════════════════════════════
 *
 * The default `plumber` pack is the fictional DEMO business "Vanguard Plumbing
 * & Heating". Every contact detail is deliberately reserved/fake (.example
 * domain, 555 phone range, Ofcom-reserved 07700 900xxx WhatsApp) so no real
 * data ships. The homepage testimonials are the pre-approved fictional reviews
 * from docs/CLIENT-CONTENT-BRIEF.demo.md. Services / Areas nav + footer
 * columns are injected automatically by the Header/Footer from the typed
 * docs — not duplicated here.
 */
import {
  client,
  createPage,
  localImageRef,
  upsertSettings,
  upsertNavigation,
  upsertFooter,
  heroBanner,
  infoSection,
  introOverviewSection,
  serviceCards,
  whyChooseUs,
  processSection,
  testimonials,
  faq,
  cta,
  contactForm,
  key,
} from './seed'
import {getPack} from './trade-packs'

// Trade-specific content (business identity, structured data, section copy,
// nav + footer labels) all come from the resolved pack. The seeding LOGIC and
// the design-level theme defaults below are trade-agnostic.
const pack = getPack(process.env.SEED_TRADE)

const biz = pack.business
const sec = pack.sections

const SITE = biz.siteTitle
// Production canonical host is the www subdomain — non-www should
// 301 to this. Used everywhere a fully-qualified URL needs emitting
// (canonical link tags, OG, sitemap, JSON-LD, etc.).
const URL = biz.url
const PHONE_DISPLAY = biz.phoneDisplay
const PHONE_TEL = biz.phoneTel
const EMAIL = biz.email

// CTA buttons. The "Call …" label is built from the display phone number.
const QUOTE = {text: 'Get a Free Quote', href: '/quote'}
const CALL = {text: `Call ${PHONE_DISPLAY}`, href: `tel:${PHONE_TEL}`}

// Trust badges shown beneath each hero. Passed explicitly on every
// heroBanner call so the template defaults baked into blocks.ts never fire.
const TRUST_BADGES = sec.trustBadges

// Map the (shared) plumber service slugs → demo photo, so the home service-card
// grid shows real images (cards link out by /services/<slug>). Mirrors
// SERVICE_IMAGES in seed-dev.ts. Demo images for intro/why-choose sections too.
// pack.images (keyed by THIS pack's service slugs) overrides these; omitted slots
// keep the plumber default, which resolves via the per-file fallback in localImageRef.
const SERVICE_CARD_IMAGES: Record<string, string> = pack.images?.service ?? {
  'boiler-installation-heating-upgrades': 'boiler-installation-photo.webp',
  'emergency-plumbing-repairs': 'emergency-plumbing.webp',
  'bathroom-design-renovation': 'bathroom-renovation-photo.webp',
  'gas-safety-certificates-boiler-servicing': 'gas-safety-servicing-photo.webp',
  'power-flushing-system-clean': 'power-flushing-photo.webp',
  'underfloor-heating-installation': 'underfloor-heating-photo.webp',
}
const INTRO_IMAGE = pack.images?.intro ?? 'plumber-headshot.webp'
const WHY_IMAGE = pack.images?.why ?? 'bathroom-renovation-photo.webp'

async function settings() {
  await upsertSettings({
    branding: {siteTitle: SITE, whatsappNumber: biz.whatsappNumber},
    seo: {
      title: pack.seo.title,
      description: pack.seo.description,
      metadataBase: URL,
      robots: {index: true, follow: true},
    },
    // Theme is DESIGN (not trade) — kept here as the trade-agnostic default.
    theme: {colorScheme: 'blue-white', mode: 'light', accent: 'solid'},
    structuredData: {
      enabled: true,
      language: 'en-GB',
      website: {
        name: SITE,
        url: URL,
        enableSearchAction: true,
        ...(pack.structuredData.searchUrlTemplate
          ? {searchUrlTemplate: pack.structuredData.searchUrlTemplate}
          : {}),
      },
      organization: {
        name: SITE,
        legalName: biz.legalName,
        url: URL,
        description: biz.description,
        foundingDate: biz.foundingDate,
        areaServed: biz.areaServed,
        // Same-as identifiers — third-party profiles that represent the same
        // entity. Strengthens the entity graph; Google uses these to merge
        // your knowledge-panel data with on-site JSON-LD.
        sameAs: biz.sameAs,
        contact: {
          phone: PHONE_TEL,
          email: EMAIL,
          contactType: 'Customer Service',
          availableLanguage: 'English',
        },
        // Service-area business with a registered company address (no public
        // walk-in). Emitted for entity consistency / GBP NAP matching.
        address: {
          streetAddress: biz.address.street,
          addressLocality: biz.address.locality,
          addressRegion: biz.address.region,
          postalCode: biz.address.postcode,
          addressCountry: biz.address.country,
        },
        geo: {
          latitude: biz.geo.latitude,
          longitude: biz.geo.longitude,
        },
        founder: {
          name: biz.founder.name,
          jobTitle: biz.founder.jobTitle,
        },
      },
      localBusiness: {
        enabled: true,
        serviceAreaOnly: pack.structuredData.localBusinessServiceAreaOnly,
        priceRange: biz.priceRange,
        currency: biz.currency,
        openingHours: biz.openingHours.map((h) => ({
          _key: key(),
          _type: 'openingHoursSpec',
          dayOfWeek: h.dayOfWeek,
          opens: h.opens,
          closes: h.closes,
        })),
      },
      services: pack.structuredData.services.map((title) => ({
        _key: key(),
        _type: 'schemaService',
        title,
        priceCurrency: biz.currency,
      })),
      areaServedCities: pack.structuredData.areaServedCities.map((title) => ({
        _key: key(),
        _type: 'servedCity',
        title,
      })),
      // Reviews aggregate. In this demo these figures back the pre-approved
      // fictional reviews from the content brief. Feeds
      // LocalBusiness.aggregateRating in the sitewide JSON-LD via layout.tsx.
      // For a real client, replace with verified figures from their GBP/Facebook.
      reviews: {
        enabled: pack.structuredData.reviews.enabled,
        aggregateRating: {
          ratingValue: pack.structuredData.reviews.ratingValue,
          reviewCount: pack.structuredData.reviews.reviewCount,
          bestRating: pack.structuredData.reviews.bestRating,
          worstRating: pack.structuredData.reviews.worstRating,
        },
      },
    },
  })
}

async function navigation() {
  await upsertNavigation({
    items: pack.navigation.items.map((i) => ({label: i.label, href: i.href})),
    cta: {
      label: pack.navigation.cta.label,
      href: pack.navigation.cta.href,
      variant: pack.navigation.cta.variant,
    },
  })
}

async function footer() {
  await upsertFooter({
    columns: pack.footer.columns.map((col) => ({
      title: col.title,
      links: col.links.map((l) => ({label: l.label, href: l.href})),
    })),
    legal: pack.footer.legal.map((l) => ({label: l.label, href: l.href})),
    copyright: `© ${new Date().getFullYear()} ${SITE}. All rights reserved.`,
  })
}

async function pages() {
  // Home
  await createPage({
    id: 'page-home',
    name: 'Home',
    slug: '/',
    seo: {
      title: sec.pageSeo.home.title,
      description: sec.pageSeo.home.description,
    },
    pageBuilder: [
      heroBanner({
        eyebrow: sec.homeHero.eyebrow,
        heading: sec.homeHero.heading,
        subheading: sec.homeHero.subheading,
        primaryButton: QUOTE,
        secondaryButton: CALL,
        trustBadges: TRUST_BADGES,
        backgroundImage: {assetRef: await localImageRef(pack.images?.homeHero ?? 'homepage-hero.webp'), alt: sec.homeHero.heading},
      }),
      introOverviewSection({
        eyebrow: sec.homeIntro.eyebrow,
        heading: sec.homeIntro.heading,
        body: sec.homeIntro.body,
        stats: [],
        checklist: sec.homeIntro.checklist,
        cta: QUOTE,
        secondaryCta: CALL,
        image: {assetRef: await localImageRef(INTRO_IMAGE), alt: sec.homeIntro.heading},
      }),
      serviceCards({
        eyebrow: sec.serviceCards.eyebrow,
        heading: sec.serviceCards.heading,
        subheading: sec.serviceCards.subheading,
        cards: await Promise.all(
          sec.serviceCards.cards.map(async (c) => {
            const file = SERVICE_CARD_IMAGES[c.href.replace(/^\/services\//, '')]
            return {
              title: c.title,
              description: c.description,
              button: {text: 'Learn more', href: c.href},
              ...(file ? {image: {assetRef: await localImageRef(file)}} : {}),
            }
          }),
        ),
      }),
      whyChooseUs({
        eyebrow: sec.whyChooseUs.eyebrow,
        heading: sec.whyChooseUs.heading,
        subheading: sec.whyChooseUs.subheading,
        reasons: sec.whyChooseUs.reasons,
        image: {assetRef: await localImageRef(WHY_IMAGE), alt: sec.whyChooseUs.heading},
        button: QUOTE,
      }),
      processSection({
        eyebrow: sec.process.eyebrow,
        heading: sec.process.heading,
        subheading: sec.process.subheading,
        steps: sec.process.steps,
      }),
      testimonials({
        eyebrow: sec.testimonials.eyebrow,
        heading: sec.testimonials.heading,
        items: sec.testimonials.items,
        // Enriches the "See all our reviews" button label into the form
        // "★★★★★ 5.0 · 27 reviews on Facebook →" — the visible counterpart
        // to the LocalBusiness.aggregateRating JSON-LD seeded above.
        aggregateRatingValue: sec.testimonials.aggregateRatingValue,
        aggregateReviewCount: sec.testimonials.aggregateReviewCount,
        aggregateSourceName: sec.testimonials.aggregateSourceName,
        reviewsUrl: sec.testimonials.reviewsUrl,
        // Funnel new reviews to Google Business Profile — Google reviews
        // tied to a GBP are the strongest signal for the local pack, so
        // the "Leave us a review" button points at GBP rather than Facebook.
        leaveReviewUrl: sec.testimonials.leaveReviewUrl,
        // `resultsCTA` variant panel (conversion-led design profiles). Seed the
        // aggregate stats ONLY when there are real reviews — a "0★ / 0+ Verified
        // reviews" panel reads as broken. With no aggregate we drop the stats so the
        // panel shows just the quote + the quote CTA (the component also hides any
        // zero stat as a backstop).
        resultsStats:
          sec.testimonials.aggregateReviewCount > 0
            ? [
                {
                  value: `${sec.testimonials.aggregateRatingValue}★`,
                  label: `Average rating on ${sec.testimonials.aggregateSourceName}`,
                },
                {value: `${sec.testimonials.aggregateReviewCount}+`, label: 'Verified reviews'},
              ]
            : [],
        ctaButton: QUOTE,
        resultsNote: 'Free, no-obligation quote — usually within the hour.',
        // `caseStudy` variant (premium/editorial profiles). Built from the first
        // testimonial + the aggregate + a real job photo, so the variant is a
        // complete mini case study instead of an empty card. Ignored/hidden on
        // cards & resultsCTA variants — safe to seed unconditionally.
        caseBody: sec.testimonials.items[0]?.quote,
        caseCustomer: sec.testimonials.items[0]?.authorName,
        caseBadge: 'Verified job',
        caseStats:
          sec.testimonials.aggregateReviewCount > 0
            ? [
                {
                  value: `${sec.testimonials.aggregateRatingValue}★`,
                  label: `Average rating on ${sec.testimonials.aggregateSourceName}`,
                },
                {value: `${sec.testimonials.aggregateReviewCount}+`, label: 'Verified reviews'},
              ]
            : [],
        caseImage: {
          assetRef: await localImageRef(pack.images?.infoImage ?? 'boiler-installation-photo.webp'),
          alt: `Completed job by ${SITE}`,
        },
      }),
      {
        _type: 'blogSection',
        _key: key(),
        eyebrow: sec.blogSection.eyebrow,
        heading: sec.blogSection.heading,
        maxPosts: 3,
        theme: 'light',
      },
      cta({
        eyebrow: sec.homeCta.eyebrow,
        heading: sec.homeCta.heading,
        subheading: sec.homeCta.subheading,
        primaryButton: QUOTE,
        secondaryButton: CALL,
      }),
      contactForm({title: sec.homeContactFormTitle}),
    ],
  })

  // About
  await createPage({
    id: 'page-about',
    name: 'About',
    slug: 'about',
    seo: {
      title: 'About',
      description: sec.pageSeo.aboutDescription,
    },
    pageBuilder: [
      heroBanner({
        eyebrow: sec.aboutHero.eyebrow,
        heading: sec.aboutHero.heading,
        subheading: sec.aboutHero.subheading,
        primaryButton: QUOTE,
        secondaryButton: CALL,
        trustBadges: TRUST_BADGES,
        backgroundImage: {assetRef: await localImageRef(pack.images?.aboutHero ?? 'about-page-hero.webp'), alt: sec.aboutHero.heading},
      }),
      introOverviewSection({
        eyebrow: sec.aboutIntro.eyebrow,
        heading: sec.aboutIntro.heading,
        body: sec.aboutIntro.body,
        stats: [],
        checklist: sec.aboutIntro.checklist,
        cta: QUOTE,
        secondaryCta: CALL,
        image: {assetRef: await localImageRef(INTRO_IMAGE), alt: sec.aboutIntro.heading},
      }),
      whyChooseUs({
        eyebrow: sec.aboutWhyChooseUs.eyebrow,
        heading: sec.aboutWhyChooseUs.heading,
        subheading: sec.aboutWhyChooseUs.subheading,
        reasons: sec.aboutWhyChooseUs.reasons,
        image: {assetRef: await localImageRef(WHY_IMAGE), alt: sec.aboutWhyChooseUs.heading},
        button: QUOTE,
      }),
      faq({
        eyebrow: sec.aboutFaq.eyebrow,
        heading: sec.aboutFaq.heading,
        subheading: sec.aboutFaq.subheading,
        items: sec.aboutFaq.items,
      }),
      cta({
        eyebrow: sec.aboutCta.eyebrow,
        heading: sec.aboutCta.heading,
        subheading: sec.aboutCta.subheading,
        primaryButton: QUOTE,
        secondaryButton: CALL,
      }),
    ],
  })

  // Privacy Policy — required for UK GDPR / linked from the footer.
  // Seeded so /privacy-policy resolves rather than 404s, and so the client
  // can edit it in Studio without a code change. Section headings (## …) are
  // parsed by richPortableText into proper Sanity h2 blocks.
  //
  // The body copy below is trade-NEUTRAL UK GDPR boilerplate and stays in the
  // seed script (only the business name / contact details are interpolated
  // from the pack). The hero microcopy comes from the pack.
  await createPage({
    id: 'page-privacy-policy',
    name: 'Privacy Policy',
    slug: 'privacy-policy',
    seo: {
      title: 'Privacy Policy',
      description: `How ${SITE} handles personal information submitted through this website. UK GDPR compliant.`,
    },
    pageBuilder: [
      heroBanner({
        eyebrow: sec.privacyHero.eyebrow,
        heading: sec.privacyHero.heading,
        subheading: sec.privacyHero.subheading,
        primaryButton: QUOTE,
        secondaryButton: CALL,
        trustBadges: TRUST_BADGES,
      }),
      infoSection({
        content: [
          '## Who we are',
          `${SITE} provides services covering Greater Manchester and North Cheshire. You can reach us at ${EMAIL} or ${PHONE_DISPLAY}. We are the data controller for any personal information you provide through this website.`,
          '## What information we collect',
          'When you submit our quote or contact form, we collect the information you give us: your name, email address, phone number, property address (if provided) and the details of your enquiry. We also receive standard server logs — IP address, browser type, page visited — collected automatically by the hosting platform for security and performance.',
          '## How we use your information',
          'We use the information you provide to respond to your enquiry, arrange a site visit, send you a written quote, schedule any agreed work and send invoices for completed jobs. Records are kept where required for accounting, tax and warranty purposes. We do not use your information for marketing without your explicit consent.',
          '## Legal basis for processing',
          'We rely on three lawful bases under UK GDPR: legitimate interest (responding to enquiries you have sent us), contract (carrying out work you have asked us to do) and legal obligation (tax and accounting records).',
          '## Who we share your information with',
          'We do not sell or share your information for marketing purposes. We use a small number of essential service providers — Cloudflare Turnstile (spam protection on forms) and our email and hosting providers. These providers process information on our instructions only and may not use it for other purposes.',
          '## How long we keep your information',
          'Enquiries that do not lead to a quote are kept for up to 12 months. Quotes and contracted work are kept for the duration of the job plus six years for accounting and tax records, in line with HMRC requirements.',
          '## Your rights',
          `Under UK GDPR you have the right to access the personal information we hold about you, ask us to correct inaccurate information, ask us to delete information (where we are not required to keep it for legal reasons), object to or restrict how we use it, and lodge a complaint with the Information Commissioner’s Office at ico.org.uk. To exercise any of these rights, contact us at ${EMAIL}.`,
          '## Cookies',
          'This site uses minimal essential cookies — security cookies for Cloudflare Turnstile on contact forms and basic performance cookies. We do not use third-party advertising or behavioural-tracking cookies.',
          '## Changes to this policy',
          'We may update this policy from time to time. The “last updated” date at the top of this page will reflect any changes. Material changes will be notified to anyone we are actively in contact with.',
          '## Contact',
          `Questions about this policy or about the personal information we hold can be sent to ${EMAIL} or ${PHONE_DISPLAY}.`,
        ],
      }),
    ],
  })

  // Contact
  await createPage({
    id: 'page-contact',
    name: 'Contact',
    slug: 'contact',
    seo: {
      title: 'Contact',
      description: sec.pageSeo.contactDescription.replace('{site}', SITE),
    },
    pageBuilder: [
      heroBanner({
        eyebrow: sec.contactHero.eyebrow,
        heading: sec.contactHero.heading,
        subheading: sec.contactHero.subheading,
        primaryButton: QUOTE,
        secondaryButton: CALL,
        trustBadges: TRUST_BADGES,
        backgroundImage: {assetRef: await localImageRef(pack.images?.contactHero ?? 'branded-plumber-van.webp'), alt: sec.contactHero.heading},
      }),
      contactForm({title: sec.contactFormTitle}),
    ],
  })

  // /quote is a dedicated route (app/quote/page.tsx) with the multi-step
  // QuoteForm — NOT a page doc. We intentionally don't seed a quote page
  // doc so editors aren't confused about which one is "the live page".
}

/**
 * Delete orphan docs from earlier seeds / Studio singleton mismatches:
 *  - 'siteNavigation' / 'siteFooter' (old desk-singleton IDs; current
 *    seed writes 'navigation' / 'footer'). With two docs of the same
 *    type the frontend's *[_type=="..."][0] pick is non-deterministic
 *    — a crawl-stability issue, not just a Studio cosmetic.
 *  - 'page-quote' (superseded by the dedicated /quote route).
 * Idempotent — succeeds whether the doc exists or not.
 */
async function cleanup() {
  const orphans = ['siteNavigation', 'siteFooter', 'page-quote']
  await Promise.allSettled(orphans.map((id) => client.delete(id)))
  // eslint-disable-next-line no-console
  console.log(`✓ cleanup  (removed any orphan: ${orphans.join(', ')})`)
}

async function main() {
  await cleanup()
  await settings()
  await navigation()
  await footer()
  await pages()
  // eslint-disable-next-line no-console
  console.log(
    `\nSite seed complete. This is the fictional ${pack.business.siteTitle} demo — all contact details are reserved/fake and the testimonials are demo content. Replace with real client material before launch.`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
