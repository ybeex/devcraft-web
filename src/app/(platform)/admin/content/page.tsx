'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { MessagesSquare, Network, ChevronRight } from 'lucide-react'
import { listAdminTracks } from '@/lib/api/admin'
import { TrackCard, TrackCreatePrompt } from '@/components/admin/content/TrackCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'

const ALL_SLUGS = ['FE', 'BE'] as const

export default function AdminContentPage() {
  const { data: tracks, isLoading, refetch } = useQuery({
    queryKey: ['admin-tracks'],
    queryFn: listAdminTracks,
  })

  const missingSlugs = ALL_SLUGS.filter((slug) => !tracks?.some((t) => t.slug === slug))

  return (
    <motion.div
      variants={cascadeContainer}
      initial="initial"
      animate="animate"
      className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8"
    >
      <motion.div variants={cascadeItem}>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Content</h1>
        <p className="mt-1 text-sm text-dim">Tracks and modules. Manage a module's lessons from its own page.</p>
      </motion.div>

      <motion.div variants={cascadeItem} className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/content/questions"
          className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-4 shadow-elev-sm transition-colors hover:border-brand"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-raised text-brand">
              <MessagesSquare size={18} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">Interview questions</span>
              <span className="block text-xs text-dim">Q&A content across both tracks</span>
            </span>
          </span>
          <ChevronRight size={16} className="text-ghost" />
        </Link>

        <Link
          href="/admin/content/system-design"
          className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-4 shadow-elev-sm transition-colors hover:border-brand"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-raised text-brand">
              <Network size={18} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">System design challenges</span>
              <span className="block text-xs text-dim">Multi-stage challenges with guided reveal</span>
            </span>
          </span>
          <ChevronRight size={16} className="text-ghost" />
        </Link>
      </motion.div>

      <motion.div variants={cascadeItem} className="flex flex-col gap-5">
        {isLoading ? (
          <>
            <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
            <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
          </>
        ) : (
          <>
            {tracks?.map((track) => (
              <TrackCard key={track.id} track={track} onSaved={() => refetch()} />
            ))}
            {missingSlugs.map((slug) => (
              <TrackCreatePrompt key={slug} slug={slug} onCreated={() => refetch()} />
            ))}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
