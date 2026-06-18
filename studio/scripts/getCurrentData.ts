/**
 * Inspect what's currently in the dataset BEFORE you seed/overwrite.
 *
 *   cd studio
 *   npm run data            # summary of pages + singletons
 *   FULL=1 npm run data     # also dump full pretty JSON of every document
 *
 * Reads only — never writes. Use this to copy real `_id`s/slugs so your
 * createPage()/upsert* calls overwrite the right documents instead of
 * creating duplicates.
 */
import {client} from './seedClient'

type PageRow = {
  _id: string
  name?: string
  slug?: string
  _updatedAt: string
  seo?: {title?: string; description?: string; hideFromSitemap?: boolean}
  blocks?: Array<{_type: string}>
}

async function main() {
  const full = Boolean(process.env.FULL)

  const [pages, settings, navigation, footer, posts] = await Promise.all([
    client.fetch<PageRow[]>(
      `*[_type == "page"] | order(slug.current asc){
        _id, name, "slug": slug.current, _updatedAt,
        seo{title, description, hideFromSitemap},
        "blocks": pageBuilder[]{_type}
      }`,
    ),
    client.fetch(`*[_type == "settings"][0]`),
    client.fetch(`*[_type == "navigation"][0]`),
    client.fetch(`*[_type == "footer"][0]`),
    client.fetch<Array<{_id: string; slug?: string; title?: string}>>(
      `*[_type == "post"]{_id, "slug": slug.current, title}`,
    ),
  ])

  console.log(`\n=== PAGES (${pages.length}) ===`)
  if (pages.length === 0) console.log('  (none)')
  for (const p of pages) {
    console.log(`\n• ${p.name ?? '(no name)'}`)
    console.log(`  _id:    ${p._id}`)
    console.log(`  slug:   ${p.slug ?? '(none)'}`)
    console.log(`  updated:${p._updatedAt}`)
    console.log(`  seo:    ${p.seo?.title ? `"${p.seo.title}"` : '(no title)'}`)
    if (p.seo?.hideFromSitemap) console.log('          ⚠ hidden from sitemap')
    const blocks = p.blocks ?? []
    console.log(
      `  blocks: ${blocks.length ? blocks.map((b) => b._type).join(' → ') : '(empty)'}`,
    )
  }

  console.log('\n=== SINGLETONS ===')
  const singleton = (label: string, doc: any) =>
    console.log(`  ${label.padEnd(11)} ${doc ? `present  [_id: ${doc._id}]` : '— MISSING'}`)
  singleton('settings', settings)
  singleton('navigation', navigation)
  singleton('footer', footer)

  console.log(`\n=== POSTS (${posts.length}) ===`)
  for (const post of posts) {
    console.log(`  ${(post.slug ?? '(no slug)').padEnd(28)} [_id: ${post._id}]`)
  }
  if (posts.length === 0) console.log('  (none)')

  if (full) {
    console.log('\n=== FULL JSON ===')
    console.log(JSON.stringify({pages, settings, navigation, footer, posts}, null, 2))
  } else {
    console.log('\nTip: run `FULL=1 npm run data` to dump complete JSON of every document.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
