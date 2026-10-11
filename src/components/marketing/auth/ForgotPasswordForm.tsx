'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ForgotPasswordFormSchema, type ForgotPasswordFormValues } from '@/lib/schemas/auth'
import { forgotPassword } from '@/lib/api/auth'
import { easeOut } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(ForgotPasswordFormSchema) })

  async function onSubmit(values: ForgotPasswordFormValues) {
    // The backend always returns 200 here regardless of whether the email
    // exists — deliberately, to prevent email enumeration (see auth.email.ts
    // / initiateForgotPassword). The UI mirrors that: same success state
    // either way, no branching on "did this email actually exist."
    await forgotPassword(values.email)
    setSubmitted(true)
  }

  return (
    <div className="rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-7 shadow-elev-lg">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="flex flex-col items-center gap-3 py-4 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--positive-bg)] text-[var(--positive-text)]">
              <MailCheck size={22} />
            </div>
            <h1 className="font-display text-xl font-bold text-ink">Check your inbox</h1>
            <p className="text-sm text-dim">
              If that email is registered, a reset link is on its way. It expires in 1 hour.
            </p>
            <Link href="/login" className="mt-2 text-sm font-semibold text-brand hover:underline">
              Back to log in
            </Link>
          </motion.div>
        ) : (
          <motion.div key="form" exit={{ opacity: 0 }}>
            <h1 className="font-display text-2xl font-bold text-ink">Reset your password</h1>
            <p className="mt-1.5 text-sm text-dim">
              Enter the email on your account and we&apos;ll send a reset link.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-dim">Email</span>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="ada@example.com"
                  autoComplete="email"
                  className={cn(
                    'w-full rounded-[var(--radius-md)] border bg-canvas px-4 py-2.5 text-sm text-ink outline-none transition-colors',
                    'placeholder:text-ghost focus:border-brand',
                    errors.email ? 'border-error' : 'border-rim'
                  )}
                />
                {errors.email && <span className="text-xs font-medium text-error">{errors.email.message}</span>}
              </label>

              <Button type="submit" disabled={isSubmitting} className="mt-2 w-full justify-center">
                {isSubmitting ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>

            <Link
              href="/login"
              className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-dim hover:text-ink"
            >
              <ArrowLeft size={14} /> Back to log in
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
