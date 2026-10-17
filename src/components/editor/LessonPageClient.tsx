'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, MessageCircle, TerminalSquare, X } from 'lucide-react'
import Link from 'next/link'
import { LessonContentPane } from './LessonContentPane'
import { LessonEditorPane } from './LessonEditorPane'
import { LessonOutputPane } from './LessonOutputPane'
import { AiTutorPane } from './AiTutorPane'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  getLesson, startLesson, runCode, checkCode, completeLesson,
  type RunResult, type CheckResult,
} from '@/lib/api/lessons'
import { getTrackCurriculum } from '@/lib/api/curriculum'
import { lessonAfter } from '@/lib/utils/next-lesson'
import { useLessonTimer } from '@/lib/hooks/useLessonTimer'
import { rewardPulse } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

type MobileTab = 'content' | 'editor'

export function LessonPageClient({ track, slug }: { track: 'FE' | 'BE'; slug: string }) {
  const queryClient = useQueryClient()
  const { getElapsedMs } = useLessonTimer()

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', slug],
    queryFn: () => getLesson(slug),
  })

  const { data: curriculum } = useQuery({
    queryKey: ['curriculum-track', track],
    queryFn: () => getTrackCurriculum(track),
    staleTime: 5 * 60_000,
  })

  const [code, setCode] = useState('')
  const [runResult, setRunResult] = useState<RunResult | null>(null)
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null)
  const [outputTab, setOutputTab] = useState<'output' | 'tests' | 'preview'>('output')
  const [mobileTab, setMobileTab] = useState<MobileTab>('content')
  const [isRunning, setIsRunning] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [pendingError, setPendingError] = useState<string | null>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [reward, setReward] = useState<{ xp: number; certificate: boolean } | null>(null)

  useEffect(() => {
    if (!aiOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAiOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aiOpen])

  useEffect(() => {
    if (!lesson) return
    setCode(lesson.starterCode ?? '')
    // HTML has nothing to run, so the lesson opens on a live preview of the markup.
    setOutputTab(lesson.language === 'html' ? 'preview' : 'output')
    void startLesson(lesson.id).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id])

  async function handleRun() {
    if (!lesson) return
    if (lesson.language === 'html') { setOutputTab('preview'); return }
    setIsRunning(true)
    setOutputTab('output')
    try {
      const result = await runCode(lesson.id, code)
      setRunResult(result)
      if (result.stderr) setPendingError(result.stderr)
    } catch {
      setRunResult({ stdout: '', stderr: 'Failed to reach the code execution service. Try again.', exitCode: null, status: 'error', timedOut: false })
    } finally {
      setIsRunning(false)
    }
  }

  async function handleCheck() {
    if (!lesson) return
    setIsChecking(true)
    setOutputTab('tests')
    try {
      const result = await checkCode(lesson.id, code)
      setCheckResult(result)

      if (!result.allPassed) {
        const firstFailure = result.results.find((r) => !r.passed)
        if (firstFailure?.reason) setPendingError(firstFailure.reason)
        return
      }

      const completion = await completeLesson(lesson.id, getElapsedMs())
      queryClient.invalidateQueries({ queryKey: ['lesson', slug] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      queryClient.invalidateQueries({ queryKey: ['bulk-lesson-status', track] })

      if (!completion.alreadyCompleted) {
        setReward({ xp: completion.xpEarned, certificate: completion.certificateIssued })
        setTimeout(() => setReward(null), 4000)
      }
    } catch {
      setCheckResult({ passed: 0, failed: 0, total: 0, allPassed: false, results: [] })
    } finally {
      setIsChecking(false)
    }
  }

  function handleReset() {
    if (lesson) setCode(lesson.starterCode ?? '')
    setRunResult(null)
    setCheckResult(null)
  }

  if (isLoading || !lesson) {
    return (
      <div className="flex h-full flex-col gap-4 p-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid flex-1 grid-cols-3 gap-4">
          <Skeleton className="h-full" />
          <Skeleton className="h-full" />
          <Skeleton className="h-full" />
        </div>
      </div>
    )
  }

  const isComplete = lesson.progress.status === 'COMPLETED' || checkResult?.allPassed === true
  const next = isComplete && curriculum ? lessonAfter(curriculum, slug) : null
  const isTrackEnd = isComplete && !!curriculum && !next

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-rim-subtle bg-card px-4 py-2.5">
        <Link href={`/learn/${track.toLowerCase()}`} className="text-dim hover:text-ink">
          <ArrowLeft size={18} />
        </Link>
        <span className="truncate font-ui text-sm flex-1 font-semibold text-ink">{lesson.title}</span>
        {next && (
          <Link
            href={`/learn/${track.toLowerCase()}/${next.lesson.slug}`}
            data-testid="next-lesson"
            title={next.lesson.title}
            className="btn-3d flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white"
          >
            Next lesson <ArrowRight size={13} />
          </Link>
        )}
        {isTrackEnd && (
          <Link
            href={`/learn/${track.toLowerCase()}`}
            data-testid="track-end"
            className="btn-3d flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white"
          >
            Back to track <ArrowRight size={13} />
          </Link>
        )}
        <Link
          href={{
            pathname: '/playground',
            query: {
              track,
              ...(code.trim() ? { code, language: lesson.language } : { language: lesson.language }),
            },
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-rim px-3 py-1.5 text-xs font-medium text-dim transition-colors hover:text-ink"
        >
          <TerminalSquare size={13} /> Try in Playground
        </Link>
        <Link
          href={{
            pathname: '/community/new',
            query: {
              lessonTitle: lesson.title,
              lessonUrl: `/learn/${track.toLowerCase()}/${slug}`,
              ...(code.trim() ? { code, language: lesson.language } : {}),
            },
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-rim px-3 py-1.5 text-xs font-medium text-dim transition-colors hover:text-ink"
        >
          <MessageCircle size={13} /> Ask community
        </Link>
      </div>

      <div className="flex border-b border-rim-subtle lg:hidden">
        {(['content', 'editor'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={cn(
              'flex-1 border-b-2 py-2.5 text-xs font-semibold capitalize transition-colors',
              mobileTab === tab ? 'border-brand text-ink' : 'border-transparent text-ghost'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        <div className="hidden h-full grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:grid">
          <div className="overflow-hidden border-r border-rim-subtle">
            <LessonContentPane lesson={lesson} />
          </div>
          <div className="flex flex-col overflow-hidden border-r border-rim-subtle">
            <div className="min-h-0 flex-[1.4]">
              <LessonEditorPane
                code={code}
                language={lesson.language}
                onChange={setCode}
                onRun={handleRun}
                onCheck={handleCheck}
                onReset={handleReset}
                onAskForHelp={() => setAiOpen(true)}
                isRunning={isRunning}
                isChecking={isChecking}
              />
            </div>
            <div className="min-h-0 flex-1">
              <LessonOutputPane runResult={runResult} checkResult={checkResult} activeTab={outputTab} onTabChange={setOutputTab} language={lesson.language} code={code} />
            </div>
          </div>
        </div>

        <div className="h-full lg:hidden">
          {mobileTab === 'content' && <LessonContentPane lesson={lesson} />}
          {mobileTab === 'editor' && (
            <div className="flex h-full flex-col">
              <div className="min-h-0 flex-[1.4]">
                <LessonEditorPane
                  code={code}
                  language={lesson.language}
                  onChange={setCode}
                  onRun={handleRun}
                  onCheck={handleCheck}
                  onReset={handleReset}
                  onAskForHelp={() => setAiOpen(true)}
                  isRunning={isRunning}
                  isChecking={isChecking}
                />
              </div>
              <div className="min-h-0 flex-1">
                <LessonOutputPane runResult={runResult} checkResult={checkResult} activeTab={outputTab} onTabChange={setOutputTab} language={lesson.language} code={code} />
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setAiOpen(true)}
        aria-label="Open AI tutor"
        data-testid="ai-fab"
        className={cn(
          'btn-3d fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-elev-lg transition-opacity',
          aiOpen && 'pointer-events-none opacity-0'
        )}
      >
        <FeatureIcon name="aiTutor" size={20} /> AI Tutor
      </button>

      <div className={cn('fixed inset-0 z-40', !aiOpen && 'pointer-events-none')} aria-hidden={!aiOpen}>
        <button
          aria-label="Close AI tutor"
          tabIndex={aiOpen ? 0 : -1}
          onClick={() => setAiOpen(false)}
          className={cn('absolute inset-0 cursor-default bg-black/40 transition-opacity', aiOpen ? 'opacity-100' : 'opacity-0')}
        />
        <aside
          role="dialog"
          aria-label="AI tutor"
          data-testid="ai-drawer"
          data-open={aiOpen}
          className={cn(
            'absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-rim-subtle bg-canvas shadow-elev-lg transition-transform duration-300',
            aiOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <button
            onClick={() => setAiOpen(false)}
            aria-label="Close"
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
            onErrorHandled={() => setPendingError(null)}
          />
        </aside>
      </div>

      <AnimatePresence>
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
    </div>
  )
}
