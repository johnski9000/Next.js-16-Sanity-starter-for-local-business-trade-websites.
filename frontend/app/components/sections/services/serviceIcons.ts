import {
  Bath,
  Building2,
  Droplet,
  Fan,
  Flame,
  Hammer,
  Home,
  Leaf,
  PaintBucket,
  PaintRoller,
  Paintbrush,
  Plug,
  Ruler,
  ShieldCheck,
  Siren,
  Sparkles,
  Thermometer,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import {ExtractPageBuilderType} from '@/sanity/lib/types'

/** One auto-listed service (projected from the Service docs in the page query). */
export type ServiceItem = ExtractPageBuilderType<'servicesOverview'>['services'][number]

/** Mirrors the SERVICE_ICONS enum on the `service` schema. */
export const SERVICE_ICONS: Record<string, LucideIcon> = {
  Wrench,
  Hammer,
  Flame,
  Droplet,
  Zap,
  Thermometer,
  ShieldCheck,
  Siren,
  Bath,
  Home,
  Building2,
  Paintbrush,
  PaintRoller,
  PaintBucket,
  Ruler,
  Sparkles,
  Plug,
  Fan,
  Leaf,
  Truck,
}

export const serviceIcon = (key?: string | null): LucideIcon => (key && SERVICE_ICONS[key]) || Wrench
