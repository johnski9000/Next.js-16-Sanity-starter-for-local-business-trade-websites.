import {defineArrayMember, defineField, defineType} from 'sanity'

export const navItem = defineType({
  name: 'navItem',
  title: 'Nav Item',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'kind',
      title: 'Type',
      type: 'string',
      initialValue: 'link',
      options: {
        list: [
          {title: 'Link', value: 'link'},
          {title: 'Dropdown', value: 'dropdown'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'link',
      title: 'Link',
      type: 'link',
      description: 'For dropdowns: optional — makes the label itself a clickable link',
      hidden: ({parent}) => parent?.kind !== 'link' && parent?.kind !== 'dropdown',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as any
          if (parent?.kind === 'link' && !value) return 'Link is required'
          return true
        }),
    }),

    defineField({
      name: 'children',
      title: 'Dropdown items',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'navChild',
          title: 'Dropdown Item',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'string',
            }),
            defineField({
              name: 'link',
              title: 'Link',
              type: 'link',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'description',
            },
          },
        }),
      ],
      hidden: ({parent}) => parent?.kind !== 'dropdown',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as any
          if (parent?.kind === 'dropdown' && (!Array.isArray(value) || value.length === 0)) {
            return 'Add at least 1 dropdown item'
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {
      title: 'label',
      kind: 'kind',
    },
    prepare({title, kind}) {
      return {title, subtitle: kind === 'dropdown' ? 'Dropdown' : 'Link'}
    },
  },
})

export const navCta = defineType({
  name: 'navCta',
  title: 'Nav CTA',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'link', title: 'Link', type: 'link', validation: (r) => r.required()}),
    defineField({
      name: 'variant',
      title: 'Style',
      type: 'string',
      initialValue: 'primary',
      options: {
        list: [
          {title: 'Primary', value: 'primary'},
          {title: 'Secondary', value: 'secondary'},
        ],
      },
    }),
  ],
})
