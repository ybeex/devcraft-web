'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Globe, GripVertical, MessageCircle, TerminalSquare } from 'lucide-react'
import Link from 'next/link'
import { LessonContentPane } from './LessonContentPane'
import { LessonEditorPane } from './LessonEditorPane'
import { LessonOutputPane, LessonTestsPanel } from './LessonOutputPane'
import { GitLessonPane } from './GitLessonPane'
import { ProtocolLabPane } from './ProtocolLabPane'
import { cn } from '@/lib/utils'
import { LessonPageLoading } from './LessonPageLoading'
import { LessonPageOverlays } from './LessonPageOverlays'
import { useLessonPage } from './useLessonPage'
import { APP_SANDBOX } from '@/lib/browser-runner'
import { Confetti, type ConfettiHandle } from '@/components/ui/motion-confetti'

const LESSON_CONFETTI_COLORS = ['#F43F5E', '#FACC15', '#22C55E', '#3B82F6', '#A855F7', '#14B8A6', '#FF7900']

export function LessonPageClient({ track, slug }: { track: 'FE' | 'BE'; slug: string }) {
  const router = useRouter()
  const page = useLessonPage(track, slug)
  const {
    lesson, curriculum, isLoading, isApp, isGit, isDocker, isLab, isProtocol, app, quota, code, setCode, webContent,
    previewCode, appPreviewDoc, reloadKey, published, setPublished, publishing, runResult,
    checkResult, confettiKey, moduleMilestone, setModuleMilestone, outputTab, setOutputTab, mobileTab, setMobileTab, webBottomTab,
    setWebBottomTab, webPanelRevealKey, webEditorTab, setWebEditorTab, contentWidth,
    setContentWidth, contentCollapsed, setContentCollapsed, mobileContentCollapsed, setMobileContentCollapsed,
    outputCollapsed, setOutputCollapsed, outputHeight, setOutputHeight, isRunning, isChecking, pendingError,
    setPendingError, aiOpen, setAiOpen, communityOpen, setCommunityOpen, aiTriggerRef, aiCloseRef, reward,
    handleRun, handleCheck, handlePublish, handleReset, handleWebContentChange, isComplete, next,
    isHtmlFoundations, isWebLesson, usesTabbedOutputCollapse,
  } = page
  const nextLessonRef = useRef<HTMLAnchorElement>(null)
  const confettiRef = useRef<ConfettiHandle>(null)
  const [confettiOrigin, setConfettiOrigin] = useState({ x: 0.5, y: 0.5 })
  const nextLessonSlug = next?.lesson.slug

  useEffect(() => {
    if (!confettiKey || !nextLessonSlug || moduleMilestone) return
    const bounds = nextLessonRef.current?.getBoundingClientRect()
    if (!bounds) return

    setConfettiOrigin({
      x: (bounds.left + bounds.width / 2) / window.innerWidth,
      y: (bounds.top + bounds.height / 2) / window.innerHeight,
    })

    const timers: number[] = []
    const frame = window.requestAnimationFrame(() => {
      confettiRef.current?.fire()
      for (let burst = 1; burst < 4; burst += 1) {
        timers.push(window.setTimeout(() => confettiRef.current?.fire(), burst * 280))
      }
    })

    return () => {
      window.cancelAnimationFrame(frame)
      timers.forEach(window.clearTimeout)
    }
  }, [confettiKey, moduleMilestone, nextLessonSlug])

  if (isLoading || !lesson) return <LessonPageLoading />

  const isTrackEnd = isComplete && !!curriculum && !next
  const lessonEditor = (
    <LessonEditorPane
      key={lesson.id}
      code={code}
      language={lesson.language}
      onChange={setCode}
      onRun={handleRun}
      onCheck={handleCheck}
      onReset={handleReset}
      onAskForHelp={() => setAiOpen(true)}
      isRunning={isRunning}
      isChecking={isChecking}
      webContent={isWebLesson ? webContent : undefined}
      onWebContentChange={isWebLesson ? handleWebContentChange : undefined}
      webPreviewDoc={isApp ? appPreviewDoc : undefined}
      webPreviewSandbox={isApp ? APP_SANDBOX : undefined}
      webPreviewKey={isWebLesson ? reloadKey : undefined}
      webPanelRevealKey={isWebLesson ? webPanelRevealKey : undefined}
      webPreviewLoading={isApp && !app}
      webLayout={isWebLesson ? 'stacked' : undefined}
      webTestsPanel={<LessonTestsPanel result={checkResult} />}
      webTestsBadge={checkResult ? `${checkResult.passed}/${checkResult.total}` : undefined}
      webActivePanel={webBottomTab}
      onWebPanelChange={setWebBottomTab}
      onWebEditorTabChange={setWebEditorTab}
    />
  )
  const outputPane = <LessonOutputPane runResult={runResult} checkResult={checkResult} activeTab={outputTab} onTabChange={setOutputTab} language={lesson.language} code={isApp ? previewCode : code} app={app} reloadKey={reloadKey} errorHelp={lesson.errorHelp} quota={quota} collapsed={usesTabbedOutputCollapse && outputCollapsed} onToggleCollapse={usesTabbedOutputCollapse ? () => setOutputCollapsed((collapsed) => !collapsed) : undefined} onRun={handleRun} onCheck={handleCheck} onReset={handleReset} onAskForHelp={() => setAiOpen(true)} isRunning={isRunning} isChecking={isChecking} />
  const editorWorkspace = isProtocol ? (
    <ProtocolLabPane key={lesson.id} lesson={lesson} code={code} onChange={setCode} onCheck={handleCheck} onReset={handleReset} isChecking={isChecking} checkResult={checkResult} />
  ) : isLab ? (
    <GitLessonPane lessonId={lesson.id} kind={isDocker ? 'docker' : 'git'} checkResult={checkResult} isChecking={isChecking} onCheck={handleCheck} />
  ) : isWebLesson ? lessonEditor : (
    <>
      <div className="min-h-0" style={{ flex: outputCollapsed ? 1 : `${100 - outputHeight} 1 0%` }}>{lessonEditor}</div>
      <div
        role="separator"
        aria-label="Resize output panel"
        aria-orientation="horizontal"
        tabIndex={0}
        onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
        onPointerMove={(event) => { if (outputCollapsed || event.buttons !== 1) return; const bounds = event.currentTarget.parentElement?.getBoundingClientRect(); if (bounds) setOutputHeight(Math.max(22, Math.min(65, ((bounds.bottom - event.clientY) / bounds.height) * 100))) }}
        onKeyDown={(event) => { if (event.key === 'ArrowUp') setOutputHeight((height) => Math.min(65, height + 3)); if (event.key === 'ArrowDown') setOutputHeight((height) => Math.max(22, height - 3)) }}
        className={cn('flex h-2 shrink-0 touch-none cursor-row-resize items-center justify-center border-y border-rim-subtle bg-raised text-ghost', outputCollapsed && 'hidden')}
      ><GripVertical size={14} className="rotate-90" /></div>
      <div className={cn('flex shrink-0 flex-col overflow-hidden', outputCollapsed ? 'h-10' : 'min-h-0')} style={outputCollapsed ? undefined : { flex: `${outputHeight} 1 0%` }}>
        {!usesTabbedOutputCollapse && <button onClick={() => setOutputCollapsed((collapsed) => !collapsed)} aria-expanded={!outputCollapsed} className="flex h-10 shrink-0 items-center justify-between border-t border-rim-subtle bg-card px-3 text-xs font-semibold text-dim hover:text-ink"><span>Output</span>{outputCollapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>}
        {(!outputCollapsed || usesTabbedOutputCollapse) && <div className="min-h-0 flex-1">{outputPane}</div>}
      </div>
    </>
  )
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-rim-subtle bg-card px-4 py-2.5">
        <Link href={`/learn/${track.toLowerCase()}`} className="text-dim hover:text-ink">
          <ArrowLeft size={18} />
        </Link>
        <span className="truncate font-ui text-sm flex-1 font-semibold text-ink">{lesson.title}</span>
        {next && (
          <motion.div
            initial={confettiKey > 0 ? { opacity: 0, y: -5, scale: 0.94 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            className="relative shrink-0"
          >
            <Link
              ref={nextLessonRef}
              href={`/learn/${track.toLowerCase()}/${next.lesson.slug}`}
              data-testid="next-lesson"
              title={next.lesson.title}
              className="btn-3d relative flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-[#080D1C]"
            >
              Next lesson <ArrowRight size={13} />
            </Link>
          </motion.div>
        )}
        {isTrackEnd && (
          <Link
            href={`/learn/${track.toLowerCase()}`}
            data-testid="track-end"
            className="btn-3d flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-[#080D1C]"
          >
            Back to track <ArrowRight size={13} />
          </Link>
        )}
        {isApp && lesson.language !== 'react-lab' && lesson.language !== 'next-lab' && (
          <button onClick={handlePublish} disabled={publishing} data-testid="publish-preview" className="flex shrink-0 items-center gap-1.5 rounded-full border border-rim px-3 py-1.5 text-xs font-medium text-dim transition-colors hover:text-ink disabled:opacity-50">
            <Globe size={13} /> {publishing ? 'Publishing…' : 'Publish preview'}
          </button>
        )}
        <Link
          href={lesson.language === 'postgresql' || lesson.language === 'nodejs-db' ? '/labs/database' : isGit ? '/labs/git' : isDocker ? '/labs/docker' : lesson.language === 'webapp' ? '/labs/storefront' : {
            pathname: '/playground',
            query: {
              track,
              ...(code.trim() ? { code, language: lesson.language } : { language: lesson.language }),
            },
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-rim px-3 py-1.5 text-xs font-medium text-dim transition-colors hover:text-ink"
        >
          <TerminalSquare size={13} /> {lesson.language === 'postgresql' || lesson.language === 'nodejs-db' ? 'Practice database' : isGit ? 'Git lab' : isDocker ? 'Docker lab' : lesson.language === 'webapp' ? 'Storefront API' : 'Try in Playground'}
        </Link>
        <button
          type="button"
          onClick={() => setCommunityOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-rim px-3 py-1.5 text-xs font-medium text-dim transition-colors hover:text-ink"
        >
          <MessageCircle size={13} /> Ask community
        </button>
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
        <div className="hidden h-full lg:grid" style={{ gridTemplateColumns: contentCollapsed ? '42px 8px minmax(0, 1fr)' : `minmax(0, ${contentWidth}fr) 8px minmax(0, ${100 - contentWidth}fr)` }}>
          <>
            <div className="relative flex min-h-0 flex-col overflow-hidden border-r border-rim-subtle bg-canvas">
              <button
                onClick={() => setContentCollapsed((collapsed) => !collapsed)}
                aria-label={contentCollapsed ? 'Expand lesson content' : 'Collapse lesson content'}
                title={contentCollapsed ? 'Expand lesson content' : 'Collapse lesson content'}
                className={cn(
                  'absolute top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-rim bg-card text-dim shadow-elev-md transition-colors hover:text-ink',
                  contentCollapsed ? 'left-1/2 -translate-x-1/2' : 'right-3'
                )}
              >
                {contentCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              {!contentCollapsed && (
                <div className="min-h-0 flex-1 pt-12">
                  <LessonContentPane lesson={lesson} />
                </div>
              )}
            </div>
            <div role="separator" aria-label="Resize lesson content" aria-orientation="vertical" aria-valuemin={22} aria-valuemax={68} aria-valuenow={contentWidth} tabIndex={0} onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={(event) => { if (contentCollapsed || event.buttons !== 1) return; const bounds = event.currentTarget.parentElement?.getBoundingClientRect(); if (bounds) setContentWidth(Math.max(22, Math.min(68, ((event.clientX - bounds.left) / bounds.width) * 100))) }} onKeyDown={(event) => { if (event.key === 'ArrowLeft') setContentWidth((width) => Math.max(22, width - 3)); if (event.key === 'ArrowRight') setContentWidth((width) => Math.min(68, width + 3)) }} className="flex touch-none cursor-col-resize items-center justify-center bg-raised text-ghost"><GripVertical size={14} /></div>
            <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-rim-subtle">{editorWorkspace}</div>
          </>
        </div>

        <div className="h-full lg:hidden">
          {mobileTab === 'content' && (
            <div className="relative h-full min-h-0">
              <button
                onClick={() => setMobileContentCollapsed((collapsed) => !collapsed)}
                aria-label={mobileContentCollapsed ? 'Expand lesson content' : 'Collapse lesson content'}
                title={mobileContentCollapsed ? 'Expand lesson content' : 'Collapse lesson content'}
                className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-rim bg-card text-dim shadow-elev-md transition-colors hover:text-ink"
              >
                {mobileContentCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
              {!mobileContentCollapsed && (
                <div className="h-full min-h-0 pt-12">
                  <LessonContentPane lesson={lesson} />
                </div>
              )}
            </div>
          )}
          {mobileTab === 'editor' && <div className="flex h-full flex-col">{editorWorkspace}</div>}
        </div>
      </div>

      <Confetti
        ref={confettiRef}
        origin={confettiOrigin}
        colors={LESSON_CONFETTI_COLORS}
        count={72}
        spread={10}
        className="fixed inset-0 z-[45] size-full"
      />

      <LessonPageOverlays
        lesson={lesson}
        track={track}
        slug={slug}
        code={code}
        pendingError={pendingError}
        onErrorHandled={() => setPendingError(null)}
        aiOpen={aiOpen}
        onAiOpenChange={setAiOpen}
        aiTriggerRef={aiTriggerRef}
        aiCloseRef={aiCloseRef}
        communityOpen={communityOpen}
        onCommunityOpenChange={setCommunityOpen}
        onPostSuccess={(postId) => {
          setCommunityOpen(false)
          router.push(`/community/${postId}`)
        }}
        published={published}
        onPublishedDismiss={() => setPublished(null)}
        reward={reward}
        moduleMilestone={moduleMilestone}
        onModuleMilestoneDismiss={() => setModuleMilestone(null)}
      />
    </div>
  )
}
