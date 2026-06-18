import type {Metadata} from 'next'
import type {PortableTextBlock} from 'next-sanity'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {ArrowRight} from 'lucide-react'

import Avatar from '@/app/components/Avatar'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import DateComponent from '@/app/components/Date'
import CustomPortableText from '@/app/components/PortableText'
import Image from '@/app/components/SanityImage'
import GraphJsonLd from '@/app/components/GraphJsonLd'
import RelatedContent from '@/app/components/Shared/RelatedContent'
import {tenantFetch} from '@/sanity/lib/tenant-client'
import {postQuery, morePostsQuery} from '@/sanity/lib/queries'
import {buildMetadata, absoluteUrl} from '@/sanity/lib/seo'
import {blogPostingJsonLd, imageObjectJsonLd} from '@/sanity/lib/jsonld'
import {localBusinessId, blogId} from '@/sanity/lib/siteIds'
import {resolveOpenGraphImage} from '@/sanity/lib/utils'
import {PostQueryResult, MorePostsQueryResult} from '@/sanity.types'

type Props = {params: Promise<{slug: string}>}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const {slug} = await props.params
  const {data: post, tenant} = await tenantFetch<PostQueryResult>({query: postQuery, params: {slug}})
  if (!post?._id) return {}
  const authorFull =
    post.author?.firstName && post.author?.lastName
      ? `${post.author.firstName} ${post.author.lastName}`
      : undefined
  return buildMetadata({
    seo: post.seo,
    fallbackTitle: post.title,
    fallbackDescription: post.excerpt,
    path: `/blog/${slug}`,
    baseUrl: tenant.siteUrl || undefined,
    imageOpts: {projectId: tenant.projectId, dataset: tenant.dataset},
    article: {
      publishedTime: post.date,
      modifiedTime: post._updatedAt,
      authors: authorFull ? [authorFull] : undefined,
      section: 'Blog',
    },
  })
}

export default async function BlogPostPage(props: Props) {
  const {slug} = await props.params
  const [{data: post, tenant}] = await Promise.all([
    tenantFetch<PostQueryResult>({query: postQuery, params: {slug}}),
  ])
  if (!post?._id) notFound()

  const {data: more} = await tenantFetch<MorePostsQueryResult>({
    query: morePostsQuery,
    params: {skip: post._id, limit: 3},
  })

  const authorName =
    post.author?.firstName && post.author?.lastName
      ? `${post.author.firstName} ${post.author.lastName}`
      : undefined

  const postUrl = absoluteUrl(`/blog/${slug}`)
  const coverUrl = resolveOpenGraphImage(post.coverImage as never, {
    projectId: tenant.projectId,
    dataset: tenant.dataset,
  })?.url
  const coverImgId = `${postUrl}#cover`

  return (
    <article>
      <GraphJsonLd
        nodes={[
          blogPostingJsonLd({
            title: post.title ?? '',
            url: postUrl,
            description: post.excerpt,
            datePublished: post.date,
            dateModified: post._updatedAt,
            imageId: coverUrl ? coverImgId : undefined,
            imageUrl: coverUrl,
            authorName,
            publisherId: localBusinessId(),
            isPartOfId: blogId(),
          }),
          coverUrl
            ? imageObjectJsonLd({id: coverImgId, url: coverUrl, caption: post.title ?? undefined})
            : null,
        ]}
      />
      <Breadcrumbs
        items={[
          {label: 'Home', href: '/'},
          {label: 'Blog', href: '/blog'},
          {label: post.title ?? 'Post', href: `/blog/${slug}`},
        ]}
      />

      <div className="container max-w-3xl py-12 sm:py-16">
        <header className="flex flex-col gap-6">
          <h1 className="text-3xl font-semibold leading-tight text-gray-950 sm:text-4xl md:text-5xl">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-neutral">
            {post.author?.firstName && post.author?.lastName && (
              <Avatar
                person={post.author}
                small={true}
                href={post.author.slug ? `/author/${post.author.slug}` : undefined}
              />
            )}
            {post.date && (
              <time dateTime={post.date} className="font-mono text-xs">
                <DateComponent dateString={post.date} />
              </time>
            )}
          </div>
        </header>

        {post.coverImage?.asset?._ref && (
          <div className="my-10 overflow-hidden rounded-2xl">
            <Image
              id={post.coverImage.asset._ref}
              alt={post.coverImage.alt ?? post.title ?? ''}
              width={1200}
              height={675}
              mode="cover"
              fetchPriority="high"
              className="aspect-video w-full object-cover"
            />
          </div>
        )}

        {post.content && post.content.length > 0 && (
          <CustomPortableText className="mt-10" value={post.content as PortableTextBlock[]} />
        )}

        <div className="mt-16 rounded-2xl border border-blue/20 bg-blue/5 p-8 text-center sm:p-10">
          <p className="text-lg font-semibold text-gray-950">
            Need a professional for your next project?
          </p>
          <p className="mt-2 text-sm leading-relaxed text-neutral">
            Get a free, no-obligation quote for your next project.
          </p>
          <Link
            href="/quote"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Get a Free Quote
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <RelatedContent
        eyebrow="Keep reading"
        heading="More from the blog"
        items={(more ?? []).map((p) => ({
          title: p.title ?? 'Post',
          href: `/blog/${p.slug}`,
          summary: p.excerpt ?? undefined,
          image: p.coverImage,
          alt: p.title ?? undefined,
        }))}
      />
    </article>
  )
}
