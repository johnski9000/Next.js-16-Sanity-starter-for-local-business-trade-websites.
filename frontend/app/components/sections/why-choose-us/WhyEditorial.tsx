import {stegaClean} from '@sanity/client/stega'

import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

import {diffIcon} from './whyIcons'

/** A · Airy borderless feature grid. */
export default function WhyEditorial({
  block,
}: {
  block: ExtractPageBuilderType<'whyChooseUs'>
}) {
  const {eyebrow, heading, subheading, image} = block

  // Prefer the variant-native `differentiators`, but fall back to the shared
  // `reasons` list so seeded copy (which populates `reasons`) still renders when
  // a design profile flips this block to the editorial variant.
  const items =
    block.differentiators && block.differentiators.length > 0
      ? block.differentiators.map((d) => ({
          _key: d._key,
          icon: diffIcon(d.icon),
          title: d.title,
          body: d.desc,
        }))
      : (block.reasons ?? []).map((r) => ({
          _key: r._key,
          icon: diffIcon(null),
          title: r.title,
          body: r.description,
        }))

  const dark = stegaClean(block.theme) === 'dark'
  const columns = stegaClean(block.columns) ?? 3
  const hasImage = Boolean(image?.asset?._ref)

  const ink = dark ? 'text-white' : 'text-gray-950'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  // With a side image the grid is constrained to the content column, so cap at 2.
  const gridCols = hasImage
    ? 'sm:grid-cols-2'
    : columns === 2
      ? 'sm:grid-cols-2'
      : 'sm:grid-cols-2 lg:grid-cols-3'

  const grid =
    items.length > 0 ? (
      <RevealGroup className={cn('grid grid-cols-1 gap-x-12 gap-y-11', gridCols)} as="div">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <RevealItem key={item._key} className="flex flex-col gap-3" as="div">
              <Icon className="h-8 w-8 text-brand" />
              {item.title && (
                <strong className={cn('text-xl font-extrabold tracking-tight', ink)}>
                  {item.title}
                </strong>
              )}
              {item.body && (
                <span className={cn('max-w-[32ch] text-base leading-relaxed', soft)}>
                  {item.body}
                </span>
              )}
            </RevealItem>
          )
        })}
      </RevealGroup>
    ) : null

  return (
    <section className={cn('py-20 sm:py-28', dark ? 'bg-gray-950' : 'bg-white')}>
      <div className="container">
        {hasImage ? (
          // Editorial with a supporting image: airy header + content/image split.
          <>
            <Reveal className="mb-12 max-w-2xl" as="div">
              {eyebrow && (
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-deep">
                  {eyebrow}
                </span>
              )}
              {heading && (
                <h2
                  className={cn(
                    'mt-2 text-balance text-3xl font-extrabold tracking-tight md:text-4xl',
                    ink,
                  )}
                >
                  {heading}
                </h2>
              )}
              {subheading && (
                <p className={cn('mt-4 text-base leading-relaxed', soft)}>{subheading}</p>
              )}
            </Reveal>

            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>{grid}</div>
              <div className="relative overflow-hidden rounded-2xl">
                <Image
                  id={image!.asset!._ref}
                  alt={image?.alt ?? ''}
                  width={680}
                  crop={image?.crop ?? undefined}
                  hotspot={image?.hotspot ?? undefined}
                  mode="cover"
                  className="h-full max-h-140 w-full object-cover"
                />
              </div>
            </div>
          </>
        ) : (
          // No image: the original centered feature grid, unchanged.
          <>
            <Reveal className="mx-auto mb-12 max-w-2xl text-center" as="div">
              {eyebrow && (
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-deep">
                  {eyebrow}
                </span>
              )}
              {heading && (
                <h2
                  className={cn(
                    'mt-2 text-balance text-3xl font-extrabold tracking-tight md:text-4xl',
                    ink,
                  )}
                >
                  {heading}
                </h2>
              )}
              {subheading && (
                <p className={cn('mt-4 text-base leading-relaxed', soft)}>{subheading}</p>
              )}
            </Reveal>

            {grid}
          </>
        )}
      </div>
    </section>
  )
}
