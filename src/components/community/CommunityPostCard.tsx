'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageCircle, ThumbsUp, Pin, CheckCircle2, ShieldCheck } from 'lucide-react'
import type { CommunityPost } from '@/lib/api/community'
import { hoverLift } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

const TYPE_STYLE: Record<CommunityPost['type'], string> = {
  QUESTION: 'bg-info/15 text-info',
  SHOWCASE: 'bg-[var(--positive-bg)] text-[var(--positive-text)]',
  ARTICLE: 'bg-brand-muted text-brand',
  NOTE: 'bg-raised text-dim',
}

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

export function CommunityPostCard({ post }: { post: CommunityPost }) {
  return (
    <motion.div {...hoverLift}>
      <Link
        href={`/community/${post.id}`}
        className="flex h-full flex-col rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-5 shadow-elev-sm transition-shadow hover:shadow-elev-md"
      >
        <div className="flex items-start justify-between gap-3">
          <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide', TYPE_STYLE[post.type])}>
            {post.type}
          </span>
          <div className="flex items-center gap-1.5">
            {post.isPinned && <Pin size={13} className="text-brand" />}
            {post.resolved && <CheckCircle2 size={13} className="text-success" />}
          </div>
        </div>

        <h3 className="font-ui mt-3.5 line-clamp-2 flex-1 text-base font-bold text-ink">{post.title}</h3>

        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-medium text-dim">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-rim-subtle pt-3.5">
          <div className="flex items-center gap-2 text-xs text-dim">
            <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-brand-muted text-[10px] font-bold text-brand">
              {post.user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.user.avatar} alt={post.user.displayName} className="h-full w-full object-cover" />
              ) : (
                initials(post.user.displayName)
              )}
            </span>
            {post.user.displayName}
            {post.user.role !== 'USER' && (
              <span className="flex items-center gap-0.5 text-brand" title={post.user.role === 'ADMIN' ? 'DevCraft team' : 'Moderator'}>
                <ShieldCheck size={11} />
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-ghost">
            <span className="flex items-center gap-1">
              <ThumbsUp size={12} /> {post.upvotes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={12} /> {post.commentCount}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
