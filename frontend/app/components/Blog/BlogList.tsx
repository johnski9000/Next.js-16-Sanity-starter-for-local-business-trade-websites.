import Link from 'next/link'

import DateComponent from '@/app/components/Date'
import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'
import type {AllPostsQueryResult} from '@/sanity.types'

const pageHref = (n: number) => (n <= 1 ? '/blog' : `/blog/page/${n}`)

export default function BlogList({
  posts,
  current,
  pageSize,
}: {
  posts: AllPostsQueryResult
  current: number
  pageSize: number
}) {
  const totalPages = Math.max(1, Math.ceil(posts.length / pageSize))
  const start = (current - 1) * pageSize
  const pageItems = posts.slice(start, start + pageSize)

  if (pageItems.length === 0) {
    return (
      <section className="bg-white py-12 sm:py-16">
        <div className="container">
          <p className="text-neutral">No posts yet — check back soon.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="container">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((post) => (
            <article
              key={post._id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow duration-300 hover:shadow-lg"
            >
              {post.coverImage?.asset?._ref && (
                <div className="relative h-48 overflow-hidden">
                  <Image
                    id={post.coverImage.asset._ref}
                    alt={post.coverImage.alt ?? post.title ?? ''}
                    width={600}
                    mode="cover"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-3 p-6">
                {post.date && (
                  <time className="text-xs font-medium text-neutral" dateTime={post.date}>
                    <DateComponent dateString={post.date} />
                  </time>
                )}
                <h2 className="text-lg font-semibold text-gray-950">{post.title}</h2>
                {post.excerpt && (
                  <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-neutral">
                    {post.excerpt}
                  </p>
                )}
              </div>
              <Link
                href={`/blog/${post.slug}`}
                className="absolute inset-0"
                aria-label={post.title ?? 'Read post'}
              >
                <span className="sr-only">{post.title ?? 'Read post'}</span>
              </Link>
            </article>
          ))}
        </div>

        {totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
            {Array.from({length: totalPages}).map((_, i) => {
              const n = i + 1
              return (
                <Link
                  key={n}
                  href={pageHref(n)}
                  aria-current={n === current ? 'page' : undefined}
                  className={cn(
                    'flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors',
                    n === current
                      ? 'bg-brand text-white'
                      : 'border border-gray-200 text-gray-700 hover:border-blue/40',
                  )}
                >
                  {n}
                </Link>
              )
            })}
          </nav>
        )}
      </div>
    </section>
  )
}
