'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { CommunityPostCard } from '@/components/community/CommunityPostCard'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { Button } from '@/components/ui/Button'
import { listCommunityPosts, type CommunityPost, type CommunityListParams } from '@/lib/api/community'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'

// PRD §8.1: Feed | Q&A | Showcase | Announcements. Feed is the unfiltered
// mix of every post type; the other three each scope the same underlying
// data differently (Q&A and Showcase by post type, Announcements by
// author role rather than type — there's no "ANNOUNCEMENT" post type).
const TAB_OPTIONS = ['Feed', 'Q&A', 'Showcase', 'Announcements']

function tabToParams(tab: string): Pick<CommunityListParams, 'type' | 'announcements'> {
  if (tab === 'Q&A') return { type: 'QUESTION' }
  if (tab === 'Showcase') return { type: 'SHOWCASE' }
  if (tab === 'Announcements') return { announcements: true }
  return {}
}

const EMPTY_COPY: Record<string, { headline: string; body: string }> = {
  Feed: { headline: 'Nothing here yet', body: 'Be the first to post — ask a question, share a build, or write up what you learned.' },
  'Q&A': { headline: 'No questions yet', body: 'Ask the first question — the community (and staff) are here to help.' },
  Showcase: { headline: 'No showcases yet', body: 'Share something you built — a finished project or a work in progress.' },
  Announcements: { headline: 'No announcements yet', body: 'Official updates from the DevCraft team will show up here.' },
}

export default function CommunityPage() {
  const [tab, setTab] = useState('Feed')

  const { data, isLoading } = useQuery({
    queryKey: ['community-posts', tab],
    queryFn: () => listCommunityPosts({ limit: 20, sort: 'createdAt', ...tabToParams(tab) }),
  })

  const empty = EMPTY_COPY[tab] ?? EMPTY_COPY.Feed!

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Community</h1>
          <p className="mt-1 text-sm text-dim">Ask questions, show off builds, share what you&rsquo;ve learned.</p>
        </div>
        <div className="flex items-center gap-3">
          <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={setTab} />
          <Link href="/community/new">
            <Button size="sm">
              <Plus size={14} /> New post
            </Button>
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-[var(--radius-xl)]" />
          ))}
        </div>
      )}

      {!isLoading && data && data.posts.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={<FeatureIcon name="community" size={56} achieved={false} />}
            headline={empty.headline}
            body={empty.body}
            action={
              tab !== 'Announcements' ? (
                <Link href="/community/new">
                  <Button variant="outline">Start a post</Button>
                </Link>
              ) : undefined
            }
          />
        </div>
      )}

      {!isLoading && data && data.posts.length > 0 && (
        <motion.div
          variants={cascadeContainer}
          initial="initial"
          animate="animate"
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {data.posts.map((post) => (
            <motion.div key={post.id} variants={cascadeItem}>
              <CommunityPostCard post={post} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
