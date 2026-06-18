/**
 * Seeding library: create/replace pages (with page-builder components and SEO
 * metadata) and the site singletons (settings, navigation, footer).
 *
 * This file has no side effects — import these functions from a runnable
 * script (see scripts/seed.example.ts) and execute it with:
 *
 *   npx sanity exec scripts/seed.example.ts --with-user-token
 *
 * Everything is idempotent: documents use deterministic `_id`s and
 * `createOrReplace`, so re-running updates in place rather than duplicating.
 */
import {readFileSync, existsSync} from 'node:fs'
import path from 'node:path'

import {client} from './seedClient'
import {image, type Block, type ImageInput} from './blocks'

/** A document stub with the fields `createOrReplace` requires. */
type SeedDoc = {_id: string; _type: string; [field: string]: unknown}

export * from './blocks'
export {client} from './seedClient'

/** Sanity `_id`s allow only [a-zA-Z0-9._-], but slugs may contain `/`. */
const toId = (prefix: string, slug: string) =>
  `${prefix}-${slug.replace(/^\/+/, '').replace(/[^a-zA-Z0-9._-]+/g, '-')}`

// ---------------------------------------------------------------------------
// SEO / metadata
// ---------------------------------------------------------------------------

export type Seo = {
  title?: string
  description?: string
  canonical?: string
  noIndex?: boolean
  noFollow?: boolean
  hideFromSitemap?: boolean
  ogImage?: ImageInput
  ogTitle?: string
  ogDescription?: string
  keywords?: string[]
}

function buildSeo(seo: Seo = {}) {
  const out: Record<string, unknown> = {
    noIndex: seo.noIndex ?? false,
    noFollow: seo.noFollow ?? false,
    hideFromSitemap: seo.hideFromSitemap ?? false,
  }
  if (seo.title) out.title = seo.title
  if (seo.description) out.description = seo.description
  if (seo.canonical) out.canonical = seo.canonical
  if (seo.ogTitle) out.ogTitle = seo.ogTitle
  if (seo.ogDescription) out.ogDescription = seo.ogDescription
  if (seo.keywords?.length) out.keywords = seo.keywords
  if (seo.ogImage) out.ogImage = image(seo.ogImage)
  return out
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

export type CreatePageOptions = {
  /** Human-readable name (Studio list title). */
  name: string
  /** URL slug, e.g. "about" or "services/plumbing-services". */
  slug: string
  /** SEO / social metadata. */
  seo?: Seo
  /** Ordered page-builder components — use the factories from ./blocks. */
  pageBuilder?: Block[]
  /** Override the deterministic id (default: `page-<slug>`). */
  id?: string
}

/**
 * Create or replace a page document. Returns the written document.
 *
 * @example
 * await createPage({
 *   name: 'About',
 *   slug: 'about',
 *   seo: {title: 'About', description: '...'},  // brand suffix is added by the layout title.template
 *   pageBuilder: [
 *     heroBanner({heading: 'About Vanguard Plumbing & Heating'}),
 *     whyChooseUs({reasons: [{title: 'Local', description: '...'}]}),
 *     cta(),
 *   ],
 * })
 */
export async function createPage(options: CreatePageOptions) {
  const _id = options.id ?? toId('page', options.slug)
  const doc = {
    _id,
    _type: 'page',
    name: options.name,
    slug: {_type: 'slug', current: options.slug},
    seo: buildSeo(options.seo),
    pageBuilder: options.pageBuilder ?? [],
  }
  const result = await client.createOrReplace(doc)
  // eslint-disable-next-line no-console
  console.log(`✓ page  "${options.name}"  (/${options.slug})  [${_id}]`)
  return result
}

// ---------------------------------------------------------------------------
// Settings singleton  (fixed _id "siteSettings" — see sanity.config.ts)
// ---------------------------------------------------------------------------

export type SettingsInput = {
  branding?: {siteTitle: string; logo?: ImageInput; whatsappNumber?: string}
  seo?: {
    title?: string
    description?: string
    metadataBase?: string
    ogImage?: ImageInput
    twitterHandle?: string
    robots?: {index?: boolean; follow?: boolean}
  }
  /** Passed through as-is (Schema.org block — see settings schema). */
  structuredData?: Record<string, unknown>
  theme?: {
    colorScheme?: string
    mode?: 'light' | 'dark' | 'system'
    accent?: 'solid' | 'outline' | 'soft'
    headingFont?: string
    bodyFont?: string
    monoFont?: string
    radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    buttonStyle?: 'pill' | 'rounded' | 'square'
    container?: 'default' | 'wide' | 'narrow'
  }
}

export async function upsertSettings(input: SettingsInput = {}) {
  const theme = input.theme ?? {}
  const doc: SeedDoc = {
    _id: 'siteSettings',
    _type: 'settings',
    theme: {
      colorScheme: theme.colorScheme ?? 'jw-orange-black',
      mode: theme.mode ?? 'light',
      accent: theme.accent ?? 'solid',
      headingFont: theme.headingFont ?? 'inter',
      bodyFont: theme.bodyFont ?? 'inter',
      monoFont: theme.monoFont ?? 'ibmplexmono',
      radius: theme.radius ?? 'xl',
      buttonStyle: theme.buttonStyle ?? 'pill',
      container: theme.container ?? 'default',
    },
  }

  if (input.branding) {
    doc.branding = {
      siteTitle: input.branding.siteTitle,
      ...(input.branding.logo ? {logo: image(input.branding.logo)} : {}),
      ...(input.branding.whatsappNumber ? {whatsappNumber: input.branding.whatsappNumber} : {}),
    }
  }

  if (input.seo) {
    const s = input.seo
    doc.seo = {
      ...(s.title ? {title: s.title} : {}),
      ...(s.description ? {description: s.description} : {}),
      ...(s.metadataBase ? {metadataBase: s.metadataBase} : {}),
      ...(s.ogImage ? {ogImage: image(s.ogImage)} : {}),
      ...(s.twitterHandle ? {twitterHandle: s.twitterHandle} : {}),
      robots: {index: s.robots?.index ?? true, follow: s.robots?.follow ?? true},
    }
  }

  if (input.structuredData) doc.structuredData = input.structuredData

  const result = await client.createOrReplace(doc)
  // eslint-disable-next-line no-console
  console.log('✓ settings  [siteSettings]')
  return result
}

// ---------------------------------------------------------------------------
// Navigation  (fixed _id "navigation")
// ---------------------------------------------------------------------------

import {key, link, type LinkInput} from './blocks'

type NavLink = {label: string} & LinkInput

export type NavigationInput = {
  logo?: ImageInput
  items: Array<
    | ({kind?: 'link'} & NavLink)
    | {
        kind: 'dropdown'
        label: string
        link?: LinkInput
        children: Array<{label: string; description?: string} & LinkInput>
      }
  >
  cta?: {label: string; variant?: 'primary' | 'secondary'} & LinkInput
}

export async function upsertNavigation(input: NavigationInput) {
  const doc: SeedDoc = {
    _id: 'navigation',
    _type: 'navigation',
    items: input.items.map((item) => {
      if (item.kind === 'dropdown') {
        return {
          _key: key(),
          _type: 'navItem',
          label: item.label,
          kind: 'dropdown',
          ...(item.link ? {link: link(item.link)} : {}),
          children: item.children.map((c) => ({
            _key: key(),
            _type: 'navChild',
            label: c.label,
            ...(c.description ? {description: c.description} : {}),
            link: link(c),
          })),
        }
      }
      return {
        _key: key(),
        _type: 'navItem',
        label: item.label,
        kind: 'link',
        link: link(item),
      }
    }),
  }
  if (input.logo) doc.logo = image(input.logo)
  if (input.cta) {
    doc.cta = {
      _type: 'navCta',
      label: input.cta.label,
      link: link(input.cta),
      variant: input.cta.variant ?? 'primary',
    }
  }
  const result = await client.createOrReplace(doc)
  // eslint-disable-next-line no-console
  console.log('✓ navigation  [navigation]')
  return result
}

// ---------------------------------------------------------------------------
// Footer  (fixed _id "footer")
// ---------------------------------------------------------------------------

export type FooterInput = {
  columns?: Array<{title: string; links: Array<{label: string} & LinkInput>}>
  social?: Array<{platform: string; url: string}>
  legal?: Array<{label: string} & LinkInput>
  copyright?: string
}

export async function upsertFooter(input: FooterInput = {}) {
  const doc: SeedDoc = {
    _id: 'footer',
    _type: 'footer',
    columns: (input.columns ?? []).map((col) => ({
      _key: key(),
      _type: 'footerColumn',
      title: col.title,
      links: col.links.map((l) => ({
        _key: key(),
        _type: 'footerLink',
        label: l.label,
        link: link(l),
      })),
    })),
    social: (input.social ?? []).map((s) => ({
      _key: key(),
      _type: 'socialLink',
      platform: s.platform,
      url: s.url,
    })),
    legal: (input.legal ?? []).map((l) => ({
      _key: key(),
      _type: 'legalLink',
      label: l.label,
      link: link(l),
    })),
    ...(input.copyright ? {copyright: input.copyright} : {}),
  }
  const result = await client.createOrReplace(doc)
  // eslint-disable-next-line no-console
  console.log('✓ footer  [footer]')
  return result
}

// ---------------------------------------------------------------------------
// Asset upload helper
// ---------------------------------------------------------------------------

/**
 * Upload an image so it can be referenced by the `image()` helper.
 * Accepts an http(s) URL or a local file path. Returns the asset `_id`.
 *
 * @example
 * const ref = await uploadImage('https://.../hero.jpg', 'Engineer at work')
 * heroBanner({backgroundImage: {assetRef: ref, alt: 'Engineer at work'}})
 */
export async function uploadImage(source: string, filename?: string): Promise<string> {
  const isUrl = /^https?:\/\//i.test(source)
  const body = isUrl
    ? Buffer.from(await (await fetch(source)).arrayBuffer())
    : readFileSync(source)
  const name = filename ?? source.split(/[\\/]/).pop() ?? 'image'
  const asset = await client.assets.upload('image', body, {filename: name})
  // eslint-disable-next-line no-console
  console.log(`✓ asset  "${name}"  [${asset._id}]`)
  return asset._id
}

// Real seed images live in the frontend public dir. Seeds run from the studio/
// package dir (pnpm -F studio exec / sanity exec), so it's one level up. Cached
// by filename so a photo reused across docs is only uploaded once.
//
// PER-TRADE: each trade looks in frontend/public/images/<trade>-seed-images first,
// then falls back to the plumber set (the canonical full set) for any shared or
// secondary file the trade's pack doesn't ship its own version of. So a trade pack
// only needs to provide the images that genuinely differ.
const IMG_ROOT = path.resolve(process.cwd(), '../frontend/public/images')
const SEED_TRADE = (process.env.SEED_TRADE || 'plumber').trim() || 'plumber'
const TRADE_IMG_DIR = path.join(IMG_ROOT, `${SEED_TRADE}-seed-images`)
const PLUMBER_IMG_DIR = path.join(IMG_ROOT, 'plumber-seed-images')
const localImgCache = new Map<string, string>()
export async function localImageRef(filename: string): Promise<string> {
  const cached = localImgCache.get(filename)
  if (cached) return cached
  const file = [path.join(TRADE_IMG_DIR, filename), path.join(PLUMBER_IMG_DIR, filename)].find((f) => existsSync(f))
  if (!file) {
    throw new Error(
      `Seed image not found: ${filename}\n` +
        `Looked in ${TRADE_IMG_DIR} then ${PLUMBER_IMG_DIR}. Add it to the trade's image set ` +
        `(frontend/public/images/${SEED_TRADE}-seed-images/) or the plumber fallback set.`,
    )
  }
  const ref = await uploadImage(file, filename)
  localImgCache.set(filename, ref)
  return ref
}
