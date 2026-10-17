'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopBar } from '@/components/dashboard/TopBar'
import { BrandedLoader } from '@/components/brand/BrandedLoader'
import { useAuthStore } from '@/stores/auth-store'
import { useProfileSync } from '@/lib/hooks/useProfileSync'
import { ProBanner } from '@/components/dashboard/ProBanner'
import { VerifyEmailPrompt } from '@/components/auth/VerifyEmailPrompt'

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { hasHydrated, accessToken } = useAuthStore()

  const syncProfile = useProfileSync()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    if (hasHydrated && !accessToken) router.replace('/login')
  }, [hasHydrated, accessToken, router])

  // Avoid a flash of the shell (or a flash of nothing) before we know
  // whether there's a valid session — same pattern used in onboarding.
  if (!hasHydrated || !accessToken) return <BrandedLoader />

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <VerifyEmailPrompt onRecheck={syncProfile} />
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)} />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar collapsed={false} onToggleCollapsed={() => {}} onNavigate={() => setMobileNavOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <ProBanner />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
