import type {Metadata} from 'next'
import {notFound} from 'next/navigation'

import PageBuilderPage from '@/app/components/PageBuilder'
import {getPageQuery} from '@/sanity/lib/queries'
import {buildMetadata} from '@/sanity/lib/seo'
import {tenantFetch} from '@/sanity/lib/tenant-client'
import {GetPageQueryResult} from '@/sanity.types'

// Multi-tenant: content is resolved per request from the hostname, so this
// route renders dynamically (ISR via tenantFetch's per-tenant cache tags)
// rather than being statically pre-built for a single project.

/**
 * Generate metadata for the home page, using the resolved tenant's own siteUrl
 * for the canonical/OG so each client gets correct, self-referential URLs.
 */
export async function generateMetadata(): Promise<Metadata> {
  const {data: page, tenant} = await tenantFetch<GetPageQueryResult>({
    query: getPageQuery,
    params: {slug: '/'},
  })

  if (!page?._id) return {}

  return buildMetadata({
    seo: page.seo,
    fallbackTitle: page.name,
    path: '/',
    baseUrl: tenant.siteUrl || undefined,
    imageOpts: {projectId: tenant.projectId, dataset: tenant.dataset},
  })
}

export default async function Page() {
  const {data: page} = await tenantFetch<GetPageQueryResult>({
    query: getPageQuery,
    params: {slug: '/'},
  })
  if (!page?._id) notFound()

  return (
    <div>
      <PageBuilderPage page={page as GetPageQueryResult} />
    </div>
  )
}
