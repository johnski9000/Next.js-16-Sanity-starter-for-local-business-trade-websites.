'use client'

import {useState, useRef} from 'react'
import {useRouter} from 'next/navigation'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import {motion, AnimatePresence} from 'framer-motion'
import {ArrowLeft, ArrowRight, Loader2, Send, AlertCircle} from 'lucide-react'

import Turnstile from '@/app/components/Turnstile'
import {Button} from '@/components/ui/button'
import {cn} from '@/lib/utils'
import {trackLeadConversion} from '@/lib/analytics'

const schema = z.object({
  service: z.string().min(1, 'Please choose a service'),
  propertyType: z.string().min(1, 'Please choose a property type'),
  message: z.string().min(10, 'Please give us a little detail (10+ characters)'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  // GDPR: explicit, unticked-by-default consent to be contacted. Required.
  consent: z.boolean().refine((v) => v === true, {
    message: 'Please confirm you’re happy for us to contact you about your enquiry',
  }),
  // Honeypot — `website_url` rather than `company` so password managers
  // and browser autofill don't recognise the field and silently trip the
  // server-side spam guard for legitimate users. Field stays unvalidated;
  // the server side (api/contact/route.ts) is the only thing that checks.
  website_url: z.string().optional(),
})
type Values = z.infer<typeof schema>

const DEFAULT_SERVICES = ['General Enquiry', 'Other / Not sure']
const PROPERTY_TYPES = ['House', 'Flat', 'Commercial', 'Other']

const inputClass = cn(
  'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900',
  'placeholder:text-gray-400 outline-none transition-all',
  'focus:border-blue focus:ring-2 focus:ring-blue/20',
  'aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-200',
)

export default function QuoteForm({
  context,
  services,
}: {
  context?: {service?: string; area?: string; sourceUrl?: string}
  services?: string[]
}) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [token, setToken] = useState('')
  // Idempotency key — dedupes the stored lead if the same enquiry is retried.
  const idemKey = useRef<string | null>(null)

  const base = services?.length ? services : DEFAULT_SERVICES
  const serviceOptions =
    context?.service && !base.includes(context.service) ? [context.service, ...base] : base

  const {
    register,
    handleSubmit,
    trigger,
    formState: {errors},
  } = useForm<Values>({
    // `as never` bridges a type-only version brand mismatch between zod 4.4 and
    // @hookform/resolvers (resolver expects zod 4.0's internal version literal).
    // Runtime is unaffected; form value types stay enforced via useForm<Values>.
    resolver: zodResolver(schema as never),
    defaultValues: {
      service: context?.service && serviceOptions.includes(context.service) ? context.service : '',
    },
  })

  const next = async () => {
    if (await trigger(['service', 'propertyType', 'message'])) setStep(2)
  }

  const onSubmit = async (data: Values) => {
    setStatus('loading')
    if (!idemKey.current && typeof crypto !== 'undefined' && crypto.randomUUID) {
      idemKey.current = crypto.randomUUID()
    }
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
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
      if (!res.ok) throw new Error('Failed')
      trackLeadConversion({service: data.service, area: context?.area})
      router.push('/quote/thanks')
    } catch {
      setStatus('error')
    }
  }

  const err = (m?: string) => m && <p className="text-xs text-red-600">{m}</p>

  // Surface a generic "please check the form" message if Step 2 submit
  // fails React-Hook-Form validation — without this the click does nothing
  // visible and the user has no idea anything's wrong.
  const onInvalid = () => {
    setStatus('error')
  }

  return (
    <form
      onSubmit={(e) => handleSubmit(onSubmit, onInvalid)(e)}
      noValidate
      className="flex flex-col gap-5"
    >
      {/* Honeypot — visually hidden, off-screen, not tab-reachable.
          Field name is `website_url` rather than `company` because Chrome
          and password managers recognise the latter as a business-name
          field and autofill it, silently tripping the server-side spam
          guard for legit users. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        {...register('website_url')}
      />

      <div className="flex items-center gap-2 text-xs font-medium text-neutral">
        <span className={step === 1 ? 'text-blue-deep' : ''}>1 · Project</span>
        <span className="h-px w-6 bg-gray-200" />
        <span className={step === 2 ? 'text-blue-deep' : ''}>2 · Your details</span>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{opacity: 0, x: -12}}
            animate={{opacity: 1, x: 0}}
            exit={{opacity: 0, x: -12}}
            transition={{duration: 0.2}}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="service" className="text-sm font-medium text-gray-700">
                Service <span className="text-blue-deep">*</span>
              </label>
              <select id="service" aria-invalid={!!errors.service} {...register('service')} className={inputClass}>
                <option value="">Select a service…</option>
                {serviceOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {err(errors.service?.message)}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-gray-700">
                Property type <span className="text-blue-deep">*</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((t) => (
                  <label
                    key={t}
                    className="cursor-pointer rounded-full border border-gray-200 px-4 py-2 text-sm has-[:checked]:border-blue has-[:checked]:bg-blue/10"
                  >
                    <input
                      type="radio"
                      value={t}
                      className="sr-only"
                      {...register('propertyType')}
                    />
                    {t}
                  </label>
                ))}
              </div>
              {err(errors.propertyType?.message)}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-sm font-medium text-gray-700">
                About the project <span className="text-blue-deep">*</span>
              </label>
              <textarea
                id="message"
                rows={4}
                placeholder="Rooms, surfaces, rough timescale…"
                aria-invalid={!!errors.message}
                {...register('message')}
                className={cn(inputClass, 'resize-none')}
              />
              {err(errors.message?.message)}
            </div>

            <Button
              type="button"
              onClick={next}
              className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-white hover:bg-brand/90"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{opacity: 0, x: 12}}
            animate={{opacity: 1, x: 0}}
            exit={{opacity: 0, x: 12}}
            transition={{duration: 0.2}}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Full name <span className="text-blue-deep">*</span>
              </label>
              <input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register('name')} className={inputClass} />
              {err(errors.name?.message)}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email <span className="text-blue-deep">*</span>
                </label>
                <input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} className={inputClass} />
                {err(errors.email?.message)}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone <span className="text-blue-deep">*</span>
                </label>
                <input id="phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} {...register('phone')} className={inputClass} />
                {err(errors.phone?.message)}
              </div>
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
                  I’m happy for my details to be used to respond to my enquiry, and I’ve read the{' '}
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
              {err(errors.consent?.message)}
            </div>

            <Turnstile onVerify={setToken} />

            {status === 'error' && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                Something went wrong. Please try again.
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setStep(1)}
                className="h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={status === 'loading'}
                className="h-11 flex-1 rounded-lg bg-brand text-sm font-semibold text-white hover:bg-brand/90"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Request my quote
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}
