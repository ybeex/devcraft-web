'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TrustBanner } from '@/components/ui/TrustBanner'
import { RegisterFormSchema, type RegisterFormValues } from '@/lib/schemas/auth'
import { registerUser } from '@/lib/api/auth'
import { ApiRequestError } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth-store'
import { easeOut } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

export function RegisterForm() {
  const router = useRouter()
  const setSession = useAuthStore((s) => s.setSession)
  // Marketing track pages link here with ?track=fe|be so the visitor is not asked again.
  const trackParam = useSearchParams().get('track')?.toLowerCase()
  const track = trackParam === 'fe' || trackParam === 'be' ? trackParam : null
  // One key per form: a double click or a network retry replays the same registration instead of failing as a duplicate.
  const idempotencyKey = useRef(crypto.randomUUID())
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(RegisterFormSchema) })

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null)
    try {
      const session = await registerUser(values, idempotencyKey.current)
      setSession(session)
      // First-time flow: onboarding chooses a track and introduces the AI
      // tutor before the dashboard proper (Design Philosophy §15).
      router.push(track ? `/onboarding?track=${track}` : '/onboarding')
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.code === 'CONFLICT') {
          // Put the problem on the field that caused it instead of a banner at the top.
          const field = /username/i.test(err.message) ? 'username' : 'email'
          setError(field, { message: err.message })
        } else if (err.code === 'TOO_MANY_REQUESTS') {
          const mins = Math.max(1, Math.ceil(Number(err.details?.['resetMs'] ?? 60_000) / 60_000))
          setServerError(`Too many sign-up attempts from this network. Try again in about ${mins} minute${mins === 1 ? '' : 's'}.`)
        } else {
          setServerError(err.message)
        }
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeOut }}
      className="rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-7 shadow-elev-lg"
    >
      <h1 className="font-display text-2xl font-bold text-ink">Create your account</h1>
      <p className="mt-1.5 text-sm text-dim">Core curriculum is free, forever. No card required.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        {serverError && (
          <TrustBanner icon={<AlertCircle />} className="bg-[var(--negative-bg)] text-[var(--negative-text)]">
            {serverError}
          </TrustBanner>
        )}

        <Field label="Full name" error={errors.displayName?.message}>
          <input
            {...register('displayName')}
            type="text"
            placeholder="Ada Lovelace"
            autoComplete="name"
            className={inputClass(!!errors.displayName)}
          />
        </Field>

        <Field label="Username" error={errors.username?.message}>
          <input
            {...register('username')}
            type="text"
            placeholder="adalovelace"
            autoComplete="username"
            className={inputClass(!!errors.username)}
          />
        </Field>

        <Field label="Email" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            placeholder="ada@example.com"
            autoComplete="email"
            className={inputClass(!!errors.email)}
          />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              autoComplete="new-password"
              className={cn(inputClass(!!errors.password), 'pr-10')}
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
        </Field>

        <p className="-mt-2 text-xs text-ghost">At least 8 characters, with an uppercase letter, a lowercase letter and a number.</p>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full justify-center">
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-ghost">
        By creating an account you agree to the{' '}
        <Link href="/legal/terms" className="underline hover:text-dim">Terms</Link> and{' '}
        <Link href="/legal/privacy" className="underline hover:text-dim">Privacy Policy</Link>.
      </p>

      <p className="mt-6 text-center text-sm text-dim">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Log in
        </Link>
      </p>
    </motion.div>
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
    'w-full rounded-[var(--radius-md)] border bg-canvas px-4 py-2.5 text-sm text-ink outline-none transition-colors',
    'placeholder:text-ghost focus:border-brand',
    hasError ? 'border-error' : 'border-rim'
  )
}
