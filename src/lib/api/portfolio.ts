import { apiFetch } from './client'
import { authFetch } from './auth-fetch'

export interface PublicPortfolio {
  user: {
    username: string
    displayName: string
    avatar: string | null
    primaryTrack: 'FE' | 'BE' | null
    tier: string
    xp: number
    level: number
    currentStreak: number
    memberSince: string
  }
  portfolio: {
    headline: string | null
    bio: string | null
    githubUrl: string | null
    linkedinUrl: string | null
    websiteUrl: string | null
    skills: unknown[]
  }
  stats: {
    projectsBuilt: number
    lessonsCompleted: number
  }
  /** Only days with at least one XP event are included — treat any date not present as zero. */
  activityHeatmap: Array<{ date: string; count: number }>
  certificates: Array<{
    id: string
    track: 'FE' | 'BE'
    verifyUrl: string
    issuedAt: string
  }>
  projects: Array<{
    id: string
    title: string
    track: string
    techStack: string[]
    difficulty: string
    liveUrl: string | null
    repoUrl: string | null
    avgScore: number | null
    submittedAt: string
  }>
}

/**
 * Public endpoint — no auth. Throws ApiRequestError (code 'NOT_FOUND' /
 * statusCode 404) for both nonexistent usernames and private portfolios —
 * deliberately indistinguishable so a caller can't probe for which case.
 */
export function getPublicPortfolio(username: string): Promise<PublicPortfolio> {
  return apiFetch<PublicPortfolio>(`/portfolio/${username}`)
}

export function updateMyPortfolio(body: {
  headline?: string
  bio?: string
  githubUrl?: string
  linkedinUrl?: string
  websiteUrl?: string
  isPublic?: boolean
  skills?: unknown[]
}): Promise<unknown> {
  return authFetch('/portfolio/me', { method: 'PUT', body, idempotencyKey: crypto.randomUUID() })
}
