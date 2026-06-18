import type {Metadata} from 'next'
import type {PortableTextBlock} from 'next-sanity'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {ArrowRight, MapPin, Star} from 'lucide-react'

import Breadcrumbs from '@/app/components/Breadcrumbs'
import CustomPortableText from '@/app/components/PortableText'
import Image from '@/app/components/SanityImage'
import {serviceIcon} from '@/app/components/sections/services/serviceIcons'
import GraphJsonLd from '@/app/components/GraphJsonLd'
import {FAQView} from '@/app/components/sections/faq/FAQ'
import RelatedContent from '@/app/components/Shared/RelatedContent'
import ContactForm from '@/app/components/sections/contact/ContactForm'
import {tenantFetch} from '@/sanity/lib/tenant-client'
import {getAreaQuery, allServicesQuery, allAreasQuery} from '@/sanity/lib/queries'
import {buildMetadata, absoluteUrl} from '@/sanity/lib/seo'
import {faqPageJsonLd, placeJsonLd, reviewJsonLd} from '@/sanity/lib/jsonld'
import {localBusinessId} from '@/sanity/lib/siteIds'
import {GetAreaQueryResult, AllServicesQueryResult, AllAreasQueryResult} from '@/sanity.types'

type Props = {params: Promise<{slug: string}>}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const {slug} = await props.params
  const {data: area, tenant} = await tenantFetch<GetAreaQueryResult>({
    query: getAreaQuery,
    params: {slug},
  })
  if (!area) return {}
  return buildMetadata({
    seo: area.seo,
    fallbackTitle: area.name ?? 'Areas we cover',
    path: `/areas/${slug}`,
    baseUrl: tenant.siteUrl || undefined,
    imageOpts: {projectId: tenant.projectId, dataset: tenant.dataset},
  })
}

export default async function AreaPage(props: Props) {
  const {slug} = await props.params
  const [{data: area}, {data: allServices}, {data: allAreas}] = await Promise.all([
    tenantFetch<GetAreaQueryResult>({query: getAreaQuery, params: {slug}}),
    tenantFetch<AllServicesQueryResult>({query: allServicesQuery}),
    tenantFetch<AllAreasQueryResult>({query: allAreasQuery}),
  ])
  if (!area?._id) notFound()

  const services =
    area.featuredServices && area.featuredServices.length > 0
      ? area.featuredServices
      : (allServices ?? [])
  const projects = area.projects ?? []
  const nearbyAreas = (allAreas ?? []).filter((a) => a.slug !== slug)

  return (
    <article>
      <GraphJsonLd
        nodes={[
          placeJsonLd({
            slug,
            name: area.name ?? '',
            latitude: area.geo?.latitude,
            longitude: area.geo?.longitude,
            url: absoluteUrl(`/areas/${slug}`),
          }),
          faqPageJsonLd(area.faqs ?? [], {
            isPartOfId: `${absoluteUrl(`/areas/${slug}`)}#area`,
          }),
          ...(area.localTestimonials ?? []).map((t) =>
            reviewJsonLd({
              body: t.quote ?? '',
              authorName: t.authorName,
              rating: t.rating,
              itemReviewedId: localBusinessId(),
            }),
          ),
        ]}
      />
      <Breadcrumbs
        items={[
          {label: 'Home', href: '/'},
          {label: 'Areas', href: '/areas'},
          {label: area.name ?? 'Area', href: `/areas/${slug}`},
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-950 text-white">
        {area.heroImage?.asset?._ref && (
          <>
            <Image
              id={area.heroImage.asset._ref}
              alt={area.heroImage.alt ?? area.name ?? ''}
              width={1920}
              height={1080}
              mode="cover"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/85 to-gray-950/40" />
          </>
        )}
        <div className="container relative py-20 sm:py-28">
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
            {area.h1 ?? area.name}
          </h1>
          {area.coverageNote && (
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-gray-300">
              {area.coverageNote}
            </p>
          )}
          <div className="mt-8">
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

      {/* Local intro */}
      {area.intro && area.intro.length > 0 && (
        <section className="bg-white py-16 sm:py-20">
          <div className="container grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="mb-6 text-2xl font-semibold text-gray-950 md:text-3xl">
                {area.name}
              </h2>
              <CustomPortableText value={area.intro as PortableTextBlock[]} />
              <div className="mt-8">
                <Link
                  href="/quote"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  Get a Free Quote
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            {area.heroImage?.asset?._ref && (
              <Image
                id={area.heroImage.asset._ref}
                alt={area.heroImage.alt ?? area.name ?? ''}
                width={760}
                height={608}
                crop={area.heroImage.crop ?? undefined}
                hotspot={area.heroImage.hotspot ?? undefined}
                mode="cover"
                className="h-full max-h-112 w-full rounded-2xl object-cover shadow-xl"
              />
            )}
          </div>
        </section>
      )}

      {/* Services offered in this area */}
      {services.length > 0 && (
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="container">
            <h2 className="mb-10 text-2xl font-semibold text-gray-950 md:text-3xl">
              Services we offer in {area.name}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => {
                const Icon = serviceIcon(s.icon)
                return (
                  <Link
                    key={s._id}
                    href={`/services/${s.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg"
                  >
                    {s.heroImage?.asset?._ref ? (
                      <Image
                        id={s.heroImage.asset._ref}
                        alt={s.heroImage.alt ?? s.name ?? ''}
                        width={640}
                        height={480}
                        crop={s.heroImage.crop ?? undefined}
                        hotspot={s.heroImage.hotspot ?? undefined}
                        mode="cover"
                        className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center bg-gray-100 text-blue-deep">
                        <Icon className="h-10 w-10" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-2 p-6">
                      <h3 className="text-base font-semibold text-gray-950">{s.name}</h3>
                      {s.summary && (
                        <p className="flex-1 text-sm leading-relaxed text-neutral">{s.summary}</p>
                      )}
                      <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-deep transition-all group-hover:gap-2.5">
                        Learn more
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Local projects */}
      <RelatedContent
        eyebrow="Recent local work"
        heading={`Projects in ${area.name}`}
        items={projects.map((p) => ({
          title: p.title ?? 'Project',
          href: `/projects/${p.slug}`,
          summary: p.summary ?? undefined,
          meta: p.services?.[0]?.name ?? undefined,
          image: p.coverImage,
          alt: p.title ?? undefined,
        }))}
      />

      {/* Local testimonials */}
      {area.localTestimonials && area.localTestimonials.length > 0 && (
        <section className="bg-white py-16 sm:py-20">
          <div className="container">
            <h2 className="mb-10 text-2xl font-semibold text-gray-950 md:text-3xl">
              What {area.name} customers say
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {area.localTestimonials.map((t, i) => (
                <figure
                  key={i}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-6"
                >
                  <div className="flex gap-0.5">
                    {Array.from({length: 5}).map((_, s) => (
                      <Star
                        key={s}
                        className={
                          s < (t.rating ?? 5)
                            ? 'h-4 w-4 fill-amber-400 text-amber-400'
                            : 'h-4 w-4 fill-gray-200 text-gray-200'
                        }
                      />
                    ))}
                  </div>
                  {t.quote && (
                    <blockquote className="flex-1 text-sm leading-relaxed text-neutral">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                  )}
                  {t.authorName && (
                    <figcaption className="text-sm font-semibold text-gray-950">
                      {t.authorName}
                      {t.authorLocation ? (
                        <span className="font-normal text-neutral"> · {t.authorLocation}</span>
                      ) : null}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Area FAQ */}
      <FAQView
        eyebrow="FAQs"
        heading={`${area.name} — frequently asked questions`}
        items={(area.faqs ?? []).map((f) => ({
          key: f._key,
          question: f.question,
          answer: f.answer,
        }))}
      />

      {/* Nearby areas */}
      {nearbyAreas.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="container">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-deep">
              Also serving nearby
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {nearbyAreas.map((a) => (
                <Link
                  key={a._id}
                  href={`/areas/${a.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue/40 hover:text-gray-950"
                >
                  <MapPin className="h-3.5 w-3.5 text-blue" />
                  {a.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lead capture — area context */}
      <ContactForm
        block={{title: `Get a quote in ${area.name}`}}
        context={{area: area.name ?? undefined, sourceUrl: `/areas/${slug}`}}
      />
    </article>
  )
}
