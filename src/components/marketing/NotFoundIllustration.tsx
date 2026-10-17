'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { DevCraftMark } from '@/components/brand/DevCraftMark'
import { useAuthStore } from '@/stores/auth-store'
import { easeOut } from '@/lib/motion/variants'

/**
 * Shared 404 illustration content — used by both (marketing)/not-found.tsx
 * (which gets full header/footer chrome via the route group's layout when
 * reached through the catch-all trigger) and the root app/not-found.tsx
 * (the true last-resort fallback, with no guaranteed layout wrap). Kept as
 * one component so the two call sites can never visually drift apart.
 */
export function NotFoundIllustration() {
  // A signed-in learner who mistypes a URL belongs back in the app, not on the marketing site. Nothing is
  // rendered in the button slot until the saved session has loaded, so the wrong buttons never flash.
  const hydrated = useAuthStore((s) => s.hasHydrated)
  const signedIn = useAuthStore((s) => !!s.accessToken)
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN')
  return (
    <section className="mesh-bg mesh-animate flex min-h-[75vh] flex-col items-center justify-center px-6 py-20 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="relative z-10"
      >
        <DevCraftMark size={96} animate="wobble" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: easeOut }}
        className="relative z-10 mt-8 font-display text-4xl font-bold text-ink"
      >
        404 — off the map
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: easeOut }}
        className="relative z-10 mt-3 max-w-md text-dim"
      >
        Even the best engineers hit a page that doesn&apos;t exist. Let&apos;s get you back to
        shipping.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35, ease: easeOut }}
        className="relative z-10 mt-8 flex flex-wrap justify-center gap-3"
      >
        {!hydrated ? null : signedIn ? (
          <>
            <Link
              href="/dashboard"
              data-testid="404-dashboard"
              className="btn-3d flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold text-white"
            >
              Back to your dashboard <ArrowRight size={16} />
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-[var(--radius-md)] border border-rim bg-card px-6 py-3 text-sm font-semibold text-ink shadow-elev-sm hover:shadow-elev-md"
              >
                Admin console
              </Link>
            )}
          </>
        ) : (
          <>
            <Link
              href="/"
              className="btn-3d flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold text-white"
            >
              Back to home <ArrowRight size={16} />
            </Link>
            <Link
              href="/blog"
              className="flex items-center gap-2 rounded-[var(--radius-md)] border border-rim bg-card px-6 py-3 text-sm font-semibold text-ink shadow-elev-sm hover:shadow-elev-md"
            >
              Read the blog instead
            </Link>
          </>
        )}
      </motion.div>
    </section>
  )
}
