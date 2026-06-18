import Link from 'next/link'
import {ArrowRight, MapPin} from 'lucide-react'

import Breadcrumbs from '@/app/components/Breadcrumbs'
import GraphJsonLd from '@/app/components/GraphJsonLd'
import {FAQView} from '@/app/components/sections/faq/FAQ'
import RelatedContent from '@/app/components/Shared/RelatedContent'
import ContactForm from '@/app/components/sections/contact/ContactForm'
import ServiceInclusions from '@/app/components/Service/ServiceInclusions'
import {absoluteUrl} from '@/sanity/lib/seo'
import {serviceJsonLd, faqPageJsonLd} from '@/sanity/lib/jsonld'
import {localBusinessId} from '@/sanity/lib/siteIds'
import type {GetServiceAreaByRefsQueryResult} from '@/sanity.types'

/**
 * serviceArea (service × area) template. Only rendered by the catch-all
 * route when the publish gate passes (see sanity/lib/serviceArea.ts).
 */
export default function ServiceArea({sa}: {sa: NonNullable<GetServiceAreaByRefsQueryResult>}) {
  const serviceName = sa.service?.name ?? 'Service'
  const areaName = sa.area?.name ?? 'your area'

  return (
    <article>
      <GraphJsonLd
        nodes={[
          serviceJsonLd({
            name: `${serviceName} in ${areaName}`,
            description: sa.localIntro,
            url: absoluteUrl(`/services/${sa.service?.slug}/${sa.area?.slug}`),
            providerId: localBusinessId(),
            areasServed:
              sa.area?.slug && sa.area?.name
                ? [{slug: sa.area.slug, name: sa.area.name}]
                : undefined,
          }),
          faqPageJsonLd(sa.localFaqs ?? [], {
            isPartOfId: `${absoluteUrl(`/services/${sa.service?.slug}/${sa.area?.slug}`)}#service`,
          }),
        ]}
      />
      <Breadcrumbs
        items={[
          {label: 'Home', href: '/'},
          {label: 'Services', href: '/services'},
          {label: serviceName, href: `/services/${sa.service?.slug}`},
          {label: `${serviceName} in ${areaName}`, href: `/services/${sa.service?.slug}/${sa.area?.slug}`},
        ]}
      />

      <section className="bg-gray-950 text-white">
        <div className="container py-20 sm:py-28">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue">
            {areaName}
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
            {serviceName} in {areaName}
          </h1>
          {sa.localIntro && (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-300">
              {sa.localIntro}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/quote"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Get a Free Quote
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* What's included — pulled from the parent service */}
      {sa.service?.whatsIncluded && sa.service.whatsIncluded.length > 0 && (
        <ServiceInclusions
          eyebrow="What's included"
          heading={`What's included with every ${serviceName.toLowerCase()} job`}
          subheading={`The standard kit and approach you get on every ${serviceName.toLowerCase()} job in ${areaName} — no upsells, no surprises mid-job.`}
          inclusions={sa.service.whatsIncluded as unknown as {_key?: string; title?: string | null; description?: string | null}[]}
        />
      )}

      <RelatedContent
        eyebrow="Local work"
        heading={`${serviceName} projects in ${areaName}`}
        items={(sa.projects ?? []).map((p) => ({
          title: p.title ?? 'Project',
          href: `/projects/${p.slug}`,
          summary: p.summary ?? undefined,
          meta: p.area?.name ?? p.locationLabel ?? undefined,
          image: p.coverImage,
          alt: p.title ?? undefined,
        }))}
      />

      {sa.localTestimonial?.quote && (
        <section className="bg-white py-16">
          <div className="container max-w-3xl text-center">
            <blockquote className="text-xl leading-relaxed text-gray-950">
              &ldquo;{sa.localTestimonial.quote}&rdquo;
            </blockquote>
            {sa.localTestimonial.authorName && (
              <p className="mt-4 text-sm font-semibold text-neutral">
                {sa.localTestimonial.authorName}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Nearby areas — same service, adjacent areas */}
      {(() => {
        const nearby = (sa.service?.areasServed ?? [])
          .filter((a) => a._id !== sa.area?._id && a.slug && a.name)
        if (nearby.length === 0) return null
        return (
          <section className="bg-gray-50 py-12">
            <div className="container">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-deep">
                {serviceName} in nearby areas
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {nearby.map((a) => (
                  <Link
                    key={a._id}
                    href={`/services/${sa.service?.slug}/${a.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue/40 hover:text-gray-950"
                  >
                    <MapPin className="h-3.5 w-3.5 text-blue" />
                    {serviceName} in {a.name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )
      })()}

      <FAQView
        eyebrow="FAQs"
        heading={`${serviceName} in ${areaName} — FAQs`}
        items={(sa.localFaqs ?? []).map((f) => ({
          key: f._key,
          question: f.question,
          answer: f.answer,
        }))}
        className="bg-gray-50"
      />

      <section className="bg-white py-12">
        <div className="container flex flex-wrap gap-3 text-sm">
          <Link
            href={`/services/${sa.service?.slug}`}
            className="rounded-full border border-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:border-blue/40 hover:text-gray-950"
          >
            All {serviceName}
          </Link>
          <Link
            href={`/areas/${sa.area?.slug}`}
            className="rounded-full border border-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:border-blue/40 hover:text-gray-950"
          >
            {serviceName} in {areaName}
          </Link>
        </div>
      </section>

      <ContactForm
        block={{title: `Get a quote — ${serviceName.toLowerCase()} in ${areaName}`}}
        context={{
          service: sa.service?.name ?? undefined,
          area: sa.area?.name ?? undefined,
          sourceUrl: `/services/${sa.service?.slug}/${sa.area?.slug}`,
        }}
      />
    </article>
  )
}
