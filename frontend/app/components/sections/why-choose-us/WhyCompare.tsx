import {stegaClean} from '@sanity/client/stega'
import {Check, X} from 'lucide-react'

import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

/** C · Comparison table — you vs. a typical contractor. */
export default function WhyCompare({
  block,
}: {
  block: ExtractPageBuilderType<'whyChooseUs'>
}) {
  const {eyebrow, heading, usLabel, themLabel} = block
  const rows = block.compareRows ?? []
  const dark = stegaClean(block.theme) === 'dark'

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const card = dark ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-white'
  const line = dark ? 'border-white/10' : 'border-gray-200'
  const cols = 'grid-cols-[1fr_4.5rem_4.5rem] sm:grid-cols-[1fr_9rem_9rem]'

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">
        <Reveal className="mb-9 max-w-2xl" as="div">
          {eyebrow && (
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-deep">
              {eyebrow}
            </span>
          )}
          {heading && (
            <h2 className={cn('mt-2 text-balance text-3xl font-extrabold tracking-tight md:text-4xl', ink)}>
              {heading}
            </h2>
          )}
        </Reveal>

        {rows.length > 0 && (
          <div className={cn('mx-auto max-w-3xl overflow-hidden rounded-2xl border shadow-lg', card)}>
            <div className={cn('grid items-center gap-2 border-b px-6 py-4', cols, line)}>
              <span aria-hidden />
              <span className="text-center text-sm font-extrabold tracking-tight text-brand">
                {usLabel || 'Us'}
              </span>
              <span className={cn('text-center text-sm font-extrabold tracking-tight', soft)}>
                {themLabel || 'Others'}
              </span>
            </div>
            <RevealGroup as="div">
            {rows.map((r, i) => {
              const yes = r.usHas !== false
              return (
                <RevealItem
                  key={r._key}
                  className={cn(
                    'grid items-center gap-2 px-6 py-4',
                    cols,
                    i < rows.length - 1 && cn('border-b', line),
                    dark ? 'odd:bg-white/[0.02]' : 'odd:bg-gray-900/[0.02]',
                  )}
                  as="div"
                >
                  <span className={cn('text-base font-semibold', ink)}>{r.label}</span>
                  <span className="flex justify-center">
                    {yes ? (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'inline-flex h-8 w-8 items-center justify-center rounded-full',
                          dark ? 'bg-white/10 text-gray-400' : 'bg-gray-900/5 text-gray-400',
                        )}
                      >
                        <X className="h-4 w-4" />
                      </span>
                    )}
                  </span>
                  <span className="flex justify-center opacity-80">
                    <span
                      className={cn(
                        'inline-flex h-8 w-8 items-center justify-center rounded-full',
                        dark ? 'bg-white/10 text-gray-400' : 'bg-gray-900/5 text-gray-400',
                      )}
                    >
                      <X className="h-4 w-4" />
                    </span>
                  </span>
                </RevealItem>
              )
            })}
            </RevealGroup>
          </div>
        )}
      </div>
    </section>
  )
}
