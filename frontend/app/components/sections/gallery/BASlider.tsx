'use client'

import {useState} from 'react'

import Image from '@/app/components/SanityImage'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

export type BAItem = NonNullable<ExtractPageBuilderType<'beforeAfter'>['items']>[number]

/**
 * Draggable before/after comparison — fills its parent (wrap in an aspect box).
 * Shared by all before/after gallery variants.
 */
export function BASlider({item, start = 50}: {item: BAItem; start?: number}) {
  const [pos, setPos] = useState(start)
  const before = item.beforeImage
  const after = item.afterImage

  if (!before?.asset?._ref || !after?.asset?._ref) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted text-sm font-medium text-muted-foreground">
        Add before &amp; after images
      </div>
    )
  }

  return (
    <div className="group relative h-full w-full select-none overflow-hidden">
      {/* After (base) */}
      <Image
        id={after.asset._ref}
        alt={after.alt ?? item.title ?? 'After'}
        width={1200}
        crop={after.crop ?? undefined}
        hotspot={after.hotspot ?? undefined}
        mode="cover"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Before (clipped overlay) */}
      <div className="absolute inset-0 overflow-hidden" style={{clipPath: `inset(0 ${100 - pos}% 0 0)`}}>
        <Image
          id={before.asset._ref}
          alt={before.alt ?? item.title ?? 'Before'}
          width={1200}
          crop={before.crop ?? undefined}
          hotspot={before.hotspot ?? undefined}
          mode="cover"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-brand/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
        Before
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-blue/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
        After
      </span>

      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
        style={{left: `${pos}%`}}
      >
        <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand shadow-md">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7l-5 5 5 5M15 7l5 5-5 5" />
          </svg>
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`Reveal before and after for ${item.title ?? 'this project'}`}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  )
}
