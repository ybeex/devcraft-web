'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Bell, Sun, Moon, BookOpen, MessageSquare, HelpCircle } from 'lucide-react'
import { globalSearch } from '@/lib/api/search'
import { getUnreadNotificationCount } from '@/lib/api/notifications'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { useAuthStore } from '@/stores/auth-store'
import { easeOut } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

export function TopBar({ onOpenMobileNav }: { onOpenMobileNav?: () => void }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const { resolvedTheme, setTheme } = useTheme()

  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ⌘K / Ctrl+K focuses search from anywhere on the page
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') inputRef.current?.blur()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Close results dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsFocused(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const searchEnabled = debouncedQuery.trim().length >= 2
  const { data: results, isFetching } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: () => globalSearch(debouncedQuery.trim()),
    enabled: searchEnabled,
  })

  const { data: unread } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: getUnreadNotificationCount,
    refetchInterval: 60_000, // poll every minute — no websocket layer yet
    enabled: !!user,
  })

  const showDropdown = isFocused && searchEnabled
  const hasResults = results && (results.lessons.length + results.posts.length + results.questions.length) > 0

  return (
    <header className="flex items-center gap-4 border-b border-rim-subtle bg-canvas px-5 py-3.5">
      {/* Mobile hamburger */}
      {onOpenMobileNav && (
        <button onClick={onOpenMobileNav} className="rounded-[var(--radius-sm)] p-2 text-dim hover:bg-card lg:hidden">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Search */}
      <div ref={containerRef} className="relative w-full max-w-md">
        <div className="flex items-center gap-2.5 rounded-full border border-rim bg-card px-4 py-2.5">
          <Search size={16} className="shrink-0 text-ghost" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Search lessons, community, questions..."
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ghost"
          />
          <kbd className="hidden shrink-0 rounded border border-rim-subtle px-1.5 py-0.5 text-[10px] font-semibold text-ghost sm:block">
            ⌘K
          </kbd>
        </div>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: easeOut }}
              className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-2 shadow-elev-lg"
            >
              {isFetching && <p className="px-3 py-4 text-center text-sm text-dim">Searching...</p>}

              {!isFetching && !hasResults && (
                <p className="px-3 py-4 text-center text-sm text-dim">Nothing matches &ldquo;{debouncedQuery}&rdquo; yet.</p>
              )}

              {!isFetching && results && results.lessons.length > 0 && (
                <ResultGroup label="Lessons" icon={<BookOpen size={12} />}>
                  {results.lessons.map((l) => (
                    <div key={l.id} className="flex cursor-default items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-dim">
                      <BookOpen size={14} className="shrink-0 text-ghost" />
                      {l.title}
                    </div>
                  ))}
                </ResultGroup>
              )}

              {!isFetching && results && results.posts.length > 0 && (
                <ResultGroup label="Community" icon={<MessageSquare size={12} />}>
                  {results.posts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/community/${p.id}`}
                      onClick={() => setIsFocused(false)}
                      className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-ink hover:bg-raised"
                    >
                      <MessageSquare size={14} className="shrink-0 text-ghost" />
                      {p.title}
                    </Link>
                  ))}
                </ResultGroup>
              )}

              {!isFetching && results && results.questions.length > 0 && (
                <ResultGroup label="Interview questions" icon={<HelpCircle size={12} />}>
                  {results.questions.map((q) => (
                    <Link
                      key={q.id}
                      href={`/interview/${q.id}`}
                      onClick={() => setIsFocused(false)}
                      className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-ink hover:bg-raised"
                    >
                      <HelpCircle size={14} className="shrink-0 text-ghost" />
                      {q.title}
                    </Link>
                  ))}
                </ResultGroup>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="rounded-full p-2.5 text-dim hover:bg-card"
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => router.push('/notifications')}
          className="relative rounded-full p-2.5 text-dim hover:bg-card"
          aria-label="Notifications"
        >
          <Bell size={17} />
          {!!unread?.count && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2 items-center justify-center rounded-full bg-error" />
          )}
        </button>

        {/* Avatar */}
        {user && (
          <Link
            href={`/p/${user.username}`}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-muted text-xs font-bold text-brand"
          >
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt={user.displayName} className="h-full w-full object-cover" />
            ) : (
              initials(user.displayName)
            )}
          </Link>
        )}
      </div>
    </header>
  )
}

function ResultGroup({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-1 last:mb-0">
      <p className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ghost">
        {icon} {label}
      </p>
      {children}
    </div>
  )
}
