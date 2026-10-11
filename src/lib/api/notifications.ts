import { authFetch } from './auth-fetch'

export interface Notification {
  id: string
  userId: string
  type: 'mention' | 'streak_reminder' | 'peer_review' | 'certificate' | 'system'
  payload: Record<string, unknown>
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export function getUnreadNotificationCount(): Promise<{ count: number }> {
  return authFetch<{ count: number }>('/notifications/unread-count')
}

export function listNotifications(page = 1, limit = 20): Promise<Notification[]> {
  return authFetch<Notification[]>(`/notifications?page=${page}&limit=${limit}`)
}

export function markNotificationRead(id: string): Promise<{ message: string }> {
  return authFetch(`/notifications/${id}/read`, { method: 'PATCH' })
}

export function markAllNotificationsRead(): Promise<{ message: string }> {
  return authFetch('/notifications/read-all', { method: 'PATCH' })
}
