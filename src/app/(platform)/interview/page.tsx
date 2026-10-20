'use client'

import { useState } from 'react'
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Shuffle } from 'lucide-react'
import { QuestionFlashcard } from '@/components/interview/QuestionFlashcard'
import { ChallengeCard } from '@/components/interview/ChallengeCard'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import {
  listInterviewQuestions,
  getMyInterviewProgress,
  setQuestionStatus,
  clearQuestionStatus,
  type ReviewStatus,
} from '@/lib/api/interview'
import { listChallenges, getMyChallengeProgress } from '@/lib/api/system-design'
import { useAuthStore } from '@/stores/auth-store'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'

const QUESTIONS_PAGE_SIZE = 30
const MODE_OPTIONS = ['Q&A', 'System design']
const DIFFICULTY_OPTIONS = ['All', 'Beginner', 'Intermediate', 'Advanced']

export default function InterviewPage() {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'Q&A' | 'System design'>('Q&A')
  const myTrack = useAuthStore((s) => s.user?.primaryTrack ?? null)
  const hydrated = useAuthStore((s) => s.hasHydrated)
  const [difficultyLabel, setDifficultyLabel] = useState('All')
  const [sortMode, setSortMode] = useState<'default' | 'random'>('default')
  const [shuffleNonce, setShuffleNonce] = useState(0)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const track = myTrack ?? undefined
  const difficulty = difficultyLabel === 'All' ? undefined : (difficultyLabel.toUpperCase() as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')

  // Paged: the API caps a page at 50 and the bank is larger than one page, so keep
  // requesting pages ("Load more") until everything has been shown. Random order is
  // re-shuffled by the server on every request, so it cannot be paged without repeats;
  // it stays a single "surprise me" page.
  const {
    data: pages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['interview-questions', myTrack, difficultyLabel, sortMode, shuffleNonce],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listInterviewQuestions({
        page: pageParam,
        limit: QUESTIONS_PAGE_SIZE,
        track,
        difficulty: difficultyLabel === 'All' ? undefined : difficultyLabel.toUpperCase(),
        sort: sortMode,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (sortMode === 'random') return undefined
      const loaded = allPages.reduce((n, p) => n + p.questions.length, 0)
      return loaded < lastPage.total && lastPage.questions.length > 0 ? allPages.length + 1 : undefined
    },
    enabled: hydrated && !!myTrack && mode === 'Q&A',
  })
  const questions = pages?.pages.flatMap((p) => p.questions) ?? []
  const totalQuestions = pages?.pages[0]?.total ?? 0

  const { data: progress } = useQuery({
    queryKey: ['interview-progress'],
    queryFn: getMyInterviewProgress,
    enabled: hydrated && !!myTrack && mode === 'Q&A',
  })
  const progressMap = new Map((progress ?? []).map((p) => [p.questionId, p.status]))

  const { data: challengeData, isLoading: areChallengesLoading } = useQuery({
    queryKey: ['system-design-challenges', myTrack, difficultyLabel],
    queryFn: () => listChallenges({ limit: 30, track, difficulty }),
    enabled: hydrated && !!myTrack && mode === 'System design',
  })

  const { data: challengeProgress } = useQuery({
    queryKey: ['system-design-progress'],
    queryFn: getMyChallengeProgress,
    enabled: hydrated && !!myTrack && mode === 'System design',
  })
  const challengeProgressMap = new Map((challengeProgress ?? []).map((p) => [p.challengeId, p.status]))

  function handleShuffle() {
    if (sortMode === 'random') {
      setShuffleNonce((n) => n + 1) // already shuffled — force a fresh random order rather than no-op
    } else {
      setSortMode('random')
    }
  }

  async function handleToggleStatus(questionId: string, clickedStatus: ReviewStatus) {
    setPendingId(questionId)
    try {
      const current = progressMap.get(questionId)
      if (current === clickedStatus) {
        await clearQuestionStatus(questionId) // clicking the active state again clears it — a real toggle
      } else {
        await setQuestionStatus(questionId, clickedStatus)
      }
      await queryClient.invalidateQueries({ queryKey: ['interview-progress'] })
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Interview prep</h1>
          <p className="mt-1 text-sm text-dim">
            {mode === 'Q&A' ? 'Flip a card to check yourself, or practice out loud with AI feedback.' : 'Work through a scenario stage by stage — think first, then reveal.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={(v) => setMode(v as 'Q&A' | 'System design')} />
          {hydrated && myTrack && <span className="rounded-full bg-raised px-3 py-1.5 text-xs font-semibold text-dim">{myTrack === 'FE' ? 'Frontend' : 'Backend'} track</span>}
          <SegmentedControl options={DIFFICULTY_OPTIONS} value={difficultyLabel} onChange={setDifficultyLabel} />
          {mode === 'Q&A' && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant={sortMode === 'random' ? 'primary' : 'outline'} onClick={handleShuffle}>
                <Shuffle size={13} /> {sortMode === 'random' ? 'Shuffle again' : 'Shuffle'}
              </Button>
              {sortMode === 'random' && (
                <button onClick={() => setSortMode('default')} className="text-xs text-ghost hover:text-dim">
                  Reset order
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {hydrated && !myTrack ? (
        <div className="mt-8 rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-6 text-center">
          <p className="font-semibold text-ink">Choose a learning track to see interview prep</p>
          <p className="mt-1 text-sm text-dim">Select Frontend or Backend in your profile to load matching questions and system design challenges.</p>
        </div>
      ) : mode === 'Q&A' ? (
        <>
          {(!hydrated || isLoading) && (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-[var(--radius-xl)]" />
              ))}
            </div>
          )}

          {!isLoading && pages && questions.length === 0 && (
            <div className="mt-8">
              <EmptyState icon={<FeatureIcon name="aiTutor" size={56} achieved={false} />} headline="No questions match" body="Try a different track or difficulty." />
            </div>
          )}

          {!isLoading && pages && questions.length > 0 && (
            <motion.div variants={cascadeContainer} initial="initial" animate="animate" className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {questions.map((q) => (
                <motion.div key={q.id} variants={cascadeItem}>
                  <QuestionFlashcard question={q} status={progressMap.get(q.id)} onToggleStatus={handleToggleStatus} statusPending={pendingId === q.id} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {!isLoading && pages && questions.length > 0 && (
            <div className="mt-8 flex flex-col items-center gap-3">
              <p className="text-xs text-ghost">
                {sortMode === 'random'
                  ? `Showing ${questions.length} random questions`
                  : `Showing ${questions.length} of ${totalQuestions}`}
              </p>
              {hasNextPage && (
                <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                  {isFetchingNextPage ? 'Loading...' : 'Load more questions'}
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {(!hydrated || areChallengesLoading) && (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-[var(--radius-xl)]" />
              ))}
            </div>
          )}

          {!areChallengesLoading && challengeData && challengeData.challenges.length === 0 && (
            <div className="mt-8">
              <EmptyState icon={<FeatureIcon name="aiTutor" size={56} achieved={false} />} headline="No challenges match" body="Try a different track or difficulty." />
            </div>
          )}

          {!areChallengesLoading && challengeData && challengeData.challenges.length > 0 && (
            <motion.div variants={cascadeContainer} initial="initial" animate="animate" className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {challengeData.challenges.map((c) => (
                <motion.div key={c.id} variants={cascadeItem}>
                  <ChallengeCard challenge={c} status={challengeProgressMap.get(c.id)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
