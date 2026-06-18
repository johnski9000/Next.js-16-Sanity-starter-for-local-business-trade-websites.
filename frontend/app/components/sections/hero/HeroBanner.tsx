import {stegaClean} from '@sanity/client/stega'

import {ExtractPageBuilderType} from '@/sanity/lib/types'

import HeroBannerView from './HeroBannerView'
import HeroCarouselView, {type CarouselSlides} from './HeroCarouselView'
import HeroSplitForm from './HeroSplitForm'
import HeroSplitImage from './HeroSplitImage'

type HeroBannerProps = {
  block: ExtractPageBuilderType<'heroBanner'>
  index: number
  pageType: string
  pageId: string
}

/**
 * Hero dispatcher (server component). Branches on the `variant` field — the same
 * in-component pattern the existing `theme`/`textAlignment` toggles use — so the
 * block keeps a single `_type` ('heroBanner') and BlockRenderer stays a plain
 * `_type` → component lookup.
 *
 *   banner (default) → HeroBannerView   (full-bleed background image)
 *   splitImage       → HeroSplitImage   (copy + image card)
 *   splitForm        → HeroSplitForm    (copy + real quote form; async, fetches services)
 */
export default function HeroBanner({block}: HeroBannerProps) {
  const variant = stegaClean(block.variant) || 'banner'

  if (variant === 'splitImage') {
    return <HeroSplitImage block={block} />
  }

  if (variant === 'splitForm') {
    return <HeroSplitForm block={block} />
  }

  if (variant === 'carousel') {
    return (
      <HeroCarouselView
        slides={(block.slides ?? []) as CarouselSlides}
        autoPlay={block.autoPlay}
        interval={block.interval}
        textAlignment={block.textAlignment}
      />
    )
  }

  return <HeroBannerView block={block} />
}
