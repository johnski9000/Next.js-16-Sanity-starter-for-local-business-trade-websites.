'use client'

import {createContext, useContext, type ReactNode} from 'react'

type TenantImageConfig = {projectId: string; dataset: string}

const TenantImageContext = createContext<TenantImageConfig | null>(null)

/**
 * Provides the current tenant's Sanity project/dataset to client components so
 * image URLs resolve to the right project. Set once in the root layout from the
 * server-resolved tenant; every <Image> below reads it via useTenantImageBase().
 */
export default function TenantImageProvider({
  value,
  children,
}: {
  value: TenantImageConfig
  children: ReactNode
}) {
  return <TenantImageContext.Provider value={value}>{children}</TenantImageContext.Provider>
}

/**
 * The Sanity image CDN base for the current tenant. Falls back to the build-time
 * env project when no provider is present (single-tenant / back-compat).
 */
export function useTenantImageBase(): string {
  const cfg = useContext(TenantImageContext)
  const projectId = cfg?.projectId || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = cfg?.dataset || process.env.NEXT_PUBLIC_SANITY_DATASET
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/`
}
