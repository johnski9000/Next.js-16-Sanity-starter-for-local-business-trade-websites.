import type {Metadata} from 'next'
import {notFound} from 'next/navigation'

import Avatar from '@/app/components/Avatar'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import BlogList from '@/app/components/Blog/BlogList'
import {getAuthorQuery, postsByAuthorQuery} from '@/sanity/lib/queries'
import {tenantFetch} from '@/sanity/lib/tenant-client'
import {GetAuthorQueryResult, PostsByAuthorQueryResult} from '@/sanity.types'

type Props = {params: Promise<{slug: string}>}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const {slug} = await props.params
  const {data: author} = await tenantFetch<GetAuthorQueryResult>({
    query: getAuthorQuery,
    params: {slug},
  })
  if (!author) return {}
  const fullName = `${author.firstName ?? ''} ${author.lastName ?? ''}`.trim()
  return {
    title: `${fullName} — Author`,
    description: `Articles by ${fullName}`,
    alternates: {canonical: `/author/${slug}`},
  }
}

export default async function AuthorPage(props: Props) {
  const {slug} = await props.params
  const [{data: author}, {data: posts}] = await Promise.all([
    tenantFetch<GetAuthorQueryResult>({query: getAuthorQuery, params: {slug}}),
    tenantFetch<PostsByAuthorQueryResult>({query: postsByAuthorQuery, params: {slug}}),
  ])
  if (!author?._id) notFound()

  const fullName = `${author.firstName ?? ''} ${author.lastName ?? ''}`.trim()

  return (
    <article>
      <Breadcrumbs
        items={[
          {label: 'Home', href: '/'},
          {label: 'Blog', href: '/blog'},
          {label: fullName, href: `/author/${slug}`},
        ]}
      />

      <section className="bg-white pt-8 pb-10">
        <div className="container">
          <Avatar person={author} />
          <h1 className="mt-8 text-4xl font-semibold leading-tight text-gray-950 md:text-5xl">
            {fullName}
          </h1>
        </div>
      </section>

      <BlogList posts={posts ?? []} current={1} pageSize={999} />
    </article>
  )
}
