'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { DevCraftMark } from '@/components/brand/DevCraftMark'
import { useAuthStore } from '@/stores/auth-store'
import { Eyebrow, GradientText, Reveal } from '@/components/marketing/primitives'

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
    <section className="aurora aurora-animate grain relative flex min-h-[75vh] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <div aria-hidden className="bg-grid mask-radial-fade pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative z-[2] flex flex-col items-center">
        <Reveal>
          <Eyebrow>Error 404</Eyebrow>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="relative mt-8">
            <span
              aria-hidden
              className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)] blur-xl"
            />
            <DevCraftMark size={96} animate="wobble" />
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <h1 className="mt-8 text-balance font-display text-4xl font-bold leading-[1.08] text-ink">
            404 — <GradientText>off the map.</GradientText>
          </h1>
        </Reveal>

        <Reveal delay={0.18}>
          <p className="mt-4 max-w-md text-balance text-dim">
            Even the best engineers hit a page that doesn&apos;t exist. Let&apos;s get you back to
            shipping.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {!hydrated ? null : signedIn ? (
              <>
                <Link
                  href="/dashboard"
                  data-testid="404-dashboard"
                  className="shine glow-brand btn-3d group flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold text-white"
                >
                  Back to your dashboard
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 rounded-[var(--radius-md)] border border-rim bg-card px-6 py-3 text-sm font-semibold text-ink shadow-elev-sm transition-all duration-300 hover:border-brand/40 hover:shadow-elev-md"
                  >
                    Admin console
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className="shine glow-brand btn-3d group flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold text-white"
                >
                  Back to home
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/blog"
                  className="flex items-center gap-2 rounded-[var(--radius-md)] border border-rim bg-card px-6 py-3 text-sm font-semibold text-ink shadow-elev-sm transition-all duration-300 hover:border-brand/40 hover:shadow-elev-md"
                >
                  Read the blog instead
                </Link>
              </>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
