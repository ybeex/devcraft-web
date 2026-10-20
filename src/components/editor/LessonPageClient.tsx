'use client'

import { ApiRequestError } from '@/lib/api/client'
import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Globe, GripVertical, MessageCircle, TerminalSquare, X } from 'lucide-react'
import Link from 'next/link'
import { LessonContentPane } from './LessonContentPane'
import { LessonEditorPane } from './LessonEditorPane'
import { LessonOutputPane, LessonTestsPanel } from './LessonOutputPane'
import type { WebBottomTab, WebEditorTab } from '@/components/playground/WebModeEditor'
import { AiTutorPane } from './AiTutorPane'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  getLesson, startLesson, runCode, checkCode, completeLesson,
  type RunResult, type CheckResult,
} from '@/lib/api/lessons'
import { getTrackCurriculum } from '@/lib/api/curriculum'
import { getBrowserTests, getStorefrontKey, storefrontBase } from '@/lib/api/storefront'
import { publishPreview } from '@/lib/api/previews'
import { APP_SANDBOX, buildAppDocument, runBrowserTests, type RunnerConfig } from '@/lib/browser-runner'
import { buildWebPreviewDocument, type WebModeContent } from '@/lib/api/playground'
import { lessonAfter } from '@/lib/utils/next-lesson'
import { useLessonTimer } from '@/lib/hooks/useLessonTimer'
import { rewardPulse } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

type MobileTab = 'content' | 'editor'

function lessonWebContent(source: string): WebModeContent {
  try {
    const parsed = JSON.parse(source) as Partial<WebModeContent>
    if (parsed && (typeof parsed.html === 'string' || typeof parsed.css === 'string' || typeof parsed.js === 'string')) {
      return {
        html: typeof parsed.html === 'string' ? parsed.html : '',
        css: typeof parsed.css === 'string' ? parsed.css : '',
        js: typeof parsed.js === 'string' ? parsed.js : '',
      }
    }
  } catch {
    // Existing lessons store a single HTML document; split its inline styles and scripts into their tabs.
  }

  const document = new DOMParser().parseFromString(source, 'text/html')
  const css = Array.from(document.querySelectorAll('style')).map((style) => style.textContent ?? '')
  const js = Array.from(document.querySelectorAll('script:not([src])')).map((script) => script.textContent ?? '')
  document.querySelectorAll('style, script:not([src])').forEach((node) => node.remove())
  return { html: document.body.innerHTML, css: css.join('\n\n'), js: js.join('\n\n') }
}

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

  const isApp = lesson?.language === 'webapp'
  const { data: keyInfo } = useQuery({ queryKey: ['storefront-key'], queryFn: getStorefrontKey, enabled: isApp, staleTime: 10 * 60_000 })
  const app = useMemo<RunnerConfig | null>(() => isApp && keyInfo ? { apiBase: storefrontBase(), apiKey: keyInfo.key ?? '' } : null, [isApp, keyInfo])
  const [code, setCode] = useState('')
  const [webContent, setWebContent] = useState<WebModeContent>({ html: '', css: '', js: '' })
  // Browser lessons show the page as of the last Run, not every keystroke, so typing never spams the API.
  const [previewCode, setPreviewCode] = useState('')
  const appPreviewDoc = useMemo(() => isApp && app ? buildAppDocument(previewCode, app) : '', [isApp, app, previewCode])
  const [reloadKey, setReloadKey] = useState(0)
  const [published, setPublished] = useState<{ url: string } | { error: string } | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [runResult, setRunResult] = useState<RunResult | null>(null)
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null)
  const [outputTab, setOutputTab] = useState<'output' | 'tests' | 'preview'>('output')
  const [mobileTab, setMobileTab] = useState<MobileTab>('content')
  const [webBottomTab, setWebBottomTab] = useState<WebBottomTab>('preview')
  const [webPanelRevealKey, setWebPanelRevealKey] = useState(0)
  const [webEditorTab, setWebEditorTab] = useState<WebEditorTab>('html')
  const [contentWidth, setContentWidth] = useState(40)
  const [contentCollapsed, setContentCollapsed] = useState(false)
  const [mobileContentCollapsed, setMobileContentCollapsed] = useState(false)
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
    const starterCode = lesson.starterCode ?? ''
    if (lesson.language === 'html' || lesson.language === 'webapp') {
      const content = lessonWebContent(starterCode)
      setWebContent(content)
      const composedCode = buildWebPreviewDocument(content)
      setCode(composedCode)
      setPreviewCode(composedCode)
    } else {
      setCode(starterCode)
      setPreviewCode(starterCode)
    }
    // HTML lessons preview live; storefront lessons preview when Run is pressed.
    setOutputTab(lesson.language === 'html' || lesson.language === 'webapp' ? 'tests' : 'output')
    setWebBottomTab('preview')
    setWebEditorTab('html')
    void startLesson(lesson.id).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id])

  async function handleRun() {
    if (!lesson) return
    if (lesson.language === 'html') {
      setWebPanelRevealKey((k) => k + 1)
      setReloadKey((k) => k + 1)
      setWebBottomTab(webEditorTab === 'js' ? 'console' : 'preview')
      setOutputTab('tests')
      return
    }
    if (lesson.language === 'webapp') {
      setWebPanelRevealKey((k) => k + 1)
      setPreviewCode(code)
      setReloadKey((k) => k + 1)
      setWebBottomTab(webEditorTab === 'js' ? 'console' : 'preview')
      setOutputTab('tests')
      return
    }
    setIsRunning(true)
    setOutputTab('output')
    try {
      const result = await runCode(lesson.id, code)
      setRunResult(result)
      if (result.stderr) setPendingError(result.stderr)
    } catch (err) {
      const msg = err instanceof ApiRequestError && err.statusCode === 402 ? err.message : 'Failed to reach the code execution service. Try again.'
      setRunResult({ stdout: '', stderr: msg, exitCode: null, status: 'error', timedOut: false })
    } finally {
      setIsRunning(false)
    }
  }

  async function handleCheck() {
    if (!lesson) return
    if (lesson.language === 'html' || lesson.language === 'webapp') {
      setWebBottomTab('tests')
      setWebPanelRevealKey((k) => k + 1)
    }
    setIsChecking(true)
    setOutputTab('tests')
    try {
      let result: CheckResult
      if (lesson.language === 'webapp') {
        if (!app) throw new Error('no key')
        setPreviewCode(code); setReloadKey((k) => k + 1)
        const { testCode } = await getBrowserTests(lesson.id)
        result = await runBrowserTests(code, testCode, app)
      } else {
        result = await checkCode(lesson.id, code)
      }
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

  async function handlePublish() {
    if (!lesson) return
    setPublishing(true); setPublished(null)
    try { setPublished({ url: (await publishPreview(lesson.title, code)).url }) }
    catch (err) { setPublished({ error: err instanceof ApiRequestError ? err.message : 'Could not publish. Try again.' }) }
    finally { setPublishing(false) }
  }

  function handleReset() {
    if (lesson?.language === 'html' || lesson?.language === 'webapp') {
      const content = lessonWebContent(lesson.starterCode ?? '')
      setWebContent(content)
      const composedCode = buildWebPreviewDocument(content)
      setCode(composedCode)
      if (lesson.language === 'webapp') setPreviewCode(composedCode)
      setWebBottomTab('preview')
    } else if (lesson) {
      setCode(lesson.starterCode ?? '')
    }
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
  const isWebLesson = lesson.language === 'html' || lesson.language === 'webapp'
  function handleWebContentChange(content: WebModeContent) {
    setWebContent(content)
    setCode(buildWebPreviewDocument(content))
  }
  const webTestsPanel = <LessonTestsPanel result={checkResult} />
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
      webTestsPanel={webTestsPanel}
      webTestsBadge={checkResult ? `${checkResult.passed}/${checkResult.total}` : undefined}
      webActivePanel={webBottomTab}
      onWebPanelChange={setWebBottomTab}
      onWebEditorTabChange={setWebEditorTab}
    />
  )
  const outputPane = <LessonOutputPane runResult={runResult} checkResult={checkResult} activeTab={outputTab} onTabChange={setOutputTab} language={lesson.language} code={isApp ? previewCode : code} app={app} reloadKey={reloadKey} />
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
        {isApp && (
          <button onClick={handlePublish} disabled={publishing} data-testid="publish-preview" className="flex shrink-0 items-center gap-1.5 rounded-full border border-rim px-3 py-1.5 text-xs font-medium text-dim transition-colors hover:text-ink disabled:opacity-50">
            <Globe size={13} /> {publishing ? 'Publishing…' : 'Publish preview'}
          </button>
        )}
        <Link
          href={lesson.language === 'postgresql' || lesson.language === 'nodejs-db' ? '/playground/database' : lesson.language === 'webapp' ? '/playground/storefront' : {
            pathname: '/playground',
            query: {
              track,
              ...(code.trim() ? { code, language: lesson.language } : { language: lesson.language }),
            },
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-rim px-3 py-1.5 text-xs font-medium text-dim transition-colors hover:text-ink"
        >
          <TerminalSquare size={13} /> {lesson.language === 'postgresql' || lesson.language === 'nodejs-db' ? 'Practice database' : lesson.language === 'webapp' ? 'Storefront API' : 'Try in Playground'}
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
        <div
          className="hidden h-full lg:grid"
          style={{
            gridTemplateColumns: isWebLesson
              ? contentCollapsed ? '42px 8px minmax(0, 1fr)' : `minmax(0, ${contentWidth}fr) 8px minmax(0, ${100 - contentWidth}fr)`
              : 'minmax(0, 1fr) minmax(0, 1.5fr)',
          }}
        >
          {isWebLesson ? (
            <>
              <div className="flex min-h-0 flex-col overflow-hidden border-r border-rim-subtle bg-canvas">
                {contentCollapsed ? (
                  <button
                    onClick={() => setContentCollapsed(false)}
                    aria-label="Expand lesson content"
                    title="Expand lesson content"
                    className="flex h-10 w-full items-center justify-center border-b border-rim-subtle text-dim hover:bg-raised hover:text-ink"
                  >
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <>
                    <div className="flex h-10 shrink-0 items-center justify-between border-b border-rim-subtle bg-card px-3">
                      <span className="text-xs font-semibold text-ink">Lesson content</span>
                      <button
                        onClick={() => setContentCollapsed(true)}
                        aria-label="Collapse lesson content"
                        title="Collapse lesson content"
                        className="rounded-[var(--radius-sm)] p-1 text-ghost hover:bg-raised hover:text-ink"
                      >
                        <ChevronLeft size={16} />
                      </button>
                    </div>
                    <div className="min-h-0 flex-1"><LessonContentPane lesson={lesson} /></div>
                  </>
                )}
              </div>
              <div
                role="separator"
                aria-label="Resize lesson content"
                aria-orientation="vertical"
                aria-valuemin={22}
                aria-valuemax={68}
                aria-valuenow={contentWidth}
                tabIndex={0}
                onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
                onPointerMove={(event) => {
                  if (contentCollapsed || event.buttons !== 1) return
                  const bounds = event.currentTarget.parentElement?.getBoundingClientRect()
                  if (!bounds) return
                  setContentWidth(Math.max(22, Math.min(68, ((event.clientX - bounds.left) / bounds.width) * 100)))
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowLeft') setContentWidth((width) => Math.max(22, width - 3))
                  if (event.key === 'ArrowRight') setContentWidth((width) => Math.min(68, width + 3))
                }}
                className="flex touch-none cursor-col-resize items-center justify-center bg-raised text-ghost transition-colors hover:bg-brand/10 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                <GripVertical size={14} />
              </div>
              <div className="min-h-0 min-w-0 overflow-hidden">{lessonEditor}</div>
            </>
          ) : (
            <>
              <div className="overflow-hidden border-r border-rim-subtle"><LessonContentPane lesson={lesson} /></div>
              <div className="flex min-w-0 flex-col overflow-hidden border-r border-rim-subtle">
                <div className="min-h-0 flex-[1.4]">{lessonEditor}</div>
                <div className="min-h-0 flex-1">{outputPane}</div>
              </div>
            </>
          )}
        </div>

        <div className="h-full lg:hidden">
          {mobileTab === 'content' && (isWebLesson ? (
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex h-10 shrink-0 items-center justify-between border-b border-rim-subtle bg-card px-3">
                <span className="text-xs font-semibold text-ink">Lesson content</span>
                <button
                  onClick={() => setMobileContentCollapsed((collapsed) => !collapsed)}
                  aria-expanded={!mobileContentCollapsed}
                  className="rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium text-dim hover:bg-raised hover:text-ink"
                >
                  {mobileContentCollapsed ? 'Expand' : 'Collapse'}
                </button>
              </div>
              {!mobileContentCollapsed && <div className="min-h-0 flex-1"><LessonContentPane lesson={lesson} /></div>}
            </div>
          ) : <LessonContentPane lesson={lesson} />)}
          {mobileTab === 'editor' && (
            isWebLesson ? lessonEditor : <div className="flex h-full flex-col">
              <div className="min-h-0 flex-[1.4]">{lessonEditor}</div>
              <div className="min-h-0 flex-1">{outputPane}</div>
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
        {published && (
          <div role="status" data-testid="publish-result" className="fixed bottom-20 left-1/2 z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-[var(--radius-md)] border border-rim bg-card px-4 py-3 text-xs shadow-lg">
            {'url' in published ? (
              <><span className="text-ink">Published:</span><a href={published.url} target="_blank" rel="noopener noreferrer" className="truncate font-mono text-brand">{published.url}</a><Link href="/playground/previews" className="text-dim underline">Manage</Link></>
            ) : (
              <span className="text-error">{published.error}</span>
            )}
            <button onClick={() => setPublished(null)} aria-label="Dismiss" className="text-ghost"><X size={13} /></button>
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
    </div>
  )
}
