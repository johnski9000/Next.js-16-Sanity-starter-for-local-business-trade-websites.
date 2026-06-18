import {stegaClean} from '@sanity/client/stega'

import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

import PainCards from './PainCards'
import PullQuote from './PullQuote'
import SoundFamiliar from './SoundFamiliar'

type ProblemSectionProps = {
  block: ExtractPageBuilderType<'problemSection'>
  index: number
  pageType: string
  pageId: string
}

/**
 * Problem / pain-acknowledgment section dispatcher. Branches on `variant`
 * (painCards / soundFamiliar / pullQuote); content is per-block. Section
 * chrome (padding + theme background) lives here; each variant renders its
 * inner content with the design tokens so it themes per-tenant.
 */
export default function ProblemSection({block}: ProblemSectionProps) {
  const variant = stegaClean(block.variant) || 'painCards'
  const dark = stegaClean(block.theme) === 'dark'

  let content: React.ReactNode
  switch (variant) {
    case 'soundFamiliar':
      content = <SoundFamiliar block={block} dark={dark} />
      break
    case 'pullQuote':
      content = <PullQuote block={block} dark={dark} />
      break
    case 'painCards':
    default:
      content = <PainCards block={block} dark={dark} />
  }

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-gray-50')}>
      <div className="container">{content}</div>
    </section>
  )
}
