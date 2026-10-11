'use client'

import { useEffect, useRef } from 'react'
import { MailCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth-store'
import { useVerifyPromptStore } from '@/stores/verify-prompt-store'
import { useResendVerification } from '@/lib/hooks/useResendVerification'

/** Shown when the server refuses an action with EMAIL_NOT_VERIFIED. Mounted once, in the platform layout. */
export function VerifyEmailPrompt({ onRecheck }: { onRecheck: () => Promise<void> | void }) {
  const open = useVerifyPromptStore((s) => s.open)
  const hide = useVerifyPromptStore((s) => s.hide)
  const email = useAuthStore((s) => s.user?.email)
  const { resend, busy, note, wait } = useResendVerification()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') hide() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, hide])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-5" onClick={hide}>
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="verify-prompt-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-7 shadow-elev-lg outline-none"
      >
        <button type="button" onClick={hide} aria-label="Close" className="absolute right-4 top-4 text-ghost hover:text-dim"><X size={18} /></button>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-muted text-brand"><MailCheck size={22} aria-hidden /></div>
        <h2 id="verify-prompt-title" className="mt-4 font-display text-xl font-bold text-ink">Verify your email first</h2>
        <p className="mt-2 text-sm text-dim">
          Posting, submitting projects, reviewing and AI hints need a confirmed address, which keeps the community and the AI credits for real learners.
          {email && <> We sent a link to <span className="font-medium text-ink">{email}</span>.</>}
        </p>
        {note && <p className="mt-3 text-sm text-ink" aria-live="polite">{note}</p>}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" onClick={resend} disabled={busy || wait > 0}>
            {busy ? 'Sending…' : wait > 0 ? `Resend in ${wait}s` : 'Resend link'}
          </Button>
          <Button type="button" variant="outline" onClick={async () => { await onRecheck(); hide() }}>I&apos;ve verified</Button>
        </div>
      </div>
    </div>
  )
}
