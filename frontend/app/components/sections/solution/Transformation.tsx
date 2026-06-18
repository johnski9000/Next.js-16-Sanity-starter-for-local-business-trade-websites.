import {ArrowRight, Check} from 'lucide-react'

import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

/** B · Before → After transformation rows. (Text — distinct from the image-slider gallery block.) */
export default function Transformation({
  block,
  dark,
}: {
  block: ExtractPageBuilderType<'solutionSection'>
  dark: boolean
}) {
  const {title, beforeLabel, afterLabel} = block
  const rows = block.rows ?? []

  const ink = dark ? 'text-white' : 'text-gray-900'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const beforeCell = dark
    ? 'border-white/10 bg-gray-900 text-gray-400'
    : 'border-gray-200 bg-gray-100 text-gray-500'

  return (
    <div className="mx-auto max-w-4xl">
      {title && (
        <Reveal
          as="h2"
          className={cn(
            'text-balance text-center text-3xl font-extrabold tracking-tight sm:text-4xl',
            ink,
          )}
        >
          {title}
        </Reveal>
      )}

      {rows.length > 0 && (
        <RevealGroup as="div" className="mt-9 flex flex-col gap-3.5">
          <div className="hidden grid-cols-[1fr_auto_1.25fr] items-center gap-3 px-1 sm:grid">
            <span className={cn('text-xs font-bold uppercase tracking-widest', soft)}>
              {beforeLabel || 'Before'}
            </span>
            <span aria-hidden />
            {afterLabel && (
              <span className="text-xs font-bold uppercase tracking-widest text-green-700">
                {afterLabel}
              </span>
            )}
          </div>

          {rows.map((r) => (
            <RevealItem
              key={r._key}
              as="div"
              className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-[1fr_auto_1.25fr]"
            >
              <div
                className={cn(
                  'flex items-center rounded-xl border px-5 py-4 text-base line-through',
                  beforeCell,
                )}
              >
                {r.before}
              </div>
              <span className="flex items-center justify-center text-brand">
                <ArrowRight className="h-5 w-5 rotate-90 sm:rotate-0" />
              </span>
              <div
                className={cn(
                  'flex items-center gap-3 rounded-xl border border-green-600/25 bg-green-500/5 px-5 py-4 text-base font-semibold',
                  ink,
                )}
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {r.after}
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </div>
  )
}
