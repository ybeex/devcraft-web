'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Bell, Sun, Moon, BookOpen, MessageSquare, HelpCircle, CheckCheck } from 'lucide-react'
import { globalSearch } from '@/lib/api/search'
import {
  getUnreadNotificationCount, listNotifications, markNotificationRead, markAllNotificationsRead,
  type Notification,
} from '@/lib/api/notifications'
import { getMessage, getLink, timeAgo } from '@/lib/utils/notification-format'
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
  const queryClient = useQueryClient()
  const [activeIndex, setActiveIndex] = useState(0)
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  // ⌘K / Ctrl+K focuses search from anywhere on the page
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
        setIsFocused(true)
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur()
        setIsFocused(false)
        setBellOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Close results dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsFocused(false)
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
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

  const { data: recent, isLoading: recentLoading } = useQuery({
    queryKey: ['notifications-preview'],
    queryFn: () => listNotifications(1, 5),
    enabled: !!user && bellOpen,
  })

  const showDropdown = isFocused && searchEnabled
  const hasResults = results && (results.lessons.length + results.posts.length + results.questions.length) > 0

  // One flat, ordered list drives keyboard navigation across all groups.
  const items: { key: string; href: string }[] = results
    ? [
        ...results.lessons.map((l) => ({ key: `l-${l.id}`, href: `/learn/${l.track.toLowerCase()}/${l.slug}` })),
        ...results.posts.map((p) => ({ key: `p-${p.id}`, href: `/community/${p.id}` })),
        ...results.questions.map((q) => ({ key: `q-${q.id}`, href: `/interview/${q.id}` })),
      ]
    : []

  useEffect(() => setActiveIndex(0), [debouncedQuery, results])

  function go(href: string) {
    setIsFocused(false)
    setQuery('')
    inputRef.current?.blur()
    router.push(href)
  }

  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || items.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + items.length) % items.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(items[activeIndex].href)
    }
  }

  const activeKey = items[activeIndex]?.key
  const optionProps = (key: string, href: string) => ({
    id: `search-opt-${key}`,
    role: 'option' as const,
    'aria-selected': activeKey === key,
    onMouseEnter: () => setActiveIndex(items.findIndex((i) => i.key === key)),
    onClick: () => go(href),
  })
  const optionClass = (key: string) =>
    cn(
      'flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-ink',
      activeKey === key ? 'bg-raised' : 'hover:bg-raised'
    )

  async function openNotification(n: Notification) {
    setBellOpen(false)
    if (!n.isRead) {
      void markNotificationRead(n.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
        queryClient.invalidateQueries({ queryKey: ['notifications-preview'] })
      }).catch(() => undefined)
    }
    const link = getLink(n)
    if (link) router.push(link)
    else router.push('/notifications')
  }

  async function readAll() {
    await markAllNotificationsRead().catch(() => undefined)
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    queryClient.invalidateQueries({ queryKey: ['notifications-preview'] })
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

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
            onKeyDown={onSearchKeyDown}
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls="search-listbox"
            aria-autocomplete="list"
            aria-activedescendant={showDropdown && activeKey ? `search-opt-${activeKey}` : undefined}
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
              id="search-listbox"
              role="listbox"
              className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-2 shadow-elev-lg"
            >
              {isFetching && <p className="px-3 py-4 text-center text-sm text-dim">Searching...</p>}

              {!isFetching && !hasResults && (
                <p className="px-3 py-4 text-center text-sm text-dim">Nothing matches &ldquo;{debouncedQuery}&rdquo; yet.</p>
              )}

              {!isFetching && results && results.lessons.length > 0 && (
                <ResultGroup label="Lessons" icon={<BookOpen size={12} />}>
                  {results.lessons.map((l) => {
                    const key = `l-${l.id}`
                    return (
                      <button key={l.id} type="button" tabIndex={-1} {...optionProps(key, `/learn/${l.track.toLowerCase()}/${l.slug}`)} className={optionClass(key)}>
                        <BookOpen size={14} className="shrink-0 text-ghost" />
                        <span className="min-w-0 flex-1 truncate">{l.title}</span>
                        <span className="shrink-0 text-[10px] font-semibold uppercase text-ghost">{l.track}</span>
                      </button>
                    )
                  })}
                </ResultGroup>
              )}

              {!isFetching && results && results.posts.length > 0 && (
                <ResultGroup label="Community" icon={<MessageSquare size={12} />}>
                  {results.posts.map((p) => {
                    const key = `p-${p.id}`
                    return (
                      <button key={p.id} type="button" tabIndex={-1} {...optionProps(key, `/community/${p.id}`)} className={optionClass(key)}>
                        <MessageSquare size={14} className="shrink-0 text-ghost" />
                        <span className="min-w-0 flex-1 truncate">{p.title}</span>
                      </button>
                    )
                  })}
                </ResultGroup>
              )}

              {!isFetching && results && results.questions.length > 0 && (
                <ResultGroup label="Interview questions" icon={<HelpCircle size={12} />}>
                  {results.questions.map((q) => {
                    const key = `q-${q.id}`
                    return (
                      <button key={q.id} type="button" tabIndex={-1} {...optionProps(key, `/interview/${q.id}`)} className={optionClass(key)}>
                        <HelpCircle size={14} className="shrink-0 text-ghost" />
                        <span className="min-w-0 flex-1 truncate">{q.title}</span>
                      </button>
                    )
                  })}
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
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setBellOpen((o) => !o)}
            className="relative rounded-full p-2.5 text-dim hover:bg-card"
            aria-label={unread?.count ? `Notifications, ${unread.count} unread` : 'Notifications'}
            aria-haspopup="true"
            aria-expanded={bellOpen}
          >
            <Bell size={17} />
            {!!unread?.count && (
              <span
                data-testid="bell-count"
                className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-none text-white"
              >
                {unread.count > 9 ? '9+' : unread.count}
              </span>
            )}
          </button>

          <AnimatePresence>
            {bellOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: easeOut }}
                data-testid="bell-dropdown"
                className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-card shadow-elev-lg"
              >
                <div className="flex items-center justify-between border-b border-rim-subtle px-4 py-2.5">
                  <span className="text-sm font-semibold text-ink">
                    Notifications{!!unread?.count && <span className="ml-1.5 text-xs font-medium text-dim">{unread.count} unread</span>}
                  </span>
                  {!!unread?.count && (
                    <button onClick={readAll} className="flex items-center gap-1 text-xs font-medium text-dim hover:text-ink">
                      <CheckCheck size={13} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {recentLoading && <p className="px-4 py-6 text-center text-sm text-dim">Loading...</p>}
                  {!recentLoading && (recent?.length ?? 0) === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-dim">You&apos;re all caught up.</p>
                  )}
                  {recent?.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => openNotification(n)}
                      className="flex w-full items-start gap-2.5 border-b border-rim-subtle px-4 py-3 text-left last:border-b-0 hover:bg-raised"
                    >
                      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.isRead ? 'bg-transparent' : 'bg-brand')} />
                      <span className="min-w-0 flex-1">
                        <span className={cn('line-clamp-2 text-sm', n.isRead ? 'text-dim' : 'font-medium text-ink')}>{getMessage(n)}</span>
                        <span className="mt-0.5 block text-xs text-ghost">{timeAgo(n.createdAt)}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <Link
                  href="/notifications"
                  onClick={() => setBellOpen(false)}
                  className="block border-t border-rim-subtle px-4 py-2.5 text-center text-sm font-semibold text-ink hover:bg-raised"
                >
                  View all
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        {user && (
          <Link
            href="/profile"
            aria-label="Your profile"
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
