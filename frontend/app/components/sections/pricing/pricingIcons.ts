import {
  Clipboard,
  Clock,
  FileText,
  MapPin,
  Package,
  Repeat,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

/** Mirrors the pricing icon enum on the pricingSection schema. */
export const PRICING_ICONS: Record<string, LucideIcon> = {
  FileText,
  Wrench,
  Repeat,
  Clipboard,
  Package,
  Clock,
  MapPin,
}

export const pricingIcon = (key?: string | null): LucideIcon => (key && PRICING_ICONS[key]) || FileText
