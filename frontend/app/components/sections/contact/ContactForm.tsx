'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Loader2,
  Send,
  AlertCircle,
  ChevronDown,
} from 'lucide-react'
import Turnstile from '@/app/components/Turnstile'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { trackLeadConversion } from '@/lib/analytics'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  service: z.string().min(1, 'Please select a service'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  // GDPR: explicit, unticked-by-default consent to be contacted. Required.
  consent: z.boolean().refine((v) => v === true, {
    message: 'Please confirm you’re happy for us to contact you about your enquiry',
  }),
  // Honeypot — `website_url` rather than `company` so password managers
  // and browser autofill don't recognise the field and silently trip the
  // server-side spam guard for legitimate users.
  website_url: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type ContactFormProps = {
  block?: {
    title?: string
    intro?: string
    phone?: string
    email?: string
    location?: string
    services?: string[]
  }
  /** Page context for attributable leads (set by service/area templates). */
  context?: {service?: string; area?: string; sourceUrl?: string}
}

// Generic trade-neutral fallbacks — real options come from Sanity.
const DEFAULT_SERVICES = ['General Enquiry', 'Other / Not sure']

const TRUST_POINTS = [
  'Fully insured & guaranteed work',
  'Free, no-obligation quotes',
  'Tidy and reliable tradespeople',
  'Clear, upfront pricing',
]

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const, delay: i * 0.07 },
  }),
}

const inputClass = cn(
  'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5',
  'text-sm text-gray-900 placeholder:text-gray-400',
  'outline-none transition-all',
  'focus:border-blue focus:ring-2 focus:ring-blue/20',
  'aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-200',
)

export default function ContactForm({ block, context }: ContactFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [token, setToken] = useState('')
  // Idempotency key: stable across retries of the SAME enquiry (dedupes the stored
  // lead), rotated after a successful submit so a fresh enquiry gets a new id.
  const idemKey = useRef<string | null>(null)

  const title = block?.title || 'Get in Touch'
  const intro =
    block?.intro || "Tell us what you need and we'll get back to you as soon as we can."
  const phone = block?.phone
  const baseServices = block?.services?.length ? block.services : DEFAULT_SERVICES
  const services =
    context?.service && !baseServices.includes(context.service)
      ? [context.service, ...baseServices]
      : baseServices
  const defaultService =
    context?.service && services.includes(context.service) ? context.service : ''

  const contactInfo = [
    phone && { icon: Phone, label: phone, href: `tel:${phone.replace(/\s+/g, '')}` },
    block?.email && { icon: Mail, label: block.email, href: `mailto:${block.email}` },
    block?.location && { icon: MapPin, label: block.location, href: null },
  ].filter(Boolean) as { icon: typeof Phone; label: string; href: string | null }[]

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    // `as never` bridges a type-only zod 4.4 / @hookform/resolvers version-brand
    // mismatch (runtime unaffected; values stay typed via useForm<FormValues>).
  } = useForm<FormValues>({ resolver: zodResolver(schema as never) })

  const onSubmit = async (data: FormValues) => {
    setStatus('loading')
    if (!idemKey.current && typeof crypto !== 'undefined' && crypto.randomUUID) {
      idemKey.current = crypto.randomUUID()
    }
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          turnstileToken: token,
          idempotencyKey: idemKey.current ?? undefined,
          _context: {
            area: context?.area,
            sourceUrl:
              context?.sourceUrl ??
              (typeof window !== 'undefined' ? window.location.pathname : undefined),
          },
        }),
      })
      if (!res.ok) throw new Error('Failed to send')
      setStatus('success')
      trackLeadConversion({service: data.service, area: context?.area})
      idemKey.current = null // rotate so the next enquiry gets a fresh id
      reset()
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container">
        {/* Section header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm font-semibold tracking-widest uppercase text-blue-deep mb-2">
            Contact Us
          </p>
          <h2 className="text-4xl font-bold text-gray-900">{title}</h2>
          <p className="mt-3 text-lg text-neutral max-w-xl mx-auto">{intro}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 overflow-hidden rounded-2xl shadow-2xl">
          {/* Left panel — contact info */}
          <motion.div
            className="bg-gray-950 text-white p-10 lg:p-14 flex flex-col gap-10"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h3 className="text-2xl font-bold text-white leading-snug">
                Let&apos;s talk about your project
              </h3>
              <p className="mt-3 text-white/60 text-sm leading-relaxed">
                Get in touch for a free, no-obligation quote. We&apos;re happy to talk through
                options and timescales.
              </p>
            </div>

            {/* Contact details */}
            {contactInfo.length > 0 && (
              <ul className="space-y-4">
                {contactInfo.map(({ icon: Icon, label, href }, i) => (
                  <motion.li
                    key={label}
                    custom={i}
                    variants={itemVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="flex items-center gap-3"
                  >
                    <span className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-lg bg-blue/15 text-blue">
                      <Icon className="h-4 w-4" />
                    </span>
                    {href ? (
                      <a
                        href={href}
                        className="text-white/80 hover:text-white text-sm font-medium transition-colors"
                      >
                        {label}
                      </a>
                    ) : (
                      <span className="text-white/80 text-sm font-medium">{label}</span>
                    )}
                  </motion.li>
                ))}
              </ul>
            )}

            {/* Trust points */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
                Why choose us
              </p>
              <ul className="space-y-3">
                {TRUST_POINTS.map((point, i) => (
                  <motion.li
                    key={point}
                    custom={i}
                    variants={itemVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="h-4 w-4 text-blue flex-shrink-0" />
                    <span className="text-white/70 text-sm">{point}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Right panel — form */}
          <motion.div
            className="bg-white p-10 lg:p-14"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  className="h-full flex flex-col items-center justify-center text-center gap-4 py-16"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                >
                  <span className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900">Message sent!</h3>
                  <p className="text-neutral max-w-xs text-sm leading-relaxed">
                    Thanks for getting in touch. We&apos;ll get back to you as soon as possible.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="text-sm text-blue-deep font-medium hover:underline mt-2"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={(e) => handleSubmit(onSubmit, () => setStatus('error'))(e)}
                  noValidate
                  className="flex flex-col gap-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Honeypot — off-screen, not tab-reachable.
                      Field name is `website_url` rather than `company` because
                      Chrome and password managers recognise the latter as a
                      business-name field and autofill it, silently tripping
                      the server-side spam guard for legit users. */}
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute left-[-9999px] h-0 w-0 opacity-0"
                    {...register('website_url')}
                  />

                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Send us a message</h3>
                    <p className="text-sm text-neutral mt-1">
                      Fill in the form below and we&apos;ll be in touch shortly.
                    </p>
                  </div>

                  {status === 'error' && (
                    <div
                      role="alert"
                      aria-live="assertive"
                      className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>
                        Something went wrong. Please try again
                        {phone ? (
                          <>
                            {' '}or call us on{' '}
                            <a
                              href={`tel:${phone.replace(/\s+/g, '')}`}
                              className="font-medium underline"
                            >
                              {phone}
                            </a>
                          </>
                        ) : null}
                        .
                      </span>
                    </div>
                  )}

                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Full name <span className="text-blue-deep">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      placeholder="John Smith"
                      aria-invalid={!!errors.name}
                      {...register('name')}
                      className={inputClass}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email + Phone */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email address <span className="text-blue-deep">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="john@example.com"
                        aria-invalid={!!errors.email}
                        {...register('email')}
                        className={inputClass}
                      />
                      {errors.email && (
                        <p className="text-xs text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone number <span className="text-blue-deep">*</span>
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="07700 000000"
                        aria-invalid={!!errors.phone}
                        {...register('phone')}
                        className={inputClass}
                      />
                      {errors.phone && (
                        <p className="text-xs text-red-600">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Service */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="service" className="text-sm font-medium text-gray-700">
                      Service required <span className="text-blue-deep">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="service"
                        aria-invalid={!!errors.service}
                        defaultValue={defaultService}
                        {...register('service')}
                        className={cn(inputClass, 'appearance-none pr-9')}
                      >
                        <option value="" disabled>
                          Select a service…
                        </option>
                        {services.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    {errors.service && (
                      <p className="text-xs text-red-600">{errors.service.message}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="message" className="text-sm font-medium text-gray-700">
                      Message <span className="text-blue-deep">*</span>
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      placeholder="Tell us about your project…"
                      aria-invalid={!!errors.message}
                      {...register('message')}
                      className={cn(inputClass, 'resize-none')}
                    />
                    {errors.message && (
                      <p className="text-xs text-red-600">{errors.message.message}</p>
                    )}
                  </div>

                  {/* GDPR consent — unticked by default, required to submit */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="consent"
                      className="flex items-start gap-2.5 text-xs leading-relaxed text-gray-500"
                    >
                      <input
                        id="consent"
                        type="checkbox"
                        aria-invalid={!!errors.consent}
                        {...register('consent')}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue focus:ring-2 focus:ring-blue/30"
                      />
                      <span>
                        I’m happy for my details to be used to respond to my enquiry, and I’ve
                        read the{' '}
                        <a
                          href="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-deep underline"
                        >
                          privacy policy
                        </a>
                        .
                      </span>
                    </label>
                    {errors.consent && (
                      <p className="text-xs text-red-600">{errors.consent.message}</p>
                    )}
                  </div>

                  <Turnstile onVerify={setToken} />

                  <Button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full h-11 bg-brand hover:bg-brand/90 text-white font-semibold text-sm rounded-lg transition-all"
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>

                  {phone && (
                    <p className="text-xs text-gray-400 text-center">
                      Or call us directly:{' '}
                      <a
                        href={`tel:${phone.replace(/\s+/g, '')}`}
                        className="text-blue-deep font-medium hover:underline"
                      >
                        {phone}
                      </a>
                    </p>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
