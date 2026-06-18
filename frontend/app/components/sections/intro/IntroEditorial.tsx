import {stegaClean} from '@sanity/client/stega'
import {ArrowRight} from 'lucide-react'
import type {PortableTextBlock} from 'next-sanity'

import PortableText from '@/app/components/PortableText'
import ResolvedLink from '@/app/components/ResolvedLink'
import {Reveal} from '@/app/components/Reveal'
import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

/** A · Oversized lead-in + two-column body + link, with optional side image. */
export default function IntroEditorial({
  block,
}: {
  block: ExtractPageBuilderType<'introOverviewSection'>
}) {
  const {eyebrow, heading, body, cta, image} = block
  const dark = stegaClean(block.theme) === 'dark'
  const hasCta = Boolean(cta?.buttonText && cta?.link)
  const hasImage = Boolean(image?.asset?._ref)

  const ink = dark ? 'text-white' : 'text-gray-950'

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-white')}>
      <div className="container">
        <div
          className={cn(
            // Full container width (lines up with the sibling sections); when an
            // image is present, two columns with the photo taking a slightly
            // larger share so it reads bigger.
            hasImage && 'grid items-start gap-12 lg:grid-cols-[1.2fr_1fr]',
          )}
        >
          <Reveal as="div">
            {eyebrow && (
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-deep">
                {eyebrow}
              </span>
            )}
            {heading && (
              <p
                className={cn(
                  'mt-4 max-w-[24ch] text-balance text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl md:text-4xl',
                  ink,
                )}
              >
                {heading}
              </p>
            )}
            {body && (
              <PortableText
                value={body as PortableTextBlock[]}
                className={cn(
                  'mt-7 text-base leading-relaxed [column-gap:3rem]',
                  // Two-column body only reads well across the full width; when an
                  // image takes the side column, keep the body single-column.
                  hasImage ? '' : 'md:columns-2',
                  dark ? 'prose-invert text-gray-400' : 'text-gray-600',
                )}
              />
            )}
            {hasCta && (
              <ResolvedLink
                link={cta!.link as unknown as DereferencedLink}
                className="mt-7 inline-flex items-center gap-2 text-base font-bold text-brand transition-opacity hover:opacity-80"
              >
                {cta!.buttonText}
                <ArrowRight className="h-4 w-4" />
              </ResolvedLink>
            )}
          </Reveal>

          {hasImage && (
            <Reveal className="relative overflow-hidden rounded-2xl lg:mt-1" as="div" delay={0.1}>
              <Image
                id={image!.asset!._ref}
                alt={image?.alt ?? ''}
                width={640}
                crop={image?.crop ?? undefined}
                hotspot={image?.hotspot ?? undefined}
                mode="cover"
                className="h-full max-h-120 w-full object-cover"
              />
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}
