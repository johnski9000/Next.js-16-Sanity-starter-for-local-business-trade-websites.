// TrustBar.ts

import {defineField, defineType} from 'sanity'
import {StarIcon, ControlsIcon} from '@sanity/icons'

/**
 * Social-proof strip. The trust FACTS (rating, certifications, stat, press) live
 * once in Site Settings → "Trust signals" / "Reviews & Ratings" and are read in
 * via the page query, so numbers stay consistent across every page and there's a
 * single place to keep claims accurate. This block only chooses a presentation.
 *
 * Each variant hides itself when the data it needs is missing — never a fake
 * placeholder (UK DMCC Act 2024 / ASA: fabricated reviews & credentials are
 * illegal/misleading).
 */
export const trustBar = defineType({
  name: 'trustBar',
  title: 'Trust Bar',
  type: 'object',
  icon: StarIcon,
  groups: [{name: 'designSystem', icon: ControlsIcon, default: true}],
  fields: [
    defineField({
      name: 'variant',
      title: 'Layout Variant',
      description:
        'Pulls content from Site Settings. Variants that need reviews only show when "Reviews & Ratings" is enabled and filled in.',
      type: 'string',
      options: {
        list: [
          {title: 'Compact line — minimal inline strip (great under a hero)', value: 'compactLine'},
          {title: 'Aggregate score — big centred rating', value: 'aggregateScore'},
          {title: 'Review cells — per-platform ratings', value: 'reviewCells'},
          {title: 'Certifications — accreditation chips', value: 'certifications'},
          {title: 'Combined bar — stat · certs · rating', value: 'combinedBar'},
          {title: 'Featured in — press logos', value: 'featuredIn'},
        ],
        layout: 'radio',
      },
      initialValue: 'compactLine',
      group: 'designSystem',
    }),
    defineField({
      name: 'heading',
      title: 'Heading / label (optional)',
      description:
        'Small label above the Certifications and "Featured in" variants. Sensible default used if blank.',
      type: 'string',
      group: 'designSystem',
      hidden: ({parent}) => {
        const v = (parent as {variant?: string})?.variant
        return v !== 'certifications' && v !== 'featuredIn'
      },
    }),
    defineField({
      name: 'theme',
      title: 'Theme',
      type: 'string',
      options: {
        list: [
          {title: 'Light', value: 'light'},
          {title: 'Dark', value: 'dark'},
        ],
        layout: 'radio',
      },
      initialValue: 'light',
      group: 'designSystem',
    }),
  ],
  preview: {
    select: {variant: 'variant'},
    prepare({variant}) {
      const labels: Record<string, string> = {
        compactLine: 'Compact line',
        aggregateScore: 'Aggregate score',
        reviewCells: 'Review cells',
        certifications: 'Certifications',
        combinedBar: 'Combined bar',
        featuredIn: 'Featured in',
      }
      return {
        title: 'Trust Bar',
        subtitle: labels[variant as string] || 'Compact line',
      }
    },
  },
})
