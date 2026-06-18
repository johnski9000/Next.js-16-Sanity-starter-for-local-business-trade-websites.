import type {Metadata} from 'next'
import {notFound} from 'next/navigation'

import Breadcrumbs from '@/app/components/Breadcrumbs'
import PageBuilderPage from '@/app/components/PageBuilder'
import {getPageQuery} from '@/sanity/lib/queries'
import {buildMetadata} from '@/sanity/lib/seo'
import {tenantFetch} from '@/sanity/lib/tenant-client'
import {GetPageQueryResult} from '@/sanity.types'

const humanize = (seg: string) =>
  seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

type Props = {
  params: Promise<{slug: string[]}>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const slug = '/' + params.slug.join('/')
  const {data: page, tenant} = await tenantFetch<GetPageQueryResult>({
    query: getPageQuery,
    params: {slug},
  })

  if (!page?._id) return {}

  return buildMetadata({
    seo: page.seo,
    fallbackTitle: page.name,
    path: slug,
    baseUrl: tenant.siteUrl || undefined,
    imageOpts: {projectId: tenant.projectId, dataset: tenant.dataset},
  })
}

export default async function Page(props: Props) {
  const params = await props.params
  const slug = '/' + params.slug.join('/')

  const [{data: page}] = await Promise.all([
    tenantFetch<GetPageQueryResult>({query: getPageQuery, params: {slug}}),
  ])
  if (!page?._id) notFound()

  // Breadcrumbs for every non-home page doc (home doesn't need them).
  const isHome = slug === '/' || params.slug.length === 0
  const crumbs = isHome
    ? []
    : [
        {label: 'Home', href: '/'},
        ...params.slug.map((seg, i) => {
          const href = '/' + params.slug.slice(0, i + 1).join('/')
          const isLast = i === params.slug.length - 1
          return {label: isLast ? (page.name ?? humanize(seg)) : humanize(seg), href}
        }),
      ]

  return (
    <div>
      {crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
      <PageBuilderPage page={page as GetPageQueryResult} />
    </div>
  )
}
