import {Reveal} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'

import {Stars, fmtCount, trustIcon, type Accreditation, type Rating, type Stat} from './TrustPrimitives'

/** E · Combined credibility bar — stat | certifications | rating. */
export default function CombinedBar({
  stat,
  accreditations,
  rating,
  dark,
}: {
  stat?: Stat | null
  accreditations: Accreditation[]
  rating: Rating | null
  dark: boolean
}) {
  const cardBg = dark ? 'bg-gray-900' : 'bg-white'
  const ink = dark ? 'text-white' : 'text-gray-900'
  const soft = dark ? 'text-gray-400' : 'text-gray-500'
  const line = dark ? 'border-white/10' : 'border-gray-200'
  const divide = dark ? 'divide-white/10' : 'divide-gray-200'
  const hasStat = Boolean(stat?.headline || stat?.sub)
  const hasRating = rating?.ratingValue != null

  return (
    <Reveal
      className={cn(
        'mx-auto flex max-w-[1060px] flex-col divide-y overflow-hidden rounded-2xl border shadow-xl md:flex-row md:divide-x md:divide-y-0',
        cardBg,
        line,
        divide,
      )}
      as="div"
    >
      {hasStat && (
        <div className="flex flex-col justify-center gap-1 px-7 py-5">
          {stat!.headline && (
            <span className={cn('text-[1.45rem] font-extrabold leading-none tracking-tight', ink)}>
              {stat!.headline}
            </span>
          )}
          {stat!.sub && <span className={cn('text-[0.83rem]', soft)}>{stat!.sub}</span>}
        </div>
      )}

      {accreditations.length > 0 && (
        <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2.5 px-7 py-5">
          {accreditations.map((m, i) => {
            const Icon = trustIcon(m.icon)
            return (
              <span
                key={i}
                className={cn('inline-flex items-center gap-2 text-[0.9rem] font-semibold', ink)}
              >
                <Icon className="h-[19px] w-[19px] text-brand" />
                {m.title}
              </span>
            )
          })}
        </div>
      )}

      {hasRating && (
        <div className="flex items-center gap-3 px-7 py-5">
          <Stars size={17} />
          <div className="flex flex-col leading-tight">
            <strong className={cn('text-[1.02rem] font-extrabold', ink)}>
              {rating!.ratingValue} / {rating!.bestRating ?? 5}
            </strong>
            {rating!.reviewCount != null && (
              <span className={cn('text-[0.78rem]', soft)}>{fmtCount(rating!.reviewCount)} reviews</span>
            )}
          </div>
        </div>
      )}
    </Reveal>
  )
}
