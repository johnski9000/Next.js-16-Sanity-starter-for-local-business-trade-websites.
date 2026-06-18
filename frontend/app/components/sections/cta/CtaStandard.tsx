'use client'

import {stegaClean} from '@sanity/client/stega'
import {motion} from 'framer-motion'

import ResolvedLink from '@/app/components/ResolvedLink'
import {cn} from '@/lib/utils'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

/** Standard variant — centred restatement + buttons (brand / dark / light theme). */
export default function CtaStandard({
  block,
}: {
  block: ExtractPageBuilderType<'cta'>
}) {
  const {eyebrow, heading, subheading, primaryButton, secondaryButton, theme, textAlignment} = block

  const isBrand = stegaClean(theme) === 'brand'
  const isDark = stegaClean(theme) === 'dark'
  const isCentered = stegaClean(textAlignment) !== 'left'

  const sectionBg = isBrand ? 'bg-brand' : isDark ? 'bg-gray-950' : 'bg-gray-50'
  const eyebrowColor = isBrand ? 'text-white/70' : 'text-brand'
  const headingColor = isBrand || isDark ? 'text-white' : 'text-gray-950'
  const subColor = isBrand ? 'text-white/75' : isDark ? 'text-gray-400' : 'text-gray-600'

  return (
    <section className={cn('relative overflow-hidden py-20 sm:py-28', sectionBg)}>
      {isBrand && (
        <div className="absolute inset-0 bg-[url(/images/tile-1-white.png)] bg-size-[5px] opacity-10" />
      )}

      <div className="container relative">
        <div className={cn('mx-auto max-w-2xl', isCentered ? 'text-center' : 'text-left')}>
          {eyebrow && (
            <motion.span
              initial={{opacity: 0, y: 12}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.5}}
              className={cn('mb-3 inline-block text-xs font-semibold uppercase tracking-widest', eyebrowColor)}
            >
              {eyebrow}
            </motion.span>
          )}

          {heading && (
            <motion.h2
              initial={{opacity: 0, y: 16}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.55, delay: 0.05}}
              className={cn('text-3xl font-semibold md:text-4xl', headingColor)}
            >
              {heading}
            </motion.h2>
          )}

          {subheading && (
            <motion.p
              initial={{opacity: 0, y: 16}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.55, delay: 0.1}}
              className={cn('mt-4 text-base leading-relaxed', subColor)}
            >
              {subheading}
            </motion.p>
          )}

          {(primaryButton?.buttonText || secondaryButton?.buttonText) && (
            <motion.div
              initial={{opacity: 0, y: 16}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.55, delay: 0.15}}
              className={cn('mt-8 flex flex-wrap gap-3', isCentered && 'justify-center')}
            >
              {primaryButton?.buttonText && primaryButton?.link && (
                <ResolvedLink
                  link={primaryButton.link as unknown as DereferencedLink}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold shadow-sm transition-all',
                    isBrand ? 'bg-white text-brand hover:bg-white/90' : 'bg-brand text-white hover:opacity-90',
                  )}
                >
                  {primaryButton.buttonText}
                </ResolvedLink>
              )}

              {secondaryButton?.buttonText && secondaryButton?.link && (
                <ResolvedLink
                  link={secondaryButton.link as unknown as DereferencedLink}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold transition-colors',
                    isBrand || isDark
                      ? 'border-white/30 text-white hover:bg-white/10'
                      : 'border-gray-300 text-gray-800 hover:bg-gray-100',
                  )}
                >
                  {secondaryButton.buttonText}
                </ResolvedLink>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
