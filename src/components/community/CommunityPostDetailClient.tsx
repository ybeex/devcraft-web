'use client'

import { useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'framer-motion'
import { ArrowLeft, ThumbsUp, Sparkles, Lightbulb, Pin, CheckCircle2, Send, ShieldCheck } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { markdownComponents } from '@/lib/markdown/components'
import { getCommunityPost, addComment, toggleReaction, resolveQuestion, endorseComment, unendorseComment, type CommunityComment } from '@/lib/api/community'
import { ApiRequestError } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth-store'
import { easeOut } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

const TYPE_STYLE: Record<string, string> = {
  QUESTION: 'bg-info/15 text-info',
  SHOWCASE: 'bg-[var(--positive-bg)] text-[var(--positive-text)]',
  ARTICLE: 'bg-brand-muted text-brand',
  NOTE: 'bg-raised text-dim',
}

const REACTIONS = [
  { emoji: 'helpful' as const, label: 'Helpful', Icon: ThumbsUp },
  { emoji: 'inspiring' as const, label: 'Inspiring', Icon: Sparkles },
  { emoji: 'learned' as const, label: 'Learned something', Icon: Lightbulb },
]

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-muted text-[10px] font-bold text-brand">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  )
}

export function CommunityPostDetailClient({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [commentText, setCommentText] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)
  const [pendingEmoji, setPendingEmoji] = useState<string | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [endorsingId, setEndorsingId] = useState<string | null>(null)

  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['community-post', id],
    queryFn: () => getCommunityPost(id),
    retry: (count, err) => !(err instanceof ApiRequestError && err.statusCode === 404) && count < 2,
  })

  async function refetchPost() {
    await queryClient.invalidateQueries({ queryKey: ['community-post', id] })
  }

  async function handleReaction(emoji: 'helpful' | 'inspiring' | 'learned') {
    setPendingEmoji(emoji)
    try {
      await toggleReaction(id, emoji)
      await refetchPost()
    } finally {
      setPendingEmoji(null)
    }
  }

  async function handleAddComment() {
    if (!commentText.trim()) return
    setIsCommenting(true)
    try {
      await addComment(id, commentText.trim())
      setCommentText('')
      await refetchPost()
    } finally {
      setIsCommenting(false)
    }
  }

  async function handleResolve(commentId: string) {
    setResolvingId(commentId)
    try {
      await resolveQuestion(id, commentId)
      await refetchPost()
    } finally {
      setResolvingId(null)
    }
  }

  /**
   * Staff/mentor endorsement — separate action from handleResolve above.
   * That's the asker marking their own question resolved; this is staff
   * recognizing a good answer on any question, independent of whether the
   * asker has resolved it (with this answer or a different one).
   */
  async function handleEndorseToggle(commentId: string, currentlyEndorsed: boolean) {
    setEndorsingId(commentId)
    try {
      if (currentlyEndorsed) {
        await unendorseComment(commentId)
      } else {
        await endorseComment(commentId)
      }
      await refetchPost()
    } finally {
      setEndorsingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-6 h-9 w-2/3" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    )
  }

  if (error) {
    if (error instanceof ApiRequestError && error.statusCode === 404) notFound()
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <p className="text-sm text-dim">Couldn&rsquo;t load this post. Try refreshing the page.</p>
      </div>
    )
  }

  if (!post) return null

  const isAuthor = !!user && user.username === post.user.username
  const isStaff = user?.role === 'ADMIN' || user?.role === 'MODERATOR'

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <Link href="/community" className="inline-flex items-center gap-1.5 text-sm font-medium text-dim hover:text-ink">
        <ArrowLeft size={14} /> Community
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easeOut }}
        className="mt-4"
      >
        <div className="flex items-center gap-2">
          <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide', TYPE_STYLE[post.type])}>
            {post.type}
          </span>
          {post.isPinned && <Pin size={14} className="text-brand" />}
          {post.resolved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-success">
              <CheckCircle2 size={13} /> Resolved
            </span>
          )}
        </div>

        <h1 className="font-display mt-3 text-2xl font-bold text-ink sm:text-3xl">{post.title}</h1>

        <div className="mt-3 flex items-center gap-2 text-xs text-dim">
          <Avatar name={post.user.displayName} src={post.user.avatar} />
          {post.user.displayName} · {new Date(post.createdAt).toLocaleDateString()}
        </div>

        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-medium text-dim">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {post.content}
          </Markdown>
        </div>

        {post.codeSnippet && (
          <div className="-mt-2 mb-4 overflow-hidden rounded-[var(--radius-md)] border border-rim-subtle">
            <div className="flex items-center gap-1.5 border-b border-rim-subtle bg-raised px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-error/60" />
              <span className="h-2 w-2 rounded-full bg-warning/60" />
              <span className="h-2 w-2 rounded-full bg-success/60" />
              {post.language && (
                <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-ghost">{post.language}</span>
              )}
            </div>
            <pre className="overflow-x-auto bg-card p-4">
              <code className="font-mono text-[13px] leading-relaxed text-ink">{post.codeSnippet}</code>
            </pre>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2 border-y border-rim-subtle py-4">
          {REACTIONS.map(({ emoji, label, Icon }) => {
            const count = post.reactions.filter((r) => r.emoji === emoji).length
            const reacted = !!user && post.reactions.some((r) => r.emoji === emoji && r.userId === user.id)
            return (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                disabled={pendingEmoji === emoji}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60',
                  reacted ? 'border-brand bg-brand-muted text-brand' : 'border-rim text-dim hover:text-ink'
                )}
              >
                <Icon size={13} /> {label} {count > 0 && <span>· {count}</span>}
              </button>
            )
          })}
        </div>

        <div className="mt-6">
          <h2 className="font-display text-lg font-bold text-ink">
            {post.commentCount} comment{post.commentCount === 1 ? '' : 's'}
          </h2>

          <div className="mt-4 flex flex-col gap-4">
            {post.comments.map((comment) => (
              <CommentRow
                key={comment.id}
                comment={comment}
                canResolve={isAuthor && post.type === 'QUESTION' && !post.resolved}
                resolving={resolvingId === comment.id}
                onResolve={() => handleResolve(comment.id)}
                canEndorse={isStaff && post.type === 'QUESTION'}
                endorsing={endorsingId === comment.id}
                onToggleEndorse={() => handleEndorseToggle(comment.id, comment.endorsed)}
              />
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              placeholder="Add a comment..."
              className="w-full resize-none rounded-[var(--radius-md)] border border-rim bg-canvas px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ghost focus:border-brand"
            />
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={isCommenting || !commentText.trim()}
              className="self-end"
            >
              <Send size={13} /> {isCommenting ? 'Posting...' : 'Comment'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function CommentRow({
  comment,
  canResolve,
  resolving,
  onResolve,
  canEndorse,
  endorsing,
  onToggleEndorse,
}: {
  comment: CommunityComment
  canResolve: boolean
  resolving: boolean
  onResolve: () => void
  canEndorse: boolean
  endorsing: boolean
  onToggleEndorse: () => void
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border p-4',
        comment.endorsed ? 'border-success/40 bg-success/5' : 'border-rim-subtle bg-card'
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-dim">
          <Avatar name={comment.user.displayName} src={comment.user.avatar} />
          <span className="font-semibold text-ink">{comment.user.displayName}</span>
          <span>· {new Date(comment.createdAt).toLocaleDateString()}</span>
          {comment.endorsed && (
            <span className="flex items-center gap-1 font-semibold text-success">
              <CheckCircle2 size={12} /> Best answer
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {canResolve && (
            <button
              onClick={onResolve}
              disabled={resolving}
              className="shrink-0 text-xs font-semibold text-brand hover:underline disabled:opacity-50"
            >
              {resolving ? 'Marking...' : 'Mark as answer'}
            </button>
          )}
          {canEndorse && (
            <button
              onClick={onToggleEndorse}
              disabled={endorsing}
              title="Staff endorsement — separate from the asker marking their own accepted answer"
              className={cn(
                'flex shrink-0 items-center gap-1 text-xs font-semibold hover:underline disabled:opacity-50',
                comment.endorsed ? 'text-dim' : 'text-brand'
              )}
            >
              <ShieldCheck size={12} />
              {endorsing ? 'Updating...' : comment.endorsed ? 'Remove endorsement' : 'Endorse'}
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-dim">{comment.content}</p>
    </div>
  )
}
