// heroBanner.ts

import {defineArrayMember, defineField, defineType} from 'sanity'
import {
  ComposeSparklesIcon,
  ImageIcon,
  LinkIcon,
  ControlsIcon,
  HomeIcon,
  TagIcon,
} from '@sanity/icons'

/** True when the carousel layout variant is selected. */
const isCarousel = (parent: unknown): boolean =>
  (parent as {variant?: string})?.variant === 'carousel'

export const heroBanner = defineType({
  name: 'heroBanner',
  title: 'Hero',
  type: 'object',
  icon: HomeIcon,
  groups: [
    {name: 'content', icon: ComposeSparklesIcon, default: true},
    {name: 'media', icon: ImageIcon},
    {name: 'buttons', icon: LinkIcon},
    {name: 'trust', icon: TagIcon},
    {name: 'designSystem', icon: ControlsIcon},
  ],
  fields: [
    // ── Single-hero content (Banner / Split variants) ──────────────────────
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      group: 'content',
      hidden: ({parent}) => isCarousel(parent),
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      group: 'content',
      hidden: ({parent}) => isCarousel(parent),
    }),
    defineField({
      name: 'subheading',
      title: 'Subheading',
      type: 'text',
      rows: 4,
      group: 'content',
      hidden: ({parent}) => isCarousel(parent),
    }),
    // ── Carousel slides (Carousel variant only) ────────────────────────────
    defineField({
      name: 'slides',
      title: 'Slides',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'heroSlide'})],
      hidden: ({parent}) => !isCarousel(parent),
      validation: (r) =>
        r.custom((slides, ctx) => {
          if (!isCarousel(ctx.parent)) return true
          return Array.isArray(slides) && slides.length >= 1 ? true : 'Add at least one slide'
        }),
    }),
    defineField({
      name: 'primaryButton',
      title: 'Primary Button',
      type: 'button',
      group: 'buttons',
      hidden: ({parent}) => isCarousel(parent),
    }),
    defineField({
      name: 'secondaryButton',
      title: 'Secondary Button',
      type: 'button',
      group: 'buttons',
      hidden: ({parent}) => isCarousel(parent),
    }),
    defineField({
      name: 'trustBadges',
      title: 'Trust Badges',
      type: 'array',
      hidden: ({parent}) => isCarousel(parent),
      of: [
        defineField({
          name: 'trustBadge',
          title: 'Trust Badge',
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {
                list: [
                  {title: 'Shield Check', value: 'ShieldCheck'},
                  {title: 'Clock', value: 'Clock'},
                  {title: 'Star', value: 'Star'},
                  {title: 'Tag', value: 'Tag'},
                ],
              },
              initialValue: 'ShieldCheck',
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
            }),
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'icon',
            },
          },
        }),
      ],
      group: 'trust',
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Image',
      description:
        'Full-bleed background for the Banner layout, or the side image for the Split (copy + image) layout.',
      type: 'image',
      options: {hotspot: true},
      hidden: ({parent}) => isCarousel(parent),
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (Rule) =>
            Rule.custom((alt, ctx) => {
              const hasAsset = Boolean((ctx.parent as any)?.asset?._ref)
              if (hasAsset && !alt) return 'Alt text is required when an image is set'
              return true
            }),
        }),
      ],
      group: 'media',
    }),
    // ── Design system ──────────────────────────────────────────────────────
    defineField({
      name: 'variant',
      title: 'Layout Variant',
      description: 'How this hero is laid out.',
      type: 'string',
      options: {
        list: [
          {title: 'Banner — full-bleed background image', value: 'banner'},
          {title: 'Split — copy + image', value: 'splitImage'},
          {title: 'Split — copy + quote form', value: 'splitForm'},
          {title: 'Carousel — rotating slides', value: 'carousel'},
        ],
        layout: 'radio',
      },
      initialValue: 'banner',
      group: 'designSystem',
    }),
    defineField({
      name: 'mediaSide',
      title: 'Image / form side',
      description: 'Which side the image or form sits on (Split layouts only).',
      type: 'string',
      options: {
        list: [
          {title: 'Right', value: 'right'},
          {title: 'Left', value: 'left'},
        ],
        layout: 'radio',
      },
      initialValue: 'right',
      group: 'designSystem',
      hidden: ({parent}) => {
        const v = (parent as {variant?: string})?.variant
        return v !== 'splitImage' && v !== 'splitForm'
      },
    }),
    defineField({
      name: 'theme',
      title: 'Theme',
      description: 'Carousel slides set their own theme per slide.',
      type: 'string',
      options: {
        list: [
          {title: 'Light', value: 'light'},
          {title: 'Dark', value: 'dark'},
        ],
        layout: 'radio',
      },
      initialValue: 'dark',
      group: 'designSystem',
      hidden: ({parent}) => isCarousel(parent),
    }),
    defineField({
      name: 'textAlignment',
      title: 'Text Alignment',
      type: 'string',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
        ],
        layout: 'radio',
      },
      initialValue: 'left',
      group: 'designSystem',
    }),
    defineField({
      name: 'autoPlay',
      title: 'Auto Play',
      description: 'Carousel only.',
      type: 'boolean',
      initialValue: true,
      group: 'designSystem',
      hidden: ({parent}) => !isCarousel(parent),
    }),
    defineField({
      name: 'interval',
      title: 'Interval (seconds)',
      type: 'number',
      initialValue: 5,
      validation: (r) => r.min(2).max(20),
      group: 'designSystem',
      hidden: ({parent}) => !isCarousel(parent) || !(parent as {autoPlay?: boolean})?.autoPlay,
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      media: 'backgroundImage.asset',
      variant: 'variant',
      slides: 'slides',
    },
    prepare({title, media, variant, slides}) {
      const n = Array.isArray(slides) ? slides.length : 0
      const label =
        variant === 'carousel'
          ? `Carousel · ${n} slide${n === 1 ? '' : 's'}`
          : variant === 'splitImage'
            ? 'Split — copy + image'
            : variant === 'splitForm'
              ? 'Split — copy + quote form'
              : 'Banner'
      return {
        title: variant === 'carousel' ? title || 'Hero Carousel' : title || 'Hero',
        subtitle: `Hero · ${label}`,
        media: media || HomeIcon,
      }
    },
  },
})
