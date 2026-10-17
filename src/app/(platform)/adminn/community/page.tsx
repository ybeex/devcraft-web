'use client'

import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Trash2, Megaphone, CheckCircle2 } from 'lucide-react'
import { listAdminPosts, deleteAdminPost, type UserRole } from '@/lib/api/admin'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTableRow } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

const TYPE_TONE: Record<string, string> = {
  QUESTION: 'bg-info/15 text-info',
  SHOWCASE: 'bg-brand-muted text-brand',
  ARTICLE: 'bg-success/15 text-success',
  NOTE: 'bg-raised text-dim',
}

const STAFF_ROLES: UserRole[] = ['ADMIN', 'MODERATOR']

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export default function AdminCommunityPage() {
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data, isLoading, isPlaceholderData, refetch } = useQuery({
    queryKey: ['admin-posts', page],
    queryFn: () => listAdminPosts(page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  })

  const posts = data?.posts ?? []
  const meta = data?.meta

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return
    setDeletingId(id)
    setDeleteError(null)
    try {
      await deleteAdminPost(id)
      await refetch()
    } catch {
      setDeleteError("Couldn't delete that post — try again.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <motion.div
      variants={cascadeContainer}
      initial="initial"
      animate="animate"
      className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8 sm:px-8"
    >
      <motion.div variants={cascadeItem}>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Community</h1>
        <p className="mt-1 text-sm text-dim">
          {meta ? `${meta.total.toLocaleString()} total posts` : 'Loading…'} — "Announcements" aren't a separate
          post type here, just posts from staff accounts (badged below).
        </p>
      </motion.div>

      <motion.div variants={cascadeItem} className="overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-card shadow-elev-sm">
        {isLoading ? (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonTableRow key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-2">
            <EmptyState icon={<Megaphone size={56} strokeWidth={1.25} className="text-ghost" />} headline="No posts yet" body="Community posts will show up here." />
          </div>
        ) : (
          <ul className="divide-y divide-rim-subtle">
            {posts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{p.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', TYPE_TONE[p.type])}>{p.type}</span>
                    {STAFF_ROLES.includes(p.user.role) && (
                      <span className="rounded-full bg-brand-muted px-2 py-0.5 text-[10px] font-bold text-brand">STAFF</span>
                    )}
                    {p.resolved && (
                      <span className="flex items-center gap-0.5 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                        <CheckCircle2 size={10} /> Resolved
                      </span>
                    )}
                    <span className="text-[11px] text-dim">
                      {p.user.username} · {p.upvotes} upvotes · {p.viewCount} views · {formatDate(p.createdAt)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 px-2 text-error hover:bg-error/10"
                  disabled={deletingId === p.id}
                  onClick={() => handleDelete(p.id, p.title)}
                >
                  <Trash2 size={14} />
                </Button>
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

      {deleteError && <p className="text-sm font-medium text-error">{deleteError}</p>}
    </motion.div>
  )
}
