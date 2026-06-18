'use client'

import {useEffect, useState} from 'react'
import Script from 'next/script'
import Link from 'next/link'

/**
 * Per-tenant GA4 on-site analytics — GDPR-correct: the tag (which sets analytics
 * cookies) loads ONLY after the visitor accepts. Choice is remembered in
 * localStorage. Rendered by the layout only when the tenant has a measurement id,
 * so sites without analytics show no banner and set no analytics cookies.
 */
export default function Analytics({measurementId}: {measurementId: string}) {
  const [consent, setConsent] = useState<'granted' | 'denied' | 'unset'>('unset')

  useEffect(() => {
    // One-time read of prior consent from localStorage (client-only external state).
    const stored = localStorage.getItem('analytics-consent')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === 'granted' || stored === 'denied') setConsent(stored)
  }, [])

  const choose = (value: 'granted' | 'denied') => {
    try {
      localStorage.setItem('analytics-consent', value)
    } catch {
      /* private mode — just honour it for this session */
    }
    setConsent(value)
  }

  return (
    <>
      {consent === 'granted' && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${measurementId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}

      {consent === 'unset' && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-60 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6"
        >
          <div className="container flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-xs leading-relaxed text-gray-600 sm:text-sm">
              We use privacy-friendly analytics cookies to understand how the site is used. See our{' '}
              <Link href="/privacy" className="font-medium text-blue-deep underline">
                privacy policy
              </Link>
              .
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => choose('denied')}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Decline
              </button>
              <button
                onClick={() => choose('granted')}
                className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
