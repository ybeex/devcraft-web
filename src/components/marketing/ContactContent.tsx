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
import { Eyebrow, GradientText, Reveal, SpotlightCard } from '@/components/marketing/primitives'

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
    <section className="aurora aurora-animate grain relative overflow-hidden px-6 py-24">
      <div aria-hidden className="bg-grid mask-radial-fade pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative z-[2] mx-auto max-w-lg">
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <Eyebrow>Say hello</Eyebrow>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="relative mt-8">
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)] blur-lg"
              />
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rim-subtle bg-card shadow-elev-md">
                <Mail size={26} className="text-brand" />
              </span>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <h1 className="mt-5 text-balance font-display text-3xl font-bold leading-[1.1] text-ink sm:text-4xl">
              Get <GradientText>in touch</GradientText>
            </h1>
          </Reveal>
          <Reveal delay={0.18}>
            <p className="mt-2 text-balance text-dim">
              We read every message. Expect a reply within one business day.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.24} className="mt-10">
          <SpotlightCard className="p-7">
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

                  <Button type="submit" disabled={isSubmitting} className="shine mt-2 w-full justify-center">
                    {isSubmitting ? 'Sending...' : 'Send message'}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </SpotlightCard>
        </Reveal>
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
