import {Gauge, ShieldCheck, Smile, type LucideIcon} from 'lucide-react'

import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

const OUTCOME_ICONS: Record<string, LucideIcon> = {Smile, Gauge, ShieldCheck}

const gridCols = (n: number) =>
  n >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : n === 3 ? 'sm:grid-cols-3' : n === 2 ? 'sm:grid-cols-2' : ''

/** A · Outcome cards (N-up) with a gradient top accent. */
export default function OutcomeCards({
  block,
  dark,
}: {
  block: ExtractPageBuilderType<'solutionSection'>
  dark: boolean
}) {
  const {eyebrow, title} = block
  const outcomes = block.outcomes ?? []

  const ink = dark ? 'text-white' : 'text-gray-900'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const card = dark ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-white'
  const pill = dark ? 'border-white/15 bg-white/10 text-white' : 'border-brand/20 bg-brand/5 text-brand'

  return (
    <div className="mx-auto max-w-5xl text-center">
      <Reveal as="div">
        {eyebrow && (
          <span
            className={cn(
              'inline-block rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest',
              pill,
            )}
          >
            {eyebrow}
          </span>
        )}
        {title && (
          <h2 className={cn('mt-5 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl', ink)}>
            {title}
          </h2>
        )}
      </Reveal>

      {outcomes.length > 0 && (
        <RevealGroup as="div" className={cn('mt-11 grid gap-5 text-left', gridCols(outcomes.length))}>
          {outcomes.map((o) => {
            const Icon = OUTCOME_ICONS[o.icon ?? 'Smile'] ?? Smile
            return (
              <RevealItem
                key={o._key}
                as="div"
                className={cn(
                  'relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-7 shadow-md',
                  card,
                )}
              >
                <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand to-blue" />
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="h-6 w-6" />
                </span>
                {o.title && (
                  <strong className={cn('text-xl font-extrabold tracking-tight', ink)}>{o.title}</strong>
                )}
                {o.desc && <span className={cn('text-base leading-relaxed', soft)}>{o.desc}</span>}
              </RevealItem>
            )
          })}
        </RevealGroup>
      )}
    </div>
  )
}
