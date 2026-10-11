'use client'

import { useCallback, useEffect, useState } from 'react'
import { resendVerification } from '@/lib/api/auth'
import { ApiRequestError } from '@/lib/api/client'

const COOLDOWN_SECS = 60 // matches the server's per-account cooldown

/** Resend the verification email, with a visible cooldown so people do not hammer a button that will answer 429. */
export function useResendVerification() {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [wait, setWait] = useState(0)

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  const resend = useCallback(async () => {
    setBusy(true)
    setNote(null)
    try {
      await resendVerification()
      setNote('A new link is on its way. Check your inbox, and your spam folder.')
      setWait(COOLDOWN_SECS)
    } catch (err) {
      if (err instanceof ApiRequestError && err.statusCode === 429) {
        setNote('A link was sent a moment ago. Give it a minute to arrive.')
        setWait(COOLDOWN_SECS)
      } else if (err instanceof ApiRequestError && err.message.includes('already verified')) {
        setNote('This address is already verified. Refresh to continue.')
      } else {
        setNote('Could not send a new link. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }, [])

  return { resend, busy, note, wait }
}
