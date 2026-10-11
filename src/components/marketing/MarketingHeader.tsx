'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, Menu, X } from 'lucide-react'
import { DevCraftMark } from '@/components/brand/DevCraftMark'
import { Button } from '@/components/ui/Button'
import { easeOut } from '@/lib/motion/variants'

const NAV_LINKS = [
  { href: '/fe', label: 'Frontend' },
  { href: '/be', label: 'Backend' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
]

export function MarketingHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-rim-subtle bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <DevCraftMark size={32} />
          <span className="font-display text-lg font-bold text-ink">DevCraft</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-dim transition-colors hover:bg-card hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-rim-subtle bg-card text-dim transition-colors hover:text-ink"
            aria-label="Toggle dark mode"
          >
            {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link href="/login" className="hidden text-sm font-medium text-dim hover:text-ink sm:block">
            Log in
          </Link>
          <Link href="/register">
            <Button size="sm">Start free</Button>
          </Link>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-rim-subtle bg-card text-ink md:hidden"
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
            transition={{ duration: 0.25, ease: easeOut }}
            className="overflow-hidden border-t border-rim-subtle bg-canvas md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-dim hover:bg-card hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-dim hover:bg-card hover:text-ink"
              >
                Log in
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
