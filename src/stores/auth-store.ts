import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiFetch, ApiRequestError } from '@/lib/api/client'

/**
 * Mirrors the PublicUserSchema shape returned by POST /auth/login and
 * POST /auth/register in the real backend (auth.schema.ts) — kept in sync
 * by hand since the FE has no shared-types package with the API yet.
 */
export interface AuthUser {
  id: string
  email: string
  username: string
  displayName: string
  avatar: string | null
  primaryTrack: 'FE' | 'BE' | null
  role: 'USER' | 'MODERATOR' | 'ADMIN'
  tier: 'FREE' | 'PRO' | 'TEAM'
  /** End of time-limited Pro (trial, code or reward). null/missing = none. */
  proUntil?: string | null
  proSource?: 'TRIAL' | 'CODE' | 'REWARD' | 'ADMIN' | null
  /** Missing on sessions saved before this field existed; the profile sync fills it in. */
  bio?: string | null
  emailVerified?: boolean
  /** null = the welcome flow was never finished or skipped. Missing = not known yet. */
  onboardedAt?: string | null
  /** What the learner wants from DevCraft; drives which lessons are suggested first. */
  goals?: string[]
  /** Placement result per track, set by the placement check. Missing/null = never placed. */
  placement?: Record<string, { startModuleSlug: string | null; level: 'beginner' | 'intermediate' | 'advanced'; takenAt: string }> | null
  xp: number
  level: number
  currentStreak: number
  createdAt: string
}

interface AuthState {
  user: AuthUser | null
  /** Lives in memory only. The refresh token is an httpOnly cookie that scripts cannot read. */
  accessToken: string | null
  /** True once the saved profile has loaded AND the silent sign-in (cookie refresh) has finished, so layouts
   *  never flash "logged out" while a valid session is being restored. */
  hasHydrated: boolean

  setSession: (session: { user: AuthUser; accessToken: string }) => void
  setTokens: (tokens: { accessToken: string }) => void
  updateUser: (patch: Partial<AuthUser>) => void
  logout: () => void
  setHasHydrated: (state: boolean) => void
}

/** A refresh token saved in localStorage by an earlier version. Used once to move the session to the cookie. */
let legacyRefreshToken: string | null = null

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Restores the session on page load: the profile comes from storage, the access token from one call to
 * /auth/refresh that carries the httpOnly cookie. Only a definitive 401/403 ends the session; a network blip
 * is retried a couple of times and otherwise leaves the saved profile alone.
 */
async function restoreSession(): Promise<void> {
  const { user } = useAuthStore.getState()
  if (user) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await apiFetch<{ accessToken: string }>('/auth/refresh', {
          method: 'POST',
          body: legacyRefreshToken ? { refreshToken: legacyRefreshToken } : {},
        })
        legacyRefreshToken = null
        useAuthStore.setState({ accessToken: r.accessToken })
        break
      } catch (err) {
        if (err instanceof ApiRequestError && (err.statusCode === 401 || err.statusCode === 403)) {
          legacyRefreshToken = null
          useAuthStore.getState().logout()
          break
        }
        await sleep(600 * (attempt + 1))
      }
    }
  }
  useAuthStore.getState().setHasHydrated(true)
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      hasHydrated: false,

      setSession: ({ user, accessToken }) => set({ user, accessToken }),

      // Refresh rotates the cookie on the server; the page only ever holds the latest access token.
      setTokens: ({ accessToken }) => set({ accessToken }),

      updateUser: (patch) =>
        set((state) => (state.user ? { user: { ...state.user, ...patch } } : state)),

      logout: () => set({ user: null, accessToken: null }),

      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: 'devcraft-auth',
      // Tokens are never written to storage: only the profile used for the first paint.
      partialize: (s) => ({ user: s.user }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as { user?: AuthUser | null; refreshToken?: string | null }
        if (typeof saved.refreshToken === 'string') legacyRefreshToken = saved.refreshToken
        return { ...current, user: saved.user ?? null }
      },
      // Storage is synchronous, so this can run before `useAuthStore` is assigned: defer one tick.
      onRehydrateStorage: () => () => {
        setTimeout(() => void restoreSession(), 0)
      },
    }
  )
)

/** Convenience selector — most components only need to know if someone is logged in. */
export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.accessToken !== null)
}
