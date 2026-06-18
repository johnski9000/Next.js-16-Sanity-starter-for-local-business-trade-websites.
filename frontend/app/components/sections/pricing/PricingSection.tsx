import {stegaClean} from '@sanity/client/stega'

import {ExtractPageBuilderType} from '@/sanity/lib/types'

import PricingFactors from './PricingFactors'
import PricingOptions from './PricingOptions'
import PricingPromise from './PricingPromise'

type PricingSectionProps = {
  block: ExtractPageBuilderType<'pricingSection'>
  index: number
  pageType: string
  pageId: string
}

/**
 * "How pricing works" dispatcher. Branches on `variant`:
 *   promise (default) → transparency statement + principles
 *   factors           → what goes into a quote + reassurance bar
 *   options           → quote paths (quoting language, no prices)
 */
export default function PricingSection({block}: PricingSectionProps) {
  const variant = stegaClean(block.variant) || 'promise'

  switch (variant) {
    case 'factors':
      return <PricingFactors block={block} />
    case 'options':
      return <PricingOptions block={block} />
    default:
      return <PricingPromise block={block} />
  }
}
