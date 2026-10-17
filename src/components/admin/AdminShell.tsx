'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { LogOut, Moon, Sun, ArrowLeftRight } from 'lucide-react'
import { DevCraftMark } from '@/components/brand/DevCraftMark'
import { AdminNav } from './AdminNav'
import { AdminBell } from './AdminBell'
import { useAuthStore } from '@/stores/auth-store'
import { useLogout } from '@/lib/hooks/useLogout'

/**
 * The admin console's own frame. It shares nothing with the learner dashboard (no learner sidebar, no
 * learner search or bell): admins get their own navigation, their own alerts and their own log out.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const { resolvedTheme, setTheme } = useTheme()
  const { logout, busy } = useLogout()

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <header className="flex items-center gap-3 border-b border-rim-subtle bg-card px-4 py-2.5">
        <Link href="/admin" className="flex items-center gap-2.5">
          <DevCraftMark size={26} />
          <span className="font-display text-sm font-bold text-ink">DevCraft</span>
          <span className="rounded-full bg-brand-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">Admin</span>
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          <Link href="/dashboard" className="hidden items-center gap-1.5 rounded-full border border-rim px-3 py-1.5 text-xs font-medium text-dim hover:text-ink sm:flex">
            <ArrowLeftRight size={13} /> Learner view
          </Link>
          <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme" className="rounded-full p-2.5 text-dim hover:bg-raised">
            {resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <AdminBell />
          {user && <span className="hidden max-w-[10rem] truncate px-2 text-xs font-medium text-dim md:block">{user.displayName}</span>}
          <button
            onClick={() => void logout()}
            disabled={busy}
            data-testid="admin-logout"
            className="flex items-center gap-1.5 rounded-full border border-rim px-3 py-1.5 text-xs font-semibold text-ink hover:bg-raised disabled:opacity-60"
          >
            <LogOut size={14} /> {busy ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </header>

      <div className="border-b border-rim-subtle bg-canvas lg:hidden">
        <AdminNav orientation="horizontal" />
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-rim-subtle bg-card lg:block">
          <AdminNav orientation="vertical" />
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
