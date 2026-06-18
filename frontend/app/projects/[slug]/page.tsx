import type {Metadata} from 'next'
import type {PortableTextBlock} from 'next-sanity'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {Star} from 'lucide-react'

import Breadcrumbs from '@/app/components/Breadcrumbs'
import CustomPortableText from '@/app/components/PortableText'
import Image from '@/app/components/SanityImage'
import GraphJsonLd from '@/app/components/GraphJsonLd'
import RelatedContent from '@/app/components/Shared/RelatedContent'
import ContactForm from '@/app/components/sections/contact/ContactForm'
import {getProjectQuery} from '@/sanity/lib/queries'
import {buildMetadata, absoluteUrl} from '@/sanity/lib/seo'
import {creativeWorkJsonLd, reviewJsonLd} from '@/sanity/lib/jsonld'
import {localBusinessId} from '@/sanity/lib/siteIds'
import {resolveOpenGraphImage} from '@/sanity/lib/utils'
import {tenantFetch} from '@/sanity/lib/tenant-client'
import {GetProjectQueryResult} from '@/sanity.types'

type Props = {params: Promise<{slug: string}>}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const {slug} = await props.params
  const {data: project, tenant} = await tenantFetch<GetProjectQueryResult>({
    query: getProjectQuery,
    params: {slug},
  })
  if (!project) return {}
  return buildMetadata({
    seo: project.seo,
    fallbackTitle: project.title,
    fallbackDescription: project.summary,
    path: `/projects/${slug}`,
    baseUrl: tenant.siteUrl || undefined,
    imageOpts: {projectId: tenant.projectId, dataset: tenant.dataset},
  })
}

export default async function ProjectPage(props: Props) {
  const {slug} = await props.params
  const [{data: project, tenant}] = await Promise.all([
    tenantFetch<GetProjectQueryResult>({query: getProjectQuery, params: {slug}}),
  ])
  if (!project?._id) notFound()

  const location = project.area?.name ?? project.locationLabel ?? undefined

  const imageOpts = {projectId: tenant.projectId, dataset: tenant.dataset}
  const galleryUrls = [project.coverImage, ...(project.gallery ?? [])]
    .map((im) => resolveOpenGraphImage(im as never, imageOpts)?.url)
    .filter((u): u is string => Boolean(u))

  return (
    <article>
      <GraphJsonLd
        nodes={[
          creativeWorkJsonLd({
            name: project.title ?? 'Project',
            url: absoluteUrl(`/projects/${slug}`),
            description: project.summary,
            dateCreated: project.completedAt,
            locationCreated: location,
            creatorId: localBusinessId(),
            about: (project.services ?? [])
              .map((s) => s.name)
              .filter((n): n is string => Boolean(n)),
            images: galleryUrls,
          }),
          project.testimonial?.quote
            ? reviewJsonLd({
                body: project.testimonial.quote,
                authorName: project.testimonial.authorName,
                rating: project.testimonial.rating,
                itemReviewedId: localBusinessId(),
              })
            : null,
        ]}
      />
      <Breadcrumbs
        items={[
          {label: 'Home', href: '/'},
          {label: 'Projects', href: '/projects'},
          {label: project.title ?? 'Project', href: `/projects/${slug}`},
        ]}
      />

      <section className="bg-white pt-8">
        <div className="container max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral">
            {location && <span>{location}</span>}
            {(project.services ?? []).map((s) => (
              <Link
                key={s._id}
                href={`/services/${s.slug}`}
                className="rounded-full bg-blue/10 px-3 py-1 text-xs font-semibold text-blue-deep transition-colors hover:bg-blue/20"
              >
                {s.name}
              </Link>
            ))}
          </div>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-gray-950 md:text-5xl">
            {project.title}
          </h1>
          {project.summary && (
            <p className="mt-4 text-lg leading-relaxed text-neutral">{project.summary}</p>
          )}
        </div>
      </section>

      {project.coverImage?.asset?._ref && (
        <section className="bg-white py-10">
          <div className="container max-w-4xl">
            <div className="overflow-hidden rounded-2xl">
              <Image
                id={project.coverImage.asset._ref}
                alt={project.coverImage.alt ?? project.title ?? ''}
                width={1400}
                height={788}
                crop={project.coverImage.crop ?? undefined}
                hotspot={project.coverImage.hotspot ?? undefined}
                mode="cover"
                fetchPriority="high"
                className="aspect-video w-full object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {project.body && project.body.length > 0 && (
        <section className="bg-white pb-10">
          <div className="container max-w-3xl">
            <CustomPortableText value={project.body as PortableTextBlock[]} />
          </div>
        </section>
      )}

      {/* Before / after */}
      {project.beforeAfter && project.beforeAfter.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="container">
            <h2 className="mb-8 text-2xl font-semibold text-gray-950 md:text-3xl">
              Before &amp; after
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              {project.beforeAfter.map((pair, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white"
                >
                  <div className="grid grid-cols-2">
                    {pair.beforeImage?.asset?._ref && (
                      <figure className="relative">
                        <Image
                          id={pair.beforeImage.asset._ref}
                          alt={pair.beforeImage.alt ?? 'Before'}
                          width={700}
                          crop={pair.beforeImage.crop ?? undefined}
                          hotspot={pair.beforeImage.hotspot ?? undefined}
                          mode="cover"
                          className="aspect-square w-full object-cover"
                        />
                        <figcaption className="absolute left-2 top-2 rounded-full bg-brand/90 px-2.5 py-1 text-[11px] font-semibold uppercase text-white">
                          Before
                        </figcaption>
                      </figure>
                    )}
                    {pair.afterImage?.asset?._ref && (
                      <figure className="relative">
                        <Image
                          id={pair.afterImage.asset._ref}
                          alt={pair.afterImage.alt ?? 'After'}
                          width={700}
                          crop={pair.afterImage.crop ?? undefined}
                          hotspot={pair.afterImage.hotspot ?? undefined}
                          mode="cover"
                          className="aspect-square w-full object-cover"
                        />
                        <figcaption className="absolute right-2 top-2 rounded-full bg-blue/90 px-2.5 py-1 text-[11px] font-semibold uppercase text-white">
                          After
                        </figcaption>
                      </figure>
                    )}
                  </div>
                  {pair.label && (
                    <p className="p-4 text-sm font-medium text-gray-950">{pair.label}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {project.gallery && project.gallery.length > 0 && (
        <section className="bg-white py-16">
          <div className="container">
            <h2 className="mb-8 text-2xl font-semibold text-gray-950 md:text-3xl">Gallery</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {project.gallery.map((g, i) =>
                g.asset?._ref ? (
                  <figure key={i} className="overflow-hidden rounded-2xl">
                    <Image
                      id={g.asset._ref}
                      alt={g.alt ?? project.title ?? ''}
                      width={800}
                      crop={g.crop ?? undefined}
                      hotspot={g.hotspot ?? undefined}
                      mode="cover"
                      className="aspect-[4/3] w-full object-cover"
                    />
                    {g.caption && (
                      <figcaption className="mt-2 text-xs text-neutral">{g.caption}</figcaption>
                    )}
                  </figure>
                ) : null,
              )}
            </div>
          </div>
        </section>
      )}

      {/* Client testimonial */}
      {project.testimonial?.quote && (
        <section className="bg-gray-950 py-16 text-white">
          <div className="container max-w-3xl text-center">
            <div className="mb-4 flex justify-center gap-0.5">
              {Array.from({length: 5}).map((_, s) => (
                <Star
                  key={s}
                  className={
                    s < (project.testimonial?.rating ?? 5)
                      ? 'h-5 w-5 fill-amber-400 text-amber-400'
                      : 'h-5 w-5 fill-white/20 text-white/20'
                  }
                />
              ))}
            </div>
            <blockquote className="text-xl leading-relaxed">
              &ldquo;{project.testimonial.quote}&rdquo;
            </blockquote>
            {project.testimonial.authorName && (
              <p className="mt-4 text-sm font-semibold text-gray-300">
                {project.testimonial.authorName}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Related projects — same area */}
      <RelatedContent
        eyebrow="More work"
        heading={location ? `More projects in ${location}` : 'Related projects'}
        items={(project.related ?? []).map((p) => ({
          title: p.title ?? 'Project',
          href: `/projects/${p.slug}`,
          summary: p.summary ?? undefined,
          meta: p.area?.name ?? p.locationLabel ?? undefined,
          image: p.coverImage,
          alt: p.title ?? undefined,
        }))}
      />

      {/* Related projects — same service (deduped against same-area) */}
      {(() => {
        const seen = new Set((project.related ?? []).map((p) => p._id))
        const sameService = (project.relatedByService ?? []).filter((p) => !seen.has(p._id))
        const primaryService = project.services?.[0]?.name
        return (
          <RelatedContent
            eyebrow="Same service"
            heading={
              primaryService ? `More ${primaryService.toLowerCase()} projects` : 'Related work'
            }
            items={sameService.map((p) => ({
              title: p.title ?? 'Project',
              href: `/projects/${p.slug}`,
              summary: p.summary ?? undefined,
              meta: p.area?.name ?? p.locationLabel ?? undefined,
              image: p.coverImage,
              alt: p.title ?? undefined,
            }))}
            isDark
          />
        )
      })()}

      <ContactForm
        block={{title: 'Want a similar finish? Get a quote'}}
        context={{
          service: project.services?.[0]?.name ?? undefined,
          area: project.area?.name ?? undefined,
          sourceUrl: `/projects/${slug}`,
        }}
      />
    </article>
  )
}
