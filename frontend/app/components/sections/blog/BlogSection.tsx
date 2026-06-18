import {stegaClean} from '@sanity/client/stega'

import {ExtractPageBuilderType} from '@/sanity/lib/types'

import BlogFeatured from './BlogFeatured'
import BlogGrid from './BlogGrid'
import BlogList from './BlogList'

type BlogSectionProps = {
  block: ExtractPageBuilderType<'blogSection'>
  index: number
  pageType: string
  pageId: string
}

/**
 * Blog (latest posts) dispatcher. Branches on `variant`:
 *   grid (default) → 3-card grid (existing layout)
 *   featured       → lead post + compact recent list
 *   list           → minimal text index
 * Posts are auto-projected from the most recent published posts in the page query.
 */
export default function BlogSection({block}: BlogSectionProps) {
  const variant = stegaClean(block.variant) || 'grid'

  switch (variant) {
    case 'featured':
      return <BlogFeatured block={block} />
    case 'list':
      return <BlogList block={block} />
    default:
      return <BlogGrid block={block} />
  }
}
