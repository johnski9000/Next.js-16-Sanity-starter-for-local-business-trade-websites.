// ServicesOverview.ts

import {defineField, defineType} from 'sanity'
import {ComposeSparklesIcon, ControlsIcon, TagIcon} from '@sanity/icons'

/**
 * Services overview / directory. Auto-lists the tenant's Service documents
 * (name, summary, icon, hero image) linking to each /services/<slug> detail
 * page — so the menu stays in sync with the services themselves. The editor
 * only chooses a layout and writes the header; edit services under "Service".
 *
 * (Distinct from the manual `serviceCards` / `mainServiceGrid` blocks.)
 */
export const servicesOverview = defineType({
  name: 'servicesOverview',
  title: 'Services Overview',
  type: 'object',
  icon: TagIcon,
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
          {title: 'Directory — scannable rows', value: 'directory'},
          {title: 'Tiles — image-led tiles', value: 'tiles'},
        ],
        layout: 'radio',
      },
      initialValue: 'directory',
      group: 'content',
    }),
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string', group: 'content'}),
    defineField({name: 'title', title: 'Title', type: 'string', group: 'content'}),
    defineField({name: 'sub', title: 'Subheading', type: 'text', rows: 2, group: 'content'}),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'number',
      options: {
        list: [
          {title: '2', value: 2},
          {title: '3', value: 3},
          {title: '4', value: 4},
        ],
        layout: 'radio',
      },
      initialValue: 3,
      group: 'designSystem',
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
    select: {title: 'title', variant: 'variant'},
    prepare({title, variant}) {
      return {
        title: title || 'Services Overview',
        subtitle: `Services · ${variant === 'tiles' ? 'Tiles' : 'Directory'} (auto-listed)`,
      }
    },
  },
})
