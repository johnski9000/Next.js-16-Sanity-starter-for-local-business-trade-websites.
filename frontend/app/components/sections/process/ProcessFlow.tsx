import {stegaClean} from '@sanity/client/stega'

import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

import {pad, processIcon} from './processIcons'

/** A · Horizontal connected flow — numbered nodes + progress line. */
export default function ProcessFlow({
  block,
}: {
  block: ExtractPageBuilderType<'processSection'>
}) {
  const {eyebrow, heading, subheading, steps = []} = block
  const dark = stegaClean(block.theme) === 'dark'
  const count = steps.length

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const ring = dark ? 'ring-gray-950' : 'ring-gray-50'
  const lgCols =
    count === 3 ? 'lg:grid-cols-3' : count === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center" as="div">
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
          {subheading && (
            <p className={cn('mx-auto mt-3 max-w-xl text-base leading-relaxed', soft)}>{subheading}</p>
          )}
        </Reveal>

        {count > 0 && (
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-x-[10%] top-7 hidden h-0.5 bg-gradient-to-r from-brand/30 to-brand lg:block"
            />
            <RevealGroup className={cn('relative grid grid-cols-1 gap-10 sm:grid-cols-2', lgCols)} as="ol">
              {steps.map((s, i) => {
                const Icon = processIcon(s.icon)
                return (
                  <RevealItem key={s._key} className="flex flex-col items-center px-4 text-center" as="li">
                    <span
                      className={cn(
                        'relative z-1 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg ring-4',
                        ring,
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="mt-4 text-[11px] font-bold uppercase tracking-widest text-brand">
                      Step {pad(i)}
                    </span>
                    {s.title && (
                      <strong className={cn('mt-1.5 text-lg font-extrabold tracking-tight', ink)}>
                        {s.title}
                      </strong>
                    )}
                    {s.description && (
                      <span className={cn('mt-2 max-w-[24ch] text-sm leading-relaxed', soft)}>
                        {s.description}
                      </span>
                    )}
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
