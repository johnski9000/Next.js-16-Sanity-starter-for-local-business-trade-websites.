import type {Metadata} from 'next'

import Breadcrumbs from '@/app/components/Breadcrumbs'
import GraphJsonLd from '@/app/components/GraphJsonLd'
import BlogList from '@/app/components/Blog/BlogList'
import {allPostsQuery} from '@/sanity/lib/queries'
import {absoluteUrl} from '@/sanity/lib/seo'
import {collectionPageJsonLd} from '@/sanity/lib/jsonld'
import {tenantFetch} from '@/sanity/lib/tenant-client'
import {AllPostsQueryResult} from '@/sanity.types'

const PAGE_SIZE = 9

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Tips, guides and project stories.',
  alternates: {canonical: '/blog'},
}

export default async function BlogIndexPage() {
  const {data: posts} = await tenantFetch<AllPostsQueryResult>({query: allPostsQuery})

  return (
    <article>
      <GraphJsonLd
        nodes={[
          collectionPageJsonLd({
            name: 'Blog',
            url: absoluteUrl('/blog'),
            description: 'Tips, guides and project stories.',
            items: (posts ?? []).map((p) => ({
              name: p.title ?? 'Post',
              url: absoluteUrl(`/blog/${p.slug}`),
              description: p.excerpt,
            })),
          }),
        ]}
      />
      <Breadcrumbs
        items={[
          {label: 'Home', href: '/'},
          {label: 'Blog', href: '/blog'},
        ]}
      />

      <section className="bg-white pt-8">
        <div className="container ">
          <h1 className="text-4xl font-semibold leading-tight text-gray-950 md:text-5xl">Blog</h1>
          <p className="mt-4 text-lg leading-relaxed text-neutral">
            Tips, guides and project stories.
          </p>
        </div>
      </section>

      <BlogList posts={posts ?? []} current={1} pageSize={PAGE_SIZE} />
    </article>
  )
}
