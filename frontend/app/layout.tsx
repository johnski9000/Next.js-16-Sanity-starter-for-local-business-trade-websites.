import './globals.css'

import {SpeedInsights} from '@vercel/speed-insights/next'
import {MotionConfig} from 'framer-motion'
import type {Metadata} from 'next'
import {Montserrat} from 'next/font/google'
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'
import {Toaster} from 'sonner'

import DraftModeToast from '@/app/components/DraftModeToast'
import GraphJsonLd from '@/app/components/GraphJsonLd'
import StickyMobileCTA from '@/app/components/StickyMobileCTA'
import WhatsAppBubble from '@/app/components/WhatsAppBubble'
import Footer from '@/app/components/Footer/Footer'
import Header from '@/app/components/NavBar/Header'
import Analytics from '@/app/components/Analytics'
import TenantImageProvider from '@/app/components/TenantImageProvider'
import {designCssVars} from '@/lib/themes'
import {currentTenant, getClient, buildSafe} from '@/sanity/lib/tenant-client'
import {setRequestBaseUrl} from '@/sanity/lib/request-base'
import {
  imageObjectJsonLd,
  localBusinessJsonLd,
  warnIfLocalBusinessIncomplete,
  webSiteJsonLd,
} from '@/sanity/lib/jsonld'
import {logoId} from '@/sanity/lib/siteIds'
import * as demo from '@/sanity/lib/demo'
import {SanityLive} from '@/sanity/lib/live'
import {
  settingsQuery,
  navigationQuery,
  footerQuery,
  searchIndexQuery,
  allServicesQuery,
  allAreasQuery,
  testimonialAggregateQuery,
} from '@/sanity/lib/queries'
import {resolveOpenGraphImage} from '@/sanity/lib/utils'
import {handleError} from '@/app/client-utils'

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  display: 'swap',
})

/**
 * Generate metadata for the site (global defaults).
 */
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await currentTenant()
  const settings = await buildSafe(getClient(tenant).fetch(settingsQuery), null)

  const siteTitle = settings?.branding?.siteTitle || demo.title
  const seo = settings?.seo
  const ogImage = resolveOpenGraphImage(seo?.ogImage, {
    projectId: tenant.projectId,
    dataset: tenant.dataset,
  })

  let metadataBase: URL | undefined
  try {
    metadataBase = tenant.siteUrl
      ? new URL(tenant.siteUrl)
      : seo?.metadataBase
        ? new URL(seo.metadataBase)
        : undefined
  } catch {
    metadataBase = undefined
  }

  return {
    metadataBase,
    title: {
      template: `%s | ${siteTitle}`,
      default: seo?.title || siteTitle,
    },
    description: seo?.description,
    openGraph: {
      images: ogImage ? [ogImage] : [],
    },
  }
}

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const {isEnabled: isDraftMode} = await draftMode()
  const tenant = await currentTenant()

  // Pin the request's base URL to THIS tenant's domain before anything renders, so
  // every absoluteUrl() (JSON-LD @ids/URLs, breadcrumbs, OG) resolves on the right
  // domain — not the global NEXT_PUBLIC_SITE_URL. Runs before children render.
  setRequestBaseUrl(tenant.siteUrl)

  const client = getClient(tenant, {stega: isDraftMode})

  // buildSafe: with dummy/unreachable Sanity creds at `next build` time (e.g. CI),
  // these fetches return null/[] so prerendering an empty shell never crashes the
  // build. ISR fills them at runtime; at runtime a real failure still propagates.
  const [settings, nav, footer, searchItems, services, areas, ratings] = await Promise.all([
    buildSafe(client.fetch(settingsQuery), null),
    buildSafe(client.fetch(navigationQuery), null),
    buildSafe(client.fetch(footerQuery), null),
    buildSafe(client.fetch(searchIndexQuery), []),
    buildSafe(client.fetch(allServicesQuery), []),
    buildSafe(client.fetch(allAreasQuery), []),
    buildSafe(client.fetch(testimonialAggregateQuery), null),
  ])

  // Aggregate site-wide rating (LocalBusiness.aggregateRating).
  // Emits only when reviewCount > 0 — no fabricated reviews in seed.
  //
  // Sources (combined into a single AggregateRating per Schema.org spec):
  //   1. settings.structuredData.reviews.aggregateRating — gated by
  //      `reviews.enabled`. Used for external sources (Facebook, Google).
  //   2. In-Sanity testimonials seeded onto area.localTestimonials[].rating
  //      and project.testimonial.rating.
  const externalReviews = (
    settings as
      | {
          structuredData?: {
            reviews?: {
              enabled?: boolean | null
              aggregateRating?: {
                ratingValue?: number | null
                reviewCount?: number | null
              } | null
            } | null
          }
        }
      | null
      | undefined
  )?.structuredData?.reviews
  const externalAgg =
    externalReviews?.enabled &&
    typeof externalReviews.aggregateRating?.ratingValue === 'number' &&
    typeof externalReviews.aggregateRating?.reviewCount === 'number' &&
    externalReviews.aggregateRating.reviewCount > 0
      ? {
          ratingValue: externalReviews.aggregateRating.ratingValue,
          reviewCount: externalReviews.aggregateRating.reviewCount,
        }
      : null

  const rawRatings: number[] = [
    ...(ratings?.areaRatings ?? []).map((r) => r?.rating),
    ...(ratings?.projectRatings ?? []).map((r) => r?.rating),
  ].filter((n): n is NonNullable<typeof n> => typeof n === 'number' && n > 0)
  const sanityAgg =
    rawRatings.length > 0
      ? {
          ratingValue: rawRatings.reduce((s, n) => s + n, 0) / rawRatings.length,
          reviewCount: rawRatings.length,
        }
      : null

  const aggregateRating = (() => {
    if (externalAgg && sanityAgg) {
      // Weighted-average ratingValue, summed reviewCount.
      const totalCount = externalAgg.reviewCount + sanityAgg.reviewCount
      return {
        ratingValue:
          (externalAgg.ratingValue * externalAgg.reviewCount +
            sanityAgg.ratingValue * sanityAgg.reviewCount) /
          totalCount,
        reviewCount: totalCount,
      }
    }
    return externalAgg ?? sanityAgg
  })()

  // Typed services + areas feed LocalBusiness.hasOfferCatalog (Offer →
  // Service @id) and areaServed (Place @id refs), closing the
  // bidirectional links between LocalBusiness and the typed docs.
  const lbServices = (services ?? [])
    .filter((s): s is typeof s & {slug: string; name: string} => Boolean(s.slug && s.name))
    .map((s) => ({slug: s.slug, name: s.name}))
  const lbAreas = (areas ?? [])
    .filter((a): a is typeof a & {slug: string; name: string} => Boolean(a.slug && a.name))
    .map((a) => ({slug: a.slug, name: a.name}))

  const whatsappNumber = (
    settings as {branding?: {whatsappNumber?: string}} | null | undefined
  )?.branding?.whatsappNumber

  const structuredData = (
    settings as {structuredData?: Parameters<typeof localBusinessJsonLd>[0]} | null | undefined
  )?.structuredData

  const logoUrl = (
    structuredData as
      | {organization?: {logo?: {asset?: {url?: string | null} | null} | null}}
      | null
      | undefined
  )?.organization?.logo?.asset?.url

  warnIfLocalBusinessIncomplete(structuredData)

  const orgContact = (
    settings as
      | {structuredData?: {organization?: {contact?: {phone?: string; email?: string}}}}
      | null
      | undefined
  )?.structuredData?.organization?.contact
  const phone = orgContact?.phone
  const email = orgContact?.email

  return (
    <html
      lang="en-GB"
      className={`${montserrat.variable} bg-white text-black`}
      style={designCssVars(tenant.branding?.design, tenant.branding?.primaryColor) as React.CSSProperties}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:font-semibold focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>
        <GraphJsonLd
          nodes={[
            localBusinessJsonLd(structuredData, {
              aggregateRating,
              services: lbServices,
              areas: lbAreas,
            }),
            webSiteJsonLd(structuredData),
            logoUrl
              ? imageObjectJsonLd({id: logoId(), url: logoUrl, caption: 'Logo'})
              : null,
          ]}
        />
        <TenantImageProvider value={{projectId: tenant.projectId, dataset: tenant.dataset}}>
        <section className="min-h-screen pt-20 pb-14 lg:pb-0">
          <Toaster />

          {isDraftMode && (
            <>
              <DraftModeToast />
              <VisualEditing />
            </>
          )}

          {/* Live content updates + the browser token are for visual editing only —
              mount ONLY in draft mode so production ships neither (matches VisualEditing). */}
          {isDraftMode && <SanityLive onError={handleError} />}

          <Header
            nav={(nav ?? undefined) as React.ComponentProps<typeof Header>['nav']}
            siteTitle={settings?.branding?.siteTitle}
            searchItems={searchItems ?? []}
            services={services ?? []}
            areas={areas ?? []}
          />
          {/* tabIndex=-1 so the skip link actually moves keyboard focus into main
              (a bare <main> isn't focusable in Safari/older Chrome). */}
          <main id="main" tabIndex={-1} className="focus:outline-none">
            {/* Respect prefers-reduced-motion across all framer-motion animations. */}
            <MotionConfig reducedMotion="user">{children}</MotionConfig>
          </main>
          <Footer
            footer={(footer ?? undefined) as React.ComponentProps<typeof Footer>['footer']}
            siteTitle={settings?.branding?.siteTitle}
            services={services ?? []}
            areas={areas ?? []}
            contact={{phone, email}}
          />
          <StickyMobileCTA phone={phone} />

          {whatsappNumber && (
            <>
              <WhatsAppBubble />
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with us on WhatsApp"
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
              >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-7 w-7 text-white"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </>
          )}
        </section>
        </TenantImageProvider>
        <SpeedInsights />
        {tenant.ga4MeasurementId && <Analytics measurementId={tenant.ga4MeasurementId} />}
      </body>
    </html>
  )
}
