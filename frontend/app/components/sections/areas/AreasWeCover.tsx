import {stegaClean} from '@sanity/client/stega'

import {ExtractPageBuilderType} from '@/sanity/lib/types'

import AreaChips from './AreaChips'
import AreaDirectory from './AreaDirectory'
import AreaMap from './AreaMap'

type AreasWeCoverProps = {
  block: ExtractPageBuilderType<'areasWeCover'>
  index: number
  pageType: string
  pageId: string
}

/**
 * Areas We Cover dispatcher. Branches on `variant`:
 *   chips (default) → tappable area pills (existing layout)
 *   map             → stylised map + location list
 *   directory       → searchable, region-grouped directory
 */
export default function AreasWeCover({block}: AreasWeCoverProps) {
  const variant = stegaClean(block.variant) || 'chips'

  switch (variant) {
    case 'map':
      return <AreaMap block={block} />
    case 'directory':
      return <AreaDirectory block={block} />
    default:
      return <AreaChips block={block} />
  }
}
