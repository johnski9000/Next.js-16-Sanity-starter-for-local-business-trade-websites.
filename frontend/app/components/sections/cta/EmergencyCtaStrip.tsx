'use client'

import {stegaClean} from '@sanity/client/stega'
import {motion} from 'framer-motion'
import {Phone} from 'lucide-react'

import ResolvedLink from '@/app/components/ResolvedLink'
import {cn} from '@/lib/utils'
import {DereferencedLink, ExtractPageBuilderType} from '@/sanity/lib/types'

type EmergencyCtaStripProps = {
  block: ExtractPageBuilderType<'emergencyCtaStrip'>
  index: number
  pageType: string
  pageId: string
}

export default function EmergencyCtaStrip({block}: EmergencyCtaStripProps) {
  const {heading, subheading, phoneNumber, button, theme} = block

  const isBrand = stegaClean(theme) !== 'dark' && stegaClean(theme) !== 'light'
  const isDark = stegaClean(theme) === 'dark'

  const sectionBg = isBrand ? 'bg-brand' : isDark ? 'bg-gray-950' : 'bg-gray-50'
  const headingColor = isBrand || isDark ? 'text-white' : 'text-gray-950'
  const subColor = isBrand ? 'text-white/75' : isDark ? 'text-gray-400' : 'text-gray-600'
  const dividerColor = isBrand ? 'border-white/20' : isDark ? 'border-white/10' : 'border-gray-200'

  return (
    <section className={cn('relative overflow-hidden', sectionBg)}>
      {isBrand && (
        <div className="absolute inset-0 bg-[url(/images/tile-1-white.png)] bg-size-[5px] opacity-10" />
      )}

      <div className="container relative py-10 sm:py-12">
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
          {/* Text */}
          <motion.div
            initial={{opacity: 0, x: -16}}
            whileInView={{opacity: 1, x: 0}}
            viewport={{once: true}}
            transition={{duration: 0.5, ease: 'easeOut'}}
            className="flex items-center gap-4"
          >
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                isBrand || isDark ? 'bg-white/10' : 'bg-brand/10',
              )}
            >
              <Phone
                className={cn('h-5 w-5', isBrand || isDark ? 'text-white' : 'text-brand')}
              />
            </div>
            <div>
              {heading && (
                <p className={cn('font-semibold leading-tight', headingColor)}>{heading}</p>
              )}
              {subheading && (
                <p className={cn('text-sm', subColor)}>{subheading}</p>
              )}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{opacity: 0, x: 16}}
            whileInView={{opacity: 1, x: 0}}
            viewport={{once: true}}
            transition={{duration: 0.5, delay: 0.08, ease: 'easeOut'}}
            className={cn(
              'flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center',
              phoneNumber && button?.buttonText && ['sm:gap-4 sm:pl-4 sm:border-l', dividerColor],
            )}
          >
            {phoneNumber && (
              <a
                href={`tel:${phoneNumber.replace(/\s/g, '')}`}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold tracking-wide transition-all',
                  isBrand
                    ? 'bg-white text-brand hover:bg-white/90'
                    : isDark
                      ? 'bg-white text-gray-950 hover:bg-gray-100'
                      : 'bg-brand text-white hover:opacity-90',
                )}
              >
                <Phone className="h-4 w-4" />
                {phoneNumber}
              </a>
            )}

            {button?.buttonText && button?.link && (
              <ResolvedLink
                link={button.link as unknown as DereferencedLink}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold transition-colors',
                  isBrand || isDark
                    ? 'border-white/30 text-white hover:bg-white/10'
                    : 'border-gray-300 text-gray-800 hover:bg-gray-100',
                )}
              >
                {button.buttonText}
              </ResolvedLink>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
