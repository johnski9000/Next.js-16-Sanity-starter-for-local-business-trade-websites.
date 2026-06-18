import {stegaClean} from '@sanity/client/stega'
import type {PortableTextBlock} from 'next-sanity'

import PortableText from '@/app/components/PortableText'
import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

/** B · Split intro + "at a glance" facts panel, with optional image. */
export default function IntroFacts({
  block,
}: {
  block: ExtractPageBuilderType<'introOverviewSection'>
}) {
  const {eyebrow, heading, body, image} = block
  const facts = block.facts ?? []
  const dark = stegaClean(block.theme) === 'dark'
  const hasImage = Boolean(image?.asset?._ref)
  const hasFacts = facts.length > 0
  // Render a right-hand column when we have either a facts panel or an image.
  const hasAside = hasFacts || hasImage

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const card = dark ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-white'
  const line = dark ? 'border-white/10' : 'border-gray-200'

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">
        <div
          className={cn(
            'grid items-center gap-14',
            hasAside ? 'lg:grid-cols-[1.1fr_0.9fr]' : 'max-w-3xl',
          )}
        >
          <Reveal as="div">
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
            {body && (
              <PortableText
                value={body as PortableTextBlock[]}
                className={cn('mt-4 text-base leading-relaxed', dark ? 'prose-invert text-gray-400' : 'text-gray-600')}
              />
            )}
          </Reveal>

          {hasAside && (
            <div className="space-y-6">
              {hasImage && (
                <div className="relative overflow-hidden rounded-2xl shadow-lg">
                  <Image
                    id={image!.asset!._ref}
                    alt={image?.alt ?? ''}
                    width={560}
                    crop={image?.crop ?? undefined}
                    hotspot={image?.hotspot ?? undefined}
                    mode="cover"
                    className="h-full max-h-96 w-full object-cover"
                  />
                </div>
              )}

              {hasFacts && (
                <div className={cn('rounded-2xl border p-7 shadow-lg', card)}>
                  <span className={cn('mb-1 block text-xs font-bold uppercase tracking-widest', soft)}>
                    At a glance
                  </span>
                  <RevealGroup as="dl">
                    {facts.map((f, i) => (
                      <RevealItem
                        key={f._key}
                        className={cn(
                          'flex items-baseline justify-between gap-4 py-3.5',
                          i < facts.length - 1 && cn('border-b', line),
                        )}
                        as="div"
                      >
                        <dt className={cn('text-sm', soft)}>{f.label}</dt>
                        <dd className={cn('m-0 text-right text-base font-bold', ink)}>{f.value}</dd>
                      </RevealItem>
                    ))}
                  </RevealGroup>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
