import type {Metadata} from 'next'
import {notFound} from 'next/navigation'

import Breadcrumbs from '@/app/components/Breadcrumbs'
import BlogList from '@/app/components/Blog/BlogList'
import {allPostsQuery} from '@/sanity/lib/queries'
import {tenantFetch} from '@/sanity/lib/tenant-client'
import {AllPostsQueryResult} from '@/sanity.types'

const PAGE_SIZE = 9

type Props = {params: Promise<{page: string}>}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const {page} = await props.params
  const n = Number(page)
  if (!Number.isInteger(n) || n < 2) return {}
  return {
    title: `Blog — page ${n}`,
    description: 'Tips, guides and project stories.',
    alternates: {canonical: `/blog/page/${n}`},
  }
}

export default async function BlogPagedPage(props: Props) {
  const {page} = await props.params
  const n = Number(page)
  if (!Number.isInteger(n) || n < 2) notFound()

  const {data: posts} = await tenantFetch<AllPostsQueryResult>({query: allPostsQuery})
  const all = posts ?? []
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
  if (n > totalPages) notFound()

  return (
    <article>
      <Breadcrumbs
        items={[
          {label: 'Home', href: '/'},
          {label: 'Blog', href: '/blog'},
          {label: `Page ${n}`, href: `/blog/page/${n}`},
        ]}
      />

      <section className="bg-white pt-8">
        <div className="container ">
          <h1 className="text-4xl font-semibold leading-tight text-gray-950 md:text-5xl">
            Blog — page {n}
          </h1>
        </div>
      </section>

      <BlogList posts={all} current={n} pageSize={PAGE_SIZE} />
    </article>
  )
}
