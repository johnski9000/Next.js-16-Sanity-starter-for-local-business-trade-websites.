import {defineField, defineType} from 'sanity'
import {EnvelopeIcon} from '@sanity/icons'

/**
 * A website enquiry, captured from the contact / quote form and written into the
 * client's OWN dataset by the contact route (frontend/app/api/contact/route.ts →
 * persistLead). So each client sees their own leads in their own Studio.
 *
 * The enquiry fields are read-only (an immutable record of what was submitted);
 * use "Handled" + "Notes" to track your follow-up.
 */
export const lead = defineType({
  name: 'lead',
  title: 'Lead',
  type: 'document',
  icon: EnvelopeIcon,
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', readOnly: true}),
    defineField({name: 'email', title: 'Email', type: 'string', readOnly: true}),
    defineField({name: 'phone', title: 'Phone', type: 'string', readOnly: true}),
    defineField({name: 'service', title: 'Service', type: 'string', readOnly: true}),
    defineField({name: 'area', title: 'Area', type: 'string', readOnly: true}),
    defineField({name: 'propertyType', title: 'Property type', type: 'string', readOnly: true}),
    defineField({name: 'message', title: 'Message', type: 'text', rows: 5, readOnly: true}),
    defineField({name: 'sourceUrl', title: 'Submitted from', type: 'string', readOnly: true}),
    defineField({name: 'submittedAt', title: 'Submitted at', type: 'datetime', readOnly: true}),
    defineField({
      name: 'consent',
      title: 'Consent given',
      type: 'boolean',
      readOnly: true,
      description: 'Whether the enquirer ticked the consent box.',
    }),
    defineField({
      name: 'deliveryStatus',
      title: 'Email delivery',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          {title: 'Sent to you', value: 'sent'},
          {title: 'Dead-letter (forwarded via agency)', value: 'dead-letter'},
          {title: 'Failed', value: 'failed'},
        ],
      },
    }),
    defineField({
      name: 'deadLetter',
      title: 'Dead-letter',
      type: 'boolean',
      readOnly: true,
      description:
        'Set when this enquiry failed BOTH email delivery and per-client storage and was captured here as a last resort. Only appears in the control dataset (the agency console).',
    }),
    defineField({
      name: 'tenantKey',
      title: 'Tenant',
      type: 'string',
      readOnly: true,
      description: 'Which client this dead-lettered enquiry belongs to (control-dataset records only).',
    }),
    defineField({
      name: 'handled',
      title: 'Handled',
      type: 'boolean',
      description: 'Tick once you’ve followed up with this enquiry.',
      initialValue: false,
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 3,
      description: 'Your private follow-up notes (not shown to the enquirer).',
    }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'newestFirst',
      by: [{field: 'submittedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      name: 'name',
      service: 'service',
      at: 'submittedAt',
      handled: 'handled',
      status: 'deliveryStatus',
    },
    prepare({name, service, at, handled, status}) {
      const date = at ? new Date(at).toLocaleDateString('en-GB') : ''
      const flag = status && status !== 'sent' ? ` · ${status}` : ''
      return {
        title: `${name || 'Lead'}${service ? ` — ${service}` : ''}`,
        subtitle: `${handled ? '✓ handled' : '● new'}${date ? ` · ${date}` : ''}${flag}`,
      }
    },
  },
})
