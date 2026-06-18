/**
 * Fire a GA4 `generate_lead` conversion when an enquiry is submitted successfully.
 *
 * Consent-aware by construction: `window.gtag` only exists after the visitor has
 * accepted analytics (see app/components/Analytics.tsx, which loads gtag.js only
 * on consent). When there's no consent / no GA4 configured this is a no-op. Also
 * pushes a `generate_lead` event to `dataLayer` for GTM-based setups. Never throws
 * into the form's success UX.
 *
 * GA4: mark `generate_lead` as a Key Event in the GA4 property to use it for
 * conversion reporting / Ads import.
 */
type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void
  dataLayer?: Array<Record<string, unknown>>
}

export function trackLeadConversion(detail?: {
  service?: string
  area?: string
  value?: number
  currency?: string
}): void {
  if (typeof window === 'undefined') return
  const w = window as GtagWindow
  const params: Record<string, unknown> = {
    currency: detail?.currency ?? 'GBP',
    value: detail?.value ?? 0,
  }
  if (detail?.service) params.service = detail.service
  if (detail?.area) params.area = detail.area
  try {
    if (typeof w.gtag === 'function') {
      w.gtag('event', 'generate_lead', params)
    } else if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({event: 'generate_lead', ...params})
    }
  } catch {
    /* analytics must never break the lead-success path */
  }
}
