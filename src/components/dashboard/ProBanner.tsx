'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

const KEY = 'devcraft-pro-banner-dismissed'

/**
 * A slim reminder while a Pro trial (or a code) is about to run out. Quiet by default: it only appears in the
 * last 3 days of time-limited Pro, and a dismissal lasts for the day.
 */
export function ProBanner() {
  const user = useAuthStore((s) => s.user)
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem(KEY) === new Date().toDateString() } catch { return false }
  })
  if (hidden || !user?.proUntil || user.tier !== 'PRO') return null
  const msLeft = new Date(user.proUntil).getTime() - Date.now()
  if (msLeft <= 0 || msLeft > 3 * 86_400_000) return null
  const days = Math.max(1, Math.ceil(msLeft / 86_400_000))
  const what = user.proSource === 'TRIAL' ? 'Your Pro trial' : 'Your Pro access'

  return (
    <div role="status" className="flex items-center gap-3 border-b border-rim-subtle bg-brand-muted px-5 py-2 text-sm text-ink">
      <Sparkles size={14} className="shrink-0 text-brand" aria-hidden />
      <p className="min-w-0 flex-1">
        {what} ends in {days} day{days === 1 ? '' : 's'}.{' '}
        <Link href="/pro" className="font-semibold underline underline-offset-2">Redeem a code</Link> or{' '}
        <Link href="/pricing" className="font-semibold underline underline-offset-2">see plans</Link>.
      </p>
      <button
        aria-label="Dismiss"
        onClick={() => { try { localStorage.setItem(KEY, new Date().toDateString()) } catch { /* ignore */ } setHidden(true) }}
        className="shrink-0 rounded p-1 text-dim hover:text-ink"
      >
        <X size={14} />
      </button>
    </div>
  )
}
