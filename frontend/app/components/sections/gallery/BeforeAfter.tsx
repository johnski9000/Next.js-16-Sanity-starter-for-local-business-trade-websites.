import {stegaClean} from '@sanity/client/stega'

import {ExtractPageBuilderType} from '@/sanity/lib/types'

import BeforeAfterFeatured from './BeforeAfterFeatured'
import BeforeAfterGrid from './BeforeAfterGrid'
import BeforeAfterThumbs from './BeforeAfterThumbs'

type BeforeAfterProps = {
  block: ExtractPageBuilderType<'beforeAfter'>
  index: number
  pageType: string
  pageId: string
}

/**
 * Before & After dispatcher. Branches on `variant`:
 *   grid (default) → grid of draggable sliders (existing layout)
 *   featured       → one large slider + caption
 *   thumbs         → featured slider + project thumbnail rail
 */
export default function BeforeAfter({block}: BeforeAfterProps) {
  const variant = stegaClean(block.variant) || 'grid'

  switch (variant) {
    case 'featured':
      return <BeforeAfterFeatured block={block} />
    case 'thumbs':
      return <BeforeAfterThumbs block={block} />
    default:
      return <BeforeAfterGrid block={block} />
  }
}
