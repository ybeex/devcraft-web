'use client'

import { CheckCircle2, ChevronDown, ChevronUp, XCircle, Terminal } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { RunResult, CheckResult, ErrorHelp, FreeQuota } from '@/lib/api/lessons'
import { ErrorHelpCard, FreeQuotaNotice } from './LessonGuide'
import { LessonActions } from './LessonActions'
import { failureTexts, matchErrorHelp } from '@/lib/lesson-guide'
import { cn } from '@/lib/utils'
import { ResultTable } from '@/components/playground/ResultTable'
import { APP_SANDBOX, buildLabDocument, compileLabDocument, isLabLanguage, type RunnerConfig } from '@/lib/browser-runner'
import { preloadLessonCompiler, recordLessonMetric } from '@/lib/lesson-compiler'

interface LessonOutputPaneProps {
  runResult: RunResult | null
  checkResult: CheckResult | null
  activeTab: 'output' | 'tests' | 'preview'
  onTabChange: (tab: 'output' | 'tests' | 'preview') => void
  /** HTML lessons have nothing to run: they get a live preview of the markup instead of an Output tab. */
  language?: string
  code?: string
  /** Browser lessons: the page runs for real (scripts on) with the learner's Storefront key; `reloadKey` restarts it. */
  app?: RunnerConfig | null
  reloadKey?: number
  collapsed?: boolean
  onToggleCollapse?: () => void
  /** Plain-language explanations for known errors in this lesson, and the free plan's remaining runs. */
  errorHelp?: ErrorHelp[]
  quota?: FreeQuota | null
  onRun: () => void
  onCheck: () => void
  onReset: () => void
  onAskForHelp: () => void
  isRunning: boolean
  isChecking: boolean
}

/** The learner's markup, rendered with scripts disabled. It is only ever shown, never executed. */
export function htmlPreviewDocument(code: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><base target="_blank"><style>body{font-family:system-ui,sans-serif;margin:16px;color:#111}</style></head><body>${code}</body></html>`
}

export function LessonOutputPane({
  runResult,
  checkResult,
  activeTab,
  onTabChange,
  language,
  code,
  app,
  reloadKey,
  collapsed = false,
  onToggleCollapse,
  errorHelp,
  quota,
  onRun,
  onCheck,
  onReset,
  onAskForHelp,
  isRunning,
  isChecking,
}: LessonOutputPaneProps) {
  const isApp = isLabLanguage(language)
  const isHtml = language === 'html' || isApp
  const isConsoleLanguage = language === 'javascript' || language === 'typescript' || language === 'sql' || language === 'nodejs-db' || language === 'postgresql'
  // Only the Storefront lessons need the learner's API key; the CSS, React and Next labs open straight away.
  const needsKey = language === 'webapp'
  const frameworkLab = language === 'react-lab' || language === 'next-lab'
  const staticDoc = useMemo(
    () => (isApp && !frameworkLab ? (needsKey && !app ? '' : buildLabDocument(language ?? '', code ?? '', app ?? { apiBase: '', apiKey: '' })) : isHtml && !isApp ? htmlPreviewDocument(code ?? '') : ''),
    [isApp, isHtml, frameworkLab, needsKey, language, code, app],
  )
  // React and Next labs compile in the host page's persistent worker; the frame renders only once the modules are ready.
  const [compiledDoc, setCompiledDoc] = useState<{ doc: string; error?: string } | null>(null)
  useEffect(() => { if (frameworkLab) preloadLessonCompiler() }, [frameworkLab])
  useEffect(() => {
    if (!frameworkLab) return
    let cancelled = false
    const started = performance.now()
    compileLabDocument(language ?? '', code ?? '', app ?? { apiBase: '', apiKey: '' })
      .then(({ doc: built }) => { if (!cancelled) { setCompiledDoc({ doc: built }); recordLessonMetric('preview-document', Math.round(performance.now() - started)) } })
      .catch((error: unknown) => { if (!cancelled) setCompiledDoc({ doc: '', error: error instanceof Error ? error.message : 'The lesson could not be compiled.' }) })
    return () => { cancelled = true }
  }, [frameworkLab, language, code, app])
  const doc = frameworkLab ? compiledDoc?.doc ?? '' : staticDoc
  return (
    <div className="flex h-full flex-col border-t border-rim-subtle bg-[var(--code-bg)]">
      <div className="flex h-10 shrink-0 items-center justify-between gap-1 border-b border-rim-subtle bg-card px-2">
        <LessonActions
          onRun={onRun}
          onCheck={onCheck}
          onReset={onReset}
          onAskForHelp={onAskForHelp}
          isRunning={isRunning}
          isChecking={isChecking}
        />
        <div className="flex min-w-0 items-center">
          {isHtml
            ? <TabButton active={activeTab === 'preview'} onClick={() => onTabChange('preview')} label="Preview" />
            : <TabButton active={activeTab === 'output'} onClick={() => onTabChange('output')} label={language === 'sql' || language === 'postgresql' ? 'Query results' : 'Output'} />}
          <TabButton
            active={activeTab === 'tests'}
            onClick={() => onTabChange('tests')}
            label="Tests"
            badge={checkResult ? `${checkResult.passed}/${checkResult.total}` : undefined}
          />
          {onToggleCollapse && <button onClick={onToggleCollapse} aria-label={collapsed ? 'Expand results' : 'Collapse results'} aria-expanded={!collapsed} className="ml-1 rounded-full p-1.5 text-ghost hover:bg-raised hover:text-ink">{collapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>}
        </div>
      </div>

      {!collapsed && isHtml && activeTab === 'preview' && (
        frameworkLab && compiledDoc?.error ? (
          <div role="alert" className="flex flex-1 items-center justify-center p-6 text-center font-sans text-xs text-error">{compiledDoc.error}</div>
        ) : frameworkLab && !doc ? (
          <div role="status" className="flex flex-1 items-center justify-center p-6 text-center font-sans text-xs text-ghost">Compiling your files…</div>
        ) : isApp && needsKey && !app ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center font-sans text-xs text-ghost">Getting your Storefront key…</div>
        ) : (
          <iframe
            key={isApp ? reloadKey : 'static'}
            title="Live preview"
            data-testid={isApp ? 'app-preview' : 'html-preview'}
            // Markup lessons: an empty sandbox, so nothing runs. Browser lessons: scripts run, but the page gets an opaque
            // origin, so it cannot read DevCraft's cookies or storage or navigate this window.
            sandbox={isApp ? APP_SANDBOX : ''}
            srcDoc={doc}
            className="min-h-0 flex-1 bg-white"
          />
        )
      )}
      {!collapsed && activeTab !== 'preview' && <ErrorHelpCard matches={matchErrorHelp(errorHelp, failureTexts(runResult, checkResult))} />}
      {!collapsed && <div className={cn('flex-1 overflow-y-auto p-4 font-mono text-[13px]', isConsoleLanguage && 'code-console-output', isHtml && activeTab === 'preview' && 'hidden')}>
        {activeTab === 'output' && <OutputView result={runResult} consoleStyle={isConsoleLanguage} />}
        {activeTab === 'tests' && <TestsView result={checkResult} />}
      </div>}
      {!collapsed && <FreeQuotaNotice quota={quota} />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  label,
  badge,
}: {
  active: boolean
  onClick: () => void
  label: string
  badge?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors',
        active ? 'border-brand text-ink' : 'border-transparent text-ghost hover:text-dim'
      )}
    >
      {label}
      {badge && <span className="rounded-full bg-raised px-1.5 py-0.5 text-[10px] text-dim">{badge}</span>}
    </button>
  )
}

function OutputView({ result, consoleStyle }: { result: RunResult | null; consoleStyle: boolean }) {
  if (!result) {
    return (
      <div className={cn('flex h-full flex-col items-center justify-center gap-2 text-ghost', consoleStyle && 'code-console-muted')}>
        <Terminal size={24} />
        <p className="font-sans text-xs">Run your code to see output here.</p>
      </div>
    )
  }

  if (result.timedOut) {
    return <p className="text-error">⏱ Execution timed out (5s limit exceeded).</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {result.table ? <section className={cn(consoleStyle && 'code-console-card')}><ResultTable result={result.table} className={consoleStyle ? 'code-console-table' : undefined} /></section> : result.stdout && <section className={cn(consoleStyle && 'code-console-card')}><pre className={cn('whitespace-pre-wrap break-words text-ink', consoleStyle && 'code-console-stdout')}>{result.stdout}</pre></section>}
      {result.stderr && <section className={cn(consoleStyle && 'code-console-card code-console-error-card')}><p className="code-console-label">Error</p><pre className={cn('whitespace-pre-wrap break-words text-error', consoleStyle && 'code-console-stderr')}>{result.stderr}</pre></section>}
      {!result.stdout && !result.stderr && !result.table && <p className={cn('text-ghost', consoleStyle && 'code-console-muted')}>No output.</p>}
      <p className={cn('mt-2 font-sans text-[11px] text-ghost', consoleStyle && 'code-console-muted')}>
        Exit code {result.exitCode ?? '—'} · {result.status}
      </p>
    </div>
  )
}

function TestsView({ result }: { result: CheckResult | null }) {
  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-ghost">
        <CheckCircle2 size={24} />
        <p className="font-sans text-xs">Click Check to run the test suite.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {result.results.map((test, i) => (
        <div key={i} className="flex items-start gap-2 rounded-[var(--radius-sm)] px-2 py-1.5">
          {test.passed ? (
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-success" />
          ) : (
            <XCircle size={15} className="mt-0.5 shrink-0 text-error" />
          )}
          <div className="min-w-0">
            <p className={test.passed ? 'text-ink' : 'text-error'}>{test.name}</p>
            {test.reason && <p className="font-sans text-xs text-ghost">{test.reason}</p>}
          </div>
        </div>
      ))}
      {result.results.length === 0 && <p className="text-ghost">No test results returned.</p>}
    </div>
  )
}

export function LessonTestsPanel({ result }: { result: CheckResult | null }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 font-mono text-[13px]">
      <TestsView result={result} />
    </div>
  )
}
