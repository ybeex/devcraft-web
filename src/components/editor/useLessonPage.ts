'use client'

import { ApiRequestError } from '@/lib/api/client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getLesson, startLesson, runCode, checkCode, completeLesson, getLessonFixtureSession, getFreeQuota,
  type RunResult, type CheckResult, type FreeQuota,
} from '@/lib/api/lessons'
import { getTrackCurriculum } from '@/lib/api/curriculum'
import { getBulkLessonStatus, type LessonStatusEntry } from '@/lib/api/progress'
import { getBrowserTests, storefrontBase } from '@/lib/api/storefront'
import { publishPreview } from '@/lib/api/previews'
import { APP_SANDBOX, assembleWebPage, buildAppDocument, isLabLanguage, runBrowserTests, type RunnerConfig } from '@/lib/browser-runner'
import { lessonAfter } from '@/lib/utils/next-lesson'
import { useLessonTimer } from '@/lib/hooks/useLessonTimer'
import { buildWebPreviewDocument, type WebModeContent } from '@/lib/api/playground'
import { lessonWebContent, lessonWorkspaceContent, readLessonDraft } from './lesson-page-utils'

type MobileTab = 'content' | 'editor'

export function useLessonPage(track: 'FE' | 'BE', slug: string) {
  const queryClient = useQueryClient()
  const { getElapsedMs } = useLessonTimer()

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', slug],
    queryFn: () => getLesson(slug),
  })
  const lessonStatusQueryKey = ['bulk-lesson-status', track] as const
  const { data: lessonStatuses } = useQuery({
    queryKey: lessonStatusQueryKey,
    queryFn: () => getBulkLessonStatus(track),
  })
  const { data: curriculum } = useQuery({
    queryKey: ['curriculum-track', track],
    queryFn: () => getTrackCurriculum(track),
    staleTime: 5 * 60_000,
  })

  const isApp = isLabLanguage(lesson?.language)
  const needsFixture = lesson?.language === 'webapp' || lesson?.language === 'next-lab' || lesson?.language === 'react-lab'
  const isGit = lesson?.language === 'git-lab'
  const isDocker = lesson?.language === 'docker-lab'
  const isLab = isGit || isDocker
  const sqlFreeLesson = lesson?.language === 'postgresql' && lesson.isPremium === false
  const { data: quotaStatus } = useQuery({
    queryKey: ['free-quota'],
    queryFn: getFreeQuota,
    enabled: Boolean(sqlFreeLesson),
    staleTime: 60_000,
    retry: false,
  })
  const [latestQuota, setLatestQuota] = useState<FreeQuota | null>(null)
  const quota: FreeQuota | null = latestQuota ?? (quotaStatus?.plan === 'free' ? quotaStatus : null)
  const { data: fixtureSession } = useQuery({
    queryKey: ['lesson-fixture', lesson?.id],
    queryFn: () => getLessonFixtureSession(lesson!.id),
    enabled: Boolean(needsFixture && lesson?.id),
    staleTime: 10 * 60_000,
  })
  const app: RunnerConfig | null = isApp
    ? needsFixture
      ? fixtureSession ? { apiBase: storefrontBase(), fixtureToken: fixtureSession.token } : null
      : { apiBase: '', apiKey: '' }
    : null

  const [code, setCode] = useState('')
  const [webContent, setWebContent] = useState<WebModeContent>({ html: '', css: '', js: '' })
  const [previewCode, setPreviewCode] = useState('')
  const appPreviewDoc = useMemo(() => isApp && app ? buildAppDocument(previewCode, app) : '', [isApp, app, previewCode])
  const [reloadKey, setReloadKey] = useState(0)
  const [published, setPublished] = useState<{ url: string } | { error: string } | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [runResult, setRunResult] = useState<RunResult | null>(null)
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null)
  const [confettiKey, setConfettiKey] = useState(0)
  const confettiLessonRef = useRef<string | null>(null)
  const [moduleMilestone, setModuleMilestone] = useState<{
    completedModuleTitle: string
    nextModule: { title: string; firstLessonSlug: string } | null
  } | null>(null)
  const [outputTab, setOutputTab] = useState<'output' | 'tests' | 'preview'>('output')
  const [mobileTab, setMobileTab] = useState<MobileTab>('content')
  const [webBottomTab, setWebBottomTab] = useState<'preview' | 'console' | 'tests'>('preview')
  const [webPanelRevealKey, setWebPanelRevealKey] = useState(0)
  const [webEditorTab, setWebEditorTab] = useState<'html' | 'css' | 'js'>('html')
  const [contentWidth, setContentWidth] = useState(40)
  const [contentCollapsed, setContentCollapsed] = useState(false)
  const [mobileContentCollapsed, setMobileContentCollapsed] = useState(false)
  const [outputCollapsed, setOutputCollapsed] = useState(false)
  const [outputHeight, setOutputHeight] = useState(42)
  const [isRunning, setIsRunning] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [pendingError, setPendingError] = useState<string | null>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [communityOpen, setCommunityOpen] = useState(false)
  const aiTriggerRef = useRef<HTMLButtonElement>(null)
  const aiCloseRef = useRef<HTMLButtonElement>(null)
  const previousAiOpen = useRef(false)
  const [reward, setReward] = useState<{ xp: number; certificate: boolean } | null>(null)
  const [draftReady, setDraftReady] = useState(false)

  useEffect(() => {
    if (!aiOpen && !communityOpen && !moduleMilestone) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAiOpen(false)
        setCommunityOpen(false)
        setModuleMilestone(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aiOpen, communityOpen, moduleMilestone])

  useEffect(() => {
    if (aiOpen) aiCloseRef.current?.focus()
    else if (previousAiOpen.current) aiTriggerRef.current?.focus()
    previousAiOpen.current = aiOpen
  }, [aiOpen])

  useEffect(() => {
    if (!lesson) return
    const savedDraft = readLessonDraft(slug)
    const starterCode = lesson.starterCode ?? ''
    if (savedDraft) {
      setCode(savedDraft.code)
      setWebContent(savedDraft.webContent)
      setPreviewCode(savedDraft.code)
    } else if (lesson.language === 'html' || lesson.language === 'webapp' || lesson.module?.slug === 'fe-html-foundations') {
      const content = lessonWorkspaceContent(starterCode)
      const composedCode = buildWebPreviewDocument(content)
      setWebContent(content)
      setCode(composedCode)
      setPreviewCode(composedCode)
    } else {
      setCode(starterCode)
      setPreviewCode(starterCode)
    }
    setOutputTab(lesson.language === 'html' || lesson.language === 'webapp' || isLabLanguage(lesson.language) ? 'preview' : 'output')
    setWebBottomTab('preview')
    setWebEditorTab('html')
    setDraftReady(true)
    void startLesson(lesson.id).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id])

  useEffect(() => {
    if (!draftReady || !lesson) return
    try {
      localStorage.setItem(`devcraft:lesson-draft:${slug}`, JSON.stringify({ code, webContent }))
    } catch {}
  }, [code, draftReady, lesson, slug, webContent])

  useEffect(() => {
    const language = lesson?.language
    if (language !== 'css-lab' && language !== 'web-lab' && language !== 'react-lab' && language !== 'next-lab') return
    const timer = setTimeout(() => setPreviewCode(code), language === 'css-lab' ? 0 : language === 'web-lab' ? 350 : 700)
    return () => clearTimeout(timer)
  }, [code, lesson?.language])

  async function handleRun() {
    if (!lesson) return
    if (lesson.language === 'html' || lesson.language === 'webapp' || lesson.module?.slug === 'fe-html-foundations') {
      if (lesson.language === 'webapp') setPreviewCode(code)
      setReloadKey((key) => key + 1)
      setWebPanelRevealKey((key) => key + 1)
      setWebBottomTab(webEditorTab === 'js' ? 'console' : 'preview')
      setOutputTab('preview')
      return
    }
    if (isLabLanguage(lesson.language)) {
      setPreviewCode(code)
      setReloadKey((key) => key + 1)
      setOutputTab('preview')
      return
    }
    setIsRunning(true)
    setOutputTab('output')
    try {
      const result = await runCode(lesson.id, code)
      setRunResult(result)
      if (result.quota) setLatestQuota(result.quota)
      if (result.stderr) setPendingError(result.stderr)
    } catch (error) {
      const known = error instanceof ApiRequestError && (error.statusCode === 402 || error.code === 'SANDBOX_FREE_QUOTA' || error.code === 'SANDBOX_FREE_FULL')
      if (error instanceof ApiRequestError && error.code === 'SANDBOX_FREE_QUOTA') queryClient.invalidateQueries({ queryKey: ['free-quota'] })
      const message = known ? error.message : 'Failed to reach the code execution service. Try again.'
      setRunResult({ stdout: '', stderr: message, exitCode: null, status: 'error', timedOut: false })
    } finally {
      setIsRunning(false)
    }
  }

  async function handleCheck() {
    if (!lesson) return
    if (lesson.language === 'html' || lesson.language === 'webapp') {
      setWebBottomTab('tests')
      setWebPanelRevealKey((key) => key + 1)
    }
    setIsChecking(true)
    setOutputTab('tests')
    try {
      let result: CheckResult
      if (isLabLanguage(lesson.language)) {
        if (!app) throw new Error('no key')
        setPreviewCode(code)
        setReloadKey((key) => key + 1)
        const { testCode } = await getBrowserTests(lesson.id)
        result = await runBrowserTests(lesson.language, code, testCode, app)
      } else {
        result = await checkCode(lesson.id, isLab ? 'check' : code)
      }
      setCheckResult(result)
      if (result.quota) setLatestQuota(result.quota)
      if (!result.allPassed) {
        const firstFailure = result.results.find((item) => !item.passed)
        if (firstFailure?.reason) setPendingError(firstFailure.reason)
        return
      }
      const isFirstPass = confettiLessonRef.current !== lesson.id
      confettiLessonRef.current = lesson.id
      const completion = await completeLesson(lesson.id, getElapsedMs())
      queryClient.invalidateQueries({ queryKey: ['lesson', slug] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      await queryClient.invalidateQueries({ queryKey: lessonStatusQueryKey })

      if (!completion.alreadyCompleted) {
        setReward({ xp: completion.xpEarned, certificate: completion.certificateIssued })
        setTimeout(() => setReward(null), 4000)
      }

      let completedModule = false
      const currentModule = curriculum?.modules.find((module) => module.id === lesson.moduleId)
      const statuses = queryClient.getQueryData<LessonStatusEntry[]>(lessonStatusQueryKey) ?? lessonStatuses
      if (!completion.alreadyCompleted && currentModule && statuses) {
        completedModule = currentModule.lessons.every((moduleLesson) =>
          moduleLesson.id === lesson.id ||
          statuses.some((status) => status.lessonId === moduleLesson.id && status.status === 'COMPLETED')
        )
        if (completedModule) {
          const moduleIndex = curriculum!.modules.findIndex((module) => module.id === currentModule.id)
          const nextModule = curriculum!.modules
            .slice(moduleIndex + 1)
            .find((module) => module.lessons.length > 0)
          const firstLesson = nextModule
            ? [...nextModule.lessons].sort((a, b) => a.order - b.order)[0]
            : null
          setModuleMilestone({
            completedModuleTitle: currentModule.title,
            nextModule: nextModule && firstLesson
              ? { title: nextModule.title, firstLessonSlug: firstLesson.slug }
              : null,
          })
        }
      }

      if (isFirstPass && !completedModule) setConfettiKey((key) => key + 1)
    } catch (error) {
      const reason = error instanceof ApiRequestError && (error.statusCode === 402 || error.code === 'SANDBOX_FREE_QUOTA' || error.code === 'SANDBOX_FREE_FULL') ? error.message : null
      if (error instanceof ApiRequestError && error.code === 'SANDBOX_FREE_QUOTA') queryClient.invalidateQueries({ queryKey: ['free-quota'] })
      setCheckResult(reason
        ? { passed: 0, failed: 1, total: 1, allPassed: false, results: [{ name: 'Practice database', passed: false, reason }] }
        : { passed: 0, failed: 0, total: 0, allPassed: false, results: [] })
    } finally {
      setIsChecking(false)
    }
  }

  async function handlePublish() {
    if (!lesson) return
    setPublishing(true)
    setPublished(null)
    try {
      setPublished({ url: (await publishPreview(lesson.title, assembleWebPage(code))).url })
    } catch (error) {
      setPublished({ error: error instanceof ApiRequestError ? error.message : 'Could not publish. Try again.' })
    } finally {
      setPublishing(false)
    }
  }

  function handleReset() {
    if (lesson?.language === 'html' || lesson?.language === 'webapp') {
      const content = lessonWebContent(lesson.starterCode ?? '')
      const composedCode = buildWebPreviewDocument(content)
      setWebContent(content)
      setCode(composedCode)
      setPreviewCode(composedCode)
      setWebBottomTab('preview')
    } else if (lesson) {
      setCode(lesson.starterCode ?? '')
    }
    setRunResult(null)
    setCheckResult(null)
    try {
      localStorage.removeItem(`devcraft:lesson-draft:${slug}`)
    } catch {}
  }

  function handleWebContentChange(content: WebModeContent) {
    setWebContent(content)
    setCode(buildWebPreviewDocument(content))
  }

  const isComplete = lesson?.progress.status === 'COMPLETED' || checkResult?.allPassed === true
  const next = isComplete && curriculum ? lessonAfter(curriculum, slug) : null
  const isHtmlFoundations = lesson?.module?.slug === 'fe-html-foundations'
  const isWebLesson = lesson?.language === 'html' || lesson?.language === 'webapp' || isHtmlFoundations
  const isSqlLesson = lesson?.language === 'sql' || lesson?.language === 'postgresql'
  const usesTabbedOutputCollapse = isSqlLesson || lesson?.language === 'javascript' || lesson?.language === 'typescript'

  return {
    lesson, curriculum, isLoading, isApp, isGit, isDocker, isLab, app, quota, code, setCode, webContent,
    previewCode, appPreviewDoc, reloadKey, setReloadKey, published, setPublished, publishing, runResult,
    checkResult, setCheckResult, confettiKey, moduleMilestone, setModuleMilestone, outputTab, setOutputTab, mobileTab, setMobileTab, webBottomTab,
    setWebBottomTab, webPanelRevealKey, setWebPanelRevealKey, webEditorTab, setWebEditorTab, contentWidth,
    setContentWidth, contentCollapsed, setContentCollapsed, mobileContentCollapsed, setMobileContentCollapsed,
    outputCollapsed, setOutputCollapsed, outputHeight, setOutputHeight, isRunning, isChecking, pendingError,
    setPendingError, aiOpen, setAiOpen, communityOpen, setCommunityOpen, aiTriggerRef, aiCloseRef, reward,
    handleRun, handleCheck, handlePublish, handleReset, handleWebContentChange, isComplete, next,
    isHtmlFoundations, isWebLesson, usesTabbedOutputCollapse,
  }
}
