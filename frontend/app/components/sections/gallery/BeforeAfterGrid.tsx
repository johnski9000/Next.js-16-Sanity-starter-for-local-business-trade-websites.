import {stegaClean} from '@sanity/client/stega'

import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

import {BASlider} from './BASlider'

/** B · Grid of independently-draggable before/after sliders (the existing layout). */
export default function BeforeAfterGrid({
  block,
}: {
  block: ExtractPageBuilderType<'beforeAfter'>
}) {
  const {eyebrow, heading, subheading} = block
  const items = block.items ?? []
  const dark = stegaClean(block.theme) === 'dark'
  const columns = stegaClean(block.columns) ?? 2

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const line = dark ? 'border-white/10' : 'border-gray-200'

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">
        {(eyebrow || heading || subheading) && (
          <Reveal className="mb-10 max-w-2xl" as="div">
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
        )}

        {items.length > 0 && (
          <RevealGroup className={cn('grid gap-6', columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')} as="div">
            {items.map((item) => (
              <RevealItem key={item._key} className="m-0" as="figure">
                <div className={cn('aspect-4/3 overflow-hidden rounded-2xl border shadow-sm', line)}>
                  <BASlider item={item} start={52} />
                </div>
                {(item.title || item.description) && (
                  <figcaption className="mt-3.5">
                    {item.title && (
                      <strong className={cn('block text-base font-bold', ink)}>{item.title}</strong>
                    )}
                    {item.description && <span className={cn('text-sm', soft)}>{item.description}</span>}
                  </figcaption>
                )}
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </div>
    </section>
  )
}
