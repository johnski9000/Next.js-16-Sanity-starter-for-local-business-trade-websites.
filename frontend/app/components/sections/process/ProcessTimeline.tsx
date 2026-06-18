import {stegaClean} from '@sanity/client/stega'

import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

import {pad, processIcon} from './processIcons'

/** B · Vertical timeline — numbered rail. */
export default function ProcessTimeline({
  block,
}: {
  block: ExtractPageBuilderType<'processSection'>
}) {
  const {eyebrow, heading, subheading, steps = []} = block
  const dark = stegaClean(block.theme) === 'dark'

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const rail = dark ? 'bg-white/10' : 'bg-gray-200'

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

        {steps.length > 0 && (
          <RevealGroup className="mx-auto max-w-2xl" as="ol">
            {steps.map((s, i) => {
              const Icon = processIcon(s.icon)
              const last = i === steps.length - 1
              return (
                <RevealItem key={s._key} className="grid grid-cols-[3.5rem_1fr] gap-6" as="li">
                  <div className="relative flex justify-center">
                    {!last && (
                      <span aria-hidden className={cn('absolute top-14 bottom-0 w-0.5', rail)} />
                    )}
                    <span className="relative z-1 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-extrabold text-white shadow-md">
                      {pad(i)}
                    </span>
                  </div>
                  <div className={cn(last ? 'pb-0' : 'pb-8', 'pt-2')}>
                    <strong
                      className={cn('flex items-center gap-2.5 text-xl font-extrabold tracking-tight', ink)}
                    >
                      <Icon className="h-5 w-5 text-brand" />
                      {s.title}
                    </strong>
                    {s.description && (
                      <span className={cn('mt-2 block text-base leading-relaxed', soft)}>
                        {s.description}
                      </span>
                    )}
                  </div>
                </RevealItem>
              )
            })}
          </RevealGroup>
        )}
      </div>
    </section>
  )
}
