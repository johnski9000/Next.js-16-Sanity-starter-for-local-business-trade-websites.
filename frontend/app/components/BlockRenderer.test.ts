import {describe, it, expect} from 'vitest'
import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'

import * as catalogue from '../test/catalogue-data'

/**
 * Page-builder registry invariant. The central data-flow rule is schema -> seed ->
 * GROQ -> component; the last hop is BlockRenderer's `Blocks` map. If a block _type
 * has no entry there it silently renders a grey "hasn't been created" placeholder.
 * This guards two ways:
 *   A. every block exercised by the /test visual catalogue HAS a renderer, and
 *   B. every renderer is exercised by the catalogue (no untested block).
 *
 * `Blocks` is parsed from source (not imported) so this stays a fast node test —
 * importing BlockRenderer would pull the whole client component tree (CSS, motion).
 */
const src = readFileSync(fileURLToPath(new URL('./BlockRenderer.tsx', import.meta.url)), 'utf8')
const blocksBody = src.slice(src.indexOf('const Blocks'), src.indexOf('export default'))
const rendererKeys = new Set(
  [...blocksBody.matchAll(/^ {2}([a-zA-Z]\w*):/gm)].map((m) => m[1]),
)

const catalogueTypes = new Set<string>()
for (const value of Object.values(catalogue)) {
  if (!Array.isArray(value)) continue
  for (const sample of value as Array<{block?: {_type?: string}}>) {
    const t = sample?.block?._type
    if (t) catalogueTypes.add(t)
  }
}

describe('page-builder block registry invariant', () => {
  it('parses a non-trivial set of renderer keys + catalogue types', () => {
    expect(rendererKeys.size).toBeGreaterThan(15)
    expect(catalogueTypes.size).toBeGreaterThan(15)
  })

  it('every catalogued block _type has a renderer (no fallback placeholder ships)', () => {
    const missing = [...catalogueTypes].filter((t) => !rendererKeys.has(t)).sort()
    expect(missing).toEqual([])
  })

  it('every renderer is exercised by the visual catalogue (no untested block)', () => {
    const orphan = [...rendererKeys].filter((t) => !catalogueTypes.has(t)).sort()
    expect(orphan).toEqual([])
  })
})
