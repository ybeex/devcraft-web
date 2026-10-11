import { authFetch } from './auth-fetch'
import type { AuthUser } from '@/stores/auth-store'

/**
 * Mirrors UpdateProfileBodySchema in the real backend's users.schema.ts.
 * Onboarding uses primaryTrack, goals and onboardingCompleted; the rest exist because
 * the backend already accepts them (profile-settings pages will use them later).
 */
export interface UpdateProfileBody {
  displayName?: string
  bio?: string
  avatar?: string
  primaryTrack?: 'FE' | 'BE'
  goals?: Array<'job-ready' | 'level-up' | 'curious' | 'career-switch'>
  /** The welcome flow was finished or skipped. One-way on the server. */
  onboardingCompleted?: true
}

export function getMe(): Promise<AuthUser> {
  return authFetch<AuthUser>('/users/me')
}

export function updateProfile(body: UpdateProfileBody): Promise<AuthUser> {
  return authFetch<AuthUser>('/users/me', { method: 'PATCH', body })
}
