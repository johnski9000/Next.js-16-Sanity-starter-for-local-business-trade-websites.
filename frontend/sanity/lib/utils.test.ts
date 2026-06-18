import {describe, expect, it} from 'vitest'

import {linkResolver, resolveOpenGraphImage} from '@/sanity/lib/utils'
import type {DereferencedLink} from '@/sanity/lib/types'

describe('linkResolver', () => {
  it('returns null for an undefined link', () => {
    expect(linkResolver(undefined)).toBeNull()
  })

  it("resolves an explicit 'href' link to its url", () => {
    const link: DereferencedLink = {_type: 'link', linkType: 'href', href: 'https://example.com'}
    expect(linkResolver(link)).toBe('https://example.com')
  })

  it("infers linkType 'href' when only href is set", () => {
    const link: DereferencedLink = {_type: 'link', href: '/contact'}
    expect(linkResolver(link)).toBe('/contact')
  })

  it("resolves a 'page' link to /<slug>", () => {
    const link: DereferencedLink = {_type: 'link', linkType: 'page', page: 'about'}
    expect(linkResolver(link)).toBe('/about')
  })

  it("resolves a 'post' link to /blog/<slug>", () => {
    const link: DereferencedLink = {_type: 'link', linkType: 'post', post: 'hello-world'}
    expect(linkResolver(link)).toBe('/blog/hello-world')
  })

  it("returns null for an unresolved 'page' ref (no fall-through to /blog)", () => {
    const link: DereferencedLink = {_type: 'link', linkType: 'page', page: null}
    const result = linkResolver(link)
    expect(result).toBeNull()
    expect(result).not.toBe('/blog')
  })

  it("returns null for an unresolved 'post' ref", () => {
    const link: DereferencedLink = {_type: 'link', linkType: 'post', post: null}
    expect(linkResolver(link)).toBeNull()
  })

  it("returns null for an 'href' link with no href value", () => {
    const link: DereferencedLink = {_type: 'link', linkType: 'href'}
    expect(linkResolver(link)).toBeNull()
  })
})

describe('resolveOpenGraphImage', () => {
  it('returns undefined when no image is supplied', () => {
    expect(resolveOpenGraphImage(null)).toBeUndefined()
    expect(resolveOpenGraphImage(undefined)).toBeUndefined()
  })

  it('honors the requested width/height and bakes them into the url', () => {
    const image = {asset: {_ref: 'image-abc123-1600x900-jpg', _type: 'reference' as const}}
    const og = resolveOpenGraphImage(image, undefined, 800, 418)

    expect(og).toBeDefined()
    expect(og?.width).toBe(800)
    expect(og?.height).toBe(418)
    expect(og?.url).toContain('w=800')
    expect(og?.url).toContain('h=418')
  })

  it('defaults to 1200x627 and carries the image alt through', () => {
    const image = {
      asset: {_ref: 'image-abc123-1600x900-jpg', _type: 'reference' as const},
      alt: 'A demo photo',
    }
    const og = resolveOpenGraphImage(image)

    expect(og?.width).toBe(1200)
    expect(og?.height).toBe(627)
    expect(og?.alt).toBe('A demo photo')
  })

  it('falls back to an empty alt when none is present', () => {
    const image = {asset: {_ref: 'image-abc123-1600x900-jpg', _type: 'reference' as const}}
    expect(resolveOpenGraphImage(image)?.alt).toBe('')
  })
})
