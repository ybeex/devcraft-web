'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { Moon, Sun, Menu, X } from 'lucide-react'
import { DevCraftMark } from '@/components/brand/DevCraftMark'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth-store'
import { easeOut } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/fe', label: 'Frontend' },
  { href: '/be', label: 'Backend' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
]

/**
 * The active theme only exists in the browser, so the server cannot know it. Waiting for mount before
 * drawing the glyph keeps the server HTML and the first client render identical; the same-size
 * placeholder holds the space so nothing shifts, and the icon then follows the real theme.
 */
function ThemeGlyph({ mounted, dark }: { mounted: boolean; dark: boolean }) {
  if (!mounted) return <span className="block h-4 w-4" aria-hidden />
  return dark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />
}

export function MarketingHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  // A signed-in learner sees a way back into the app instead of the sign-up buttons. The sign-up buttons stay
  // in the server-rendered page (visitors without scripts still get them) and swap once the saved session loads.
  const hydrated = useAuthStore((s) => s.hasHydrated)
  const signedIn = useAuthStore((s) => !!s.accessToken)
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN')
  const appHref = isAdmin ? '/admin' : '/dashboard'

  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 8))

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300',
        scrolled
          ? 'border-rim-subtle bg-canvas/75 shadow-elev-sm backdrop-blur-xl'
          : 'border-transparent bg-canvas/40 backdrop-blur-md'
      )}
    >
      <div
        className={cn(
          'mx-auto flex max-w-7xl items-center justify-between px-6 transition-[height] duration-300',
          scrolled ? 'h-14' : 'h-16'
        )}
      >
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="transition-transform duration-300 group-hover:scale-110">
            <DevCraftMark size={32} />
          </span>
          <span className="font-display text-lg font-bold text-ink">DevCraft</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'nav-underline relative rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  active ? 'text-ink' : 'text-dim hover:text-ink'
                )}
              >
                {link.label}
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    transition={{ duration: 0.35, ease: easeOut }}
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--brand-2)]"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-rim-subtle bg-card text-dim transition-all duration-300 hover:scale-105 hover:border-brand/40 hover:text-ink md:flex"
            aria-label="Toggle dark mode"
          >
            <ThemeGlyph mounted={mounted} dark={resolvedTheme === 'dark'} />
          </button>
          {hydrated && signedIn && (
            <Link href={appHref} data-testid="header-app-link" className="hidden md:block">
              <Button size="sm" className="shine">
                {isAdmin ? 'Admin console' : 'Dashboard'}
              </Button>
            </Link>
          )}
          {!(hydrated && signedIn) && (
            <>
              <Link
                href="/login"
                className="nav-underline hidden px-1 py-2 text-sm font-medium text-dim transition-colors hover:text-ink md:block"
              >
                Log in
              </Link>
              <Link href="/register" className="hidden md:block">
                <Button size="sm" className="shine">
                  Start free
                </Button>
              </Link>
            </>
          )}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-rim-subtle bg-card text-ink transition-colors hover:border-brand/40 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: easeOut }}
            className="overflow-hidden border-t border-rim-subtle bg-canvas/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive(link.href) ? 'bg-card text-ink' : 'text-dim hover:bg-card hover:text-ink'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={hydrated && signedIn ? appHref : '/login'}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-dim hover:bg-card hover:text-ink"
              >
                {hydrated && signedIn ? (isAdmin ? 'Admin console' : 'Dashboard') : 'Log in'}
              </Link>

              {!(hydrated && signedIn) && (
                <Link href="/register" onClick={() => setMobileOpen(false)} className="mt-1">
                  <Button className="shine w-full">Start free</Button>
                </Link>
              )}

              <div className="mt-2 flex items-center justify-between border-t border-rim-subtle px-3 pt-4">
                <span className="text-sm font-medium text-dim">Appearance</span>
                <button
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-rim-subtle bg-card text-dim transition-all duration-300 hover:scale-105 hover:border-brand/40 hover:text-ink"
                  aria-label="Toggle dark mode"
                >
                  <ThemeGlyph mounted={mounted} dark={resolvedTheme === 'dark'} />
                </button>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
