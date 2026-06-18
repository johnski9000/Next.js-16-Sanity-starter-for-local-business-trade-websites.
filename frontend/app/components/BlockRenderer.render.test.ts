import {describe, it, expect, vi} from 'vitest'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'

// Render-smoke: server-render every block variant from the /test catalogue through
// BlockRenderer and assert it produces markup without throwing. Catches the
// "build is green but the page 500s at render" class — a render crash in any of the
// ~80 variant components (one deploy serves every tenant, so a crash is estate-wide).
//
// Uses renderToStaticMarkup in the node env (no jsdom). The section components are
// all synchronous/presentational; we stub the Next runtime pieces they touch
// (router/link/image) so they render outside the Next server.
vi.mock('next/navigation', () => ({
  useRouter: () => ({push: () => {}, replace: () => {}, prefetch: () => {}, back: () => {}}),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('next/link', () => ({
  default: ({href, children, ...rest}: {href?: string; children?: unknown}) =>
    createElement('a', {href: typeof href === 'string' ? href : '#', ...rest}, children as never),
}))
vi.mock('next/image', () => ({
  default: ({alt, ...rest}: {alt?: string}) => createElement('img', {alt: alt ?? '', ...rest}),
}))

import BlockRenderer from './BlockRenderer'
import * as catalogue from '../test/catalogue-data'

type Sample = {label?: string; block?: {_type?: string}}
const samples: Array<{group: string; label: string; block: {_type: string}}> = []
for (const [group, value] of Object.entries(catalogue)) {
  if (!Array.isArray(value)) continue
  for (const s of value as Sample[]) {
    if (s?.block?._type) samples.push({group, label: s.label ?? '', block: s.block as {_type: string}})
  }
}

describe('block render smoke (renderToStaticMarkup, no throw)', () => {
  it('collected a non-trivial sample set', () => {
    expect(samples.length).toBeGreaterThan(20)
  })

  for (const s of samples) {
    it(`renders ${s.block._type} — ${s.label || s.group}`, () => {
      const html = renderToStaticMarkup(
        createElement(BlockRenderer, {
          block: s.block,
          index: 0,
          pageId: 'test',
          pageType: 'page',
        } as never),
      )
      expect(typeof html).toBe('string')
      expect(html.length).toBeGreaterThan(0)
    })
  }
})
