'use client'

import {stegaClean} from '@sanity/client/stega'
import {motion} from 'framer-motion'
import {ArrowRight} from 'lucide-react'

import ResolvedLink from '@/app/components/ResolvedLink'
import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

type ServiceCardsProps = {
  block: ExtractPageBuilderType<'serviceCards'>
  index: number
  pageType: string
  pageId: string
}

const colClass: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export default function ServiceCards({block}: ServiceCardsProps) {
  const {eyebrow, heading, subheading, theme, columns} = block
  const cards = block.cards ?? []

  const isDark = stegaClean(theme) === 'dark'
  const cols = stegaClean(columns) ?? 3
  const gridCols = colClass[cols] ?? colClass[3]

  return (
    <section id='services' className={cn('py-20 sm:py-28', isDark ? 'bg-gray-950' : 'bg-white')}>
      <div className="container" >
        {/* Header */}
        {(eyebrow || heading || subheading) && (
          <div className="mb-14 max-w-2xl">
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
          </div>
        )}

        {/* Grid */}
        {cards.length > 0 && (
          <div  className={cn('grid gap-6', gridCols)}>
            {cards.map((card, i) => {
              const hasImage = Boolean(card.image?.asset?._ref)
              const hasButton = Boolean(card.button?.buttonText && card.button?.link)

              return (
                <motion.div
                  key={card._key}
                  initial={{opacity: 0, y: 28}}
                  whileInView={{opacity: 1, y: 0}}
                  viewport={{once: true, margin: '-60px'}}
                  transition={{duration: 0.5, delay: i * 0.08, ease: 'easeOut'}}
                  className={cn(
                    'group flex flex-col overflow-hidden rounded-2xl border transition-shadow duration-300 hover:shadow-lg',
                    isDark
                      ? 'border-white/8 bg-gray-900 hover:shadow-black/40'
                      : 'border-gray-100 bg-white hover:shadow-gray-100',
                  )}
                >
                  {/* Image */}
                  {hasImage && (
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        id={card.image!.asset!._ref}
                        alt={card.image?.alt ?? card.title ?? ''}
                        width={600}
                        crop={card.image?.crop ?? undefined}
                        hotspot={card.image?.hotspot ?? undefined}
                        mode="cover"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    {card.title && (
                      <h3
                        className={cn(
                          'text-lg font-semibold',
                          isDark ? 'text-white' : 'text-gray-950',
                        )}
                      >
                        {card.title}
                      </h3>
                    )}
                    {card.description && (
                      <p
                        className={cn(
                          'flex-1 text-sm leading-relaxed',
                          isDark ? 'text-gray-400' : 'text-gray-600',
                        )}
                      >
                        {card.description}
                      </p>
                    )}

                    {hasButton && (
                      <div className="mt-2">
                        <ResolvedLink
                          link={card.button!.link as unknown as DereferencedLink}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-deep transition-gap hover:gap-2.5"
                        >
                          {card.button!.buttonText}
                          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </ResolvedLink>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
