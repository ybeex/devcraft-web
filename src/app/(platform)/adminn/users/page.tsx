'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Search, Users as UsersIcon } from 'lucide-react'
import { listAdminUsers, type UserRole, type UserTier } from '@/lib/api/admin'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTableRow } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { AvatarStack } from '@/components/ui/AvatarStack'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

const ROLE_TONE: Record<UserRole, string> = {
  USER: 'bg-raised text-dim',
  MODERATOR: 'bg-info/15 text-info',
  ADMIN: 'bg-brand-muted text-brand',
}

function inputClass(): string {
  return 'rounded-[var(--radius-md)] border border-rim bg-canvas px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brand'
}

export default function AdminUsersPage() {
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 350)
  const [role, setRole] = useState<UserRole | 'ALL'>('ALL')
  const [tier, setTier] = useState<UserTier | 'ALL'>('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['admin-users', page, role, tier, debouncedSearch],
    queryFn: () =>
      listAdminUsers({
        page,
        limit: PAGE_SIZE,
        role: role === 'ALL' ? undefined : role,
        tier: tier === 'ALL' ? undefined : tier,
        search: debouncedSearch || undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const users = data?.users ?? []
  const meta = data?.meta

  return (
    <motion.div
      variants={cascadeContainer}
      initial="initial"
      animate="animate"
      className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-8 sm:px-8"
    >
      <motion.div variants={cascadeItem}>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Users</h1>
        <p className="mt-1 text-sm text-dim">{meta ? `${meta.total.toLocaleString()} total` : 'Loading…'}</p>
      </motion.div>

      <motion.div variants={cascadeItem} className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ghost" />
          <input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            placeholder="Search by email…"
            className={cn(inputClass(), 'w-full pl-8')}
          />
        </div>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value as UserRole | 'ALL')
            setPage(1)
          }}
          className={inputClass()}
        >
          <option value="ALL">All roles</option>
          <option value="USER">User</option>
          <option value="MODERATOR">Moderator</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          value={tier}
          onChange={(e) => {
            setTier(e.target.value as UserTier | 'ALL')
            setPage(1)
          }}
          className={inputClass()}
        >
          <option value="ALL">All tiers</option>
          <option value="FREE">Free</option>
          <option value="PRO">Pro</option>
          <option value="TEAM">Team</option>
        </select>
      </motion.div>

      <motion.div variants={cascadeItem} className="overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-card shadow-elev-sm">
        {isLoading ? (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonTableRow key={i} />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-2">
            <EmptyState
              icon={<UsersIcon size={56} strokeWidth={1.25} className="text-ghost" />}
              headline="No matching users"
              body="Try widening or clearing your filters."
            />
          </div>
        ) : (
          <ul className="divide-y divide-rim-subtle">
            {users.map((u) => (
              <li key={u.id}>
                <Link href={`/admin/users/${u.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-raised/50">
                  <div className="flex min-w-0 items-center gap-3">
                    <AvatarStack avatars={[{ name: u.displayName, src: null }]} max={1} size={32} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{u.displayName}</p>
                      <p className="truncate text-xs text-dim">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', ROLE_TONE[u.role])}>{u.role}</span>
                    <span className="rounded-full bg-raised px-2.5 py-1 text-[11px] font-semibold text-dim">{u.tier}</span>
                    {!u.isActive && <span className="rounded-full bg-error/15 px-2.5 py-1 text-[11px] font-semibold text-error">Deactivated</span>}
                    <span className="hidden text-xs text-dim sm:inline">{u.xp.toLocaleString()} XP</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-rim-subtle px-5 py-3">
            <p className="text-xs text-dim">
              Page {meta.page} of {meta.totalPages}
            </p>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" className="px-2.5" disabled={!meta.hasPrev || isPlaceholderData} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={15} />
              </Button>
              <Button variant="ghost" size="sm" className="px-2.5" disabled={!meta.hasNext || isPlaceholderData} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
