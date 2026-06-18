import {describe, expect, it} from 'vitest'

// NOTE: scripts/onboard-client.mjs does NOT export its pure helpers, and the
// module runs top-level code (env loading + Sanity HTTP calls / process.exit on
// missing config) the moment it's imported, so importing it here is unsafe.
// Per the task brief, the small pure functions below are REPLICATED verbatim
// from scripts/onboard-client.mjs so the parsing/filtering logic stays tested.
// If these helpers are ever exported, switch to importing them instead.

// ─── Replicated from scripts/onboard-client.mjs ──────────────────────────────
const ALLOWED_SERVICE_ICONS = new Set([
  'PaintRoller',
  'Paintbrush',
  'PaintBucket',
  'Palette',
  'Brush',
  'SprayCan',
  'Ruler',
  'Layers',
  'Sparkles',
  'Home',
  'Building2',
])

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_ALIASES: Record<string, string> = {
  mo: 'Monday',
  mon: 'Monday',
  monday: 'Monday',
  tu: 'Tuesday',
  tue: 'Tuesday',
  tues: 'Tuesday',
  tuesday: 'Tuesday',
  we: 'Wednesday',
  wed: 'Wednesday',
  weds: 'Wednesday',
  wednesday: 'Wednesday',
  th: 'Thursday',
  thu: 'Thursday',
  thur: 'Thursday',
  thurs: 'Thursday',
  thursday: 'Thursday',
  fr: 'Friday',
  fri: 'Friday',
  friday: 'Friday',
  sa: 'Saturday',
  sat: 'Saturday',
  saturday: 'Saturday',
  su: 'Sunday',
  sun: 'Sunday',
  sunday: 'Sunday',
}

function normaliseTime(t: string): string | null {
  const s = t.trim().toLowerCase()
  let m = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/)
  if (m) {
    let h = parseInt(m[1], 10)
    if (m[3] === 'pm' && h < 12) h += 12
    if (m[3] === 'am' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${m[2]}`
  }
  m = s.match(/^(\d{1,2})\s*(am|pm)$/)
  if (m) {
    let h = parseInt(m[1], 10)
    if (m[2] === 'pm' && h < 12) h += 12
    if (m[2] === 'am' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:00`
  }
  return null
}

function parseOpeningHours(str: unknown, i: number) {
  if (typeof str !== 'string') return null
  const timeMatch = str.match(
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–—to]+\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
  )
  if (!timeMatch) return null
  const opens = normaliseTime(timeMatch[1])
  const closes = normaliseTime(timeMatch[2])
  if (!opens || !closes) return null

  const dayPart = str.slice(0, timeMatch.index).trim()
  const days: string[] = []
  for (const chunk of dayPart
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)) {
    const range = chunk.split(/[-–—]/).map((c) => c.trim().toLowerCase())
    if (range.length === 2 && DAY_ALIASES[range[0]] && DAY_ALIASES[range[1]]) {
      const start = DAY_ORDER.indexOf(DAY_ALIASES[range[0]])
      const end = DAY_ORDER.indexOf(DAY_ALIASES[range[1]])
      if (start !== -1 && end !== -1) {
        for (let d = start; d <= end; d++) days.push(DAY_ORDER[d])
        continue
      }
    }
    const single = DAY_ALIASES[chunk.toLowerCase()]
    if (single) days.push(single)
  }
  if (!days.length) return null
  return {_type: 'openingHoursSpec', _key: `oh-${i}`, dayOfWeek: days, opens, closes}
}
// ─── end replicated block ────────────────────────────────────────────────────

describe('parseOpeningHours (replicated from scripts/onboard-client.mjs)', () => {
  it('parses a weekday range with 24h times: "Mo-Fr 08:00-18:00"', () => {
    expect(parseOpeningHours('Mo-Fr 08:00-18:00', 0)).toEqual({
      _type: 'openingHoursSpec',
      _key: 'oh-0',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '18:00',
    })
  })

  it('parses a single day with am/pm times: "Sat 9am-1pm"', () => {
    expect(parseOpeningHours('Sat 9am-1pm', 1)).toEqual({
      _type: 'openingHoursSpec',
      _key: 'oh-1',
      dayOfWeek: ['Saturday'],
      opens: '09:00',
      closes: '13:00',
    })
  })

  it('returns null for a garbage string', () => {
    expect(parseOpeningHours('open whenever we feel like it', 2)).toBeNull()
  })

  it('returns null for a non-string input', () => {
    expect(parseOpeningHours(undefined, 0)).toBeNull()
    expect(parseOpeningHours(42, 0)).toBeNull()
  })

  it('returns null when times are present but no recognisable day', () => {
    expect(parseOpeningHours('Funday 08:00-18:00', 0)).toBeNull()
  })

  it('handles 12am/12pm boundary conversion', () => {
    expect(parseOpeningHours('Sun 12am-12pm', 0)).toMatchObject({opens: '00:00', closes: '12:00'})
  })
})

describe('ALLOWED_SERVICE_ICONS filter (replicated from scripts/onboard-client.mjs)', () => {
  // Mirrors the source guard: `svc.icon && ALLOWED_SERVICE_ICONS.has(svc.icon)`.
  const keepIcon = (icon?: string) => Boolean(icon && ALLOWED_SERVICE_ICONS.has(icon))

  it('keeps on-list icon values', () => {
    expect(keepIcon('PaintRoller')).toBe(true)
    expect(keepIcon('Building2')).toBe(true)
    expect(keepIcon('Sparkles')).toBe(true)
  })

  it('drops off-list icon values', () => {
    expect(keepIcon('Wrench')).toBe(false)
    expect(keepIcon('NotARealIcon')).toBe(false)
  })

  it('is case-sensitive (drops wrong casing)', () => {
    expect(keepIcon('paintroller')).toBe(false)
  })

  it('drops empty / missing icon', () => {
    expect(keepIcon('')).toBe(false)
    expect(keepIcon(undefined)).toBe(false)
  })
})
