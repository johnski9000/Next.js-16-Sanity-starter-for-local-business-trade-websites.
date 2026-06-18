import {stegaClean} from '@sanity/client/stega'

import {ExtractPageBuilderType} from '@/sanity/lib/types'

import IntroCentered from './IntroCentered'
import IntroEditorial from './IntroEditorial'
import IntroFacts from './IntroFacts'
import IntroSplit from './IntroSplit'

type IntroOverviewSectionProps = {
  block: ExtractPageBuilderType<'introOverviewSection'>
  index: number
  pageType: string
  pageId: string
}

/**
 * Intro / overview dispatcher. Branches on `variant`:
 *   split (default) → copy + stats/checklist + optional image (existing layout)
 *   editorial       → oversized lead + two-column body
 *   facts           → copy + "at a glance" panel
 *   centered        → centred overview + inline stats
 */
export default function IntroOverviewSection({block}: IntroOverviewSectionProps) {
  const variant = stegaClean(block.variant) || 'split'

  switch (variant) {
    case 'editorial':
      return <IntroEditorial block={block} />
    case 'facts':
      return <IntroFacts block={block} />
    case 'centered':
      return <IntroCentered block={block} />
    default:
      return <IntroSplit block={block} />
  }
}
