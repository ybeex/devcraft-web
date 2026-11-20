'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BrandedLoader } from '@/components/brand/BrandedLoader'
import { AdminNav } from '@/components/admin/AdminNav'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Every /admin/* backend route (admin.routes.ts, analytics.routes.ts,
 * audit-log-view.routes.ts, conflicts.routes.ts) gates on authorize('ADMIN')
 * specifically — there is currently no MODERATOR-accessible admin endpoint
 * anywhere, despite MODERATOR existing as a role. This gate matches that
 * reality: a MODERATOR let past this layout would hit 403s on every single
 * request the pages below make. Loosen this if a MODERATOR-accessible admin
 * endpoint ships later.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    // (platform)/layout.tsx already guarantees hasHydrated + accessToken by
    // the time this mounts, so a non-admin `user` here is a real answer, not
    // a loading state — redirect immediately rather than waiting on anything.
    if (!isAdmin) router.replace('/dashboard')
  }, [isAdmin, router])

  // Same "avoid a flash of the wrong thing" reasoning as the parent layout —
  // never let a non-admin see this shell, even for one frame.
  if (!isAdmin) return <BrandedLoader />

  return (
    <>
      <AdminNav orientation="horizontal" />
      {children}
    </>
  )
}
