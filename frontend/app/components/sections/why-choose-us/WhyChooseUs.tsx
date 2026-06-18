import {stegaClean} from '@sanity/client/stega'

import {ExtractPageBuilderType} from '@/sanity/lib/types'

import WhyChooseUsSplit from './WhyChooseUsSplit'
import WhyCompare from './WhyCompare'
import WhyEditorial from './WhyEditorial'
import WhyGuarantee from './WhyGuarantee'

type WhyChooseUsProps = {
  block: ExtractPageBuilderType<'whyChooseUs'>
  index: number
  pageType: string
  pageId: string
}

/**
 * Why Choose Us dispatcher. Branches on `variant`:
 *   split (default) → content + side image checklist (existing layout)
 *   editorial       → airy feature grid
 *   guarantee       → promise panel + chips
 *   compare         → us vs. typical contractor table
 */
export default function WhyChooseUs({block}: WhyChooseUsProps) {
  const variant = stegaClean(block.variant) || 'split'

  switch (variant) {
    case 'editorial':
      return <WhyEditorial block={block} />
    case 'guarantee':
      return <WhyGuarantee block={block} />
    case 'compare':
      return <WhyCompare block={block} />
    default:
      return <WhyChooseUsSplit block={block} />
  }
}
