'use client'

import {stegaClean} from '@sanity/client/stega'
import {motion} from 'framer-motion'

import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'

type GalleryImage = {
  _key: string
  asset?: {_ref: string}
  alt?: string
  caption?: string
  crop?: unknown
  hotspot?: unknown
}

type GalleryProps = {
  block: {
    eyebrow?: string
    heading?: string
    subheading?: string
    images?: GalleryImage[]
    columns?: number
    theme?: string
  }
}

const colClass: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export default function Gallery({block}: GalleryProps) {
  const {eyebrow, heading, subheading, images = [], theme, columns} = block

  const isDark = stegaClean(theme) === 'dark'
  const cols = stegaClean(columns) ?? 3
  const gridCols = colClass[cols] ?? colClass[3]

  return (
    <section className={cn('py-20 sm:py-28', isDark ? 'bg-gray-950' : 'bg-white')}>
      <div className="container">
        {(eyebrow || heading || subheading) && (
          <div className="mb-12 max-w-2xl">
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
                  isDark ? 'text-gray-400' : 'text-neutral',
                )}
              >
                {subheading}
              </motion.p>
            )}
          </div>
        )}

        {images.length > 0 && (
          <div className={cn('grid gap-4', gridCols)}>
            {images.map((img, i) => {
              if (!img.asset?._ref) return null
              return (
                <motion.figure
                  key={img._key}
                  initial={{opacity: 0, y: 24}}
                  whileInView={{opacity: 1, y: 0}}
                  viewport={{once: true, margin: '-60px'}}
                  transition={{duration: 0.5, delay: (i % 6) * 0.06, ease: 'easeOut'}}
                  className="group relative overflow-hidden rounded-2xl"
                >
                  <Image
                    id={img.asset._ref}
                    alt={img.alt ?? ''}
                    width={800}
                    crop={(img.crop as never) ?? undefined}
                    hotspot={(img.hotspot as never) ?? undefined}
                    mode="cover"
                    className="aspect-[4/3] h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {img.caption && (
                    <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-brand/90 to-transparent p-4 text-sm font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      {img.caption}
                    </figcaption>
                  )}
                </motion.figure>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
