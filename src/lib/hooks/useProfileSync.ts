'use client'

import { useCallback, useEffect } from 'react'
import { getMe } from '@/lib/api/users'
import { useAuthStore } from '@/stores/auth-store'

/**
 * The persisted session can be stale: it is saved at login, but the track, verification state and
 * onboarding state change on the server afterwards (verifying in another tab, finishing onboarding on
 * another device). Pull the current profile once the session is ready, and again when the tab regains
 * focus while the email is still unverified, so the reminder disappears as soon as the learner returns
 * from their inbox.
 */
export function useProfileSync() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const hasToken = useAuthStore((s) => !!s.accessToken)
  const unverified = useAuthStore((s) => s.user?.emailVerified === false)
  const updateUser = useAuthStore((s) => s.updateUser)

  const sync = useCallback(async () => {
    try {
      updateUser(await getMe())
    } catch {
      // Keep what we have: the session still works, and the next focus or load tries again.
    }
  }, [updateUser])

  useEffect(() => {
    if (hasHydrated && hasToken) void sync()
  }, [hasHydrated, hasToken, sync])

  useEffect(() => {
    if (!unverified) return
    const onFocus = () => void sync()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [unverified, sync])

  return sync
}
