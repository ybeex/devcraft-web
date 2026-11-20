'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

/** Learners only see their own track: opening the other track's page (an old link, a typed URL) goes to their own. */
export function TrackGuard({ track, children }: { track: 'FE' | 'BE'; children: React.ReactNode }) {
  const router = useRouter()
  const mine = useAuthStore((s) => s.user?.primaryTrack ?? null)
  const role = useAuthStore((s) => s.user?.role)
  const mismatch = mine !== null && mine !== track && role !== 'ADMIN'
  useEffect(() => { if (mismatch) router.replace(`/learn/${mine!.toLowerCase()}`) }, [mismatch, mine, router])
  return mismatch ? null : <>{children}</>
}
