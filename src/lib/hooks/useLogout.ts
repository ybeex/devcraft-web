'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { logoutUser } from '@/lib/api/auth'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Ends the session: revokes the refresh token on the server (best effort: leaving must work offline too),
 * clears the saved session AND every cached query, so the next person on this browser sees none of it.
 */
export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)

  const logout = useCallback(async () => {
    setBusy(true)
    const { logout: clear } = useAuthStore.getState()
    try {
      await logoutUser()
    } catch {
      // The server could not be reached or the session was already gone: signing out locally is still right.
    }
    clear()
    queryClient.clear()
    router.replace('/login')
  }, [queryClient, router])

  return { logout, busy }
}
