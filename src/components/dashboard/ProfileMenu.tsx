'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Briefcase, LogOut, User } from 'lucide-react'
import { useLogout } from '@/lib/hooks/useLogout'
import { useAuthStore } from '@/stores/auth-store'
import { easeOut } from '@/lib/motion/variants'

const initials = (name: string): string => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

/** The avatar button in the header: Profile, Portfolio and Log out live here instead of the sidebar. */
export function ProfileMenu() {
  const user = useAuthStore((s) => s.user)
  const { logout, busy } = useLogout()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent): void => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  if (!user) return null
  const item = 'flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-ink hover:bg-raised'
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Your account"
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="profile-menu-button"
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-muted text-xs font-bold text-brand"
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt={user.displayName} className="h-full w-full object-cover" />
        ) : initials(user.displayName)}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            data-testid="profile-menu"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: easeOut }}
            className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-1.5 shadow-elev-lg"
          >
            <div className="border-b border-rim-subtle px-3 pb-2 pt-1.5">
              <p className="truncate text-sm font-semibold text-ink">{user.displayName}</p>
              <p className="truncate text-xs text-ghost">@{user.username}</p>
            </div>
            <div className="pt-1.5">
              <Link role="menuitem" href="/profile" onClick={() => setOpen(false)} className={item}><User size={15} /> Profile</Link>
              <Link role="menuitem" href={`/p/${user.username}`} onClick={() => setOpen(false)} className={item}><Briefcase size={15} /> Portfolio</Link>
              <button role="menuitem" type="button" onClick={() => void logout()} disabled={busy} className={`${item} disabled:opacity-60`}>
                <LogOut size={15} /> {busy ? 'Logging out…' : 'Log out'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
