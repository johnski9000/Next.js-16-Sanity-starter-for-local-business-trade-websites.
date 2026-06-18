'use client'

import Link from 'next/link'
import {stegaClean} from '@sanity/client/stega'
import {motion} from 'framer-motion'
import {ArrowRight} from 'lucide-react'

import Image from '@/app/components/SanityImage'
import DateComponent from '@/app/components/Date'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

/** B · 3-card grid (the existing default layout). */
export default function BlogGrid({
  block,
}: {
  block: ExtractPageBuilderType<'blogSection'>
}) {
  const {eyebrow, heading, subheading, theme, maxPosts} = block
  const isDark = stegaClean(theme) === 'dark'
  const visiblePosts = (block.posts ?? []).slice(0, stegaClean(maxPosts) ?? 3)

  if (visiblePosts.length === 0) return null

  return (
    <section className={cn('py-20 sm:py-28', isDark ? 'bg-gray-950' : 'bg-white')}>
      <div className="container">
        {(eyebrow || heading || subheading) && (
          <div className="mb-12 max-w-2xl">
            {eyebrow && (
              <motion.span
                initial={{opacity: 0, y: 12}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5}}
                className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-blue-deep"
              >
                {eyebrow}
              </motion.span>
            )}
            {heading && (
              <motion.h2
                initial={{opacity: 0, y: 16}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.55, delay: 0.05}}
                className={cn('text-3xl font-semibold md:text-4xl', isDark ? 'text-white' : 'text-gray-950')}
              >
                {heading}
              </motion.h2>
            )}
            {subheading && (
              <motion.p
                initial={{opacity: 0, y: 16}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.55, delay: 0.1}}
                className={cn('mt-3 text-base leading-relaxed', isDark ? 'text-gray-400' : 'text-neutral')}
              >
                {subheading}
              </motion.p>
            )}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePosts.map((post, i) => (
            <motion.article
              key={post._id}
              initial={{opacity: 0, y: 24}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, margin: '-60px'}}
              transition={{duration: 0.5, delay: (i % 3) * 0.08, ease: 'easeOut'}}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-2xl border transition-shadow duration-300 hover:shadow-lg',
                isDark ? 'border-white/8 bg-gray-900 hover:shadow-black/40' : 'border-gray-100 bg-white hover:shadow-gray-100',
              )}
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
                  <time className={cn('text-xs font-medium', isDark ? 'text-gray-500' : 'text-neutral')} dateTime={post.date}>
                    <DateComponent dateString={post.date} />
                  </time>
                )}
                {post.title && (
                  <h3 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-950')}>
                    {post.title}
                  </h3>
                )}
                {post.excerpt && (
                  <p className={cn('line-clamp-3 flex-1 text-sm leading-relaxed', isDark ? 'text-gray-400' : 'text-neutral')}>
                    {post.excerpt}
                  </p>
                )}
                <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-deep transition-all group-hover:gap-2.5">
                  Read more
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </div>
              {post.slug && (
                <Link href={`/blog/${post.slug}`} className="absolute inset-0" aria-label={post.title ?? 'Read post'}>
                  <span className="sr-only">{post.title ?? 'Read post'}</span>
                </Link>
              )}
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
