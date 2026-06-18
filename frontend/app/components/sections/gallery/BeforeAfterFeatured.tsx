import {stegaClean} from '@sanity/client/stega'

import {Reveal} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

import {BASlider} from './BASlider'

/** A · One large featured before/after slider + caption. */
export default function BeforeAfterFeatured({
  block,
}: {
  block: ExtractPageBuilderType<'beforeAfter'>
}) {
  const {eyebrow, heading, subheading} = block
  const items = block.items ?? []
  const featured = items[0]
  const dark = stegaClean(block.theme) === 'dark'

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const line = dark ? 'border-white/10' : 'border-gray-200'

  if (!featured) return null

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-white')}>
      <div className="container">
        <Reveal className="mx-auto max-w-3xl text-center" as="div">
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
          {subheading && <p className={cn('mx-auto mt-3 max-w-xl text-base leading-relaxed', soft)}>{subheading}</p>}
        </Reveal>

        <Reveal className="mx-auto mt-10 max-w-4xl" as="div" delay={0.1}>
          <div className={cn('aspect-video overflow-hidden rounded-2xl border shadow-xl', line)}>
            <BASlider item={featured} />
          </div>
          {(featured.title || featured.description) && (
            <p className={cn('mt-4 text-center text-base', soft)}>
              {featured.title && <strong className={cn('font-bold', ink)}>{featured.title}</strong>}
              {featured.description ? ` · ${featured.description}` : ''} · drag to compare
            </p>
          )}
        </Reveal>
      </div>
    </section>
  )
}
