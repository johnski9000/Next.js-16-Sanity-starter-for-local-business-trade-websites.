import Link from 'next/link'
import {stegaClean} from '@sanity/client/stega'
import {ArrowRight} from 'lucide-react'

import DateComponent from '@/app/components/Date'
import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

/** C · Minimal text index — date + title + excerpt rows. */
export default function BlogList({
  block,
}: {
  block: ExtractPageBuilderType<'blogSection'>
}) {
  const {eyebrow, heading, subheading} = block
  const dark = stegaClean(block.theme) === 'dark'
  const posts = (block.posts ?? []).slice(0, stegaClean(block.maxPosts) ?? 6)

  if (posts.length === 0) return null

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const line = dark ? 'border-white/10' : 'border-gray-200'

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-white')}>
      <div className="container">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <Reveal as="div">
            {eyebrow && (
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-deep">
                {eyebrow}
              </span>
            )}
            {heading && (
              <h2 className={cn('mt-2 text-balance text-3xl font-extrabold tracking-tight md:text-4xl', ink)}>
                {heading}
              </h2>
            )}
            {subheading && <p className={cn('mt-2 text-base leading-relaxed', soft)}>{subheading}</p>}
          </Reveal>
          <Link
            href="/blog"
            className="inline-flex shrink-0 items-center gap-1.5 text-base font-bold text-brand hover:underline"
          >
            View all posts <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <RevealGroup className={cn('mx-auto max-w-4xl border-t', line)} as="div">
          {posts.map((p) => (
            <RevealItem key={p._id} as="div">
            <Link
              href={`/blog/${p.slug}`}
              className={cn(
                'group grid grid-cols-1 items-baseline gap-x-6 gap-y-1.5 border-b py-5 sm:grid-cols-[8rem_1fr_2rem]',
                line,
              )}
            >
              {p.date && (
                <time className={cn('text-sm', soft)} dateTime={p.date}>
                  <DateComponent dateString={p.date} />
                </time>
              )}
              <div className="flex flex-col gap-1">
                <strong className={cn('text-xl font-extrabold tracking-tight transition-colors group-hover:text-brand', ink)}>
                  {p.title}
                </strong>
                {p.excerpt && <span className={cn('line-clamp-2 text-sm leading-relaxed', soft)}>{p.excerpt}</span>}
              </div>
              <ArrowRight
                className="hidden h-5 w-5 -translate-x-1 self-center text-brand opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 sm:block"
              />
            </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
