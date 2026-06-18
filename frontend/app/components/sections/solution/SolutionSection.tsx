import {stegaClean} from '@sanity/client/stega'

import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

import OutcomeCards from './OutcomeCards'
import Transformation from './Transformation'
import ValuePromise from './ValuePromise'

type SolutionSectionProps = {
  block: ExtractPageBuilderType<'solutionSection'>
  index: number
  pageType: string
  pageId: string
}

/**
 * Solution / value section dispatcher. Branches on `variant` (outcomeCards /
 * transformation / valuePromise); content is per-block. The `transformation`
 * variant is the text Before→After layout — distinct from the image-slider
 * `beforeAfter` gallery block.
 */
export default function SolutionSection({block}: SolutionSectionProps) {
  const variant = stegaClean(block.variant) || 'outcomeCards'
  const dark = stegaClean(block.theme) === 'dark'

  let content: React.ReactNode
  switch (variant) {
    case 'transformation':
      content = <Transformation block={block} dark={dark} />
      break
    case 'valuePromise':
      content = <ValuePromise block={block} dark={dark} />
      break
    case 'outcomeCards':
    default:
      content = <OutcomeCards block={block} dark={dark} />
  }

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-white')}>
      <div className="container">{content}</div>
    </section>
  )
}
