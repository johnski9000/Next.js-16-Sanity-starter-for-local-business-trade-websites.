import type {Metadata} from 'next'

import Breadcrumbs from '@/app/components/Breadcrumbs'
import GraphJsonLd from '@/app/components/GraphJsonLd'
import ProjectsExplorer from '@/app/components/Project/ProjectsExplorer'
import ContactForm from '@/app/components/sections/contact/ContactForm'
import {projectsIndexQuery} from '@/sanity/lib/queries'
import {absoluteUrl} from '@/sanity/lib/seo'
import {tenantFetch} from '@/sanity/lib/tenant-client'
import {collectionPageJsonLd} from '@/sanity/lib/jsonld'
import {ProjectsIndexQueryResult} from '@/sanity.types'

export const metadata: Metadata = {
  title: 'Our Projects',
  description: 'A selection of our recent projects. Filter by service or area.',
  alternates: {canonical: '/projects'},
}

export default async function ProjectsIndexPage() {
  const {data: projects} = await tenantFetch<ProjectsIndexQueryResult>({
    query: projectsIndexQuery,
  })

  return (
    <article>
      <GraphJsonLd
        nodes={[
          collectionPageJsonLd({
            name: 'Our Projects',
            url: absoluteUrl('/projects'),
            description: 'A selection of our recent projects. Filter by service or area.',
            items: (projects ?? []).map((p) => ({
              name: p.title ?? 'Project',
              url: absoluteUrl(`/projects/${p.slug}`),
              description: p.summary,
            })),
          }),
        ]}
      />
      <Breadcrumbs
        items={[
          {label: 'Home', href: '/'},
          {label: 'Projects', href: '/projects'},
        ]}
      />

      <section className="bg-white pt-8">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-semibold leading-tight text-gray-950 md:text-5xl">
            Our recent work
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-neutral">
            A selection of our recent projects. Filter by service or area.
          </p>
        </div>
      </section>

      <ProjectsExplorer items={projects ?? []} />

      <ContactForm
        block={{title: 'Like what you see? Get a quote'}}
        context={{sourceUrl: '/projects'}}
      />
    </article>
  )
}
