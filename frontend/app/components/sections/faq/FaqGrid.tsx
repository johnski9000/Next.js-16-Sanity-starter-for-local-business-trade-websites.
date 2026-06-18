import {stegaClean} from '@sanity/client/stega'
import {HelpCircle, Phone} from 'lucide-react'
import type {PortableTextBlock} from 'next-sanity'

import PortableText from '@/app/components/PortableText'
import ResolvedLink from '@/app/components/ResolvedLink'
import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

/** B · Open Q&A grid — every answer visible (snippet-friendly) + a CTA cell. */
export default function FaqGrid({
  block,
}: {
  block: ExtractPageBuilderType<'faq'>
}) {
  const {eyebrow, heading, subheading, ctaTitle, ctaText, ctaButton} = block
  const items = block.items ?? []
  const dark = stegaClean(block.theme) === 'dark'
  const hasCta = Boolean(ctaButton?.buttonText && ctaButton?.link)

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'

  if (items.length === 0) return null

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-white')}>
      <div className="container">
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

        <RevealGroup className="grid gap-x-10 gap-y-8 sm:grid-cols-2" as="div">
          {items.map((item) => (
            <RevealItem key={item._key} className="flex gap-4" as="div">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <HelpCircle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <strong className={cn('block text-lg font-bold tracking-tight', ink)}>
                  {item.question}
                </strong>
                {item.answer && (
                  <div className="mt-1.5">
                    <PortableText
                      value={item.answer as PortableTextBlock[]}
                      className={cn('text-sm leading-relaxed', dark && 'prose-invert')}
                    />
                  </div>
                )}
              </div>
            </RevealItem>
          ))}

          {hasCta && (
            <RevealItem className="flex flex-col justify-center gap-2 rounded-2xl border border-brand/20 bg-brand/5 p-6" as="div">
              {ctaTitle && <strong className={cn('text-lg font-extrabold tracking-tight', ink)}>{ctaTitle}</strong>}
              {ctaText && <span className={cn('text-sm', soft)}>{ctaText}</span>}
              <ResolvedLink
                link={ctaButton!.link as unknown as DereferencedLink}
                className="mt-2 inline-flex items-center gap-2 self-start rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                <Phone className="h-4 w-4" />
                {ctaButton!.buttonText}
              </ResolvedLink>
            </RevealItem>
          )}
        </RevealGroup>
      </div>
    </section>
  )
}
