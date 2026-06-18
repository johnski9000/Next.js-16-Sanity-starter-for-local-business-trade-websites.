import {describe, expect, it} from 'vitest'

import {
  percentile,
  monthsBetween,
  parseQueryRows,
  parseQueryPageRows,
  primaryPageByQuery,
  ageForPath,
  provenCeiling,
  classifyCandidateKd,
  quickWins,
  reEvalCandidates,
  cannibalisation,
  internalLinkSuggestion,
} from './gsc-phase2-lib.mjs'

const NOW = '2026-06-16T00:00:00.000Z'

describe('percentile', () => {
  it('returns the single value for a 1-element array', () => {
    expect(percentile([42], 0.9)).toBe(42)
  })
  it('interpolates the 90th percentile', () => {
    // 11 evenly spaced values 0..100, p90 → index 9 → 90
    expect(percentile([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100], 0.9)).toBeCloseTo(90)
  })
  it('ignores non-numbers and empty input', () => {
    expect(percentile([], 0.5)).toBeNull()
    expect(percentile([NaN, null as unknown as number, 5], 0.5)).toBe(5)
  })
})

describe('monthsBetween', () => {
  it('computes ~months between two dates', () => {
    expect(monthsBetween('2025-12-16', '2026-06-16')).toBeCloseTo(6, 0)
  })
  it('returns null for unparseable input', () => {
    expect(monthsBetween('not-a-date', NOW)).toBeNull()
  })
})

describe('parsers', () => {
  it('parseQueryRows normalises keys + numbers', () => {
    const rows = parseQueryRows({rows: [{keys: ['Boiler Repair'], clicks: 2, impressions: 100, ctr: 0.02, position: 6.4}]})
    expect(rows).toEqual([{query: 'boiler repair', clicks: 2, impr: 100, ctr: 0.02, pos: 6.4}])
  })
  it('parseQueryPageRows extracts the pathname', () => {
    const rows = parseQueryPageRows({rows: [{keys: ['x', 'https://site.com/services/loft'], impressions: 10, position: 9}]})
    expect(rows[0].path).toBe('/services/loft')
  })
  it('primaryPageByQuery keeps the highest-impression page per query', () => {
    const m = primaryPageByQuery([
      {query: 'q', path: '/a', impr: 5, pos: 8},
      {query: 'q', path: '/b', impr: 20, pos: 12},
    ])
    expect(m.get('q')?.path).toBe('/b')
  })
})

describe('ageForPath', () => {
  it('falls back to the /services/<svc> prefix for combo pages', () => {
    const ages = {'/services/loft': '2025-01-01'}
    expect(ageForPath(ages, '/services/loft/altrincham')).toBe('2025-01-01')
    expect(ageForPath(ages, '/services/loft')).toBe('2025-01-01')
    expect(ageForPath(ages, '/areas/sale')).toBeNull()
  })
})

describe('provenCeiling', () => {
  it('returns null + a fallback note when too few proven top-7 queries', () => {
    const res = provenCeiling([{query: 'a', pos: 5, impr: 50, clicks: 1, ctr: 0}], {a: 20}, {minProven: 3})
    expect(res.ceiling).toBeNull()
    expect(res.note).toMatch(/Insufficient/)
  })
  it('computes a ceiling from the proven top-7 KDs', () => {
    const q = (query: string, pos: number) => ({query, pos, impr: 50, clicks: 1, ctr: 0})
    const rows = [q('a', 3), q('b', 5), q('c', 6), q('d', 2)]
    const kd = {a: 10, b: 20, c: 30, d: 40}
    const res = provenCeiling(rows, kd, {minProven: 3})
    expect(res.sampleSize).toBe(4)
    expect(res.ceiling).toBeGreaterThanOrEqual(30) // 90th pct of [10,20,30,40]
    expect(res.proven[0].kd).toBe(40) // sorted hardest-first
  })
  it('excludes queries with no KD reading', () => {
    const rows = [{query: 'a', pos: 4, impr: 9, clicks: 0, ctr: 0}]
    expect(provenCeiling(rows, {}, {minProven: 1}).sampleSize).toBe(0)
  })
})

describe('classifyCandidateKd', () => {
  it('buckets candidates against the ceiling', () => {
    expect(classifyCandidateKd(20, 30)).toBe('winnable')
    expect(classifyCandidateKd(35, 30)).toBe('stretch')
    expect(classifyCandidateKd(60, 30)).toBe('not-yet')
    expect(classifyCandidateKd(20, null)).toBe('unknown')
  })
})

describe('quickWins', () => {
  const queryPage = [
    {query: 'boiler service altrincham', path: '/services/boiler/altrincham', impr: 100, pos: 6, clicks: 1, ctr: 0.01},
    {query: 'phantom term', path: '/services/x', impr: 50, pos: 5, clicks: 0, ctr: 0},
    {query: 'fresh term', path: '/services/fresh', impr: 40, pos: 7, clicks: 0, ctr: 0},
  ]
  it('flags a real win as High when KD<30', () => {
    const rows = quickWins(
      [{query: 'boiler service altrincham', pos: 6, impr: 100, clicks: 1, ctr: 0.01}],
      queryPage, [], {'boiler service altrincham': 25}, {}, {now: NOW},
    )
    expect(rows[0].priority).toBe('High')
    expect(rows[0].phantom).toBe(false)
    expect(rows[0].page).toBe('/services/boiler/altrincham')
  })
  it('detects a phantom ranking via the main-country split and sorts it last', () => {
    const rows = quickWins(
      [
        {query: 'boiler service altrincham', pos: 6, impr: 100, clicks: 1, ctr: 0.01},
        {query: 'phantom term', pos: 5, impr: 50, clicks: 0, ctr: 0},
      ],
      queryPage,
      [{query: 'phantom term', country: 'gbr', pos: 40, impr: 50}],
      {'boiler service altrincham': 25, 'phantom term': 10},
      {}, {now: NOW},
    )
    const phantom = rows.find((r: {query: string; phantom: boolean}) => r.query === 'phantom term')
    expect(phantom?.phantom).toBe(true)
    expect(rows[rows.length - 1].query).toBe('phantom term') // sorted last
  })
  it('holds a page edited within the cooldown window', () => {
    const rows = quickWins(
      [{query: 'fresh term', pos: 7, impr: 40, clicks: 0, ctr: 0}],
      queryPage, [], {'fresh term': 20},
      {'/services/fresh': '2026-06-15T00:00:00.000Z'}, // 1 day before NOW
      {now: NOW, cooldownDays: 7},
    )
    expect(rows[0].cooldown).toBe(true)
    expect(rows[0].priority).toBe('Hold')
  })
})

describe('reEvalCandidates', () => {
  const queryPage = [
    {query: 'old stuck', path: '/services/loft', impr: 40, pos: 12, clicks: 0, ctr: 0},
    {query: 'fresh stuck', path: '/services/fresh', impr: 40, pos: 12, clicks: 0, ctr: 0},
  ]
  it('includes an old, winnable, stuck page', () => {
    const res = reEvalCandidates(
      [{query: 'old stuck', pos: 12, impr: 40, clicks: 0, ctr: 0}],
      queryPage, {'old stuck': 20}, {'/services/loft': '2025-09-01T00:00:00.000Z'}, {now: NOW},
    )
    expect(res).toHaveLength(1)
    expect(res[0].ageKnown).toBe(true)
    expect(res[0].action).toMatch(/Republish/)
  })
  it('excludes a too-fresh page', () => {
    const res = reEvalCandidates(
      [{query: 'fresh stuck', pos: 12, impr: 40, clicks: 0, ctr: 0}],
      queryPage, {'fresh stuck': 20}, {'/services/fresh': '2026-06-01T00:00:00.000Z'}, {now: NOW},
    )
    expect(res).toHaveLength(0)
  })
  it('excludes pages out of the Pos 8-25 band', () => {
    const res = reEvalCandidates(
      [{query: 'top', pos: 3, impr: 40, clicks: 0, ctr: 0}],
      [{query: 'top', path: '/services/loft', impr: 40, pos: 3, clicks: 0, ctr: 0}],
      {top: 20}, {}, {now: NOW},
    )
    expect(res).toHaveLength(0)
  })
})

describe('cannibalisation', () => {
  it('flags a query split across pages and names the best-positioned target', () => {
    const res = cannibalisation([
      {query: 'loft conversion', path: '/services/loft/altrincham', impr: 30, pos: 9, clicks: 1, ctr: 0},
      {query: 'loft conversion', path: '/services/loft', impr: 20, pos: 14, clicks: 0, ctr: 0},
    ])
    expect(res).toHaveLength(1)
    expect(res[0].target).toBe('/services/loft/altrincham')
    expect(res[0].cannibals).toEqual(['/services/loft'])
  })
  it('ignores queries with only one competing page', () => {
    const res = cannibalisation([{query: 'solo', path: '/a', impr: 30, pos: 9, clicks: 1, ctr: 0}])
    expect(res).toHaveLength(0)
  })
})

describe('internalLinkSuggestion', () => {
  it('suggests a relevant hub with anchor + bridge + confirm', () => {
    const s = internalLinkSuggestion('/services/loft-conversion/altrincham', [{path: '/services/loft-conversion', clicks: 50}], {
      targetKeyword: 'loft conversion altrincham',
    })
    expect(s?.source).toBe('/services/loft-conversion')
    expect(s?.anchor).toContain('loft')
    expect(s?.confirm).toMatch(/mid-content/)
  })
  it('returns null when no topically-relevant hub exists', () => {
    expect(internalLinkSuggestion('/services/loft', [{path: '/blog/unrelated', clicks: 99}], {targetKeyword: 'loft'})).toBeNull()
    expect(internalLinkSuggestion('/services/loft', [], {})).toBeNull()
  })
})
