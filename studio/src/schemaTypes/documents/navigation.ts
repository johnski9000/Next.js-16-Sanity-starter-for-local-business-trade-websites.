import {MenuIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const navigation = defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  icon: MenuIcon,
  fields: [
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'Displayed in the header. Leave blank to show the site title as text.',
      options: {hotspot: false},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          initialValue: 'Site logo',
        }),
      ],
    }),
    defineField({
      name: 'items',
      title: 'Nav Items',
      type: 'array',
      of: [defineArrayMember({type: 'navItem'})],
    }),
    defineField({
      name: 'cta',
      title: 'CTA Button',
      type: 'navCta',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Navigation'}
    },
  },
})
