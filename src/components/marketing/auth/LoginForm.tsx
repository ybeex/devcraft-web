'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TrustBanner } from '@/components/ui/TrustBanner'
import { LoginFormSchema, type LoginFormValues } from '@/lib/schemas/auth'
import { loginUser } from '@/lib/api/auth'
import { ApiRequestError } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth-store'
import { easeOut } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

export function LoginForm() {
  const router = useRouter()
  const setSession = useAuthStore((s) => s.setSession)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(LoginFormSchema) })

  async function onSubmit(values: LoginFormValues) {
    setServerError(null)
    try {
      const session = await loginUser(values)
      setSession(session)
      router.push(getLoginDestination(session.user))
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setServerError(
          err.code === 'UNAUTHORIZED'
            ? 'Incorrect email or password.'
            : err.code === 'TOO_MANY_REQUESTS'
              ? err.message // account-lockout message from the backend, includes wait time
              : err.message
        )
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
      <h1 className="font-display text-2xl font-bold text-ink">Welcome back</h1>
      <p className="mt-1.5 text-sm text-dim">Pick up right where you left off.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        {serverError && (
          <TrustBanner icon={<AlertCircle />} className="bg-[var(--negative-bg)] text-[var(--negative-text)]">
            {serverError}
          </TrustBanner>
        )}

        <Field label="Email" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            placeholder="ada@example.com"
            autoComplete="email"
            className={inputClass(!!errors.email)}
          />
        </Field>

        <Field
          label="Password"
          error={errors.password?.message}
          trailing={
            <Link href="/forgot-password" className="text-xs font-semibold text-brand hover:underline">
              Forgot password?
            </Link>
          }
        >
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Your password"
              autoComplete="current-password"
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

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full justify-center">
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-dim">
        New to DevCraft?{' '}
        <Link href="/register" className="font-semibold text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </motion.div>
  )
}

function getLoginDestination(user: { role: 'USER' | 'MODERATOR' | 'ADMIN'; onboardedAt?: string | null }): string {
  if (user.role === 'ADMIN' && user.onboardedAt !== null) return '/admin'
  // Someone who closed the tab mid-onboarding gets the welcome flow; everyone else goes straight in.
  return user.onboardedAt === null ? '/onboarding' : '/dashboard'
}

function Field({
  label,
  error,
  trailing,
  children,
}: {
  label: string
  error?: string
  trailing?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-dim">{label}</span>
        {trailing}
      </span>
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
