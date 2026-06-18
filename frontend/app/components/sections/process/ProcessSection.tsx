import {stegaClean} from '@sanity/client/stega'

import {ExtractPageBuilderType} from '@/sanity/lib/types'

import ProcessBigNumber from './ProcessBigNumber'
import ProcessFlow from './ProcessFlow'
import ProcessGrid from './ProcessGrid'
import ProcessTimeline from './ProcessTimeline'

type ProcessSectionProps = {
  block: ExtractPageBuilderType<'processSection'>
  index: number
  pageType: string
  pageId: string
}

/**
 * Process / how-it-works dispatcher. All variants share the same `steps` data;
 * branches on `variant`: grid (default) / flow / timeline / bigNumber.
 */
export default function ProcessSection({block}: ProcessSectionProps) {
  const variant = stegaClean(block.variant) || 'grid'

  switch (variant) {
    case 'flow':
      return <ProcessFlow block={block} />
    case 'timeline':
      return <ProcessTimeline block={block} />
    case 'bigNumber':
      return <ProcessBigNumber block={block} />
    default:
      return <ProcessGrid block={block} />
  }
}
