import {defineField, defineType, defineArrayMember} from 'sanity'
import {ComposeSparklesIcon, ControlsIcon, PinIcon} from '@sanity/icons'

/** Hide a field unless the chosen variant is in the list. */
const only =
  (...variants: string[]) =>
  ({parent}: {parent?: {variant?: string}}) =>
    !variants.includes(parent?.variant ?? 'chips')

export const areasWeCover = defineType({
  name: 'areasWeCover',
  title: 'Areas We Cover',
  type: 'object',
  icon: PinIcon,
  groups: [
    {name: 'content', icon: ComposeSparklesIcon, default: true},
    {name: 'designSystem', icon: ControlsIcon},
  ],
  fields: [
    defineField({
      name: 'variant',
      title: 'Layout Variant',
      type: 'string',
      options: {
        list: [
          {title: 'Chips — tappable area pills', value: 'chips'},
          {title: 'Map — stylised map + location list', value: 'map'},
          {title: 'Directory — searchable, region-grouped', value: 'directory'},
        ],
        layout: 'radio',
      },
      initialValue: 'chips',
      group: 'content',
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      initialValue: 'Coverage',
      group: 'content',
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      initialValue: 'Areas We Cover',
      group: 'content',
    }),
    defineField({
      name: 'subheading',
      title: 'Subheading',
      type: 'text',
      rows: 2,
      group: 'content',
    }),
    defineField({
      name: 'areas',
      title: 'Areas',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'area',
          fields: [
            defineField({
              name: 'name',
              title: 'Area Name',
              type: 'string',
            }),
            defineField({
              name: 'page',
              title: 'Linked Page',
              type: 'reference',
              to: [{type: 'page'}],
              description: 'Internal page for this area',
            }),
            defineField({
              name: 'region',
              title: 'Region',
              type: 'string',
              description: 'Optional — groups this area in the Directory layout (e.g. "North county").',
            }),
          ],
          preview: {
            select: {title: 'name', page: 'page.name', region: 'region'},
            prepare({title, page, region}) {
              return {
                title: title || 'Area',
                subtitle: [region, page ? `→ ${page}` : 'No page linked'].filter(Boolean).join(' · '),
                media: PinIcon,
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'mapImage',
      title: 'Map image',
      description: 'Static map screenshot for the Map layout. Leave empty for a stylised placeholder.',
      type: 'image',
      options: {hotspot: true},
      group: 'content',
      hidden: only('map'),
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'footerNote',
      title: 'Footer note',
      description: 'e.g. "Don’t see your area?" — shown under the Chips / Map layouts.',
      type: 'string',
      group: 'content',
      hidden: only('chips', 'map'),
    }),
    defineField({
      name: 'footerButton',
      title: 'Footer button',
      type: 'button',
      group: 'content',
      hidden: only('chips', 'map'),
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
    select: {title: 'heading', areas: 'areas', variant: 'variant'},
    prepare({title, areas, variant}) {
      const labels: Record<string, string> = {chips: 'Chips', map: 'Map', directory: 'Directory'}
      const n = Array.isArray(areas) ? areas.length : 0
      return {
        title: title || 'Areas We Cover',
        subtitle: `Areas · ${labels[variant as string] || 'Chips'} · ${n}`,
        media: PinIcon,
      }
    },
  },
})
