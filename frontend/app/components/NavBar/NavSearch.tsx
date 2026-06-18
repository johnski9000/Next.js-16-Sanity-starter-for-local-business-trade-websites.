'use client'

import {useRouter} from 'next/navigation'
import {useEffect, useMemo, useRef, useState} from 'react'
import {AnimatePresence, motion} from 'framer-motion'
import {Search, X, FileText, ArrowRight} from 'lucide-react'
import {cn} from '@/lib/utils'

export type SearchItem = {
  _type: 'page' | 'post' | 'service' | 'area' | 'project'
  title: string
  slug: string | null
  description?: string | null
}

function searchHref(item: SearchItem): string {
  const slug = (item.slug ?? '').replace(/^\/+/, '')
  if (item._type === 'service') return `/services/${slug}`
  if (item._type === 'area') return `/areas/${slug}`
  if (item._type === 'project') return `/projects/${slug}`
  if (item._type === 'post') return `/blog/${slug}`
  if (!slug || slug === 'homepage') return '/'
  return `/${slug}`
}

const TYPE_LABEL: Record<SearchItem['_type'], string> = {
  service: 'Service',
  area: 'Area',
  project: 'Project',
  post: 'Blog',
  page: 'Page',
}

// Type weights bias results toward higher-intent destinations when scores
// are otherwise close. Service pages convert; pages/posts are informational.
const TYPE_WEIGHT: Record<SearchItem['_type'], number> = {
  service: 1.25,
  area: 1.15,
  project: 1.0,
  post: 0.95,
  page: 0.9,
}

function score(item: SearchItem, q: string): number {
  const title = item.title.toLowerCase()
  const slug = (item.slug ?? '').toLowerCase()
  const desc = (item.description ?? '').toLowerCase()
  let base = 0
  if (title === q || slug === q) base = 100
  else if (title.startsWith(q)) base = 90
  else if (title.includes(q)) base = 70
  else if (slug.includes(q)) base = 50
  else if (desc.includes(q)) base = 30
  if (base === 0) return 0
  return base * (TYPE_WEIGHT[item._type] ?? 1)
}

/**
 * Splits `text` into [non-match, match, non-match, ...] segments around the
 * first occurrence of `query` (case-insensitive). Used by the result row to
 * bold the matched substring so the user can see why a result matched.
 */
function highlight(text: string, query: string): Array<{text: string; match: boolean}> {
  if (!query) return [{text, match: false}]
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  const idx = lower.indexOf(q)
  if (idx === -1) return [{text, match: false}]
  return [
    {text: text.slice(0, idx), match: false},
    {text: text.slice(idx, idx + query.length), match: true},
    {text: text.slice(idx + query.length), match: false},
  ]
}

export default function NavSearch({
  open,
  onClose,
  items,
}: {
  open: boolean
  onClose: () => void
  items: SearchItem[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeRaw, setActiveRaw] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevOpen = useRef(open)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items.slice(0, 8)
    return items
      .map((item) => ({item, s: score(item, q)}))
      .filter(({s}) => s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map(({item}) => item)
  }, [items, query])

  // Derive the clamped active index during render — avoids the
  // react-hooks/set-state-in-effect synchronisation pattern.
  const active = Math.min(activeRaw, Math.max(results.length - 1, 0))
  const setActive: typeof setActiveRaw = setActiveRaw

  // Reset state + focus only on the false->true open transition. Using a
  // ref to gate avoids re-firing on every render and removes the lint warning
  // about setting state inside an effect on an unconditional dep.
  useEffect(() => {
    if (open && !prevOpen.current) {
      setQuery('')
      setActiveRaw(0)
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      prevOpen.current = open
      return () => clearTimeout(t)
    }
    prevOpen.current = open
  }, [open])

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const go = (item?: SearchItem) => {
    if (!item) return
    onClose()
    router.push(searchHref(item))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(results[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="search-backdrop"
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          transition={{duration: 0.15}}
          className="fixed inset-0 z-[60] flex items-start justify-center bg-gray-950/60 backdrop-blur-sm px-4 pt-[12vh]"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Site search"
        >
          <motion.div
            key="search-panel"
            initial={{opacity: 0, y: 12, scale: 0.98}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: 12, scale: 0.98}}
            transition={{duration: 0.18, ease: 'easeOut'}}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl shadow-black/40"
          >
            {/* Input */}
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <Search className="h-5 w-5 shrink-0 text-white/40" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search services and pages…"
                aria-label="Search services and pages"
                className="h-14 w-full bg-transparent text-base text-white placeholder:text-white/40 outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/40 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results */}
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-white/40">
                  No results for &ldquo;{query}&rdquo;
                </li>
              ) : (
                results.map((item, i) => (
                  <li key={`${item._type}-${item.slug}-${i}`}>
                    <button
                      type="button"
                      onClick={() => go(item)}
                      onMouseEnter={() => setActive(i)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                        i === active ? 'bg-white/10' : 'hover:bg-white/5',
                      )}
                    >
                      <FileText className="h-4 w-4 shrink-0 text-brand" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="block truncate text-sm font-medium text-white">
                            {highlight(item.title, query).map((seg, j) =>
                              seg.match ? (
                                <span key={j} className="text-brand">
                                  {seg.text}
                                </span>
                              ) : (
                                <span key={j}>{seg.text}</span>
                              ),
                            )}
                          </span>
                          <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
                            {TYPE_LABEL[item._type]}
                          </span>
                        </span>
                        {item.description && (
                          <span className="block truncate text-xs text-white/40">
                            {highlight(item.description, query).map((seg, j) =>
                              seg.match ? (
                                <span key={j} className="text-white/70">
                                  {seg.text}
                                </span>
                              ) : (
                                <span key={j}>{seg.text}</span>
                              ),
                            )}
                          </span>
                        )}
                      </span>
                      <ArrowRight
                        className={cn(
                          'h-4 w-4 shrink-0 transition-opacity',
                          i === active ? 'text-white/60 opacity-100' : 'opacity-0',
                        )}
                      />
                    </button>
                  </li>
                ))
              )}
            </ul>

            {/* Footer hint */}
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5 text-[11px] text-white/30">
              <span>
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-sans">↑</kbd>{' '}
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-sans">↓</kbd> to navigate
              </span>
              <span>
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-sans">Esc</kbd> to close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
