'use client'

import { Suspense, type RefObject } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, X } from 'lucide-react'
import { AiTutorPane } from './AiTutorPane'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { Skeleton } from '@/components/ui/Skeleton'
import { Confetti } from '@/components/ui/motion-confetti'
import { NewPostForm } from '@/components/community/NewPostForm'
import { rewardPulse } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'
import type { LessonDetail } from '@/lib/api/lessons'

const MODULE_CONFETTI_ORIGIN = { x: 0.5, y: 0.4 }
const MODULE_CONFETTI_COLORS = ['#F43F5E', '#FACC15', '#22C55E', '#3B82F6', '#A855F7', '#14B8A6', '#FF7900']

type Props = {
  lesson: LessonDetail
  track: 'FE' | 'BE'
  slug: string
  code: string
  pendingError: string | null
  onErrorHandled: () => void
  aiOpen: boolean
  onAiOpenChange: (open: boolean) => void
  aiTriggerRef: RefObject<HTMLButtonElement | null>
  aiCloseRef: RefObject<HTMLButtonElement | null>
  communityOpen: boolean
  onCommunityOpenChange: (open: boolean) => void
  onPostSuccess: (postId: string) => void
  published: { url: string } | { error: string } | null
  onPublishedDismiss: () => void
  reward: { xp: number; certificate: boolean } | null
  moduleMilestone: {
    completedModuleTitle: string
    nextModule: { title: string; firstLessonSlug: string } | null
  } | null
  onModuleMilestoneDismiss: () => void
}

export function LessonPageOverlays({
  lesson,
  track,
  slug,
  code,
  pendingError,
  onErrorHandled,
  aiOpen,
  onAiOpenChange,
  aiTriggerRef,
  aiCloseRef,
  communityOpen,
  onCommunityOpenChange,
  onPostSuccess,
  published,
  onPublishedDismiss,
  reward,
  moduleMilestone,
  onModuleMilestoneDismiss,
}: Props) {
  return (
    <>
      <AnimatePresence>
        {moduleMilestone && (
          <motion.div
            key="module-milestone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={onModuleMilestoneDismiss}
          >
            <Confetti
              fire
              origin={MODULE_CONFETTI_ORIGIN}
              colors={MODULE_CONFETTI_COLORS}
              count={130}
              spread={14}
              className="fixed inset-0 z-[70] size-full"
            />
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="module-milestone-title"
              data-testid="module-completion-modal"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.24 }}
              onClick={(event) => event.stopPropagation()}
              className="relative z-[65] w-full max-w-md rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-7 text-center shadow-elev-lg sm:p-9"
            >
              <button
                type="button"
                onClick={onModuleMilestoneDismiss}
                aria-label="Close module completion"
                className="absolute right-3 top-3 rounded-full p-2 text-dim transition-colors hover:bg-raised hover:text-ink"
              >
                <X size={18} />
              </button>
              <FeatureIcon name="xpGem" size={60} className="mx-auto" />
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-brand">Milestone reached</p>
              <h2 id="module-milestone-title" className="mt-2 font-display text-2xl font-bold text-ink">
                Module complete!
              </h2>
              <p className="mt-2 font-semibold text-ink">{moduleMilestone.completedModuleTitle}</p>
              <p className="mt-2 text-sm leading-relaxed text-dim">
                {moduleMilestone.nextModule
                  ? `Congratulations! You’re ready to continue with ${moduleMilestone.nextModule.title}.`
                  : 'Congratulations! You’ve completed every module in this track.'}
              </p>
              <Link
                href={moduleMilestone.nextModule
                  ? `/learn/${track.toLowerCase()}/${moduleMilestone.nextModule.firstLessonSlug}`
                  : `/learn/${track.toLowerCase()}`}
                data-testid="next-module"
                onClick={onModuleMilestoneDismiss}
                className="btn-3d mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-[#080D1C]"
              >
                {moduleMilestone.nextModule ? `Start ${moduleMilestone.nextModule.title}` : 'Back to track'}
                <ArrowRight size={16} />
              </Link>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aiOpen && (
          <motion.button
            type="button"
            aria-label="Close AI tutor"
            onClick={() => onAiOpenChange(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-0 z-30 cursor-default bg-black/40"
          />
        )}
      </AnimatePresence>
      <motion.div
        role={aiOpen ? 'dialog' : undefined}
        aria-label={aiOpen ? 'Ybee AI mentor' : undefined}
        aria-modal={aiOpen || undefined}
        data-testid="ai-drawer"
        data-open={aiOpen}
        layout
        initial={false}
        animate={{
          width: aiOpen ? 'min(28rem, calc(100vw - 2.5rem))' : 52,
          height: aiOpen ? 'min(42rem, calc(100dvh - 2.5rem))' : 52,
          borderRadius: aiOpen ? 24 : 999,
        }}
        transition={{
          layout: { type: 'spring', stiffness: 200, damping: 28, mass: 0.85 },
          width: { type: 'spring', stiffness: 200, damping: 28, mass: 0.85 },
          height: { type: 'spring', stiffness: 200, damping: 28, mass: 0.85 },
          borderRadius: { duration: 0.32, ease: 'easeInOut' },
        }}
        className={cn(
          'fixed bottom-5 right-5 z-40 overflow-hidden border border-rim shadow-elev-lg',
          aiOpen ? 'bg-canvas' : 'border-transparent bg-transparent shadow-none'
        )}
      >
        <motion.button
          type="button"
          onClick={() => onAiOpenChange(true)}
          aria-label="Open Ybee AI mentor"
          data-testid="ai-fab"
          ref={aiTriggerRef}
          inert={aiOpen}
          tabIndex={aiOpen ? -1 : 0}
          initial={false}
          animate={{
            opacity: aiOpen ? [1, 0] : [0, 1],
            scale: aiOpen ? [1, 1.1] : [1.2, 1],
          }}
          transition={{
            opacity: { duration: 0.18, delay: aiOpen ? 0 : 0.08, ease: 'easeInOut' },
            scale: { duration: 0.24, delay: aiOpen ? 0 : 0.08, ease: 'easeInOut' },
          }}
          className="btn-3d absolute inset-0 flex items-center justify-center rounded-full bg-brand text-[#080D1C]"
        >
          <FeatureIcon name="aiTutor" size={22} />
        </motion.button>
        <motion.div
          inert={!aiOpen}
          animate={{ opacity: aiOpen ? 1 : 0, scale: aiOpen ? 1 : 0.98 }}
          transition={{
            opacity: { duration: 0.22, delay: aiOpen ? 0.08 : 0, ease: 'easeInOut' },
            scale: { duration: 0.24, delay: aiOpen ? 0.05 : 0, ease: 'easeInOut' },
          }}
          className={cn('absolute inset-0 flex flex-col bg-canvas', !aiOpen && 'pointer-events-none')}
        >
          <button
            type="button"
            onClick={() => onAiOpenChange(false)}
            aria-label="Close AI tutor"
            ref={aiCloseRef}
            tabIndex={aiOpen ? 0 : -1}
            className="absolute right-3 top-3 z-10 rounded-[var(--radius-sm)] p-1.5 text-dim hover:bg-raised hover:text-ink"
          >
            <X size={16} />
          </button>
          <AiTutorPane
            lessonId={lesson.id}
            language={lesson.language}
            currentCode={code}
            pendingError={pendingError}
            onErrorHandled={onErrorHandled}
          />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {communityOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => onCommunityOpenChange(false)}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="ask-community-title"
              data-testid="ask-community-modal"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-xl)] border border-rim-subtle bg-canvas shadow-elev-lg"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-rim-subtle bg-card px-5 py-4">
                <div>
                  <h2 id="ask-community-title" className="font-display text-xl font-bold text-ink">Ask the community</h2>
                  <p className="mt-1 text-sm text-dim">Share your question with other learners.</p>
                </div>
                <button
                  type="button"
                  onClick={() => onCommunityOpenChange(false)}
                  aria-label="Close ask community form"
                  className="rounded-full p-2 text-dim transition-colors hover:bg-raised hover:text-ink"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto p-5 sm:p-6">
                <Suspense fallback={<Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />}>
                  <NewPostForm
                    lessonContext={{
                      lessonTitle: lesson.title,
                      lessonUrl: `/learn/${track.toLowerCase()}/${slug}`,
                      ...(code.trim() ? { code, language: lesson.language } : {}),
                    }}
                    onSuccess={onPostSuccess}
                  />
                </Suspense>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {published && (
          <div role="status" data-testid="publish-result" className="fixed bottom-20 left-1/2 z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-[var(--radius-md)] border border-rim bg-card px-4 py-3 text-xs shadow-lg">
            {'url' in published ? (
              <>
                <span className="text-ink">Published:</span>
                <a href={published.url} target="_blank" rel="noopener noreferrer" className="truncate font-mono text-brand">{published.url}</a>
                <Link href="/labs/previews" className="text-dim underline">Manage</Link>
              </>
            ) : (
              <span className="text-error">{published.error}</span>
            )}
            <button onClick={onPublishedDismiss} aria-label="Dismiss" className="text-ghost"><X size={13} /></button>
          </div>
        )}
        {reward && (
          <motion.div
            variants={rewardPulse}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[var(--radius-xl)] border border-rim-subtle bg-card px-6 py-4 text-center shadow-elev-lg"
          >
            <FeatureIcon name="xpGem" size={40} className="mx-auto" />
            <p className="mt-2 font-ui text-sm font-bold text-ink">+{reward.xp} XP earned!</p>
            {reward.certificate && (
              <p className="mt-1 flex items-center justify-center gap-1 text-xs font-semibold text-brand">
                <FeatureIcon name="certificate" size={14} /> Track certificate unlocked!
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
