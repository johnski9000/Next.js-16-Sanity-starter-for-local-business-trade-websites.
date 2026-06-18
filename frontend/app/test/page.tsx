import type {Metadata} from 'next'

import Catalogue from './Catalogue'

/**
 * Internal visual component catalogue. Hidden from search engines (noindex) and
 * excluded in robots.ts. Renders every page-builder block + variant plus the
 * chrome/forms/utility components with trade-agnostic dummy data.
 */
export const metadata: Metadata = {
  title: 'Component Catalogue — internal',
  robots: {index: false, follow: false},
}

export default function TestPage() {
  return <Catalogue />
}
