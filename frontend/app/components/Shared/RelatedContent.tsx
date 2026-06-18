import Link from 'next/link'
import {ArrowRight} from 'lucide-react'

import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'

/**
 * Presentational related-content rail. Server component — templates
 * (Phase 3) resolve and pass `items`; this just renders the grid.
 * Used for: related projects, other services, other areas, recent posts.
 */
export type RelatedItem = {
  title: string
  href: string
  summary?: string
  meta?: string
  image?: {asset?: {_ref?: string | null} | null} | null
  alt?: string
}

const colClass: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export default function RelatedContent({
  eyebrow,
  heading,
  items,
  columns = 3,
  isDark = false,
}: {
  eyebrow?: string
  heading?: string
  items: RelatedItem[]
  columns?: number
  isDark?: boolean
}) {
  if (!items || items.length === 0) return null

  return (
    <section className={cn('py-16 sm:py-20', isDark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">
        {(eyebrow || heading) && (
          <div className="mb-8 max-w-2xl">
            {eyebrow && (
              <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-blue-deep">
                {eyebrow}
              </span>
            )}
            {heading && (
              <h2
                className={cn(
                  'text-2xl font-semibold md:text-3xl',
                  isDark ? 'text-white' : 'text-gray-950',
                )}
              >
                {heading}
              </h2>
            )}
          </div>
        )}

        <div className={cn('grid gap-5', colClass[columns] ?? colClass[3])}>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex flex-col overflow-hidden rounded-2xl border transition-shadow duration-300 hover:shadow-lg',
                isDark
                  ? 'border-white/8 bg-gray-900 hover:shadow-black/40'
                  : 'border-gray-100 bg-white hover:shadow-gray-100',
              )}
            >
              {item.image?.asset?._ref && (
                <div className="relative h-44 overflow-hidden">
                  <Image
                    id={item.image.asset._ref}
                    alt={item.alt ?? item.title}
                    width={600}
                    mode="cover"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2 p-5">
                {item.meta && (
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isDark ? 'text-gray-500' : 'text-neutral',
                    )}
                  >
                    {item.meta}
                  </span>
                )}
                <h3
                  className={cn(
                    'text-base font-semibold',
                    isDark ? 'text-white' : 'text-gray-950',
                  )}
                >
                  {item.title}
                </h3>
                {item.summary && (
                  <p
                    className={cn(
                      'line-clamp-2 flex-1 text-sm leading-relaxed',
                      isDark ? 'text-gray-400' : 'text-neutral',
                    )}
                  >
                    {item.summary}
                  </p>
                )}
                <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-deep transition-all group-hover:gap-2.5">
                  View
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
