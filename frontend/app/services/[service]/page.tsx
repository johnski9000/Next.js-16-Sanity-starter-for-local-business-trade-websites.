import type {Metadata} from 'next'
import type {PortableTextBlock} from 'next-sanity'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {ArrowRight, Phone} from 'lucide-react'

import Breadcrumbs from '@/app/components/Breadcrumbs'
import Image from '@/app/components/SanityImage'
import GraphJsonLd from '@/app/components/GraphJsonLd'
import ServiceOverview from '@/app/components/Service/ServiceOverview'
import ServiceInclusions from '@/app/components/Service/ServiceInclusions'
import ServiceProcess from '@/app/components/Service/ServiceProcess'
import ServiceList from '@/app/components/Service/ServiceList'
import {FAQView} from '@/app/components/sections/faq/FAQ'
import RelatedContent from '@/app/components/Shared/RelatedContent'
import ContactForm from '@/app/components/sections/contact/ContactForm'
import {getServiceQuery, allServicesQuery} from '@/sanity/lib/queries'
import {buildMetadata, absoluteUrl} from '@/sanity/lib/seo'
import {imageObjectJsonLd, serviceJsonLd, faqPageJsonLd} from '@/sanity/lib/jsonld'
import {localBusinessId} from '@/sanity/lib/siteIds'
import {resolveOpenGraphImage} from '@/sanity/lib/utils'
import {tenantFetch} from '@/sanity/lib/tenant-client'
import {GetServiceQueryResult, AllServicesQueryResult} from '@/sanity.types'

type Props = {params: Promise<{service: string}>}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const {service: slug} = await props.params
  const {data: service, tenant} = await tenantFetch<GetServiceQueryResult>({
    query: getServiceQuery,
    params: {slug},
  })
  if (!service) return {}
  return buildMetadata({
    seo: service.seo,
    fallbackTitle: service.name,
    fallbackDescription: service.summary,
    path: `/services/${slug}`,
    baseUrl: tenant.siteUrl || undefined,
    imageOpts: {projectId: tenant.projectId, dataset: tenant.dataset},
  })
}

export default async function ServicePage(props: Props) {
  const {service: slug} = await props.params
  const [{data: service, tenant}, {data: allServices}] = await Promise.all([
    tenantFetch<GetServiceQueryResult>({query: getServiceQuery, params: {slug}}),
    tenantFetch<AllServicesQueryResult>({query: allServicesQuery}),
  ])
  if (!service?._id) notFound()

  const projects =
    service.featuredProjects && service.featuredProjects.length > 0
      ? service.featuredProjects
      : (service.autoProjects ?? [])

  const otherServices = (allServices ?? []).filter((s) => s.slug !== slug)

  const serviceUrl = absoluteUrl(`/services/${slug}`)
  const serviceId = `${serviceUrl}#service`
  const heroUrl = resolveOpenGraphImage(service.heroImage as never, {
    projectId: tenant.projectId,
    dataset: tenant.dataset,
  })?.url
  const heroImgId = `${serviceUrl}#hero`

  // Typed area docs from areasServed -> Place @id refs in serviceJsonLd
  // (matches the Place entities defined on each Area page and the @ids
  // LocalBusiness.areaServed references — closes the matrix in the graph).
  const areasServed = (service.areasServed ?? [])
    .filter((a): a is typeof a & {slug: string; name: string} => Boolean(a.slug && a.name))
    .map((a) => ({slug: a.slug, name: a.name}))

  return (
    <article>
      <GraphJsonLd
        nodes={[
          serviceJsonLd({
            name: service.name ?? '',
            description: service.summary,
            url: serviceUrl,
            dateModified: service._updatedAt,
            providerId: localBusinessId(),
            areasServed,
            imageId: heroUrl ? heroImgId : undefined,
          }),
          heroUrl
            ? imageObjectJsonLd({id: heroImgId, url: heroUrl, caption: service.name ?? undefined})
            : null,
          faqPageJsonLd(service.faqs ?? [], {isPartOfId: serviceId}),
        ]}
      />
      <Breadcrumbs
        items={[
          {label: 'Home', href: '/'},
          {label: 'Services', href: '/services'},
          {label: service.name ?? 'Service', href: `/services/${slug}`},
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-950 text-white">
        {service.heroImage?.asset?._ref && (
          <>
            <Image
              id={service.heroImage.asset._ref}
              alt={service.heroImage.alt ?? service.name ?? ''}
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
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue">
            Our Services
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
            {service.h1 ?? service.name}
          </h1>
          {service.summary && (
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-gray-300">
              {service.summary}
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
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Phone className="h-4 w-4" />
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Overview */}
      {service.overview && service.overview.length > 0 && (
        <ServiceOverview
          eyebrow="Overview"
          body={service.overview as PortableTextBlock[]}
          ctaText="Get a free quote"
          ctaHref="/quote"
          trustSignals={service.trustSignals ?? []}
        />
      )}

      {/* What's included */}
      <ServiceInclusions
        eyebrow="What's included"
        heading="What's included with every job"
        subheading={`The standard kit and approach you get on every ${service.name?.toLowerCase()} job — no upsells, no surprises mid-job.`}
        inclusions={service.whatsIncluded ?? []}
      />

      {/* Process */}
      <ServiceProcess
        eyebrow="How it works"
        heading="From enquiry to sign-off"
        subheading="A simple, predictable process from your first message through to the walk-round at the end."
        steps={service.steps ?? []}
      />

      {/* Pricing indication */}
      {service.pricingIndication && (
        <section className="bg-white py-10 sm:py-14">
          <div className="container max-w-3xl text-center">
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-blue-deep">
              Pricing
            </span>
            <p className="text-xl font-medium leading-relaxed text-gray-950">
              {service.pricingIndication}
            </p>
          </div>
        </section>
      )}

      {/* Other services */}
      <ServiceList
        items={otherServices}
        eyebrow="Other services"
        heading="Explore our other services"
        subheading="Browse the rest of what we cover."
      />

      {/* Recent projects for this service */}
      <RelatedContent
        eyebrow="Recent work"
        heading={`${service.name} projects`}
        items={projects.map((p) => ({
          title: p.title ?? 'Project',
          href: `/projects/${p.slug}`,
          summary: p.summary ?? undefined,
          meta: p.area?.name ?? p.locationLabel ?? undefined,
          image: p.coverImage,
          alt: p.title ?? undefined,
        }))}
      />

      {/* Service FAQ */}
      <FAQView
        eyebrow="FAQs"
        heading={`${service.name} — frequently asked questions`}
        items={(service.faqs ?? []).map((f) => ({
          key: f._key,
          question: f.question,
          answer: f.answer,
        }))}
      />


      {/* Areas served */}
      {service.areasServed && service.areasServed.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="container">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-deep">
              {service.name} across the areas we cover
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {service.areasServed.map((a) => (
                <Link
                  key={a._id}
                  href={`/services/${slug}/${a.slug}`}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue/40 hover:text-gray-950"
                >
                  {service.name} in {a.name}
                </Link>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Link
                href="/areas"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-deep transition-all hover:gap-2.5"
              >
                Areas we cover
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/services/${slug}`}
                className="text-sm text-neutral transition-colors hover:text-gray-700"
              >
                All {service.name?.toLowerCase()} services
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Lead capture — context-prefilled */}
      <ContactForm
        block={{title: `Get a quote for ${service.name?.toLowerCase()}`}}
        context={{service: service.name ?? undefined, sourceUrl: `/services/${slug}`}}
      />
    </article>
  )
}
