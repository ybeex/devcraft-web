'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, LineChart, Layers, FolderCheck, Megaphone, UserCog, History, GitMerge, Ticket, BellRing, Database, Globe } from 'lucide-react'
import { getPendingConflictCount } from '@/lib/api/admin'
import { getAdminUnreadCount } from '@/lib/api/admin-notifications'
import { cn } from '@/lib/utils'

interface AdminNavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  /** Overview only: every other admin route starts with its own href, so a startsWith check would keep Overview lit everywhere. */
  exact?: boolean
}

const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Overview', icon: BarChart3, exact: true },
  { href: '/admin/analytics', label: 'Analytics', icon: LineChart },
  { href: '/admin/notifications', label: 'Alerts', icon: BellRing },
  { href: '/admin/content', label: 'Content', icon: Layers },
  { href: '/admin/submissions', label: 'Submissions', icon: FolderCheck },
  { href: '/admin/community', label: 'Community', icon: Megaphone },
  { href: '/admin/users', label: 'Users', icon: UserCog },
  { href: '/admin/pro', label: 'Pro codes', icon: Ticket },
  { href: '/admin/audit-log', label: 'Audit Log', icon: History },
  { href: '/admin/practice-db', label: 'Practice DB', icon: Database },
  { href: '/admin/previews', label: 'Previews', icon: Globe },
  { href: '/admin/conflicts', label: 'Conflicts', icon: GitMerge },
]

/** Vertical on desktop (the console's own sidebar), a scrolling strip on small screens. */
export function AdminNav({ orientation }: { orientation: 'vertical' | 'horizontal' }) {
  const pathname = usePathname()
  const { data: pending } = useQuery({ queryKey: ['admin-pending-conflicts'], queryFn: getPendingConflictCount, refetchInterval: 60_000 })
  const { data: unread } = useQuery({ queryKey: ['admin-notifications-unread'], queryFn: getAdminUnreadCount, refetchInterval: 30_000 })

  return (
    <nav aria-label="Admin" className={cn(orientation === 'vertical' ? 'flex flex-col gap-0.5 p-3' : 'flex items-center gap-1 overflow-x-auto px-3 py-2')}>
      {ADMIN_NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        const Icon = item.icon
        const badge =
          item.href === '/admin/conflicts' ? pending?.count :
          item.href === '/admin/notifications' ? unread?.count : 0
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-3 whitespace-nowrap rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-colors',
              active ? 'bg-brand-muted font-semibold text-brand' : 'text-dim hover:bg-raised hover:text-ink',
            )}
          >
            <Icon size={17} />
            <span className="flex-1">{item.label}</span>
            {!!badge && badge > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">{badge > 99 ? '99+' : badge}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
