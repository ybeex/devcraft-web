'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCheck, Bell } from 'lucide-react'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { listNotifications, markNotificationRead, markAllNotificationsRead, type Notification } from '@/lib/api/notifications'
import { NOTIFICATION_ICON, timeAgo, getMessage, getLink } from '@/lib/utils/notification-format'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'


export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const [markingAll, setMarkingAll] = useState(false)
  const [readingIds, setReadingIds] = useState<Set<string>>(new Set())

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) => listNotifications(pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.length === 20 ? allPages.length + 1 : undefined),
  })

  const notifications = data?.pages.flat() ?? []
  const hasUnread = notifications.some((n) => !n.isRead)

  async function handleMarkRead(n: Notification) {
    if (n.isRead || readingIds.has(n.id)) return
    setReadingIds((prev) => new Set(prev).add(n.id))
    try {
      await markNotificationRead(n.id)
      queryClient.setQueryData<InfiniteData<Notification[], number>>(['notifications'], (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page) => page.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))),
            }
          : old
      )
    } finally {
      setReadingIds((prev) => {
        const next = new Set(prev)
        next.delete(n.id)
        return next
      })
    }
  }

  async function handleMarkAll() {
    setMarkingAll(true)
    try {
      await markAllNotificationsRead()
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Notifications</h1>
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={markingAll}>
            <CheckCheck size={14} /> {markingAll ? 'Marking...' : 'Mark all read'}
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="mt-8 flex flex-col gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={<Bell size={56} strokeWidth={1.25} className="text-ghost" />}
            headline="You're all caught up"
            body="Mentions, peer reviews, and streak reminders will show up here."
          />
        </div>
      )}

      {!isLoading && notifications.length > 0 && (
        <motion.div variants={cascadeContainer} initial="initial" animate="animate" className="mt-8 flex flex-col gap-2">
          {notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} onRead={() => handleMarkRead(n)} />
          ))}
        </motion.div>
      )}

      {hasNextPage && (
        <div className="mt-5 flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  )
}

function NotificationRow({ notification, onRead }: { notification: Notification; onRead: () => void }) {
  const link = getLink(notification)

  const inner = (
    <motion.div
      variants={cascadeItem}
      className={cn(
        'flex items-start gap-3 rounded-[var(--radius-lg)] border px-4 py-3.5 transition-colors',
        notification.isRead ? 'border-rim-subtle bg-card' : 'border-brand/30 bg-brand-muted',
        link && 'hover:border-rim'
      )}
    >
      <FeatureIcon name={NOTIFICATION_ICON[notification.type] ?? 'xpGem'} size={32} />
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', notification.isRead ? 'text-dim' : 'font-medium text-ink')}>{getMessage(notification)}</p>
        <p className="mt-1 text-xs text-ghost">{timeAgo(notification.createdAt)}</p>
      </div>
      {!notification.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />}
    </motion.div>
  )

  if (link) {
    return (
      <Link href={link} onClick={onRead} className="block">
        {inner}
      </Link>
    )
  }

  return (
    <button onClick={onRead} disabled={notification.isRead} className="block w-full text-left disabled:cursor-default">
      {inner}
    </button>
  )
}
