import {stegaClean} from '@sanity/client/stega'
import type {CSSProperties} from 'react'

import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

import {pad, processIcon} from './processIcons'

/** C · Bold outlined big numerals. */
export default function ProcessBigNumber({
  block,
}: {
  block: ExtractPageBuilderType<'processSection'>
}) {
  const {eyebrow, heading, subheading, steps = []} = block
  const dark = stegaClean(block.theme) === 'dark'
  const count = steps.length

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const topLine = dark ? 'border-white/15' : 'border-gray-900/15'
  const lgCols =
    count === 3 ? 'lg:grid-cols-3' : count === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'

  // Outlined numeral — stroke uses the per-tenant brand var.
  const numeralStyle: CSSProperties = {
    color: 'transparent',
    WebkitTextStroke: '1.5px color-mix(in srgb, var(--color-brand) 55%, transparent)',
  }

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-white')}>
      <div className="container">
        <Reveal className="mb-12 max-w-2xl" as="div">
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
          {subheading && <p className={cn('mt-3 text-base leading-relaxed', soft)}>{subheading}</p>}
        </Reveal>

        {count > 0 && (
          <RevealGroup className={cn('grid grid-cols-1 gap-8 sm:grid-cols-2', lgCols)} as="ol">
            {steps.map((s, i) => {
              const Icon = processIcon(s.icon)
              return (
                <RevealItem key={s._key} className={cn('flex flex-col items-start border-t-2 pt-6', topLine)} as="li">
                  <span
                    className="text-[4.2rem] font-extrabold leading-none tracking-tighter"
                    style={numeralStyle}
                  >
                    {pad(i)}
                  </span>
                  <span className="mt-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="h-6 w-6" />
                  </span>
                  {s.title && (
                    <strong className={cn('mt-4 text-lg font-extrabold tracking-tight', ink)}>
                      {s.title}
                    </strong>
                  )}
                  {s.description && (
                    <span className={cn('mt-2 text-sm leading-relaxed', soft)}>{s.description}</span>
                  )}
                </RevealItem>
              )
            })}
          </RevealGroup>
        )}
      </div>
    </section>
  )
}
