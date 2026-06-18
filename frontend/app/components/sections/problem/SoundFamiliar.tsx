import {Check, X} from 'lucide-react'

import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

/** B · "Sound familiar?" pain checklist → relief card. */
export default function SoundFamiliar({
  block,
  dark,
}: {
  block: ExtractPageBuilderType<'problemSection'>
  dark: boolean
}) {
  const {eyebrow, title, reliefKicker, reliefLead} = block
  const pains = block.painList ?? []
  const fixes = block.fixes ?? []

  const ink = dark ? 'text-white' : 'text-gray-900'
  const pill = dark ? 'border-white/15 bg-white/10 text-white' : 'border-brand/20 bg-brand/5 text-brand'

  return (
    <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
      {/* pains */}
      <div>
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
            <h2 className={cn('mt-5 text-balance text-2xl font-extrabold tracking-tight sm:text-3xl', ink)}>
              {title}
            </h2>
          )}
        </Reveal>
        {pains.length > 0 && (
          <RevealGroup as="ul" className="mt-7 flex flex-col gap-4">
            {pains.map((p, i) => (
              <RevealItem key={i} as="li" className={cn('flex items-start gap-3 text-lg font-medium leading-snug', ink)}>
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-600">
                  <X className="h-3.5 w-3.5" />
                </span>
                {p}
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </div>

      {/* relief */}
      <Reveal as="div" className="rounded-3xl border border-green-600/25 bg-green-500/5 p-8 shadow-lg">
        {reliefKicker && (
          <span className="text-xs font-bold uppercase tracking-widest text-green-700">{reliefKicker}</span>
        )}
        {reliefLead && (
          <p className={cn('mt-3 text-xl font-bold leading-snug tracking-tight', ink)}>{reliefLead}</p>
        )}
        {fixes.length > 0 && (
          <RevealGroup as="ul" className="mt-6 flex flex-col gap-3.5">
            {fixes.map((f, i) => (
              <RevealItem key={i} as="li" className={cn('flex items-center gap-3 text-base font-semibold', ink)}>
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {f}
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </Reveal>
    </div>
  )
}
