'use client'

import {stegaClean} from '@sanity/client/stega'
import {motion} from 'framer-motion'

import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

import {processIcon} from './processIcons'

/** Grid variant — icon circles with step-number badges + a connector line. */
export default function ProcessGrid({
  block,
}: {
  block: ExtractPageBuilderType<'processSection'>
}) {
  const {eyebrow, heading, subheading, steps = [], theme} = block

  const isDark = stegaClean(theme) === 'dark'
  const count = steps.length

  return (
    <section className={cn('py-20 sm:py-28', isDark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">
        <div className="mb-16 text-center">
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
              className={cn(
                'mx-auto mt-3 max-w-xl text-base leading-relaxed',
                isDark ? 'text-gray-400' : 'text-gray-600',
              )}
            >
              {subheading}
            </motion.p>
          )}
        </div>

        {steps.length > 0 && (
          <div className="relative">
            <div
              aria-hidden
              className={cn(
                'absolute inset-x-[6%] top-9 hidden h-px lg:block',
                isDark ? 'bg-white/10' : 'bg-gray-200',
              )}
            />

            <ol
              className={cn(
                'relative grid gap-10 sm:gap-8',
                count === 3 && 'lg:grid-cols-3',
                count === 4 && 'lg:grid-cols-4',
                count === 5 && 'lg:grid-cols-5',
              )}
            >
              {steps.map((step, i) => {
                const Icon = processIcon(step.icon)

                return (
                  <motion.li
                    key={step._key}
                    initial={{opacity: 0, y: 24}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true, margin: '-40px'}}
                    transition={{duration: 0.5, delay: i * 0.1, ease: 'easeOut'}}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="relative z-10 mb-6">
                      <div
                        className={cn(
                          'flex h-18 w-18 items-center justify-center rounded-2xl border-2 border-brand shadow-md',
                          isDark ? 'bg-gray-900' : 'bg-white',
                        )}
                      >
                        <Icon className="h-7 w-7 text-blue" />
                      </div>
                      <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white ring-2 ring-white">
                        {i + 1}
                      </span>
                    </div>

                    {step.title && (
                      <h3 className={cn('text-base font-semibold', isDark ? 'text-white' : 'text-gray-950')}>
                        {step.title}
                      </h3>
                    )}
                    {step.description && (
                      <p
                        className={cn(
                          'mt-2 max-w-[16rem] text-sm leading-relaxed',
                          isDark ? 'text-gray-400' : 'text-gray-600',
                        )}
                      >
                        {step.description}
                      </p>
                    )}
                  </motion.li>
                )
              })}
            </ol>
          </div>
        )}
      </div>
    </section>
  )
}
