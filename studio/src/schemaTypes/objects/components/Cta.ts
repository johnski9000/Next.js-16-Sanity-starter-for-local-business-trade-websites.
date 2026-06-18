import {defineField, defineType, defineArrayMember} from 'sanity'
import {ComposeSparklesIcon, ControlsIcon, ArrowRightIcon} from '@sanity/icons'

/** Hide a field unless the chosen variant is in the list. */
const only =
  (...variants: string[]) =>
  ({parent}: {parent?: {variant?: string}}) =>
    !variants.includes(parent?.variant ?? 'standard')

export const cta = defineType({
  name: 'cta',
  title: 'CTA',
  type: 'object',
  icon: ArrowRightIcon,
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
          {title: 'Standard — centred restatement + buttons', value: 'standard'},
          {title: 'Band — full-bleed brand band + trust line', value: 'band'},
          {title: 'Phone — emergency band, tappable number (uses your phone)', value: 'phone'},
          {title: 'Form — split copy + quote form', value: 'form'},
        ],
        layout: 'radio',
      },
      initialValue: 'standard',
      group: 'content',
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      group: 'content',
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
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
      name: 'primaryButton',
      title: 'Primary Button',
      description: 'Standard / Band: the main CTA. Phone / Form: optional “prefer to talk” link.',
      type: 'button',
      group: 'content',
    }),
    defineField({
      name: 'secondaryButton',
      title: 'Secondary Button',
      description: 'Standard / Band: secondary CTA. Phone: the “not urgent” link.',
      type: 'button',
      group: 'content',
    }),
    defineField({
      name: 'trustItems',
      title: 'Trust line items',
      type: 'array',
      group: 'content',
      hidden: only('band'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'ctaTrustItem',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {
                list: [
                  {title: 'Clock', value: 'Clock'},
                  {title: 'Shield Check', value: 'Shield'},
                  {title: 'Check', value: 'Check'},
                ],
              },
              initialValue: 'Check',
            }),
            defineField({name: 'label', title: 'Label', type: 'string'}),
          ],
          preview: {select: {title: 'label', subtitle: 'icon'}},
        }),
      ],
    }),
    defineField({
      name: 'theme',
      title: 'Theme',
      description: 'Applies to the Standard variant (Band is always brand; Phone is always dark).',
      type: 'string',
      options: {
        list: [
          {title: 'Brand', value: 'brand'},
          {title: 'Dark', value: 'dark'},
          {title: 'Light', value: 'light'},
        ],
        layout: 'radio',
      },
      initialValue: 'brand',
      group: 'designSystem',
      hidden: only('standard'),
    }),
    defineField({
      name: 'textAlignment',
      title: 'Text Alignment',
      type: 'string',
      options: {
        list: [
          {title: 'Center', value: 'center'},
          {title: 'Left', value: 'left'},
        ],
        layout: 'radio',
      },
      initialValue: 'center',
      group: 'designSystem',
      hidden: only('standard'),
    }),
  ],
  preview: {
    select: {title: 'heading', subtitle: 'subheading', variant: 'variant'},
    prepare({title, subtitle, variant}) {
      const labels: Record<string, string> = {
        standard: 'Standard',
        band: 'Band',
        phone: 'Phone',
        form: 'Form',
      }
      return {
        title: title || 'CTA',
        subtitle: `CTA · ${labels[variant as string] || 'Standard'}${subtitle ? ` · ${subtitle}` : ''}`,
        media: ArrowRightIcon,
      }
    },
  },
})
