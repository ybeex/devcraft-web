'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCheck } from 'lucide-react'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { SEVERITY_ICON, SEVERITY_TONE } from '@/components/admin/AdminBell'
import { listAdminNotifications, markAdminNotificationRead, markAllAdminNotificationsRead } from '@/lib/api/admin-notifications'
import { timeAgo } from '@/lib/utils/notification-format'
import { cn } from '@/lib/utils'

export default function AdminNotificationsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)
  const unreadOnly = filter === 'Unread'
  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications', filter, page],
    queryFn: () => listAdminNotifications({ page, limit: 20, unreadOnly }),
  })
  const items = data?.data ?? []
  const totalPages = (data?.meta as { totalPages?: number } | undefined)?.totalPages ?? 1

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['admin-notifications'] })
    void qc.invalidateQueries({ queryKey: ['admin-notifications-unread'] })
    void qc.invalidateQueries({ queryKey: ['admin-notifications-preview'] })
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Admin alerts</h1>
          <p className="mt-1 text-sm text-dim">Submissions to review, content conflicts, AI provider trouble and Pro rewards.</p>
        </div>
        <div className="flex items-center gap-2">
          <SegmentedControl options={['All', 'Unread']} value={filter} onChange={(v) => { setFilter(v); setPage(1) }} />
          <Button size="sm" variant="outline" onClick={() => void markAllAdminNotificationsRead().then(refresh)}><CheckCheck size={13} /> Mark all read</Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {isLoading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-[var(--radius-lg)]" />)}
        {!isLoading && items.length === 0 && <EmptyState icon={<CheckCheck size={40} className="text-ghost" />} headline={unreadOnly ? 'No unread alerts' : 'No alerts yet'} body="Operational events show up here as they happen." />}
        {items.map((n) => {
          const Icon = SEVERITY_ICON[n.severity]
          const body = (
            <div className={cn('flex items-start gap-3 rounded-[var(--radius-lg)] border border-rim-subtle bg-card px-4 py-3', !n.isRead && 'border-l-2 border-l-brand')}>
              <Icon size={16} className={cn('mt-0.5 shrink-0', SEVERITY_TONE[n.severity])} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm', n.isRead ? 'text-dim' : 'font-semibold text-ink')}>{n.title}</p>
                {n.body && <p className="mt-0.5 text-xs text-dim">{n.body}</p>}
                <p className="mt-1 text-xs text-ghost">{timeAgo(n.createdAt)} · {n.kind}</p>
              </div>
            </div>
          )
          return n.link ? (
            <Link key={n.id} href={n.link} onClick={() => { if (!n.isRead) void markAdminNotificationRead(n.id).then(refresh) }}>{body}</Link>
          ) : (
            <button key={n.id} className="text-left" onClick={() => { if (!n.isRead) void markAdminNotificationRead(n.id).then(refresh) }}>{body}</button>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-xs text-dim">Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}
