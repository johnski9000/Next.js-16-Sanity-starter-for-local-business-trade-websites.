'use client'

import {stegaClean} from '@sanity/client/stega'
import {motion} from 'framer-motion'
import {CheckCircle2} from 'lucide-react'

import ResolvedLink from '@/app/components/ResolvedLink'
import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

/** Split variant — content column + side image, reasons as an icon checklist. */
export default function WhyChooseUsSplit({
  block,
}: {
  block: ExtractPageBuilderType<'whyChooseUs'>
}) {
  const {eyebrow, heading, subheading, reasons = [], image, button, theme, imageAlignment} = block

  const isDark = stegaClean(theme) === 'dark'
  const imgLeft = stegaClean(imageAlignment) === 'left'
  const hasImage = Boolean(image?.asset?._ref)
  const hasButton = Boolean(button?.buttonText && button?.link)

  return (
    <section className={cn('py-20 sm:py-28', isDark ? 'bg-gray-950' : 'bg-white')}>
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Content column */}
          <div className={cn(hasImage && imgLeft && 'lg:order-2')}>
            {eyebrow && (
              <motion.span
                initial={{opacity: 0, y: 12}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5}}
                className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-blue-deep"
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
                className={cn(
                  'text-3xl font-semibold md:text-4xl',
                  isDark ? 'text-white' : 'text-gray-950',
                )}
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
                className={cn(
                  'mt-3 text-base leading-relaxed',
                  isDark ? 'text-gray-400' : 'text-gray-600',
                )}
              >
                {subheading}
              </motion.p>
            )}

            {/* Reasons */}
            {reasons.length > 0 && (
              <ul className="mt-8 space-y-5">
                {reasons.map((reason, i) => {
                  const hasIcon = Boolean(reason.icon?.asset?._ref)

                  return (
                    <motion.li
                      key={reason._key}
                      initial={{opacity: 0, x: -16}}
                      whileInView={{opacity: 1, x: 0}}
                      viewport={{once: true}}
                      transition={{duration: 0.45, delay: 0.15 + i * 0.07, ease: 'easeOut'}}
                      className="flex gap-4"
                    >
                      <div className="mt-0.5 shrink-0">
                        {hasIcon ? (
                          <Image
                            id={reason.icon!.asset!._ref}
                            alt={reason.title ?? ''}
                            width={24}
                            className="h-6 w-6 object-contain"
                          />
                        ) : (
                          <CheckCircle2 className="h-6 w-6 text-blue" />
                        )}
                      </div>

                      <div>
                        {reason.title && (
                          <p className={cn('font-semibold', isDark ? 'text-white' : 'text-gray-950')}>
                            {reason.title}
                          </p>
                        )}
                        {reason.description && (
                          <p
                            className={cn(
                              'mt-0.5 text-sm leading-relaxed',
                              isDark ? 'text-gray-400' : 'text-gray-500',
                            )}
                          >
                            {reason.description}
                          </p>
                        )}
                      </div>
                    </motion.li>
                  )
                })}
              </ul>
            )}

            {hasButton && (
              <motion.div
                initial={{opacity: 0, y: 12}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: 0.2 + reasons.length * 0.07}}
                className="mt-8"
              >
                <ResolvedLink
                  link={button!.link as unknown as DereferencedLink}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  {button!.buttonText}
                </ResolvedLink>
              </motion.div>
            )}
          </div>

          {/* Image column */}
          {hasImage && (
            <motion.div
              initial={{opacity: 0, scale: 0.97}}
              whileInView={{opacity: 1, scale: 1}}
              viewport={{once: true}}
              transition={{duration: 0.6, ease: 'easeOut'}}
              className={cn('relative overflow-hidden rounded-2xl', imgLeft && 'lg:order-1')}
            >
              <Image
                id={image!.asset!._ref}
                alt={image?.alt ?? ''}
                width={680}
                crop={image?.crop ?? undefined}
                hotspot={image?.hotspot ?? undefined}
                mode="cover"
                className="h-full max-h-140 w-full object-cover"
              />
              <div className="absolute bottom-0 left-0 h-1 w-24 bg-blue" />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
