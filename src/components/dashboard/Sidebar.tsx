'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, BookOpen, FolderKanban, Code2,
  MessagesSquare, Sparkles, LogOut, User, Users, Trophy, PanelLeftClose, PanelLeftOpen, ShieldCheck,
} from 'lucide-react'
import { useLogout } from '@/lib/hooks/useLogout'
import { DevCraftMark } from '@/components/brand/DevCraftMark'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
}

function buildNavItems(primaryTrack: 'FE' | 'BE' | null): NavItem[] {
  return [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: primaryTrack === 'BE' ? '/learn/be' : '/learn/fe', label: 'My Track', icon: BookOpen },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/playground', label: 'Playground', icon: Code2 },
    { href: '/interview', label: 'Interview Prep', icon: MessagesSquare },
    { href: '/community', label: 'Community', icon: Users },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/pro', label: 'Pro access', icon: Sparkles },
  ]
}

interface SidebarProps {
  collapsed: boolean
  onToggleCollapsed: () => void
  /** Closes the mobile drawer after a nav link is tapped. No-op on desktop. */
  onNavigate?: () => void
}

export function Sidebar({ collapsed, onToggleCollapsed, onNavigate }: SidebarProps) {
  const { logout, busy: loggingOut } = useLogout()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)

  const navItems = buildNavItems(user?.primaryTrack ?? null)
  const xpInLevel = user ? user.xp % 1000 : 0
  const xpPercent = (xpInLevel / 1000) * 100

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-rim-subtle bg-card transition-[width] duration-200',
        collapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between border-b border-rim-subtle px-4 py-5">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <DevCraftMark size={32} />
          {!collapsed && <span className="font-display whitespace-nowrap text-lg font-bold text-ink">DevCraft</span>}
        </Link>
        <button
          onClick={onToggleCollapsed}
          className="hidden shrink-0 rounded-[var(--radius-sm)] p-1.5 text-dim hover:bg-raised hover:text-ink lg:block"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-muted text-brand' : 'text-dim hover:bg-raised hover:text-ink',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={19} />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </Link>
          )
        })}

        {user?.role === 'ADMIN' && (
          <>
            <div className="my-2 border-t border-rim-subtle" />
            {(() => {
              const isActive = pathname === '/admin' || pathname.startsWith('/admin/')
              return (
                <Link
                  href="/admin"
                  onClick={onNavigate}
                  className={cn(
                    'relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-brand-muted text-brand' : 'text-dim hover:bg-raised hover:text-ink',
                    collapsed && 'justify-center px-0'
                  )}
                  title={collapsed ? 'Admin' : undefined}
                >
                  <ShieldCheck size={19} />
                  {!collapsed && <span className="whitespace-nowrap">Admin</span>}
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </Link>
              )
            })()}
          </>
        )}
      </nav>

      {/* Footer: portfolio link + XP/streak */}
      <div className="border-t border-rim-subtle p-3">
        {user && (
          <Link
            href={`/p/${user.username}`}
            onClick={onNavigate}
            className={cn(
              'mb-2 flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-dim transition-colors hover:bg-raised hover:text-ink',
              collapsed && 'justify-center px-0'
            )}
            title={collapsed ? 'Portfolio' : undefined}
          >
            <User size={19} />
            {!collapsed && <span>Portfolio</span>}
          </Link>
        )}

        <button
          type="button"
          onClick={() => void logout()}
          disabled={loggingOut}
          className={cn(
            'mb-2 flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-dim transition-colors hover:bg-raised hover:text-ink disabled:opacity-60',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? 'Log out' : undefined}
        >
          <LogOut size={19} />
          {!collapsed && <span>{loggingOut ? 'Logging out…' : 'Log out'}</span>}
        </button>

        {!collapsed && user && (
          <div className="flex flex-col gap-2.5 rounded-[var(--radius-lg)] bg-raised p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-ink">
                <FeatureIcon name="xpGem" size={16} /> Level {user.level}
              </span>
              <span className="flex items-center gap-1 font-semibold text-warning">
                <FeatureIcon name="streak" size={14} /> {user.currentStreak}d
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-card">
              <motion.div
                className="h-full rounded-full bg-brand"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[11px] text-ghost">{xpInLevel} / 1,000 XP to next level</span>
          </div>
        )}
      </div>
    </aside>
  )
}
