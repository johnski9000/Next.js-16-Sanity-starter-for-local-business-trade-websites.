import type {Metadata} from 'next'
import Link from 'next/link'
import {CheckCircle2} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Thank you',
  robots: {index: false, follow: false},
  alternates: {canonical: '/quote/thanks'},
}

export default function QuoteThanksPage() {
  return (
    <section className="bg-white py-24">
      <div className="container max-w-xl text-center">
        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </span>
        <h1 className="text-3xl font-semibold text-gray-950 sm:text-4xl">
          Thanks — your request is in
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-neutral">
          We&apos;ve received your enquiry and will get back to you as soon as we can with a
          no-obligation quote.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Back home
          </Link>
          <Link
            href="/projects"
            className="rounded-lg border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            See our work
          </Link>
        </div>
      </div>
    </section>
  )
}
