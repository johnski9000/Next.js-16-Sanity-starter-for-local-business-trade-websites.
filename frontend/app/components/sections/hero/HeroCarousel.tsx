import {ExtractPageBuilderType} from '@/sanity/lib/types'

import HeroCarouselView from './HeroCarouselView'

type HeroCarouselProps = {
  block: ExtractPageBuilderType<'heroCarousel'>
  index: number
  pageType: string
  pageId: string
}

/**
 * Standalone (legacy) `heroCarousel` block. New pages should use the Hero block
 * with its `carousel` variant; this stays so existing carousels keep working.
 * Both feed the same presentational HeroCarouselView.
 */
export default function HeroCarousel({block}: HeroCarouselProps) {
  return (
    <HeroCarouselView
      slides={block.slides ?? []}
      autoPlay={block.autoPlay}
      interval={block.interval}
      textAlignment={block.textAlignment}
    />
  )
}
