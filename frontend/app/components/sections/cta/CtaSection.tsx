import {stegaClean} from '@sanity/client/stega'

import {ExtractPageBuilderType} from '@/sanity/lib/types'

import CtaBand from './CtaBand'
import CtaForm from './CtaForm'
import CtaPhone from './CtaPhone'
import CtaStandard from './CtaStandard'

type CTAProps = {
  block: ExtractPageBuilderType<'cta'>
  index: number
  pageType: string
  pageId: string
}

/**
 * CTA dispatcher. Branches on `variant`:
 *   standard (default) → centred restatement + buttons (existing layout)
 *   band               → full-bleed brand band + trust line
 *   phone              → emergency band with the tenant's phone (projected from Settings NAP)
 *   form               → split copy + the real QuoteForm
 */
export default function CtaSection({block}: CTAProps) {
  const variant = stegaClean(block.variant) || 'standard'

  switch (variant) {
    case 'band':
      return <CtaBand block={block} />
    case 'phone':
      return <CtaPhone block={block} />
    case 'form':
      return <CtaForm block={block} />
    default:
      return <CtaStandard block={block} />
  }
}
