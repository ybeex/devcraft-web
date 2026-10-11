'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowUpRight, MessageCircle } from 'lucide-react'
import { listCommunityPosts } from '@/lib/api/community'
import { Skeleton } from '@/components/ui/Skeleton'
import { cascadeContainer, cascadeItem, hoverLift } from '@/lib/motion/variants'

const TYPE_COLOR: Record<string, string> = {
  QUESTION: 'text-info',
  SHOWCASE: 'text-brand',
  ARTICLE: 'text-be',
  NOTE: 'text-dim',
}

export function CommunitySnippet() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['dashboard-community-snippet'],
    queryFn: () => listCommunityPosts({ limit: 3, sort: 'createdAt' }),
    select: (result) => result.posts,
  })

  return (
    <div className="rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-5 shadow-elev-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-ui text-sm font-semibold text-ink">From the community</h3>
        <Link href="/community" className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
          View all <ArrowUpRight size={12} />
        </Link>
      </div>

      {isLoading && (
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      )}

      {!isLoading && posts && posts.length === 0 && (
        <p className="mt-4 text-sm text-dim">No posts yet — be the first to start a discussion.</p>
      )}

      {!isLoading && posts && posts.length > 0 && (
        <motion.ul variants={cascadeContainer} initial="initial" animate="animate" className="mt-3 flex flex-col gap-1">
          {posts.map((post) => (
            <motion.li key={post.id} variants={cascadeItem} {...hoverLift}>
              <Link
                href={`/community/${post.id}`}
                className="flex items-start gap-2.5 rounded-[var(--radius-md)] px-2 py-2.5 hover:bg-raised"
              >
                <span className={`mt-0.5 text-[10px] font-bold uppercase tracking-wide ${TYPE_COLOR[post.type] ?? 'text-dim'}`}>
                  {post.type.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{post.title}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-ghost">
                    {post.user.displayName}
                    <span className="flex items-center gap-0.5">
                      <MessageCircle size={11} /> {post.commentCount}
                    </span>
                  </p>
                </div>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  )
}
