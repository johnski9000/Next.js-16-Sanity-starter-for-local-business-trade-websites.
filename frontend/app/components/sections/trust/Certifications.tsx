import {Reveal, RevealGroup, RevealItem} from '@/app/components/Reveal'
import {cn} from '@/lib/utils'

import {trustIcon, type Accreditation} from './TrustPrimitives'

/** C · Certifications & accreditations chips. */
export default function Certifications({
  accreditations,
  heading,
  dark,
}: {
  accreditations: Accreditation[]
  heading?: string
  dark: boolean
}) {
  const cardBg = dark ? 'bg-gray-900' : 'bg-white'
  const ink = dark ? 'text-white' : 'text-gray-900'
  const soft = dark ? 'text-gray-400' : 'text-gray-500'
  const line = dark ? 'border-white/10' : 'border-gray-200'

  return (
    <div className="flex flex-col items-center gap-5">
      <Reveal className={cn('text-xs font-bold uppercase tracking-widest', soft)} as="span">
        {heading || 'Licensed, certified & accredited'}
      </Reveal>
      <RevealGroup className="flex flex-wrap justify-center gap-3.5" as="div">
        {accreditations.map((c, i) => {
          const Icon = trustIcon(c.icon)
          return (
            <RevealItem
              key={i}
              className={cn('flex items-center gap-3 rounded-xl border p-3.5 shadow-sm', cardBg, line)}
              as="div"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Icon className="h-6 w-6" />
              </span>
              <span className="flex flex-col leading-tight">
                <strong className={cn('text-[0.96rem] font-bold', ink)}>{c.title}</strong>
                {c.sub && <span className={cn('text-[0.8rem]', soft)}>{c.sub}</span>}
              </span>
            </RevealItem>
          )
        })}
      </RevealGroup>
    </div>
  )
}
