import type {Metadata} from 'next'

import Breadcrumbs from '@/app/components/Breadcrumbs'
import GalleryExplorer from '@/app/components/Gallery/GalleryExplorer'
import GraphJsonLd from '@/app/components/GraphJsonLd'
import ContactForm from '@/app/components/sections/contact/ContactForm'
import {galleryQuery} from '@/sanity/lib/queries'
import {absoluteUrl} from '@/sanity/lib/seo'
import {imageGalleryJsonLd} from '@/sanity/lib/jsonld'
import {tenantFetch} from '@/sanity/lib/tenant-client'
import {resolveOpenGraphImage} from '@/sanity/lib/utils'
import {GalleryQueryResult} from '@/sanity.types'

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'A look at our recent work. Filter by service or area.',
  alternates: {canonical: '/gallery'},
}

export default async function GalleryPage() {
  const {data: projects, tenant} = await tenantFetch<GalleryQueryResult>({query: galleryQuery})

  const imageOpts = {projectId: tenant.projectId, dataset: tenant.dataset}
  const allImages = (projects ?? [])
    .flatMap((p) => [p.coverImage, ...(p.gallery ?? [])])
    .map((im) => resolveOpenGraphImage(im as never, imageOpts)?.url)
    .filter((u): u is string => Boolean(u))

  return (
    <article>
      <GraphJsonLd
        nodes={[
          imageGalleryJsonLd({
            name: 'Gallery',
            url: absoluteUrl('/gallery'),
            images: allImages,
          }),
        ]}
      />
      <Breadcrumbs
        items={[
          {label: 'Home', href: '/'},
          {label: 'Gallery', href: '/gallery'},
        ]}
      />

      <section className="bg-white pt-8">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-semibold leading-tight text-gray-950 md:text-5xl">
            Gallery
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-neutral">
            A look at our recent work. Filter by service or area.
          </p>
        </div>
      </section>

      <GalleryExplorer projects={projects ?? []} />

      <ContactForm
        block={{title: 'Like what you see? Get a quote'}}
        context={{sourceUrl: '/gallery'}}
      />
    </article>
  )
}
