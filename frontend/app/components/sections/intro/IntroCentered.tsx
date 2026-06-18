import {stegaClean} from '@sanity/client/stega'
import type {PortableTextBlock} from 'next-sanity'

import PortableText from '@/app/components/PortableText'
import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

/** C · Centred overview + inline stats. */
export default function IntroCentered({
  block,
}: {
  block: ExtractPageBuilderType<'introOverviewSection'>
}) {
  const {eyebrow, heading, body} = block
  const stats = block.stats ?? []
  const dark = stegaClean(block.theme) === 'dark'

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const divide = dark ? 'divide-white/10' : 'divide-gray-200'

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-white')}>
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
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
                className={cn(
                  'mx-auto mt-5 max-w-prose text-center text-lg leading-relaxed',
                  dark ? 'prose-invert text-gray-300' : 'text-gray-600',
                )}
              />
            )}
          </Reveal>

          {stats.length > 0 && (
            <RevealGroup className={cn('mt-9 flex justify-center divide-x', divide)} as="div">
              {stats.map((s) => (
                <RevealItem key={s._key} className="flex max-w-48 flex-1 flex-col gap-1 px-6" as="div">
                  <span className="text-3xl font-extrabold tracking-tight text-brand">{s.value}</span>
                  <span className={cn('text-sm', soft)}>{s.label}</span>
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </div>
      </div>
    </section>
  )
}
