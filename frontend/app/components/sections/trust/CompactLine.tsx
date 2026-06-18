import {Reveal} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'

import {Stars, fmtCount, trustIcon, type Accreditation, type Rating} from './TrustPrimitives'

/** F · Compact inline trust line — minimal, sits high under a hero. */
export default function CompactLine({
  rating,
  items,
  dark,
}: {
  rating: Rating | null
  items: Accreditation[]
  dark: boolean
}) {
  const ink = dark ? 'text-white' : 'text-gray-900'
  const soft = dark ? 'text-gray-400' : 'text-gray-500'
  const dot = dark ? 'bg-white/25' : 'bg-gray-900/20'
  const hasRating = rating?.ratingValue != null

  return (
    <Reveal className={cn('flex flex-wrap items-center justify-center gap-x-4 gap-y-2', ink)} as="div">
      {hasRating && (
        <span className="inline-flex items-center gap-2 text-[0.96rem] font-semibold">
          <Stars size={15} className="mr-1" />
          <strong className="font-extrabold">{rating!.ratingValue}</strong>
          {rating!.reviewCount != null && (
            <span className={cn('font-medium', soft)}>({fmtCount(rating!.reviewCount)} reviews)</span>
          )}
        </span>
      )}
      {items.map((it, i) => {
        const Icon = trustIcon(it.icon)
        return (
          <span key={i} className="contents">
            {(hasRating || i > 0) && <span className={cn('h-1 w-1 rounded-full', dot)} />}
            <span className="inline-flex items-center gap-2 text-[0.96rem] font-semibold">
              <Icon className="h-[17px] w-[17px] text-blue" />
              {it.title}
            </span>
          </span>
        )
      })}
    </Reveal>
  )
}
