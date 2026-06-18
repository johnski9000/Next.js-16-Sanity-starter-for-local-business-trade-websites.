'use client'

import {stegaClean} from '@sanity/client/stega'
import {motion} from 'framer-motion'
import {ArrowRight, CheckCircle2} from 'lucide-react'
import type {PortableTextBlock} from 'next-sanity'

import PortableText from '@/app/components/PortableText'
import ResolvedLink from '@/app/components/ResolvedLink'
import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

/** Split variant — copy + stats/checklist + optional side image (existing layout). */
export default function IntroSplit({
  block,
}: {
  block: ExtractPageBuilderType<'introOverviewSection'>
}) {
  const {eyebrow, heading, body, stats = [], checklist = [], cta, secondaryCta, image, theme, imageAlignment} = block

  const isDark = stegaClean(theme) === 'dark'
  const imgLeft = stegaClean(imageAlignment) === 'left'
  const hasImage = Boolean(image?.asset?._ref)
  const hasCta = Boolean(cta?.buttonText && cta?.link)
  const hasSecondaryCta = Boolean(secondaryCta?.buttonText && secondaryCta?.link)

  return (
    <section className={cn('py-20 sm:py-28', isDark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">
        <div className={cn('grid items-center gap-12', hasImage ? 'lg:grid-cols-2' : 'max-w-3xl')}>
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
                className={cn('text-3xl font-semibold md:text-4xl', isDark ? 'text-white' : 'text-gray-950')}
              >
                {heading}
              </motion.h2>
            )}

            {body && (
              <motion.div
                initial={{opacity: 0, y: 16}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.55, delay: 0.1}}
                className="mt-4"
              >
                <PortableText
                  value={body as PortableTextBlock[]}
                  className={cn('text-base leading-relaxed', isDark ? 'prose-invert text-gray-400' : 'text-gray-600')}
                />
              </motion.div>
            )}

            {stats.length > 0 && (
              <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: 0.15}}
                className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3"
              >
                {stats.map((stat) => (
                  <div
                    key={stat._key}
                    className={cn(
                      'rounded-xl p-4',
                      isDark ? 'border border-white/8 bg-gray-900' : 'border border-gray-100 bg-white shadow-sm',
                    )}
                  >
                    <p className="text-2xl font-bold text-blue-deep">{stat.value}</p>
                    <p className={cn('mt-0.5 text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {checklist.length > 0 && (
              <ul className="mt-8 space-y-3">
                {checklist.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{opacity: 0, x: -14}}
                    whileInView={{opacity: 1, x: 0}}
                    viewport={{once: true}}
                    transition={{duration: 0.4, delay: 0.2 + i * 0.06, ease: 'easeOut'}}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                    <span className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>{item}</span>
                  </motion.li>
                ))}
              </ul>
            )}

            {(hasCta || hasSecondaryCta) && (
              <motion.div
                initial={{opacity: 0, y: 12}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.5, delay: 0.3}}
                className="mt-8 flex flex-wrap gap-3"
              >
                {hasCta && (
                  <ResolvedLink
                    link={cta!.link as unknown as DereferencedLink}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                  >
                    {cta!.buttonText}
                    <ArrowRight className="h-4 w-4" />
                  </ResolvedLink>
                )}
                {hasSecondaryCta && (
                  <ResolvedLink
                    link={secondaryCta!.link as unknown as DereferencedLink}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold transition-colors',
                      isDark ? 'border-white/20 text-white hover:bg-white/5' : 'border-gray-200 text-gray-900 hover:bg-gray-100',
                    )}
                  >
                    {secondaryCta!.buttonText}
                  </ResolvedLink>
                )}
              </motion.div>
            )}
          </div>

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
                className="h-full max-h-128 w-full object-cover"
              />
              <div className="absolute bottom-0 left-0 h-1 w-24 bg-blue" />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
