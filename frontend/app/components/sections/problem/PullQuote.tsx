import {Reveal} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'
import {ExtractPageBuilderType} from '@/sanity/lib/types'

/** C · Emotional pull-quote → calm reassurance. */
export default function PullQuote({
  block,
  dark,
}: {
  block: ExtractPageBuilderType<'problemSection'>
  dark: boolean
}) {
  const {quote, caption, reliefTitle, reliefBody} = block

  const ink = dark ? 'text-white' : 'text-gray-900'
  const soft = dark ? 'text-gray-400' : 'text-gray-600'
  const line = dark ? 'border-white/10' : 'border-gray-200'

  return (
    <div className="mx-auto max-w-3xl text-center">
      <Reveal as="div">
        <span aria-hidden className="block font-serif text-7xl leading-[0.5] text-brand/60">
          &ldquo;
        </span>
        {quote && (
          <p className={cn('mt-2 text-balance text-3xl font-bold leading-snug tracking-tight sm:text-4xl', ink)}>
            {quote}
          </p>
        )}
        {caption && <p className={cn('mt-5 text-sm italic', soft)}>{caption}</p>}
      </Reveal>

      {(reliefTitle || reliefBody) && (
        <Reveal as="div" className={cn('mt-9 border-t pt-8', line)}>
          {reliefTitle && (
            <h3 className={cn('flex items-center justify-center gap-3 text-xl font-extrabold tracking-tight sm:text-2xl', ink)}>
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 ring-4 ring-green-500/25" />
              {reliefTitle}
            </h3>
          )}
          {reliefBody && (
            <p className={cn('mx-auto mt-2.5 max-w-md text-lg leading-relaxed', soft)}>{reliefBody}</p>
          )}
        </Reveal>
      )}
    </div>
  )
}
