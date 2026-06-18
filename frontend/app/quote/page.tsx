import type {Metadata} from 'next'
import {CheckCircle2} from 'lucide-react'

import Breadcrumbs from '@/app/components/Breadcrumbs'
import QuoteForm from '@/app/components/sections/contact/QuoteForm'
import {allServicesQuery} from '@/sanity/lib/queries'
import {tenantFetch} from '@/sanity/lib/tenant-client'
import {AllServicesQueryResult} from '@/sanity.types'

export const metadata: Metadata = {
  title: 'Get a Free Quote',
  description: 'Request a free, no-obligation quote.',
  alternates: {canonical: '/quote'},
}

const POINTS = [
  'Free, no-obligation quote',
  'Fully insured & guaranteed work',
  'Local to the areas we cover',
  'Tidy, reliable tradespeople',
]

export default async function QuotePage() {
  const {data: services} = await tenantFetch<AllServicesQueryResult>({query: allServicesQuery})
  const serviceNames = (services ?? []).map((s) => s.name ?? '').filter(Boolean)

  return (
    <article>
      <Breadcrumbs
        items={[
          {label: 'Home', href: '/'},
          {label: 'Get a Quote', href: '/quote'},
        ]}
      />

      <section className="bg-gray-50 py-12 sm:py-16">
        <div className="container grid gap-10 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-semibold leading-tight text-gray-950 md:text-5xl">
              Get a free quote
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-neutral">
              Tell us about your project and we&apos;ll get back to you with a no-obligation
              quote.
            </p>
            <ul className="mt-8 space-y-3">
              {POINTS.map((p) => (
                <li key={p} className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-blue" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <QuoteForm
              services={serviceNames}
              context={{sourceUrl: '/quote'}}
            />
          </div>
        </div>
      </section>
    </article>
  )
}
