'use client'

import {useState} from 'react'
import {stegaClean} from '@sanity/client/stega'
import {AnimatePresence, motion} from 'framer-motion'
import {ChevronDown} from 'lucide-react'
import type {PortableTextBlock} from 'next-sanity'

import PortableText from '@/app/components/PortableText'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

/** A · Centred interactive accordion (first item open). */
export default function FaqAccordion({
  block,
}: {
  block: ExtractPageBuilderType<'faq'>
}) {
  const {eyebrow, heading} = block
  const items = block.items ?? []
  const dark = stegaClean(block.theme) === 'dark'
  const [open, setOpen] = useState(0)

  const ink = dark ? 'text-white' : 'text-gray-950'
  const card = dark ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-white'
  const line = dark ? 'border-white/10' : 'border-gray-200'

  if (items.length === 0) return null

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-white')}>
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <div className="mb-9 text-center">
            {eyebrow && (
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-deep">
                {eyebrow}
              </span>
            )}
            {heading && (
              <h2 className={cn('mt-2 text-balance text-3xl font-extrabold tracking-tight md:text-4xl', ink)}>
                {heading}
              </h2>
            )}
          </div>

          <div className={cn('overflow-hidden rounded-2xl border shadow-sm', card, line)}>
            {items.map((item, i) => {
              const isOpen = open === i
              return (
                <div key={item._key} className={cn(i > 0 && cn('border-t', line))}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className={cn('text-base font-bold sm:text-lg', isOpen ? 'text-brand' : ink)}>
                      {item.question}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-5 w-5 shrink-0 text-brand transition-transform duration-300',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && item.answer && (
                      <motion.div
                        key="answer"
                        initial={{height: 0, opacity: 0}}
                        animate={{height: 'auto', opacity: 1}}
                        exit={{height: 0, opacity: 0}}
                        transition={{duration: 0.25, ease: 'easeInOut'}}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5">
                          <PortableText
                            value={item.answer as PortableTextBlock[]}
                            className={cn('text-sm leading-relaxed', dark && 'prose-invert')}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
