import {Check} from 'lucide-react'

import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import Image from '@/app/components/SanityImage'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

/** C · Value promise + imagery (copy left, photo card right). */
export default function ValuePromise({
  block,
  dark,
}: {
  block: ExtractPageBuilderType<'solutionSection'>
  dark: boolean
}) {
  const {eyebrow, title, lead, chip, image} = block
  const bullets = block.bullets ?? []
  const hasImage = Boolean(image?.asset?._ref)

  const ink = dark ? 'text-white' : 'text-gray-900'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const pill = dark ? 'border-white/15 bg-white/10 text-white' : 'border-brand/20 bg-brand/5 text-brand'
  const chipBox = dark ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-white'

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
      {/* copy */}
      <div>
        <Reveal as="div">
          {eyebrow && (
            <span
              className={cn(
                'inline-block rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest',
                pill,
              )}
            >
              {eyebrow}
            </span>
          )}
          {title && (
            <h2 className={cn('mt-5 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl', ink)}>
              {title}
            </h2>
          )}
          {lead && <p className={cn('mt-4 max-w-prose text-lg leading-relaxed', soft)}>{lead}</p>}
        </Reveal>

        {bullets.length > 0 && (
          <RevealGroup as="ul" className="mt-7 flex flex-col gap-4">
            {bullets.map((b) => (
              <RevealItem key={b._key} as="li" className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-500/15 text-green-600">
                  <Check className="h-4 w-4" />
                </span>
                <span className="flex flex-col gap-0.5">
                  {b.title && <strong className={cn('text-base font-bold', ink)}>{b.title}</strong>}
                  {b.desc && <span className={cn('text-sm leading-relaxed', soft)}>{b.desc}</span>}
                </span>
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </div>

      {/* media */}
      <Reveal as="div" className="relative mx-auto w-full max-w-[460px] lg:max-w-none">
        <div
          aria-hidden
          className="absolute -bottom-5 -right-4 h-[84%] w-[84%] rotate-3 rounded-3xl bg-brand opacity-[0.12]"
        />
        <figure className="relative z-1 m-0 aspect-4/5 w-full overflow-hidden rounded-3xl border border-border bg-muted shadow-2xl">
          {hasImage ? (
            <Image
              id={image!.asset!._ref}
              alt={image?.alt ?? ''}
              width={900}
              height={1125}
              crop={image?.crop ?? undefined}
              hotspot={image?.hotspot ?? undefined}
              mode="cover"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted text-sm font-medium text-muted-foreground">
              Add an image
            </div>
          )}
        </figure>
        {chip && (
          <div
            className={cn(
              'absolute -left-5 bottom-5 z-1 inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold shadow-lg',
              chipBox,
              ink,
            )}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 ring-4 ring-green-500/25" />
            {chip}
          </div>
        )}
      </Reveal>
    </div>
  )
}
