'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { resendVerification, verifyEmail } from '@/lib/api/auth'
import { ApiRequestError } from '@/lib/api/client'

type State = 'verifying' | 'verified' | 'failed'

export function VerifyEmailStatus() {
  const token = useSearchParams().get('token')
  const [state, setState] = useState<State>(token ? 'verifying' : 'failed')
  const [message, setMessage] = useState<string>(token ? '' : 'This link is missing its token.')
  const [resend, setResend] = useState<{ busy: boolean; note: string | null }>({ busy: false, note: null })
  // Verification links work once. React Strict Mode runs effects twice in development, which would burn
  // the token on the first call and show "invalid" on the second, so the request is sent exactly once.
  const sent = useRef(false)

  useEffect(() => {
    if (!token || sent.current) return
    sent.current = true
    verifyEmail(token)
      .then(() => setState('verified'))
      .catch((err: unknown) => {
        setState('failed')
        setMessage(err instanceof ApiRequestError ? err.message : 'Something went wrong. Please try again.')
      })
  }, [token])

  async function onResend() {
    setResend({ busy: true, note: null })
    try {
      await resendVerification()
      setResend({ busy: false, note: 'A new link is on its way. Check your inbox.' })
    } catch (err) {
      const note =
        err instanceof ApiRequestError && err.statusCode === 401
          ? 'Sign in first, then ask for a new link.'
          : err instanceof ApiRequestError
            ? err.message
            : 'Could not send a new link. Please try again.'
      setResend({ busy: false, note })
    }
  }

  return (
    <div className="rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-7 text-center shadow-elev-lg" aria-live="polite">
      {state === 'verifying' && (
        <>
          <Loader2 className="mx-auto animate-spin text-brand" size={28} />
          <h1 className="mt-4 font-display text-xl font-bold text-ink">Verifying your email…</h1>
        </>
      )}

      {state === 'verified' && (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--positive-bg)] text-[var(--positive-text)]">
            <CheckCircle2 size={22} />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold text-ink">Email verified</h1>
          <p className="mt-2 text-sm text-dim">Thanks. Your address is confirmed.</p>
          <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            Continue to sign in
          </Link>
        </>
      )}

      {state === 'failed' && (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--negative-bg)] text-[var(--negative-text)]">
            <AlertCircle size={22} />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold text-ink">This link did not work</h1>
          <p className="mt-2 text-sm text-dim">{message || 'The link is invalid or has expired.'} Links work once and expire after 24 hours.</p>
          <div className="mt-4 flex flex-col items-center gap-2">
            <Button type="button" onClick={onResend} disabled={resend.busy}>
              {resend.busy ? 'Sending…' : 'Send me a new link'}
            </Button>
            {resend.note && <p className="text-sm text-dim">{resend.note}</p>}
            <Link href="/login" className="text-sm font-semibold text-brand hover:underline">Back to sign in</Link>
          </div>
        </>
      )}
    </div>
  )
}
