'use client'

import { CheckCircle2, XCircle, Terminal } from 'lucide-react'
import { useMemo } from 'react'
import type { RunResult, CheckResult } from '@/lib/api/lessons'
import { cn } from '@/lib/utils'
import { ResultTable } from '@/components/playground/ResultTable'
import { APP_SANDBOX, buildAppDocument, type RunnerConfig } from '@/lib/browser-runner'

interface LessonOutputPaneProps {
  runResult: RunResult | null
  checkResult: CheckResult | null
  activeTab: 'output' | 'tests' | 'preview'
  onTabChange: (tab: 'output' | 'tests' | 'preview') => void
  /** HTML lessons have no code runner; they show a live preview instead of Output. */
  language?: string
  code?: string
  /** Browser lessons: the page runs for real (scripts on) with the learner's Storefront key; `reloadKey` restarts it. */
  app?: RunnerConfig | null
  reloadKey?: number
}

/** The learner's markup, rendered with scripts disabled. It is only ever shown, never executed. */
export function htmlPreviewDocument(code: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><base target="_blank"><style>body{font-family:system-ui,sans-serif;margin:16px;color:#111}</style></head><body>${code}</body></html>`
}

export function LessonOutputPane({ runResult, checkResult, activeTab, onTabChange, language, code, app, reloadKey }: LessonOutputPaneProps) {
  const isApp = language === 'webapp'
  const isHtml = language === 'html' || isApp
  const doc = useMemo(() => (isApp ? (app ? buildAppDocument(code ?? '', app) : '') : isHtml ? htmlPreviewDocument(code ?? '') : ''), [isApp, isHtml, code, app])
  return (
    <div className="flex h-full flex-col border-t border-rim-subtle bg-canvas">
      <div className="flex border-b border-rim-subtle">
        {isHtml
          ? <TabButton active={activeTab === 'preview'} onClick={() => onTabChange('preview')} label="Preview" />
          : <TabButton active={activeTab === 'output'} onClick={() => onTabChange('output')} label="Output" />}
        <TabButton
          active={activeTab === 'tests'}
          onClick={() => onTabChange('tests')}
          label="Tests"
          badge={checkResult ? `${checkResult.passed}/${checkResult.total}` : undefined}
        />
      </div>

      {isHtml && activeTab === 'preview' && (
        isApp && !app ? (
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
      <div className={cn('flex-1 overflow-y-auto p-4 font-mono text-[13px]', isHtml && activeTab === 'preview' && 'hidden')}>
        {activeTab === 'output' && <OutputView result={runResult} />}
        {activeTab === 'tests' && <TestsView result={checkResult} />}
      </div>
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

function OutputView({ result }: { result: RunResult | null }) {
  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-ghost">
        <Terminal size={24} />
        <p className="font-sans text-xs">Run your code to see output here.</p>
      </div>
    )
  }

  if (result.timedOut) {
    return <p className="text-error">⏱ Execution timed out (5s limit exceeded).</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {result.table ? <ResultTable result={result.table} /> : result.stdout && <pre className="whitespace-pre-wrap text-ink">{result.stdout}</pre>}
      {result.stderr && <pre className="whitespace-pre-wrap text-error">{result.stderr}</pre>}
      {!result.stdout && !result.stderr && !result.table && <p className="text-ghost">No output.</p>}
      <p className="mt-2 font-sans text-[11px] text-ghost">
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
