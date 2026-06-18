import {stegaClean} from '@sanity/client/stega'

import {ExtractPageBuilderType} from '@/sanity/lib/types'

import CaseStudy from './CaseStudy'
import ResultsCTA from './ResultsCTA'
import TestimonialsCards from './TestimonialsCards'

type TestimonialsProps = {
  block: ExtractPageBuilderType<'testimonials'>
  index: number
  pageType: string
  pageId: string
}

/**
 * Testimonials / proof dispatcher. Branches on `variant`:
 *   cards (default) → testimonial grid + reviews CTA (existing layout)
 *   caseStudy       → photo + story + result stats
 *   resultsCTA      → featured quote + stats beside a CTA button
 */
export default function Testimonials({block}: TestimonialsProps) {
  const variant = stegaClean(block.variant) || 'cards'

  switch (variant) {
    case 'caseStudy':
      return <CaseStudy block={block} />
    case 'resultsCTA':
      return <ResultsCTA block={block} />
    default:
      return <TestimonialsCards block={block} />
  }
}
