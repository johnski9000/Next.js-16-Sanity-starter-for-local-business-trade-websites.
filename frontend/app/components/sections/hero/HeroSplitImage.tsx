import Image from '@/app/components/SanityImage'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

import HeroSplitShell from './HeroSplitShell'

/**
 * Hero variant `splitImage` — copy on one side, a photo card on the other.
 * Reuses the heroBanner `backgroundImage` field as the side image.
 */
export default function HeroSplitImage({
  block,
}: {
  block: ExtractPageBuilderType<'heroBanner'>
}) {
  const {backgroundImage} = block
  const hasImage = Boolean(backgroundImage?.asset?._ref)

  const media = (
    <figure className="relative z-1 m-0 aspect-4/5 w-full overflow-hidden rounded-3xl border border-border bg-muted shadow-2xl">
      {hasImage ? (
        <Image
          id={backgroundImage!.asset!._ref}
          alt={backgroundImage?.alt ?? ''}
          width={900}
          height={1125}
          crop={backgroundImage?.crop ?? undefined}
          hotspot={backgroundImage?.hotspot ?? undefined}
          mode="cover"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-sm font-medium text-muted-foreground">
          Add an image
        </div>
      )}
    </figure>
  )

  return <HeroSplitShell block={block} media={media} />
}
