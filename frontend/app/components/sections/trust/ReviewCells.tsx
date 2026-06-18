import type {CSSProperties} from 'react'

import {Reveal} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'

import {Stars, type Platform} from './TrustPrimitives'

/** A · Review-platform rating cells. */
export default function ReviewCells({platforms, dark}: {platforms: Platform[]; dark: boolean}) {
  const cardBg = dark ? 'bg-gray-900' : 'bg-white'
  const ink = dark ? 'text-white' : 'text-gray-900'
  const soft = dark ? 'text-gray-400' : 'text-gray-500'
  const line = dark ? 'border-white/10' : 'border-gray-200'

  return (
    <div
      className={cn(
        'mx-auto grid max-w-[1000px] grid-cols-2 overflow-hidden rounded-2xl border shadow-xl sm:[grid-template-columns:repeat(var(--cols,4),minmax(0,1fr))]',
        cardBg,
        line,
      )}
      style={{'--cols': platforms.length} as CSSProperties}
    >
      {platforms.map((c, i) => (
        <Reveal
          key={i}
          delay={i * 0.08}
          className={cn(
            'flex flex-col items-center gap-2.5 p-7 text-center',
            i > 0 && cn('border-l', line),
          )}
          as="div"
        >
          <span className={cn('text-xs font-bold uppercase tracking-widest', soft)}>{c.platform}</span>
          {c.showStars ? (
            <Stars size={15} />
          ) : (
            <span className="text-[1.7rem] font-extrabold leading-none text-blue">{c.score}</span>
          )}
          <div className="flex flex-col gap-0.5">
            {c.showStars && (
              <span className={cn('text-[1.7rem] font-extrabold leading-none', ink)}>{c.score}</span>
            )}
            {c.subLabel && <span className={cn('text-[0.8rem]', soft)}>{c.subLabel}</span>}
          </div>
        </Reveal>
      ))}
    </div>
  )
}
