import type {Metadata} from 'next'
import Link from 'next/link'
import {MapPin} from 'lucide-react'

import Breadcrumbs from '@/app/components/Breadcrumbs'
import GraphJsonLd from '@/app/components/GraphJsonLd'
import ContactForm from '@/app/components/sections/contact/ContactForm'
import {FAQView} from '@/app/components/sections/faq/FAQ'

// Hub FAQs live in code (not Sanity) — /areas is a static route with no
// page doc backing it, matching the same pattern as /quote in seed-site.ts.
const AREAS_HUB_FAQS = [
  {
    question: 'Where do you cover?',
    answer:
      'We cover the areas listed above and the surrounding postcodes. Each area has its own page with local detail.',
  },
  {
    question: 'Is there a travel charge?',
    answer:
      'No — all areas listed above are part of standard coverage with no travel charge. For addresses just outside the listed areas, get in touch and we’ll confirm.',
  },
  {
    question: 'How quickly can you visit for a quote?',
    answer:
      'Survey visits are usually possible within a few days of your enquiry. A written quote follows within 48 hours of the visit.',
  },
  {
    question: 'Do you cover the surrounding postcodes?',
    answer:
      'Yes — each area covers its main postcodes plus the streets around them. If you’re unsure whether your address is in range, just ask when you get in touch.',
  },
  {
    question: 'Do you work on rental and lettings properties?',
    answer:
      'Yes — between-tenant refreshes and letting-agent work are part of regular coverage across all areas. Tight changeover windows are usually workable with notice.',
  },
]
import {allAreasQuery, settingsQuery} from '@/sanity/lib/queries'
import {absoluteUrl} from '@/sanity/lib/seo'
import {collectionPageJsonLd} from '@/sanity/lib/jsonld'
import {tenantFetch} from '@/sanity/lib/tenant-client'
import {AllAreasQueryResult, SettingsQueryResult} from '@/sanity.types'

export const metadata: Metadata = {
  title: 'Areas We Cover',
  description: 'The areas we cover — find your local area below.',
  alternates: {canonical: '/areas'},
}

export default async function AreasHubPage() {
  const [{data: areas}, {data: settings}] = await Promise.all([
    tenantFetch<AllAreasQueryResult>({query: allAreasQuery}),
    tenantFetch<SettingsQueryResult>({query: settingsQuery}),
  ])

  const areaDocs = areas ?? []
  const byName = new Map(areaDocs.map((a) => [(a.name ?? '').toLowerCase(), a]))

  const cities =
    (settings as {structuredData?: {areaServedCities?: {title?: string | null}[] | null}} | null)
      ?.structuredData?.areaServedCities ?? []

  // Cities with no dedicated page (text only).
  const extra = cities
    .map((c) => c?.title)
    .filter((t): t is string => Boolean(t) && !byName.has((t as string).toLowerCase()))

  return (
    <article>
      <GraphJsonLd
        nodes={[
          collectionPageJsonLd({
            name: 'Areas We Cover',
            url: absoluteUrl('/areas'),
            description: 'The areas we cover — find your local area below.',
            items: areaDocs.map((a) => ({
              name: a.name ?? 'Area',
              url: absoluteUrl(`/areas/${a.slug}`),
            })),
          }),
        ]}
      />
      <Breadcrumbs
        items={[
          {label: 'Home', href: '/'},
          {label: 'Areas', href: '/areas'},
        ]}
      />

      <section className="bg-white pt-8">
        <div className="container">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-deep">
            Areas We Cover
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-gray-950 md:text-5xl">
            Areas we cover
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-neutral">
            The areas we cover — find your local area below.
          </p>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="container">
          {areaDocs.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {areaDocs.map((a) => (
                <Link
                  key={a._id}
                  href={`/areas/${a.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
                >
                  <MapPin className="h-5 w-5 shrink-0 text-blue" />
                  <span className="text-base font-semibold text-gray-950">{a.name}</span>
                </Link>
              ))}
            </div>
          )}

          {extra.length > 0 && (
            <p className="mt-10 text-sm leading-relaxed text-neutral">
              We also cover {extra.slice(0, -1).join(', ')}
              {extra.length > 1 ? ' and ' : ''}
              {extra[extra.length - 1]}. Get in touch to confirm coverage for your address.
            </p>
          )}
        </div>
      </section>

      <FAQView
        eyebrow="FAQs"
        heading="Frequently asked questions"
        items={AREAS_HUB_FAQS}
        className="bg-gray-50"
      />

      <ContactForm
        block={{title: 'Check coverage for your area'}}
        context={{sourceUrl: '/areas'}}
      />
    </article>
  )
}
