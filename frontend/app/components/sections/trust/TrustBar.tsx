import {stegaClean} from '@sanity/client/stega'

import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

import AggregateScore from './AggregateScore'
import Certifications from './Certifications'
import CombinedBar from './CombinedBar'
import CompactLine from './CompactLine'
import FeaturedIn from './FeaturedIn'
import ReviewCells from './ReviewCells'

type TrustBarProps = {
  block: ExtractPageBuilderType<'trustBar'>
  index: number
  pageType: string
  pageId: string
}

/**
 * Trust Bar dispatcher. Reads the business trust facts projected from Site
 * Settings (single source of truth) and renders the chosen variant.
 *
 * Compliance-first: a variant renders ONLY when the real data it needs exists —
 * review variants additionally require the Settings "reviews" gate to be on.
 * Missing data → nothing renders (never a fabricated placeholder).
 */
export default function TrustBar({block}: TrustBarProps) {
  const variant = stegaClean(block.variant) || 'compactLine'
  const dark = stegaClean(block.theme) === 'dark'
  const heading = block.heading

  const t = block.trust
  const reviewsOn = Boolean(t?.reviewsEnabled)
  const rating = reviewsOn && t?.rating?.ratingValue != null ? t.rating : null
  const platforms = t?.platforms ?? []
  const accreditations = t?.accreditations ?? []
  const press = t?.press ?? []
  const stat = t?.stat ?? null

  let content: React.ReactNode = null

  switch (variant) {
    case 'reviewCells':
      if (reviewsOn && platforms.length) content = <ReviewCells platforms={platforms} dark={dark} />
      break
    case 'aggregateScore':
      if (rating) content = <AggregateScore rating={rating} dark={dark} />
      break
    case 'certifications':
      if (accreditations.length)
        content = <Certifications accreditations={accreditations} heading={heading} dark={dark} />
      break
    case 'featuredIn':
      if (press.length) content = <FeaturedIn press={press} heading={heading} dark={dark} />
      break
    case 'combinedBar':
      if (rating || accreditations.length || stat?.headline || stat?.sub)
        content = (
          <CombinedBar stat={stat} accreditations={accreditations} rating={rating} dark={dark} />
        )
      break
    case 'compactLine':
    default:
      if (rating || accreditations.length)
        content = <CompactLine rating={rating} items={accreditations} dark={dark} />
  }

  if (!content) return null

  return (
    <section className={cn('py-12 sm:py-16', dark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">{content}</div>
    </section>
  )
}
