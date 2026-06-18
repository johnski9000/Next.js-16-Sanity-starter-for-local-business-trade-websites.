import {stegaClean} from '@sanity/client/stega'
import {ArrowRight, Phone} from 'lucide-react'

import ResolvedLink from '@/app/components/ResolvedLink'
import {RevealGroup, RevealItem} from '@/app/components/Reveal'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

/** C · Phone-forward emergency band (dark). The number comes from Settings NAP. */
export default function CtaPhone({
  block,
}: {
  block: ExtractPageBuilderType<'cta'>
}) {
  const {eyebrow, heading, subheading, primaryButton, secondaryButton} = block
  const phone = stegaClean(block.phone) || undefined
  const phoneHref = phone ? `tel:${phone.replace(/\s+/g, '')}` : undefined

  return (
    <section className="bg-gray-950 px-6 py-20 text-center text-white sm:py-28">
      <RevealGroup as="div" className="container">
        {eyebrow && (
          <RevealItem as="span" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
            <span className="h-2 w-2 rounded-full bg-blue ring-4 ring-blue/25" />
            {eyebrow}
          </RevealItem>
        )}
        {heading && (
          <RevealItem as="h2" className="mx-auto mt-5 max-w-2xl text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            {heading}
          </RevealItem>
        )}

        {phoneHref ? (
          <RevealItem as="div">
            <a
              href={phoneHref}
              className="mt-6 inline-flex items-center gap-4 text-4xl font-extrabold tracking-tight whitespace-nowrap sm:text-5xl"
            >
              <Phone className="h-9 w-9 shrink-0 text-blue" />
              {phone}
            </a>
          </RevealItem>
        ) : (
          primaryButton?.buttonText &&
          primaryButton?.link && (
            <RevealItem as="div" className="mt-6">
              <ResolvedLink
                link={primaryButton.link as unknown as DereferencedLink}
                className="inline-flex items-center gap-2.5 rounded-xl bg-brand px-7 py-4 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-90"
              >
                <Phone className="h-5 w-5" />
                {primaryButton.buttonText}
              </ResolvedLink>
            </RevealItem>
          )
        )}

        {subheading && <RevealItem as="p" className="mt-4 text-lg text-gray-400">{subheading}</RevealItem>}

        {secondaryButton?.buttonText && secondaryButton?.link && (
          <RevealItem as="div" className="mt-7">
            <ResolvedLink
              link={secondaryButton.link as unknown as DereferencedLink}
              className="inline-flex items-center gap-1.5 border-b-[1.5px] border-white/30 pb-1 text-sm font-bold text-white transition-colors hover:border-white"
            >
              {secondaryButton.buttonText}
              <ArrowRight className="h-4 w-4" />
            </ResolvedLink>
          </RevealItem>
        )}
      </RevealGroup>
    </section>
  )
}
