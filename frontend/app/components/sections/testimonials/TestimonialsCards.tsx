'use client'

import {stegaClean} from '@sanity/client/stega'
import {motion} from 'framer-motion'
import {Star} from 'lucide-react'

import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

function StarRating({rating}: {rating: number}) {
  return (
    <div className="flex gap-0.5">
      {Array.from({length: 5}).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-4 w-4',
            i < rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200',
          )}
        />
      ))}
    </div>
  )
}

/** Cards variant — testimonial grid + optional reviews call-to-action. */
export default function TestimonialsCards({
  block,
}: {
  block: ExtractPageBuilderType<'testimonials'>
}) {
  const {
    eyebrow,
    heading,
    items = [],
    theme,
    reviewsUrl,
    leaveReviewUrl,
    aggregateRatingValue,
    aggregateReviewCount,
    aggregateSourceName,
  } = block

  const isDark = stegaClean(theme) === 'dark'

  const ratingClean = aggregateRatingValue != null ? Number(stegaClean(String(aggregateRatingValue))) : null
  const countClean = aggregateReviewCount != null ? Number(stegaClean(String(aggregateReviewCount))) : null
  const sourceClean = aggregateSourceName ? stegaClean(aggregateSourceName) : null
  const hasAggregate = typeof ratingClean === 'number' && !Number.isNaN(ratingClean) && ratingClean > 0
  const reviewsButtonLabel = hasAggregate
    ? [
        ratingClean.toFixed(1),
        countClean && countClean > 0 ? `${countClean} reviews` : 'all our reviews',
        sourceClean ? `on ${sourceClean}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : 'See all our reviews'

  return (
    <section className={cn('py-20 sm:py-28', isDark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">
        {(eyebrow || heading) && (
          <div className="mb-12 text-center">
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
          </div>
        )}

        {items.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => {
              const hasAvatar = Boolean(item.avatar?.asset?._ref)
              const initials = item.authorName
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()

              return (
                <motion.div
                  key={item._key}
                  initial={{opacity: 0, y: 24}}
                  whileInView={{opacity: 1, y: 0}}
                  viewport={{once: true, margin: '-60px'}}
                  transition={{duration: 0.5, delay: i * 0.08, ease: 'easeOut'}}
                  className={cn(
                    'flex flex-col gap-4 rounded-2xl border p-6',
                    isDark
                      ? 'border-white/8 bg-gray-900'
                      : 'border-gray-100 bg-white shadow-sm shadow-gray-100',
                  )}
                >
                  {item.rating && <StarRating rating={item.rating} />}

                  {item.quote && (
                    <blockquote
                      className={cn(
                        'flex-1 text-sm leading-relaxed',
                        isDark ? 'text-gray-300' : 'text-gray-600',
                      )}
                    >
                      &ldquo;{item.quote}&rdquo;
                    </blockquote>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    {hasAvatar ? (
                      <Image
                        id={item.avatar!.asset!._ref}
                        alt={item.authorName ?? ''}
                        width={40}
                        mode="cover"
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                        {initials}
                      </div>
                    )}
                    <div>
                      {item.authorName && (
                        <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                          {item.authorName}
                        </p>
                      )}
                      {item.authorLocation && (
                        <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
                          {item.authorLocation}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {(reviewsUrl || leaveReviewUrl) && (
          <motion.div
            initial={{opacity: 0, y: 16}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.5, delay: 0.1}}
            className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            {reviewsUrl && (
              <a
                href={reviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-2.5 rounded-full border px-6 py-3 text-sm font-semibold transition-colors',
                  isDark
                    ? 'border-white/15 bg-white/5 text-white hover:bg-white/10'
                    : 'border-gray-200 bg-white text-gray-900 shadow-sm hover:bg-gray-50',
                )}
              >
                <span className="flex gap-0.5">
                  {Array.from({length: 5}).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </span>
                {reviewsButtonLabel}
              </a>
            )}
            {leaveReviewUrl && (
              <a
                href={leaveReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand/90"
              >
                <Star className="h-4 w-4 fill-white" />
                Leave us a review
              </a>
            )}
          </motion.div>
        )}
      </div>
    </section>
  )
}
