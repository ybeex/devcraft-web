import { authFetch } from './auth-fetch'

// ─── Shapes (mirror the real backend's response payloads) ─────────────────────

export interface UserStats {
  xp: number
  level: number
  xpInLevel: number
  xpForNextLevel: number
  currentStreak: number
  longestStreak: number
  lessonsCompleted: number
  projectsSubmitted: number
  communityPosts: number
}

export interface ModuleProgress {
  moduleId: string
  slug: string
  title: string
  order: number
  total: number
  completed: number
  percentage: number
}

export interface TrackProgress {
  trackSlug: 'FE' | 'BE'
  trackName: string
  totalLessons: number
  completedLessons: number
  percentage: number
  modules: ModuleProgress[]
}

export interface XpEvent {
  id: string
  eventType: string
  xpAwarded: number
  description: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface LessonStatusEntry {
  lessonId: string
  slug: string
  moduleId: string
  order: number
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
}

// ─── Calls ────────────────────────────────────────────────────────────────────

export function getUserStats(): Promise<UserStats> {
  return authFetch<UserStats>('/users/me/stats')
}

export function getTrackProgress(track: 'FE' | 'BE'): Promise<TrackProgress> {
  return authFetch<TrackProgress>(`/progress/tracks/${track}`)
}

export function getRecentActivity(limit = 10): Promise<XpEvent[]> {
  return authFetch<XpEvent[]>(`/progress/activity?limit=${limit}`)
}

/**
 * Exact per-lesson completion status for a track, ordered flat by `order`.
 * See devcraft-bulk-lesson-status-module/INTEGRATION.md — this endpoint was
 * added specifically to replace the count-based heuristic that
 * `findNextLesson` previously had to use.
 */
export function getBulkLessonStatus(track: 'FE' | 'BE'): Promise<LessonStatusEntry[]> {
  return authFetch<LessonStatusEntry[]>(`/progress/tracks/${track}/lessons`)
}
