'use client'

import {stegaClean} from '@sanity/client/stega'
import {motion} from 'framer-motion'
import {
  ArrowRight,
  Bath,
  Building2,
  CheckCircle2,
  Droplet,
  Fan,
  Flame,
  Hammer,
  Home,
  Leaf,
  PaintBucket,
  PaintRoller,
  Paintbrush,
  Plug,
  Ruler,
  ShieldCheck,
  Siren,
  Sparkles,
  Thermometer,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import ResolvedLink from '@/app/components/ResolvedLink'
import {cn} from '@/lib/utils'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

type MainServiceGridProps = {
  block: ExtractPageBuilderType<'mainServiceGrid'>
  index: number
  pageType: string
  pageId: string
}

const ICON_MAP: Record<string, LucideIcon> = {
  Wrench,
  Hammer,
  Flame,
  Droplet,
  Zap,
  Thermometer,
  ShieldCheck,
  Siren,
  Bath,
  Home,
  Building2,
  Paintbrush,
  PaintRoller,
  PaintBucket,
  Ruler,
  Sparkles,
  Plug,
  Fan,
  Leaf,
  Truck,
}

const colClass: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export default function MainServiceGrid({block}: MainServiceGridProps) {
  const {eyebrow, heading, subheading, theme, columns} = block
  const items = block.items ?? []

  const isDark = stegaClean(theme) === 'dark'
  const cols = stegaClean(columns) ?? 3
  const gridCols = colClass[cols] ?? colClass[3]

  return (
    <section className={cn('py-20 sm:py-28', isDark ? 'bg-gray-950' : 'bg-white')}>
      <div className="container">
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
              className={cn('text-3xl font-semibold md:text-4xl', isDark ? 'text-white' : 'text-gray-950')}
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
              className={cn('mt-3 text-base leading-relaxed', isDark ? 'text-gray-400' : 'text-gray-600')}
            >
              {subheading}
            </motion.p>
          )}
        </div>

        {items.length > 0 && (
          <div  className={cn('grid gap-6', gridCols)}>
            {items.map((item, i) => {
              const iconName = stegaClean(item.icon) ?? 'Wrench'
              const Icon = ICON_MAP[iconName] ?? Wrench
              const hasCta = Boolean(item.cta?.buttonText && item.cta?.link)

              return (
                <motion.div
                  key={item._key}
                  initial={{opacity: 0, y: 28}}
                  whileInView={{opacity: 1, y: 0}}
                  viewport={{once: true, margin: '-60px'}}
                  transition={{duration: 0.5, delay: i * 0.08, ease: 'easeOut'}}
                  className={cn(
                    'group flex flex-col rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
                    isDark
                      ? 'border-white/8 bg-gray-900 hover:border-brand/30 hover:shadow-black/40'
                      : 'border-gray-100 bg-white hover:border-brand/20 hover:shadow-gray-100',
                  )}
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10">
                    <Icon className="h-6 w-6 text-blue" />
                  </div>

                  {item.title && (
                    <h3 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-950')}>
                      {item.title}
                    </h3>
                  )}

                  {item.description && (
                    <p
                      className={cn(
                        'mt-2 flex-1 text-sm leading-relaxed',
                        isDark ? 'text-gray-400' : 'text-gray-600',
                      )}
                    >
                      {item.description}
                    </p>
                  )}

                  {item.bullets && item.bullets.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {item.bullets.map((bullet, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                          <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                            {bullet}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {hasCta && (
                    <div
                      className={cn(
                        'mt-5 border-t pt-4',
                        isDark ? 'border-white/8' : 'border-gray-100',
                      )}
                    >
                      <ResolvedLink
                        link={item.cta!.link as unknown as DereferencedLink}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-deep transition-all hover:gap-2.5"
                      >
                        {item.cta!.buttonText}
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </ResolvedLink>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
