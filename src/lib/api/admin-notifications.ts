import { authFetch, authFetchWithMeta } from './auth-fetch'

export interface AdminNotification {
  id: string
  kind: 'submission' | 'conflict' | 'contact' | 'ai-provider' | 'pro-rewards' | 'system'
  severity: 'info' | 'warning' | 'critical'
  title: string
  body: string | null
  link: string | null
  createdAt: string
  isRead: boolean
}

export const getAdminUnreadCount = () => authFetch<{ count: number }>('/admin/notifications/unread-count')
export const listAdminNotifications = (opts: { page?: number; limit?: number; unreadOnly?: boolean } = {}) => {
  const qs = new URLSearchParams({ page: String(opts.page ?? 1), limit: String(opts.limit ?? 20), unreadOnly: String(!!opts.unreadOnly) })
  return authFetchWithMeta<AdminNotification[]>(`/admin/notifications?${qs}`)
}
export const markAdminNotificationRead = (id: string) => authFetch(`/admin/notifications/${id}/read`, { method: 'POST' })
export const markAllAdminNotificationsRead = () => authFetch('/admin/notifications/read-all', { method: 'POST' })
