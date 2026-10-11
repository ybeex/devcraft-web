'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Eye, Trash2 } from 'lucide-react'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { listMySnippets, listCommunitySnippets, deleteSnippet, type Snippet } from '@/lib/api/playground'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'

const TABS = ['Mine', 'Community']

export function SnippetBrowser({ onLoad, refreshKey }: { onLoad: (snippet: Snippet) => void; refreshKey: number }) {
  const [tab, setTab] = useState('Mine')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const mineQuery = useQuery({
    queryKey: ['my-snippets', refreshKey],
    queryFn: () => listMySnippets(),
    enabled: tab === 'Mine',
  })

  const communityQuery = useQuery({
    queryKey: ['community-snippets'],
    queryFn: () => listCommunitySnippets({ limit: 20 }),
    enabled: tab === 'Community',
  })

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteSnippet(id)
      await mineQuery.refetch()
    } finally {
      setDeletingId(null)
    }
  }

  const isLoading = tab === 'Mine' ? mineQuery.isLoading : communityQuery.isLoading
  const snippets = tab === 'Mine' ? (mineQuery.data?.snippets ?? []) : (communityQuery.data?.snippets ?? [])

  return (
    <div className="flex h-full flex-col">
      <SegmentedControl options={TABS} value={tab} onChange={setTab} />

      <div className="mt-4 flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-[var(--radius-lg)]" />
            ))}
          </div>
        )}

        {!isLoading && snippets.length === 0 && (
          <EmptyState
            icon={<FeatureIcon name="codeWindow" size={48} achieved={false} />}
            headline={tab === 'Mine' ? 'No saved snippets yet' : 'Nothing shared yet'}
            body={tab === 'Mine' ? 'Save your first snippet to see it here.' : 'Be the first to make a snippet public.'}
          />
        )}

        {!isLoading && snippets.length > 0 && (
          <motion.div variants={cascadeContainer} initial="initial" animate="animate" className="flex flex-col gap-2">
            {snippets.map((snippet) => (
              <motion.div
                key={snippet.id}
                variants={cascadeItem}
                className="group flex items-center gap-2 rounded-[var(--radius-lg)] border border-rim-subtle bg-card px-3.5 py-3"
              >
                <button onClick={() => onLoad(snippet)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold text-ink">{snippet.title}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-ghost">
                    <span className="rounded bg-raised px-1.5 py-0.5 font-mono uppercase">{snippet.language}</span>
                    {tab === 'Community' && <span className="truncate">by {snippet.user?.displayName ?? 'Unknown'}</span>}
                    {tab === 'Mine' && (
                      <span className="flex items-center gap-1">
                        <Eye size={11} /> {snippet.viewCount}
                      </span>
                    )}
                  </p>
                </button>
                {tab === 'Mine' && (
                  <button
                    onClick={() => handleDelete(snippet.id)}
                    disabled={deletingId === snippet.id}
                    className="shrink-0 rounded-[var(--radius-sm)] p-1.5 text-ghost opacity-0 transition-opacity hover:bg-error/10 hover:text-error group-hover:opacity-100 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
