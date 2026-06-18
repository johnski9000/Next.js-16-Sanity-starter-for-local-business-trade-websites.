'use client'

import {useState} from 'react'
import {stegaClean} from '@sanity/client/stega'
import {AnimatePresence, motion} from 'framer-motion'
import {ChevronDown} from 'lucide-react'
import type {PortableTextBlock} from 'next-sanity'

import PortableText from '@/app/components/PortableText'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

import FaqAccordion from './FaqAccordion'
import FaqGrid from './FaqGrid'

// ---------------------------------------------------------------------------
// FAQView — presentational core, accepts string OR portable-text answers.
// Used directly by typed-doc pages (service, area) and static hubs
// (/services, /areas) where the FAQ data isn't a page-builder block.
// ---------------------------------------------------------------------------

export type FAQViewItem = {
  key?: string
  question?: string | null
  // Accept the auto-generated Sanity query result shape (which is structurally
  // a `PortableTextBlock[]` but typed loosely with optional children) OR a
  // plain string (legacy/page-builder usage). FAQView strips down to `unknown[]`
  // and the PortableText component handles the actual shape at render.
  answer?: string | unknown[] | null
}

type FAQViewProps = {
  eyebrow?: string
  heading?: string
  subheading?: string
  theme?: 'light' | 'dark'
  items: FAQViewItem[]
  className?: string
}

export function FAQView({
  eyebrow,
  heading,
  subheading,
  theme = 'light',
  items,
  className,
}: FAQViewProps) {
  const isDark = theme === 'dark'
  const [openKey, setOpenKey] = useState<string | null>(null)

  if (items.length === 0) return null

  return (
    <section className={cn('py-20 sm:py-28', isDark ? 'bg-gray-950' : 'bg-white', className)}>
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
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
          </div>

          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.55, delay: 0.1}}
            className="lg:col-span-8"
          >
            <dl className={cn('divide-y', isDark ? 'divide-white/8' : 'divide-gray-100')}>
              {items.map((item, i) => {
                const key = item.key ?? `faq-${i}`
                const isOpen = openKey === key
                const isStringAnswer = typeof item.answer === 'string'

                return (
                  <div key={key}>
                    <dt>
                      <button
                        type="button"
                        onClick={() => setOpenKey(isOpen ? null : key)}
                        aria-expanded={isOpen}
                        className={cn(
                          'flex w-full items-center justify-between gap-4 py-5 text-left',
                          isDark ? 'text-white' : 'text-gray-950',
                        )}
                      >
                        <span className="text-base font-medium">{item.question}</span>
                        <ChevronDown
                          className={cn(
                            'h-5 w-5 shrink-0 transition-transform duration-300',
                            isDark ? 'text-gray-400' : 'text-gray-400',
                            isOpen && 'rotate-180 text-blue',
                          )}
                        />
                      </button>
                    </dt>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.dd
                          key="answer"
                          initial={{height: 0, opacity: 0}}
                          animate={{height: 'auto', opacity: 1}}
                          exit={{height: 0, opacity: 0}}
                          transition={{duration: 0.25, ease: 'easeInOut'}}
                          className="overflow-hidden"
                        >
                          <div className="pb-5">
                            {item.answer && isStringAnswer && (
                              <p
                                className={cn(
                                  'text-sm leading-relaxed',
                                  isDark ? 'text-gray-400' : 'text-gray-600',
                                )}
                              >
                                {item.answer as string}
                              </p>
                            )}
                            {item.answer && !isStringAnswer && (
                              <PortableText
                                value={item.answer as PortableTextBlock[]}
                                className={cn(
                                  'text-sm leading-relaxed',
                                  isDark ? 'prose-invert' : '',
                                )}
                              />
                            )}
                          </div>
                        </motion.dd>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </dl>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Default export — page-builder block wrapper around FAQView.
// ---------------------------------------------------------------------------

type FAQProps = {
  block: ExtractPageBuilderType<'faq'>
  index: number
  pageType: string
  pageId: string
}

export default function FAQ({block}: FAQProps) {
  const variant = stegaClean(block.variant) || 'split'
  if (variant === 'accordion') return <FaqAccordion block={block} />
  if (variant === 'grid') return <FaqGrid block={block} />

  const {eyebrow, heading, subheading, theme} = block
  const items = block.items ?? []

  return (
    <FAQView
      eyebrow={eyebrow ?? undefined}
      heading={heading ?? undefined}
      subheading={subheading ?? undefined}
      theme={stegaClean(theme) === 'dark' ? 'dark' : 'light'}
      items={items.map((i) => ({
        key: i._key,
        question: i.question,
        answer: i.answer as PortableTextBlock[] | undefined,
      }))}
    />
  )
}
