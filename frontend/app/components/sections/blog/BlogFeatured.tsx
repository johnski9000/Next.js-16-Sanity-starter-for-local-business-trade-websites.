import Link from 'next/link'
import {stegaClean} from '@sanity/client/stega'
import {ArrowRight} from 'lucide-react'

import DateComponent from '@/app/components/Date'
import Image from '@/app/components/SanityImage'
import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

/** A · Featured lead post + compact recent list. */
export default function BlogFeatured({
  block,
}: {
  block: ExtractPageBuilderType<'blogSection'>
}) {
  const {eyebrow, heading, subheading} = block
  const dark = stegaClean(block.theme) === 'dark'
  const posts = block.posts ?? []

  if (posts.length === 0) return null
  const [feat, ...rest] = posts

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const line = dark ? 'border-white/10' : 'border-gray-200'

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-white')}>
      <div className="container">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
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

        <RevealGroup className="grid gap-10 lg:grid-cols-[1.25fr_1fr]" as="div">
          {/* featured */}
          <RevealItem as="div">
            <Link href={`/blog/${feat.slug}`} className="group block">
            <div className={cn('aspect-video overflow-hidden rounded-2xl border', line)}>
              {feat.coverImage?.asset?._ref ? (
                <Image
                  id={feat.coverImage.asset._ref}
                  alt={feat.coverImage.alt ?? feat.title ?? ''}
                  width={900}
                  mode="cover"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="block h-full w-full bg-muted" />
              )}
            </div>
            <h3 className={cn('mt-4 text-2xl font-extrabold tracking-tight transition-colors group-hover:text-brand', ink)}>
              {feat.title}
            </h3>
            {feat.excerpt && <p className={cn('mt-2 text-base leading-relaxed', soft)}>{feat.excerpt}</p>}
            {feat.date && (
              <time className={cn('mt-3 block text-sm', soft)} dateTime={feat.date}>
                <DateComponent dateString={feat.date} />
              </time>
            )}
            </Link>
          </RevealItem>

          {/* recent list */}
          {rest.length > 0 && (
            <RevealItem className="flex flex-col" as="div">
              {rest.slice(0, 4).map((p, i) => (
                <Link
                  key={p._id}
                  href={`/blog/${p.slug}`}
                  className={cn('group flex gap-4 py-4', i > 0 && cn('border-t', line))}
                >
                  <div className={cn('h-16 w-24 shrink-0 overflow-hidden rounded-lg border', line)}>
                    {p.coverImage?.asset?._ref ? (
                      <Image
                        id={p.coverImage.asset._ref}
                        alt={p.coverImage.alt ?? p.title ?? ''}
                        width={200}
                        mode="cover"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="block h-full w-full bg-muted" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <strong className={cn('text-base font-bold leading-snug transition-colors group-hover:text-brand', ink)}>
                      {p.title}
                    </strong>
                    {p.date && (
                      <time className={cn('text-xs', soft)} dateTime={p.date}>
                        <DateComponent dateString={p.date} />
                      </time>
                    )}
                  </div>
                </Link>
              ))}
            </RevealItem>
          )}
        </RevealGroup>
      </div>
    </section>
  )
}
