'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, AlertTriangle, Info, OctagonAlert } from 'lucide-react'
import {
  getAdminUnreadCount, listAdminNotifications, markAdminNotificationRead, markAllAdminNotificationsRead,
  type AdminNotification,
} from '@/lib/api/admin-notifications'
import { timeAgo } from '@/lib/utils/notification-format'
import { cn } from '@/lib/utils'

export const SEVERITY_ICON = { info: Info, warning: AlertTriangle, critical: OctagonAlert } as const
export const SEVERITY_TONE = { info: 'text-info', warning: 'text-warning', critical: 'text-error' } as const

/** The admin console's own bell: operational alerts for admins, not the learner notifications. */
export function AdminBell() {
  const router = useRouter()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: unread } = useQuery({ queryKey: ['admin-notifications-unread'], queryFn: getAdminUnreadCount, refetchInterval: 30_000 })
  const { data: recent, isLoading } = useQuery({
    queryKey: ['admin-notifications-preview'],
    queryFn: () => listAdminNotifications({ limit: 6 }),
    enabled: open,
  })

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey) }
  }, [open])

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['admin-notifications-unread'] })
    void qc.invalidateQueries({ queryKey: ['admin-notifications-preview'] })
    void qc.invalidateQueries({ queryKey: ['admin-notifications'] })
  }

  async function openItem(n: AdminNotification) {
    setOpen(false)
    if (!n.isRead) await markAdminNotificationRead(n.id).then(refresh).catch(() => undefined)
    router.push(n.link ?? '/admin/notifications')
  }

  const count = unread?.count ?? 0
  const items = recent?.data ?? []

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={count ? `Admin alerts, ${count} unread` : 'Admin alerts'}
        aria-expanded={open}
        className="relative rounded-full p-2.5 text-dim hover:bg-card"
      >
        <Bell size={17} />
        {count > 0 && (
          <span data-testid="admin-bell-count" className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-none text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      {open && (
        <div data-testid="admin-bell-dropdown" className="absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-card shadow-elev-lg">
          <div className="flex items-center justify-between border-b border-rim-subtle px-4 py-2.5">
            <span className="text-sm font-semibold text-ink">Admin alerts</span>
            {count > 0 && (
              <button onClick={() => void markAllAdminNotificationsRead().then(refresh)} className="flex items-center gap-1 text-xs font-medium text-dim hover:text-ink">
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {isLoading && <p className="px-4 py-6 text-center text-sm text-dim">Loading...</p>}
            {!isLoading && items.length === 0 && <p className="px-4 py-6 text-center text-sm text-dim">Nothing needs attention.</p>}
            {items.map((n) => {
              const Icon = SEVERITY_ICON[n.severity]
              return (
                <button key={n.id} onClick={() => void openItem(n)} className="flex w-full items-start gap-2.5 border-b border-rim-subtle px-4 py-3 text-left last:border-b-0 hover:bg-raised">
                  <Icon size={15} className={cn('mt-0.5 shrink-0', SEVERITY_TONE[n.severity])} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className={cn('line-clamp-2 text-sm', n.isRead ? 'text-dim' : 'font-medium text-ink')}>{n.title}</span>
                    <span className="mt-0.5 block text-xs text-ghost">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                </button>
              )
            })}
          </div>
          <Link href="/admin/notifications" onClick={() => setOpen(false)} className="block border-t border-rim-subtle px-4 py-2.5 text-center text-sm font-semibold text-ink hover:bg-raised">
            View all
          </Link>
        </div>
      )}
    </div>
  )
}
