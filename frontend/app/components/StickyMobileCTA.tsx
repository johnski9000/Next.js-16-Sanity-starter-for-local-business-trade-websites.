import Link from 'next/link'
import {Phone, MessageSquare} from 'lucide-react'

/**
 * Persistent mobile call/quote bar. Hidden on lg+ (desktop has the
 * header CTA). `phone` comes from settings; the call button is omitted
 * when no phone is configured.
 */
export default function StickyMobileCTA({phone}: {phone?: string | null}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-gray-950 lg:hidden">
      {phone && (
        <a
          href={`tel:${phone.replace(/\s+/g, '')}`}
          className="flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white"
        >
          <Phone className="h-4 w-4 text-blue" />
          Call
        </a>
      )}
      <Link
        href="/quote"
        className="flex flex-1 items-center justify-center gap-2 bg-brand py-3.5 text-sm font-semibold text-white"
      >
        <MessageSquare className="h-4 w-4" />
        Get a Free Quote
      </Link>
    </div>
  )
}
