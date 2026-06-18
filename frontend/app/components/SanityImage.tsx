'use client'

import type {ElementType} from 'react'
import {SanityImage, type WrapperProps} from 'sanity-image'

import {useTenantImageBase} from '@/app/components/TenantImageProvider'

// Resolves the CDN base from the current tenant (via context) so the same
// component serves the right project's images on every client domain. Falls
// back to the env project when no TenantImageProvider is present.
const Image = <T extends ElementType = 'img'>(props: WrapperProps<T>) => {
  const baseUrl = useTenantImageBase()
  return <SanityImage baseUrl={baseUrl} {...props} />
}

export default Image
