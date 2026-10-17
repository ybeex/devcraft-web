import { apiFetch } from './client'
import { authFetch } from './auth-fetch'
import type { AuthUser } from '@/stores/auth-store'

// ─── Response shapes (mirror the real backend's auth.schema.ts) ──────────────

export interface AuthSession {
  user: AuthUser
  accessToken: string
  expiresIn: number
}

// ─── Unauthenticated endpoints ─────────────────────────────────────────────────

export function registerUser(values: {
  email: string
  username: string
  password: string
  displayName: string
}, idempotencyKey?: string): Promise<AuthSession> {
  return apiFetch<AuthSession>('/auth/register', { method: 'POST', body: values, idempotencyKey })
}

export function loginUser(values: { email: string; password: string }): Promise<AuthSession> {
  return apiFetch<AuthSession>('/auth/login', { method: 'POST', body: values })
}

export function verifyEmail(token: string): Promise<{ message: string }> {
  return apiFetch('/auth/verify-email', { method: 'POST', body: { token } })
}

export function forgotPassword(email: string): Promise<{ message: string }> {
  return apiFetch('/auth/forgot-password', { method: 'POST', body: { email } })
}

export function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return apiFetch('/auth/reset-password', { method: 'POST', body: { token, newPassword } })
}

// ─── Authenticated endpoints (go through authFetch for auto-refresh) ─────────

export function resendVerification(): Promise<{ message: string }> {
  return authFetch('/auth/resend-verification', { method: 'POST' })
}

export function logoutUser(): Promise<{ message: string }> {
  return authFetch('/auth/logout', { method: 'POST', body: {} })
}

/** Full profile (xp, level, streak, tier, etc.) — GET /users/me, not the
 *  lightweight identity-only GET /auth/me. Used to rehydrate the auth store
 *  on app load when a valid access token already exists. */
export function getCurrentUser(): Promise<AuthUser> {
  return authFetch<AuthUser>('/users/me')
}
