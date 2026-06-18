import Link from 'next/link'
import type {ReactNode} from 'react'
import {
  Facebook,
  Instagram,
  XTwitter,
  Linkedin,
  Youtube,
  Tiktok,
  Pinterest,
} from '@/components/brand-icons'
import {cn} from '@/lib/utils'

/**
 * A page/post link target as projected by `navigationQuery`/`footerQuery` —
 * GROQ rewrites `page->slug.current` to a string, but local fixtures may
 * still pass a `{current}` object, so accept both.
 */
type SanityRef = {current?: string} | string

type SanityLink = {
  linkType: 'href' | 'page' | 'post'
  href?: string
  page?: SanityRef
  post?: SanityRef
  openInNewTab?: boolean
}

type FooterLink = {
  label: string
  link: SanityLink
}

type FooterColumn = {
  title: string
  links: FooterLink[]
}

type SocialLink = {
  platform: string
  url: string
}

type LegalLink = {
  label: string
  link: SanityLink
}

type FooterData = {
  columns?: FooterColumn[]
  social?: SocialLink[]
  legal?: LegalLink[]
  copyright?: string
}

const SOCIAL_ICONS: Record<string, ReactNode> = {
  facebook: <Facebook className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  twitter: <XTwitter className="h-4 w-4" />,
  x: <XTwitter className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
  tiktok: <Tiktok className="h-4 w-4" />,
  pinterest: <Pinterest className="h-4 w-4" />,
}

function getSlugValue(ref: SanityRef | undefined): string | undefined {
  if (!ref) return undefined
  if (typeof ref === 'string') return ref
  return ref.current
}

function resolveLink(link?: SanityLink): {
  href: string
  external: boolean
  target?: string
  rel?: string
} {
  if (!link) return {href: '#', external: false}

  const openInNewTab = Boolean(link.openInNewTab)

  if (link.linkType === 'href' && link.href) {
    return {
      href: link.href,
      external: true,
      target: openInNewTab ? '_blank' : undefined,
      rel: openInNewTab ? 'noopener noreferrer' : undefined,
    }
  }

  if (link.linkType === 'page' && link.page) {
    const slug = (getSlugValue(link.page) ?? '').replace(/^\/+/, '')
    const href = slug === 'homepage' ? '/' : `/${slug}`
    return {href, external: false}
  }

  if (link.linkType === 'post' && link.post) {
    const slug = (getSlugValue(link.post) ?? '').replace(/^\/+/, '')
    return {href: `/blog/${slug}`, external: false}
  }

  return {href: '#', external: false}
}

function SmartLink({
  link,
  className,
  children,
}: {
  link?: SanityLink
  className?: string
  children: ReactNode
}) {
  const {href, external, target, rel} = resolveLink(link)

  if (external) {
    return (
      <a href={href} className={className} target={target} rel={rel}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

type LinkedDoc = {name?: string | null; slug?: string | null}

type ContactInfo = {
  phone?: string | null
  email?: string | null
}

export default function Footer({
  footer,
  siteTitle,
  services = [],
  areas = [],
  contact,
}: {
  footer?: FooterData
  siteTitle?: string
  services?: LinkedDoc[]
  areas?: LinkedDoc[]
  contact?: ContactInfo
}) {
  const social = footer?.social ?? []
  const legal = footer?.legal ?? []
  // Always surface a Privacy Policy link (GDPR) — append our /privacy page unless
  // the client already added a privacy link in Sanity.
  const hasPrivacy = legal.some(
    (l) =>
      /privacy/i.test(l.label || '') ||
      (l.link?.linkType === 'href' && l.link.href === '/privacy'),
  )
  const legalLinks: LegalLink[] = hasPrivacy
    ? legal
    : [...legal, {label: 'Privacy Policy', link: {linkType: 'href' as const, href: '/privacy'}}]
  const brand = siteTitle || 'Your Company'
  const copyright =
    footer?.copyright || `© ${new Date().getFullYear()} ${brand}. All rights reserved.`

  const genColumns: FooterColumn[] = []
  if (services.length > 0) {
    genColumns.push({
      title: 'Services',
      links: services.map((s) => ({
        label: s.name ?? '',
        link: {linkType: 'href' as const, href: `/services/${s.slug}`},
      })),
    })
  }
  if (areas.length > 0) {
    genColumns.push({
      title: 'Areas We Cover',
      links: [
        ...areas.map((a) => ({
          label: a.name || '',
          link: {linkType: 'href' as const, href: `/areas/${a.slug}`},
        })),
        {label: 'All areas', link: {linkType: 'href' as const, href: '/areas'}},
      ],
    })
  }
  // Contact column (phone/email/quote) auto-generated from settings.
  // Phone display strips +44 prefix back to UK national format for readability;
  // the `tel:` href uses the canonical international form.
  if (contact?.phone || contact?.email) {
    const links: FooterLink[] = []
    if (contact.phone) {
      const tel = contact.phone.replace(/\s+/g, '')
      const display = tel.startsWith('+44') ? `0${tel.slice(3)}`.replace(/(\d{5})(\d{6})/, '$1 $2') : contact.phone
      links.push({
        label: display,
        link: {linkType: 'href' as const, href: `tel:${tel}`},
      })
    }
    if (contact.email) {
      links.push({
        label: contact.email,
        link: {linkType: 'href' as const, href: `mailto:${contact.email}`},
      })
    }
    links.push({
      label: 'Get a free quote',
      link: {linkType: 'href' as const, href: '/quote'},
    })
    genColumns.push({title: 'Get in Touch', links})
  }
  // Guard: Services + "Areas We Cover" are ALWAYS auto-generated above from the live
  // docs, so drop any CMS footer column that duplicates them — matched by a service/
  // area title OR by links that point at /services|/areas. Stops a pack/Studio config
  // that re-lists Services/Areas from doubling the footer.
  const isServiceOrAreaColumn = (c: FooterColumn) => {
    const t = (c.title || '').toLowerCase()
    if (/service|area/.test(t)) return true
    const links = c.links ?? []
    return links.length > 0 && links.every((l) => /^\/(services|areas)(\/|$)/.test(l.link?.href || ''))
  }
  const cmsColumns = (footer?.columns ?? []).filter((c) => !isServiceOrAreaColumn(c))
  const columns = [...genColumns, ...cmsColumns]

  return (
    <footer className="bg-white text-gray-600 border-t border-gray-200">
      {/* Brand accent line */}
      <div className="h-1 bg-blue" />

      <div className="container py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div>
              <Link href="/" className="text-2xl font-semibold text-gray-950 hover:opacity-80 transition-opacity">
                {brand}
              </Link>
            </div>

            {social.length > 0 && (
              <div className="flex gap-2">
                {social.map((s, i) => {
                  const icon = SOCIAL_ICONS[s.platform.toLowerCase()]
                  return (
                    <a
                      key={`${s.platform}-${i}`}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.platform}
                      className="flex items-center justify-center h-9 w-9 rounded-lg bg-gray-100 text-gray-600 hover:bg-brand hover:text-white transition-all duration-200"
                    >
                      {icon ?? <span className="text-xs font-medium">{s.platform.slice(0, 2).toUpperCase()}</span>}
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Link columns */}
          {columns.length > 0 && (
            <div className="lg:col-span-8">
              <div
                className={cn(
                  'grid gap-8',
                  columns.length === 1 && 'grid-cols-1',
                  columns.length === 2 && 'sm:grid-cols-2',
                  columns.length >= 3 && 'sm:grid-cols-2 lg:grid-cols-3',
                )}
              >
                {columns.map((col, i) => (
                  <div key={`${col.title}-${i}`}>
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral mb-4">
                      {col.title}
                    </h4>
                    <ul className="space-y-2.5">
                      {(col.links ?? []).map((l, j) => (
                        <li key={`${l.label}-${j}`}>
                          <SmartLink
                            link={l.link}
                            className="text-sm text-gray-600 hover:text-gray-950 transition-colors"
                          >
                            {l.label}
                          </SmartLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-neutral">{copyright}</p>

          {legalLinks.length > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {legalLinks.map((l, i) => (
                <SmartLink
                  key={`${l.label}-${i}`}
                  link={l.link}
                  className="text-xs text-neutral hover:text-gray-950 transition-colors"
                >
                  {l.label}
                </SmartLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
