'use client'

import { Fragment, useEffect, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { History, ChevronDown, ChevronUp, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { listAuditLogs, listAuditActions, getAdminActivitySummary } from '@/lib/api/admin'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTableRow } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { AvatarStack } from '@/components/ui/AvatarStack'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

interface Filters {
  action: string
  adminId: string
  targetType: string
  from: string
  to: string
}

const EMPTY_FILTERS: Filters = { action: '', adminId: '', targetType: '', from: '', to: '' }

/** Same visual language as LoginForm's inputClass, sized down for a dense filter bar. */
function inputClass(): string {
  return 'rounded-[var(--radius-md)] border border-rim bg-canvas px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ghost focus:border-brand'
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AuditLogPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 350)
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Any filter change invalidates whatever page we were on.
  useEffect(() => {
    setPage(1)
  }, [filters, debouncedSearch])

  const hasActiveFilters = Object.values(filters).some(Boolean) || debouncedSearch.length > 0

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['admin-audit-log', page, filters, debouncedSearch],
    queryFn: () =>
      listAuditLogs({
        page,
        limit: PAGE_SIZE,
        adminId: filters.adminId || undefined,
        action: filters.action || undefined,
        targetType: filters.targetType || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        search: debouncedSearch || undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const { data: actionOptions } = useQuery({ queryKey: ['admin-audit-actions'], queryFn: listAuditActions })

  // 365 (the max the endpoint allows) so the dropdown covers the full admin
  // roster rather than just whoever's been active in a short recent window.
  const { data: activitySummary } = useQuery({
    queryKey: ['admin-activity-summary', 365],
    queryFn: () => getAdminActivitySummary(365),
  })

  const logs = data?.logs ?? []
  const meta = data?.meta

  return (
    <motion.div
      variants={cascadeContainer}
      initial="initial"
      animate="animate"
      className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8"
    >
      <motion.div variants={cascadeItem}>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Audit log</h1>
        <p className="mt-1 text-sm text-dim">Every admin mutation, who made it, and what changed.</p>
      </motion.div>

      <motion.div
        variants={cascadeItem}
        className="flex flex-wrap items-end gap-3 rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-4 shadow-elev-sm"
      >
        <label className="flex min-w-[200px] flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-dim">Search by action</span>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ghost" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g. lesson.delete"
              className={cn(inputClass(), 'w-full pl-8')}
            />
          </div>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-dim">Action</span>
          <select
            value={filters.action}
            onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
            className={cn(inputClass(), 'min-w-[160px]')}
          >
            <option value="">All actions</option>
            {(actionOptions ?? []).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-dim">Admin</span>
          <select
            value={filters.adminId}
            onChange={(e) => setFilters((f) => ({ ...f, adminId: e.target.value }))}
            className={cn(inputClass(), 'min-w-[160px]')}
          >
            <option value="">All admins</option>
            {(activitySummary?.admins ?? []).map((a) => (
              <option key={a.adminId} value={a.adminId}>
                {a.displayName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-dim">Target type</span>
          <input
            value={filters.targetType}
            onChange={(e) => setFilters((f) => ({ ...f, targetType: e.target.value.toUpperCase() }))}
            placeholder="e.g. LESSON"
            className={cn(inputClass(), 'w-32')}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-dim">From</span>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            className={inputClass()}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-dim">To</span>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            className={inputClass()}
          />
        </label>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => {
              setFilters(EMPTY_FILTERS)
              setSearchInput('')
            }}
          >
            <X size={14} /> Clear
          </Button>
        )}
      </motion.div>

      <motion.div variants={cascadeItem} className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card shadow-elev-sm">
        {isLoading ? (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonTableRow key={i} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-2">
            <EmptyState
              icon={<History size={56} strokeWidth={1.25} className="text-ghost" />}
              headline={hasActiveFilters ? 'No matching entries' : 'No audit activity yet'}
              body={
                hasActiveFilters
                  ? 'Try widening or clearing your filters.'
                  : 'Admin actions will start showing up here as they happen.'
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-rim-subtle text-left text-xs uppercase tracking-wide text-ghost">
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">Admin</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                    <th className="px-4 py-3 font-semibold">Target</th>
                    <th className="w-10 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const isExpanded = expandedId === log.id
                    return (
                      <Fragment key={log.id}>
                        <tr
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="cursor-pointer border-b border-rim-subtle transition-colors last:border-0 hover:bg-raised/50"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-dim">{formatTimestamp(log.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <AvatarStack avatars={[{ name: log.admin.displayName, src: log.admin.avatar }]} max={1} size={22} />
                              <span className="text-ink">{log.admin.displayName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <code className="rounded bg-raised px-1.5 py-0.5 font-mono text-xs text-ink">{log.action}</code>
                          </td>
                          <td className="px-4 py-3 text-xs text-dim">
                            {log.targetType} <span className="text-ghost">·</span>{' '}
                            <span className="font-mono">{log.targetId.slice(0, 8)}</span>
                          </td>
                          <td className="px-4 py-3 text-ghost">{isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</td>
                        </tr>
                        {isExpanded && (
                          <tr className="border-b border-rim-subtle last:border-0">
                            <td colSpan={5} className="bg-canvas px-4 py-4">
                              <div className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
                                <span className="text-xs font-semibold text-dim">Full target ID</span>
                                <span className="font-mono text-xs text-ink">{log.targetId}</span>
                                <span className="text-xs font-semibold text-dim">IP address</span>
                                <span className="font-mono text-xs text-ink">{log.ip ?? '—'}</span>
                                <span className="text-xs font-semibold text-dim">Payload</span>
                                {log.payload ? (
                                  <pre className="overflow-x-auto rounded-[var(--radius-md)] bg-raised p-3 font-mono text-xs text-ink">
                                    {JSON.stringify(log.payload, null, 2)}
                                  </pre>
                                ) : (
                                  <span className="text-xs italic text-ghost">No payload recorded</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {meta && (
              <div className="flex items-center justify-between border-t border-rim-subtle px-4 py-3">
                <p className="text-xs text-dim">
                  Page {meta.page} of {meta.totalPages} · {meta.total.toLocaleString()} entr{meta.total === 1 ? 'y' : 'ies'}
                </p>
                <div className="flex gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 px-2.5"
                    disabled={!meta.hasPrev || isPlaceholderData}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft size={15} /> Prev
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 px-2.5"
                    disabled={!meta.hasNext || isPlaceholderData}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next <ChevronRight size={15} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
