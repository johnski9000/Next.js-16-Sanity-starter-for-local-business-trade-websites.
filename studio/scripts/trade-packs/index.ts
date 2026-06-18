/**
 * Trade-pack registry.
 *
 * The seed scripts (seed-dev.ts, seed-site.ts) call `getPack(process.env.SEED_TRADE)`
 * to resolve the per-trade content for the current build. Add a new trade by
 * authoring a `<trade>.ts` pack and registering it in PACKS below.
 */
import type {TradePack} from './types'
import {plumber} from './plumber'
import {electrician} from './electrician'

export type {TradePack} from './types'

// Trade content packs — the seed copy/services for one trade vertical. The look
// (colour + layout) is a SEPARATE axis: the design presets in
// frontend/lib/themes.ts are applied per build via NEXT_PUBLIC_DESIGN. Any trade
// can wear any design. Add a vertical by authoring a `<trade>.ts` pack and
// registering it below; packs fall back to the plumber seed image set.
export const PACKS: Record<string, TradePack> = {
  plumber,
  electrician,
}

/**
 * Resolve a trade pack by name. UNSET → defaults to "plumber". An EXPLICITLY-SET
 * but unknown trade THROWS rather than silently seeding the wrong content set.
 */
export function getPack(trade?: string): TradePack {
  const key = (trade ?? '').trim()
  if (!key) return PACKS.plumber
  const pack = PACKS[key]
  if (!pack) {
    throw new Error(
      `Unknown trade pack "${trade}". Known packs: ${Object.keys(PACKS).join(', ')}. ` +
        `Set SEED_TRADE to a known pack, or leave it unset to default to "plumber".`,
    )
  }
  return pack
}
