import {Reveal} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'

import {Stars, fmtCount, type Rating} from './TrustPrimitives'

/** B · Big aggregate score, centred. */
export default function AggregateScore({rating, dark}: {rating: Rating; dark: boolean}) {
  const ink = dark ? 'text-white' : 'text-gray-900'
  const soft = dark ? 'text-gray-400' : 'text-gray-500'
  const best = rating.bestRating ?? 5

  return (
    <Reveal className="flex flex-col items-center gap-3.5 text-center" as="div">
      <Stars size={30} />
      <div className="flex items-baseline gap-2">
        <strong className={cn('text-[3.4rem] font-extrabold leading-none tracking-tight', ink)}>
          {rating.ratingValue}
        </strong>
        <span className={cn('text-xl font-semibold', soft)}>/ {best}</span>
      </div>
      {rating.reviewCount != null && (
        <p className={cn('m-0 text-[1.05rem]', soft)}>
          Rated by{' '}
          <strong className={cn('font-bold', ink)}>{fmtCount(rating.reviewCount)} verified customers</strong>
        </p>
      )}
    </Reveal>
  )
}
