import {CalendarX, Check, Clock, DollarSign, TriangleAlert, type LucideIcon} from 'lucide-react'

import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

const PAIN_ICONS: Record<string, LucideIcon> = {
  Clock,
  CalendarX,
  Dollar: DollarSign,
  Alert: TriangleAlert,
}

const gridCols = (n: number) =>
  n >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : n === 3 ? 'sm:grid-cols-3' : n === 2 ? 'sm:grid-cols-2' : ''

/** A · Empathy headline + pain-card grid → reassurance pill. */
export default function PainCards({
  block,
  dark,
}: {
  block: ExtractPageBuilderType<'problemSection'>
  dark: boolean
}) {
  const {eyebrow, title, lead, reassurance} = block
  const pains = block.pains ?? []

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
        {lead && <p className={cn('mx-auto mt-4 max-w-2xl text-lg leading-relaxed', soft)}>{lead}</p>}
      </Reveal>

      {pains.length > 0 && (
        <RevealGroup as="div" className={cn('mt-10 grid gap-4 text-left', gridCols(pains.length))}>
          {pains.map((p) => {
            const Icon = PAIN_ICONS[p.icon ?? 'Clock'] ?? Clock
            return (
              <RevealItem
                key={p._key}
                as="div"
                className={cn('flex flex-col gap-2.5 rounded-2xl border p-5 shadow-sm', card)}
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                  <Icon className="h-6 w-6" />
                </span>
                {p.title && (
                  <strong className={cn('text-base font-bold leading-snug', ink)}>{p.title}</strong>
                )}
                {p.desc && <span className={cn('text-sm leading-relaxed', soft)}>{p.desc}</span>}
              </RevealItem>
            )
          })}
        </RevealGroup>
      )}

      {reassurance && (
        <Reveal as="div" className="mt-9 inline-flex items-center gap-2 rounded-full border border-green-600/30 bg-green-500/10 px-5 py-3 text-base font-bold">
          <Check className="h-5 w-5 text-green-600" />
          <span className={ink}>{reassurance}</span>
        </Reveal>
      )}
    </div>
  )
}
