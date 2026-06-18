'use client'

import {useState} from 'react'
import {stegaClean} from '@sanity/client/stega'

import {Reveal} from '@/app/components/Reveal'
import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

import {BASlider} from './BASlider'

/** C · Featured slider + thumbnail rail to switch projects. */
export default function BeforeAfterThumbs({
  block,
}: {
  block: ExtractPageBuilderType<'beforeAfter'>
}) {
  const {eyebrow, heading, subheading} = block
  const items = block.items ?? []
  const dark = stegaClean(block.theme) === 'dark'
  const [sel, setSel] = useState(0)

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const line = dark ? 'border-white/10' : 'border-gray-200'

  if (items.length === 0) return null
  const active = items[Math.min(sel, items.length - 1)]

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-white')}>
      <div className="container">
        <Reveal className="mb-8 max-w-2xl" as="div">
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

        <div className="mx-auto max-w-4xl">
          <div className={cn('aspect-video overflow-hidden rounded-2xl border shadow-xl', line)}>
            <BASlider key={sel} item={active} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            {(active.title || active.description) && (
              <p className={cn('text-base', soft)}>
                {active.title && <strong className={cn('font-bold', ink)}>{active.title}</strong>}
                {active.description ? ` · ${active.description}` : ''}
              </p>
            )}
            {items.length > 1 && (
              <div className="flex flex-wrap gap-2.5">
                {items.map((it, i) => {
                  const ref = it.afterImage?.asset?._ref
                  return (
                    <button
                      key={it._key}
                      type="button"
                      onClick={() => setSel(i)}
                      aria-label={it.title ?? `Project ${i + 1}`}
                      className={cn(
                        'h-12 w-16 overflow-hidden rounded-lg border-2 transition-colors',
                        i === sel ? 'border-brand' : cn(line, 'opacity-70 hover:opacity-100'),
                      )}
                    >
                      {ref ? (
                        <Image
                          id={ref}
                          alt={it.title ?? ''}
                          width={120}
                          mode="cover"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="block h-full w-full bg-muted" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
