import type {Metadata} from 'next'

import Breadcrumbs from '@/app/components/Breadcrumbs'
import GraphJsonLd from '@/app/components/GraphJsonLd'
import ServiceList from '@/app/components/Service/ServiceList'
import ContactForm from '@/app/components/sections/contact/ContactForm'
import {FAQView} from '@/app/components/sections/faq/FAQ'

// Hub FAQs live in code (not Sanity) — /services is a static route with no
// page doc backing it, matching the same pattern as /quote in seed-site.ts.
const SERVICES_HUB_FAQS = [
  {
    question: 'What areas do you cover?',
    answer:
      'We work across the areas we cover and the surrounding postcodes. Each area has its own page with local detail — if you’re unsure whether your address is in range, just ask when you get in touch.',
  },
  {
    question: 'Do you offer free quotes?',
    answer:
      'Yes — quotes are free and come with no obligation. Send a few details through the quote form or call direct, and we’ll come back to you with a clear, written price.',
  },
  {
    question: 'Are you fully insured?',
    answer:
      'Yes — we’re fully insured with public liability cover on every job. Insurance details are available on request before work starts.',
  },
  {
    question: 'How quickly can you start?',
    answer:
      'It depends on the job and our current schedule, but most work can be booked in within a few days of accepting a quote. Get in touch and we’ll let you know the next available slot.',
  },
  {
    question: 'Do you guarantee your work?',
    answer:
      'Yes — all work is guaranteed, and we’ll put things right if anything isn’t up to standard. We’ll walk through the finished job with you before we sign off.',
  },
]
import {allServicesQuery} from '@/sanity/lib/queries'
import {absoluteUrl} from '@/sanity/lib/seo'
import {tenantFetch} from '@/sanity/lib/tenant-client'
import {collectionPageJsonLd} from '@/sanity/lib/jsonld'
import {AllServicesQueryResult} from '@/sanity.types'

export const metadata: Metadata = {
  title: 'Our Services',
  description:
    'Our services — choose one to see what’s included and recent local work.',
  alternates: {canonical: '/services'},
}

export default async function ServicesHubPage() {
  const {data: services} = await tenantFetch<AllServicesQueryResult>({query: allServicesQuery})

  return (
    <article>
      <GraphJsonLd
        nodes={[
          collectionPageJsonLd({
            name: 'Our Services',
            url: absoluteUrl('/services'),
            description:
              'Our services — choose one to see what’s included and recent local work.',
            items: (services ?? []).map((s) => ({
              name: s.name ?? 'Service',
              url: absoluteUrl(`/services/${s.slug}`),
              description: s.summary,
            })),
          }),
        ]}
      />
      <Breadcrumbs
        items={[
          {label: 'Home', href: '/'},
          {label: 'Services', href: '/services'},
        ]}
      />

      <section className="bg-white pt-8">
        <div className="container ">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-deep">
            Our Services
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-gray-950 md:text-5xl">
            Our services
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-neutral">
            Browse our services — choose one to see what&apos;s included and recent local work.
          </p>
        </div>
      </section>

      {(services ?? []).length === 0 ? (
        <section className="bg-white py-12 sm:py-16">
          <div className="container">
            <p className="text-neutral">Services coming soon.</p>
          </div>
        </section>
      ) : (
        <ServiceList items={services ?? []} />
      )}

      <FAQView
        eyebrow="FAQs"
        heading="Frequently asked questions"
        items={SERVICES_HUB_FAQS}
        className="bg-gray-50"
      />

      <ContactForm
        block={{title: 'Tell us about your project'}}
        context={{sourceUrl: '/services'}}
      />
    </article>
  )
}
