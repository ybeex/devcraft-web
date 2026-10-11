'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TrustBanner } from '@/components/ui/TrustBanner'
import { ResetPasswordFormSchema, type ResetPasswordFormValues } from '@/lib/schemas/auth'
import { resetPassword } from '@/lib/api/auth'
import { ApiRequestError } from '@/lib/api/client'
import { easeOut } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

export function ResetPasswordForm() {
  const token = useSearchParams().get('token')
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(ResetPasswordFormSchema) })

  async function onSubmit(values: ResetPasswordFormValues) {
    if (!token) return
    setServerError(null)
    try {
      await resetPassword(token, values.password)
      setSubmitted(true)
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError
          ? err.message // "Reset token is invalid or has expired" from the backend
          : 'Something went wrong. Please try again.'
      )
    }
  }

  if (!token) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-7 text-center shadow-elev-lg">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--negative-bg)] text-[var(--negative-text)]">
          <AlertCircle size={22} />
        </div>
        <h1 className="mt-4 font-display text-xl font-bold text-ink">Invalid reset link</h1>
        <p className="mt-2 text-sm text-dim">This link is missing its token. Request a new one below.</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
          Request a new link
        </Link>
      </div>
    )
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
              <CheckCircle2 size={22} />
            </div>
            <h1 className="font-display text-xl font-bold text-ink">Password reset</h1>
            <p className="text-sm text-dim">
              Your password has been changed. For your security, you&apos;ll need to log in again on all
              devices.
            </p>
            <Link href="/login" className="mt-2 w-full">
              <Button className="w-full justify-center">Log in</Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div key="form" exit={{ opacity: 0 }}>
            <h1 className="font-display text-2xl font-bold text-ink">Set a new password</h1>
            <p className="mt-1.5 text-sm text-dim">Make it something you haven&apos;t used before.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
              {serverError && (
                <TrustBanner icon={<AlertCircle />} className="bg-[var(--negative-bg)] text-[var(--negative-text)]">
                  {serverError}
                </TrustBanner>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-dim">New password</span>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className={cn(
                      'w-full rounded-[var(--radius-md)] border bg-canvas px-4 py-2.5 pr-10 text-sm text-ink outline-none transition-colors',
                      'placeholder:text-ghost focus:border-brand',
                      errors.password ? 'border-error' : 'border-rim'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ghost hover:text-dim"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <span className="text-xs font-medium text-error">{errors.password.message}</span>}
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-dim">Confirm password</span>
                <input
                  {...register('confirmPassword')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Type it again"
                  autoComplete="new-password"
                  className={cn(
                    'w-full rounded-[var(--radius-md)] border bg-canvas px-4 py-2.5 text-sm text-ink outline-none transition-colors',
                    'placeholder:text-ghost focus:border-brand',
                    errors.confirmPassword ? 'border-error' : 'border-rim'
                  )}
                />
                {errors.confirmPassword && (
                  <span className="text-xs font-medium text-error">{errors.confirmPassword.message}</span>
                )}
              </label>

              <Button type="submit" disabled={isSubmitting} className="mt-2 w-full justify-center">
                {isSubmitting ? 'Resetting...' : 'Reset password'}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
