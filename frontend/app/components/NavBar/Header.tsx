'use client'

import Link from 'next/link'
import Image from 'next/image'
import {useState, useEffect} from 'react'
import type {ReactNode} from 'react'
import {AnimatePresence, motion} from 'framer-motion'
import {Menu, X, ChevronDown, Search} from 'lucide-react'
import {cn} from '@/lib/utils'
import NavSearch, {type SearchItem} from './NavSearch'

/**
 * A page/post link target as projected by `navigationQuery` — GROQ rewrites
 * `page->slug.current` to a string, but local fixtures may still pass a
 * `{current}` object, so accept both shapes here.
 */
type SanityRef = {current?: string} | string

type SanityLink = {
  linkType: 'href' | 'page' | 'post'
  href?: string
  page?: SanityRef
  post?: SanityRef
  openInNewTab?: boolean
}

type NavChild = {
  label: string
  description?: string
  link: SanityLink
}

type NavItem = {
  label: string
  kind: 'link' | 'dropdown'
  link?: SanityLink
  children?: NavChild[]
}

type NavCta = {
  label: string
  link: SanityLink
  variant?: 'primary' | 'secondary'
}

type NavLogo = {
  asset?: {url?: string; metadata?: {dimensions?: {width: number; height: number}}}
  alt?: string
}

type NavData = {
  logo?: NavLogo
  items?: NavItem[]
  cta?: NavCta
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

function NavLink({
  link,
  className,
  children,
  onClick,
}: {
  link?: SanityLink
  className?: string
  children: ReactNode
  onClick?: () => void
}) {
  const {href, external, target, rel} = resolveLink(link)

  if (external) {
    return (
      <a href={href} className={className} target={target} rel={rel} onClick={onClick}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  )
}

type LinkedDoc = {name?: string | null; slug?: string | null}

export default function Header({
  nav,
  siteTitle = 'Your Company',
  searchItems = [],
  services = [],
  areas = [],
}: {
  nav?: NavData
  siteTitle?: string
  searchItems?: SearchItem[]
  services?: LinkedDoc[]
  areas?: LinkedDoc[]
}) {
  const cmsItems = nav?.items ?? []
  const generatedItems: NavItem[] = [
    services.length > 0 && {
      label: 'Services',
      kind: 'dropdown' as const,
      link: {linkType: 'href' as const, href: '/services'},
      children: services.map((s) => ({
        label: s.name ?? '',
        link: {linkType: 'href' as const, href: `/services/${s.slug}`},
      })),
    },
    areas.length > 0 && {
      label: 'Areas',
      kind: 'dropdown' as const,
      link: {linkType: 'href' as const, href: '/areas'},
      children: areas.map((a) => ({
        label: a.name ?? '',
        link: {linkType: 'href' as const, href: `/areas/${a.slug}`},
      })),
    },
  ].filter(Boolean) as NavItem[]
  // Guard: Services + Areas are ALWAYS auto-generated above from the live docs, so
  // drop any CMS nav item that duplicates them (by label, or by an /#services|/#areas|
  // /services|/areas href). Stops a pack/Studio config that also lists Services/Areas
  // from rendering them twice.
  const generatedLabels = new Set(generatedItems.map((i) => i.label.toLowerCase()))
  const DUP_HREFS = new Set(['/#services', '/#areas', '/services', '/areas'])
  const cmsDeduped = cmsItems.filter((i) => {
    if (generatedLabels.has((i.label || '').toLowerCase())) return false
    return !DUP_HREFS.has((i.link?.href || '').toLowerCase().replace(/\/$/, ''))
  })
  const items = [...generatedItems, ...cmsDeduped]
  const cta = nav?.cta

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  // Cmd/Ctrl+K opens search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openSearch = () => {
    setDrawerOpen(false)
    setSearchOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setMobileExpanded(null)
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 h-20 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="container h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            {nav?.logo?.asset?.url ? (
              <Image
                src={nav.logo.asset.url}
                alt={nav.logo.alt ?? siteTitle}
                width={nav.logo.asset.metadata?.dimensions?.width ?? 160}
                height={nav.logo.asset.metadata?.dimensions?.height ?? 40}
                className="h-15 w-auto object-contain"
                priority
              />
            ) : (
              <span className="font-semibold text-2xl text-gray-950">{siteTitle}</span>
            )}
          </Link>

          {/* Desktop nav + CTA (right side) */}
          <div className="hidden lg:flex items-center gap-1">
            <nav aria-label="Primary" className="flex items-center gap-1">
              {items.map((item, idx) => {
                if (item.kind === 'dropdown') {
                  const children = item.children ?? []
                  if (children.length === 0) return null

                  return (
                    <div
                      key={`${item.label}-${idx}`}
                      className="relative"
                      onMouseEnter={() => setActiveDropdown(item.label)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      <div
                        className={cn(
                          'inline-flex items-center rounded-lg text-sm font-medium transition-colors',
                          activeDropdown === item.label ? 'text-gray-950' : 'text-gray-600 hover:text-gray-950',
                        )}
                        aria-haspopup="menu"
                        aria-expanded={activeDropdown === item.label}
                      >
                        {item.link ? (
                          <NavLink
                            link={item.link}
                            className="px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            {item.label}
                          </NavLink>
                        ) : (
                          <button
                            type="button"
                            className="px-4 py-2 rounded-lg transition-colors"
                          >
                            {item.label}
                          </button>
                        )}
                        <button
                          type="button"
                          className="px-1.5 py-2 rounded-lg transition-colors"
                          tabIndex={-1}
                          aria-hidden
                        >
                          <ChevronDown
                            className={cn(
                              'h-3.5 w-3.5 text-gray-400 transition-transform duration-200',
                              activeDropdown === item.label && 'rotate-180 text-blue-deep',
                            )}
                          />
                        </button>
                      </div>

                      <AnimatePresence>
                        {activeDropdown === item.label && (
                          <motion.div
                            initial={{opacity: 0, y: 6, scale: 0.97}}
                            animate={{opacity: 1, y: 0, scale: 1}}
                            exit={{opacity: 0, y: 6, scale: 0.97}}
                            transition={{duration: 0.15, ease: 'easeOut'}}
                            className="absolute top-full right-0 mt-1.5 w-72 z-50"
                            role="menu"
                          >
                            <div className="rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60 overflow-hidden p-1.5">
                              {children.map((child, cIdx) => (
                                <NavLink
                                  key={`${child.label}-${cIdx}`}
                                  link={child.link}
                                  className="flex flex-col gap-0.5 rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors group"
                                >
                                  <span className="text-sm font-medium text-gray-900 group-hover:text-blue-deep">
                                    {child.label}
                                  </span>
                                  {child.description && (
                                    <span className="text-xs text-neutral leading-relaxed">
                                      {child.description}
                                    </span>
                                  )}
                                </NavLink>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                }

                return (
                  <NavLink
                    key={`${item.label}-${idx}`}
                    link={item.link}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-950 hover:bg-gray-50 transition-colors"
                  >
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>

            <button
              type="button"
              onClick={openSearch}
              aria-label="Search"
              className="ml-1 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-neutral hover:text-gray-950 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="hidden xl:inline">Search</span>
              <kbd className="hidden xl:inline rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-neutral">
                ⌘K
              </kbd>
            </button>

            {cta?.label && (
              <div className="ml-2">
                <NavLink
                  link={cta.link}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                    cta.variant === 'secondary'
                      ? 'border border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400'
                      : 'bg-brand text-white hover:opacity-90 shadow-sm',
                  )}
                >
                  {cta.label}
                </NavLink>
              </div>
            )}
          </div>

          {/* Mobile actions */}
          <div className="lg:hidden flex items-center gap-1">
            <button
              type="button"
              aria-label="Search"
              onClick={openSearch}
              className="flex items-center justify-center h-10 w-10 rounded-lg text-gray-600 hover:text-gray-950 hover:bg-gray-50 transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center justify-center h-10 w-10 rounded-lg text-gray-600 hover:text-gray-950 hover:bg-gray-50 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.2}}
              onClick={closeDrawer}
              className="fixed inset-0 z-50 bg-gray-950/40 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{x: '100%'}}
              animate={{x: 0}}
              exit={{x: '100%'}}
              transition={{type: 'spring', damping: 28, stiffness: 280}}
              className="fixed right-0 top-0 z-50 h-full w-80 bg-white shadow-2xl flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 h-20 border-b border-gray-200 shrink-0">
                <Link href="/" className="flex items-center hover:opacity-80 transition-opacity" onClick={closeDrawer}>
                  {nav?.logo?.asset?.url ? (
                    <Image
                      src={nav.logo.asset.url}
                      alt={nav.logo.alt ?? siteTitle}
                      width={nav.logo.asset.metadata?.dimensions?.width ?? 160}
                      height={nav.logo.asset.metadata?.dimensions?.height ?? 40}
                      className="h-12 w-auto object-contain"
                    />
                  ) : (
                    <span className="font-semibold text-2xl text-gray-950">{siteTitle}</span>
                  )}
                </Link>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={closeDrawer}
                  className="flex items-center justify-center h-9 w-9 rounded-lg text-gray-600 hover:text-gray-950 hover:bg-gray-50 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer nav */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Mobile navigation">
                <button
                  type="button"
                  onClick={openSearch}
                  className="mb-2 flex w-full items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-neutral hover:text-gray-950 hover:bg-gray-50 transition-colors"
                >
                  <Search className="h-4 w-4" />
                  Search services &amp; pages
                </button>
                {items.map((item, idx) => {
                  if (item.kind === 'dropdown') {
                    const children = item.children ?? []
                    if (children.length === 0) return null
                    const isOpen = mobileExpanded === item.label

                    return (
                      <div key={`${item.label}-${idx}`}>
                        <button
                          type="button"
                          onClick={() => setMobileExpanded(isOpen ? null : item.label)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-950 hover:bg-gray-50 transition-colors"
                          aria-expanded={isOpen}
                        >
                          {item.label}
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 text-gray-400 transition-transform duration-200',
                              isOpen && 'rotate-180 text-blue-deep',
                            )}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{height: 0, opacity: 0}}
                              animate={{height: 'auto', opacity: 1}}
                              exit={{height: 0, opacity: 0}}
                              transition={{duration: 0.2, ease: 'easeInOut'}}
                              className="overflow-hidden"
                            >
                              <div className="pl-3 pr-1 pb-1 space-y-0.5 mt-0.5">
                                {children.map((child, cIdx) => (
                                  <NavLink
                                    key={`${child.label}-${cIdx}`}
                                    link={child.link}
                                    onClick={closeDrawer}
                                    className="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                                  >
                                    <span className="text-sm font-medium text-gray-900">
                                      {child.label}
                                    </span>
                                    {child.description && (
                                      <span className="text-xs text-neutral">
                                        {child.description}
                                      </span>
                                    )}
                                  </NavLink>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  }

                  return (
                    <NavLink
                      key={`${item.label}-${idx}`}
                      link={item.link}
                      onClick={closeDrawer}
                      className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-950 hover:bg-gray-50 transition-colors"
                    >
                      {item.label}
                    </NavLink>
                  )
                })}
              </nav>

              {/* Drawer CTA */}
              {cta?.label && (
                <div className="shrink-0 p-4 border-t border-gray-200">
                  <NavLink
                    link={cta.link}
                    onClick={closeDrawer}
                    className={cn(
                      'flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                      cta.variant === 'secondary'
                        ? 'border border-gray-200 text-gray-800 hover:bg-gray-50'
                        : 'bg-brand text-white hover:opacity-90 shadow-sm',
                    )}
                  >
                    {cta.label}
                  </NavLink>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <NavSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        items={searchItems}
      />
    </>
  )
}
