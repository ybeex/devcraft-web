'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Skeleton } from '@/components/ui/Skeleton'

export function DatabasePlaygroundAccess({ children }: { children: ReactNode }) {
  const primaryTrack = useAuthStore((state) => state.user?.primaryTrack ?? null)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)

  if (!hasHydrated) {
    return <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><Skeleton className="h-40 w-full" /></div>
  }

  if (primaryTrack === 'FE') {
    return (
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <p className="text-sm text-dim">The database playground is available to Backend learners.</p>
        <Link href="/playground" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">Back to Playground</Link>
      </div>
    )
  }

  return children
}
