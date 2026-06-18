'use client'

import {useState} from 'react'

import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'

import {type PressItem} from './TrustPrimitives'

/** D · "As featured in" press logos. Greyscale until hovered. */
export default function FeaturedIn({
  press,
  heading,
  dark,
}: {
  press: PressItem[]
  heading?: string
  dark: boolean
}) {
  const soft = dark ? 'text-gray-400' : 'text-gray-500'
  const [hover, setHover] = useState<number | null>(null)

  return (
    <div className="flex flex-col items-center gap-5">
      <Reveal className={cn('text-xs font-bold uppercase tracking-widest', soft)} as="span">
        {heading || 'As featured in'}
      </Reveal>
      <RevealGroup className="flex flex-wrap items-center justify-center gap-9" as="div">
        {press.map((p, i) => {
          const hasLogo = Boolean(p.logo?.asset?._ref)
          return (
            <RevealItem key={i} as="span">
              <span
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                className={cn(
                  'transition-all duration-200',
                  hover === i ? 'opacity-100 grayscale-0' : 'opacity-70 grayscale',
                )}
              >
                {hasLogo ? (
                  <Image
                    id={p.logo!.asset!._ref}
                    alt={p.logo?.alt ?? p.name ?? ''}
                    width={180}
                    height={48}
                    mode="contain"
                    className="h-7 w-auto object-contain"
                  />
                ) : (
                  <span className={cn('text-lg font-semibold', soft)}>{p.name}</span>
                )}
              </span>
            </RevealItem>
          )
        })}
      </RevealGroup>
    </div>
  )
}
