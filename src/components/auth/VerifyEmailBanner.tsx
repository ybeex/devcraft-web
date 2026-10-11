'use client'

import { MailWarning } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth-store'
import { getMe } from '@/lib/api/users'
import { useResendVerification } from '@/lib/hooks/useResendVerification'

/** Dashboard reminder for accounts whose email is not verified yet. Renders nothing once it is, or while that is still unknown. */
export function VerifyEmailBanner() {
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const recheck = async () => { try { updateUser(await getMe()) } catch { /* keep showing the reminder */ } }
  const { resend, busy, note, wait } = useResendVerification()
  if (!user || user.emailVerified !== false) return null

  return (
    <div role="status" className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-rim bg-brand-muted px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <MailWarning className="mt-0.5 shrink-0 text-brand" size={20} aria-hidden />
        <div>
          <p className="text-sm font-semibold text-ink">Verify your email to unlock posting, project submissions and AI hints</p>
          <p className="mt-0.5 text-sm text-dim">
            We sent a link to <span className="font-medium text-ink">{user.email}</span>. Lessons and the playground work in the meantime.
          </p>
          {note && <p className="mt-1.5 text-sm text-ink" aria-live="polite">{note}</p>}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" size="sm" onClick={resend} disabled={busy || wait > 0}>
          {busy ? 'Sending…' : wait > 0 ? `Resend in ${wait}s` : 'Resend link'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={recheck}>I&apos;ve verified</Button>
      </div>
    </div>
  )
}
