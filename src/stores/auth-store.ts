import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  /** Missing on sessions saved before this field existed; the profile sync fills it in. */
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
  accessToken: string | null
  refreshToken: string | null
  /** True once the persisted store has finished rehydrating from storage —
   *  guards against a flash of "logged out" UI on first paint. */
  hasHydrated: boolean

  setSession: (session: { user: AuthUser; accessToken: string; refreshToken: string }) => void
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void
  updateUser: (patch: Partial<AuthUser>) => void
  logout: () => void
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hasHydrated: false,

      setSession: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken }),

      // Refresh rotation issues a NEW refresh token every time (see
      // POST /auth/refresh) — old one is revoked server-side immediately,
      // so the store must always hold the latest pair, never the original.
      setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),

      updateUser: (patch) =>
        set((state) => (state.user ? { user: { ...state.user, ...patch } } : state)),

      logout: () => set({ user: null, accessToken: null, refreshToken: null }),

      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: 'devcraft-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

/** Convenience selector — most components only need to know if someone is logged in. */
export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.accessToken !== null)
}
