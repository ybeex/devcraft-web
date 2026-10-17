'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BrandedLoader } from '@/components/brand/BrandedLoader'
import { AdminShell } from '@/components/admin/AdminShell'
import { useAuthStore } from '@/stores/auth-store'
import { useProfileSync } from '@/lib/hooks/useProfileSync'

/**
 * The admin console lives in its own route group, so the learner dashboard shell does not wrap it.
 * Because of that this layout does the session check the learner layout does: nobody is shown the shell
 * without a session, and nobody without the ADMIN role is shown it at all.
 *
 * Every /admin/* backend route gates on authorize('ADMIN'); a MODERATOR let in here would hit 403s on every
 * request, so the gate matches the API.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const accessToken = useAuthStore((s) => s.accessToken)
  const role = useAuthStore((s) => s.user?.role)
  useProfileSync()

  useEffect(() => {
    if (!hasHydrated) return
    if (!accessToken) router.replace('/login')
    else if (role && role !== 'ADMIN') router.replace('/dashboard')
  }, [hasHydrated, accessToken, role, router])

  if (!hasHydrated || !accessToken || role !== 'ADMIN') return <BrandedLoader />
  return <AdminShell>{children}</AdminShell>
}
