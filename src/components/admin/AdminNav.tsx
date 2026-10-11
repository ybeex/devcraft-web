'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart3, Layers, FolderCheck, Megaphone, UserCog, History, GitMerge } from 'lucide-react'
import { getPendingConflictCount } from '@/lib/api/admin'
import { cn } from '@/lib/utils'

interface AdminNavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  /** Overview only — every other admin route starts with its own href, so a startsWith check would keep Overview lit everywhere. */
  exact?: boolean
}

const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Overview', icon: BarChart3, exact: true },
  { href: '/admin/content', label: 'Content', icon: Layers },
  { href: '/admin/submissions', label: 'Submissions', icon: FolderCheck },
  { href: '/admin/community', label: 'Community', icon: Megaphone },
  { href: '/admin/users', label: 'Users', icon: UserCog },
  { href: '/admin/audit-log', label: 'Audit Log', icon: History },
  { href: '/admin/conflicts', label: 'Conflicts', icon: GitMerge },
]

export function AdminNav() {
  const pathname = usePathname()

  // Cheap, read-only, and useful the moment an admin lands anywhere in the
  // section — even though the resolution UI at /admin/conflicts is still a
  // "Coming soon" placeholder, the count itself is real signal today.
  const { data: pending } = useQuery({
    queryKey: ['admin-pending-conflicts'],
    queryFn: getPendingConflictCount,
    refetchInterval: 60_000,
  })

  return (
    <div className="sticky top-0 z-10 border-b border-rim-subtle bg-canvas/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-5 py-2.5 sm:px-8">
        {ADMIN_NAV.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          const badge = item.href === '/admin/conflicts' && pending && pending.count > 0 ? pending.count : null

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors',
                isActive ? 'font-semibold text-ink' : 'text-dim hover:text-ink'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="admin-tab-active"
                  className="absolute inset-0 rounded-full bg-raised shadow-elev-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={15} />
                {item.label}
                {badge !== null && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
