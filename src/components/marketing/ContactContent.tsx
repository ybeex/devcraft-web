'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, AlertCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TrustBanner } from '@/components/ui/TrustBanner'
import { ContactFormSchema, type ContactFormValues } from '@/lib/schemas/contact'
import { apiFetch, ApiRequestError } from '@/lib/api/client'
import { easeOut } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

export function ContactContent() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(ContactFormSchema),
  })

  async function onSubmit(values: ContactFormValues) {
    setServerError(null)
    try {
      await apiFetch<{ message: string }>('/contact', {
        method: 'POST',
        body: values,
      })
      setSubmitted(true)
      reset()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setServerError(
          err.statusCode === 429
            ? "You've sent a few messages already — try again in a bit."
            : err.message
        )
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <section className="mesh-bg px-6 py-20">
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="text-center"
        >
          <Mail size={32} className="mx-auto text-brand" />
          <h1 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">Get in touch</h1>
          <p className="mt-2 text-dim">We read every message. Expect a reply within one business day.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
          className="mt-10 rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-7 shadow-elev-md"
        >
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: easeOut }}
                className="flex flex-col items-center gap-4 py-6 text-center"
              >
                <CheckCircle2 size={40} className="text-success" />
                <h2 className="font-ui text-lg font-semibold text-ink">Message sent</h2>
                <p className="text-sm text-dim">
                  Thanks for reaching out — we&apos;ll get back to you within one business day.
                </p>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Send another message
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
                noValidate
              >
                {serverError && (
                  <TrustBanner icon={<AlertCircle />} tone="info" className="bg-[var(--negative-bg)] text-[var(--negative-text)]">
                    {serverError}
                  </TrustBanner>
                )}

                <Field label="Name" error={errors.name?.message}>
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="Ada Lovelace"
                    className={inputClass(!!errors.name)}
                  />
                </Field>

                <Field label="Email" error={errors.email?.message}>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="ada@example.com"
                    className={inputClass(!!errors.email)}
                  />
                </Field>

                <Field label="Subject" error={errors.subject?.message}>
                  <input
                    {...register('subject')}
                    type="text"
                    placeholder="Question about the Pro plan"
                    className={inputClass(!!errors.subject)}
                  />
                </Field>

                <Field label="Message" error={errors.message?.message}>
                  <textarea
                    {...register('message')}
                    rows={5}
                    placeholder="Tell us what's on your mind..."
                    className={cn(inputClass(!!errors.message), 'resize-none')}
                  />
                </Field>

                <Button type="submit" disabled={isSubmitting} className="mt-2 w-full justify-center">
                  {isSubmitting ? 'Sending...' : 'Send message'}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-dim">{label}</span>
      {children}
      {error && <span className="text-xs font-medium text-error">{error}</span>}
    </label>
  )
}

function inputClass(hasError: boolean): string {
  return cn(
    'rounded-[var(--radius-md)] border bg-canvas px-4 py-2.5 text-sm text-ink outline-none transition-colors',
    'placeholder:text-ghost focus:border-brand',
    hasError ? 'border-error' : 'border-rim'
  )
}
