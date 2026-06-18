import {Award, Clock, DollarSign, Heart, MapPin, ShieldCheck, type LucideIcon} from 'lucide-react'

/** Mirrors the differentiator icon enum on the whyChooseUs schema. */
export const DIFF_ICONS: Record<string, LucideIcon> = {
  Clock,
  Dollar: DollarSign,
  ShieldCheck,
  Award,
  MapPin,
  Heart,
}

export const diffIcon = (key?: string | null): LucideIcon => (key && DIFF_ICONS[key]) || ShieldCheck
