import {
  Award,
  BadgeCheck,
  Clock,
  Leaf,
  ShieldCheck,
  Star,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react'

import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

/**
 * Shared building blocks for the Trust Bar variants. Icons are lucide (the app's
 * icon library — no second icon system); types are derived from the generated
 * trustBar block shape so every variant stays in sync with the GROQ projection.
 */
type TrustBarBlock = ExtractPageBuilderType<'trustBar'>
export type TrustData = NonNullable<TrustBarBlock['trust']>
export type Rating = NonNullable<TrustData['rating']>
export type Platform = NonNullable<TrustData['platforms']>[number]
export type Accreditation = NonNullable<TrustData['accreditations']>[number]
export type PressItem = NonNullable<TrustData['press']>[number]
export type Stat = NonNullable<TrustData['stat']>

export const TRUST_ICONS: Record<string, LucideIcon> = {
  Award,
  BadgeCheck,
  Clock,
  Leaf,
  ShieldCheck,
  Star,
  Tag,
  Users,
}

/** Resolve an accreditation icon key to a lucide component (ShieldCheck fallback). */
export function trustIcon(key?: string | null): LucideIcon {
  return (key && TRUST_ICONS[key]) || ShieldCheck
}

/** Locale-formatted integer, e.g. 2400 -> "2,400". */
export function fmtCount(n: number): string {
  return new Intl.NumberFormat('en-GB').format(n)
}

/** Five gold stars — gold is the universal rating colour, not a per-tenant token. */
export function Stars({size = 18, className}: {size?: number; className?: string}) {
  return (
    <span className={cn('inline-flex gap-0.5', className)} aria-hidden="true">
      {Array.from({length: 5}).map((_, i) => (
        <Star key={i} size={size} className="fill-amber-400 text-amber-400" />
      ))}
    </span>
  )
}
