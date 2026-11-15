'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { CheckCircle2, ChevronLeft, ChevronRight, FileText, Folder, Loader2, Lock, RotateCcw, X, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ApiRequestError } from '@/lib/api/client'
import type { CheckResult } from '@/lib/api/lessons'
import { getGitLab, prepareGitLesson, readGitFile, resetGitLab, writeGitFile, type LabState } from '@/lib/api/git-lab'
import { monacoLanguage } from '@/lib/lab-files'
import { defineDevCraftMonacoThemes } from '@/lib/monaco-theme'
import { Skeleton } from '@/components/ui/Skeleton'
import { GitGraph } from './GitGraph'
import { GitTerminal } from './GitTerminal'
import { cn } from '@/lib/utils'

const BADGE: Record<string, string> = { '??': 'new', M: 'modified', A: 'added', D: 'deleted', R: 'renamed', U: 'conflict' }
const badge = (code: string): string => (code === '??' ? 'new' : code.includes('U') || code === 'AA' || code === 'DD' ? 'conflict' : BADGE[code.trim()[0] ?? ''] ?? code.trim())
type EditingFile = { path: string; content: string; saved: boolean }

/** The terminal, the working-tree file list/editor and the live commit graph. On a lesson page it first sets up that lesson's exercise. */
export function GitLabWorkspace({ lessonId, compact, onChanged, checkResult, isChecking = false, onCheck }: {
  lessonId?: string
  compact?: boolean
  onChanged?: () => void
  checkResult?: CheckResult | null
  isChecking?: boolean
  onCheck?: () => void
}) {
  const { resolvedTheme } = useTheme()
  const editorTheme = resolvedTheme === 'dark' ? 'devcraft-dark' : 'devcraft-light'
  const [state, setState] = useState<LabState | null>(null)
  const [load, setLoad] = useState<'loading' | 'ready' | 'pro' | 'down' | 'error'>('loading')
  const [resetKey, setResetKey] = useState(0)
  const [editing, setEditing] = useState<EditingFile | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [tab, setTab] = useState<'tests' | 'graph'>('tests')
  const [filesCollapsed, setFilesCollapsed] = useState(false)
  const testOutputRef = useRef<HTMLDivElement>(null)
  const revealTestOutput = useRef(false)

  useEffect(() => {
    if (!revealTestOutput.current || isChecking) return
    revealTestOutput.current = false
    requestAnimationFrame(() => testOutputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
  }, [checkResult, isChecking])

  useEffect(() => {
    let live = true
    setLoad('loading')
    ;(lessonId ? prepareGitLesson(lessonId) : getGitLab())
      .then((s) => { if (!live) return; if (!s.available) setLoad('down'); else { setState(s); setLoad('ready') } })
      .catch((e) => { if (live) setLoad(e instanceof ApiRequestError && e.statusCode === 402 ? 'pro' : 'error') })
    return () => { live = false }
  }, [lessonId])

  const openFile = useCallback(async (path: string) => {
    try { const f = await readGitFile(path); setEditing({ path, content: f.content, saved: true }) }
    catch { setMsg(`${path} could not be opened.`) }
  }, [])

  async function save() {
    if (!editing) return
    try { setState(await writeGitFile(editing.path, editing.content)); setEditing({ ...editing, saved: true }); setMsg(`Saved ${editing.path}`); onChanged?.() }
    catch (e) { setMsg(e instanceof ApiRequestError ? e.message : 'Could not save the file.') }
  }

  async function reset() {
    if (!window.confirm('Reset this exercise? Your changes in the lab are replaced with the starting point.')) return
    try { setState(await resetGitLab(lessonId ? undefined : state?.scenario)); setEditing(null); setResetKey((k) => k + 1); onChanged?.() }
    catch (e) { setMsg(e instanceof ApiRequestError ? e.message : 'Could not reset.') }
  }

  function checkWork() {
    revealTestOutput.current = true
    setTab('tests')
    onCheck?.()
  }

  if (load === 'loading') {
    if (!compact) return <div className="flex h-48 items-center justify-center text-sm text-dim"><Loader2 className="mr-2 animate-spin" size={16} /> Setting up your repository…</div>
    return (
      <div className="flex h-full min-h-0 flex-col" data-testid="git-workspace-loading">
        <div className="flex h-10 shrink-0 items-center gap-2 border-b border-rim-subtle bg-card px-0">
          <div className="h-full w-10 shrink-0 border-r border-rim-subtle lg:w-[180px]" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="ml-auto h-5 w-20" />
        </div>
        <div className="grid min-h-0 flex-1 lg:grid-cols-[180px_minmax(0,1fr)]">
          <div className="hidden flex-col gap-3 border-r border-rim-subtle p-3 lg:flex">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex min-h-0 flex-col gap-2 p-2">
            <Skeleton className="h-20 shrink-0 lg:hidden" />
            <Skeleton className="min-h-[170px] min-w-0 flex-[2]" />
            <Skeleton className="min-h-[180px] min-w-0 flex-[3]" />
            <Skeleton className="h-36 shrink-0" />
          </div>
        </div>
      </div>
    )
  }
  if (load === 'pro') return (
    <div className="flex flex-col items-center gap-3 p-8 text-center" data-testid="git-pro">
      <Lock size={22} className="text-brand" />
      <p className="max-w-sm text-sm text-dim">The Git lab gives you a real repository to practise on. It is part of Pro.</p>
      <Link href="/pricing"><Button size="sm">View Pro plans</Button></Link>
    </div>
  )
  if (load === 'down' || load === 'error' || !state) return <p className="p-8 text-center text-sm text-dim">{load === 'down' ? 'The Git lab is not available right now.' : 'The lab could not be loaded. Try refreshing.'}</p>

  const statusOf = new Map(state.status.map((s) => [s.path, s.code]))
  const files = (
    <div className="flex h-full min-h-0 flex-col" data-testid="git-files">
      <ul className="min-h-0 flex-1 overflow-auto px-1 pb-2 text-[13px]">
        {state.files.map((f) => {
          const code = statusOf.get(f.path)
          return (
            <li key={f.path} style={{ paddingLeft: 8 + (f.path.split('/').length - 1) * 12 }}>
              {f.dir ? (
                <span className="flex items-center gap-1.5 py-0.5 text-dim"><Folder size={12} /> {f.path.split('/').pop()}</span>
              ) : (
                <button type="button" onClick={() => void openFile(f.path)} className="flex w-full items-center gap-1.5 rounded py-0.5 text-left text-ink hover:bg-raised">
                  <FileText size={12} className="shrink-0 text-ghost" />
                  <span className="truncate">{f.path.split('/').pop()}</span>
                  {code && <span className={cn('ml-auto shrink-0 rounded px-1 text-[10px] font-semibold', badge(code) === 'conflict' ? 'bg-error/15 text-error' : badge(code) === 'new' ? 'bg-raised text-dim' : 'bg-warning/20 text-warning')}>{badge(code)}</span>}
                </button>
              )}
            </li>
          )
        })}
        {state.files.length === 0 && <li className="px-2 py-1 text-xs text-ghost">No files yet.</li>}
      </ul>
    </div>
  )

  const graphPanel = (
    <div className="min-h-0 min-w-0 overflow-auto rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-2">
      <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ghost">History</p>
      <GitGraph state={state} />
    </div>
  )

  const gitEditor = editing && (
    <GitFileEditor
      editing={editing}
      theme={editorTheme}
      compact={compact}
      onChange={(content) => setEditing({ ...editing, content, saved: false })}
      onSave={() => void save()}
      onClose={() => setEditing(null)}
    />
  )

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', !compact && 'gap-3')} data-testid="git-lab">
      <div className={cn(
        'flex shrink-0 items-center gap-2 text-xs',
        compact ? 'h-10 border-b border-rim-subtle bg-card px-0' : 'flex-wrap'
      )}>
        {compact ? (
          <>
            <div className={cn(
              'flex h-full shrink-0 items-center justify-center border-r border-rim-subtle lg:justify-end lg:pr-2',
              filesCollapsed ? 'w-10' : 'w-10 lg:w-[180px]'
            )}>
              <button
                type="button"
                onClick={() => setFilesCollapsed((collapsed) => !collapsed)}
                aria-expanded={!filesCollapsed}
                aria-label={filesCollapsed ? 'Expand files panel' : 'Collapse files panel'}
                title={filesCollapsed ? 'Expand files panel' : 'Collapse files panel'}
                data-testid="git-files-toggle"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rim bg-card text-dim shadow-elev-md transition-colors hover:text-ink"
              >
                {filesCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
              </button>
            </div>
            <span className="shrink-0 px-2 text-xs font-semibold text-dim">Terminal</span>
            <span className="min-w-0 truncate rounded-full bg-raised px-2 py-1 font-mono text-[11px] text-dim" data-testid="git-head">
              {state.head.detached ? `HEAD detached at ${state.head.sha?.slice(0, 7)}` : state.head.branch ?? 'no commits yet'}
            </span>
            {state.operation && <span className="hidden shrink-0 rounded-full bg-warning/20 px-2 py-1 text-[11px] font-semibold text-warning sm:inline-flex" data-testid="git-operation">{state.operation} in progress</span>}
            {state.stashCount > 0 && <span className="hidden shrink-0 rounded-full bg-raised px-2 py-1 text-[11px] text-dim md:inline-flex">{state.stashCount} stashed</span>}
          </>
        ) : (
          <>
            <span className="rounded-full bg-raised px-2.5 py-1 font-mono text-dim" data-testid="git-head">{state.head.detached ? `HEAD detached at ${state.head.sha?.slice(0, 7)}` : state.head.branch ?? 'no commits yet'}</span>
            {state.operation && <span className="rounded-full bg-warning/20 px-2.5 py-1 font-semibold text-warning" data-testid="git-operation">{state.operation} in progress</span>}
            {state.stashCount > 0 && <span className="rounded-full bg-raised px-2.5 py-1 text-dim">{state.stashCount} stashed</span>}
          </>
        )}
        {!compact && (
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {onCheck && <Button size="sm" onClick={checkWork} disabled={isChecking} data-testid="git-check">{isChecking ? <><Loader2 size={14} className="animate-spin" /> Checking…</> : 'Check my work'}</Button>}
            <button type="button" onClick={() => void reset()} className="flex items-center gap-1 rounded-full p-2 text-dim transition-colors hover:bg-raised hover:text-ink sm:px-2.5 sm:py-1" data-testid="git-reset" title="Reset exercise" aria-label="Reset exercise"><RotateCcw size={13} /><span className="hidden sm:inline">Reset</span></button>
          </div>
        )}
      </div>

      {msg && <p role="status" className="shrink-0 border-b border-rim-subtle bg-card px-3 py-1.5 text-xs text-dim">{msg}</p>}

      {compact ? (
        <div className="flex min-h-0 flex-1">
          <aside className={cn(
            'hidden min-h-0 shrink-0 overflow-hidden border-r border-rim-subtle bg-canvas lg:flex lg:flex-col',
            filesCollapsed ? 'w-10' : 'w-[180px]'
          )}>
            {!filesCollapsed && files}
          </aside>
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
            {!filesCollapsed && <div className="h-20 shrink-0 overflow-hidden border-b border-rim-subtle bg-card lg:hidden">{files}</div>}
            <div className="flex min-h-[170px] min-w-0 flex-[2] flex-col overflow-hidden bg-[var(--code-bg)]">
            <div className={cn('min-h-[170px] min-w-0 overflow-hidden', gitEditor ? 'flex-[2]' : 'flex-1')}>
              <GitTerminal
                className="h-full rounded-none border-x-0 border-t-0 shadow-none"
                onState={(s) => { setState(s); setEditing((e) => e) }}
                onEdit={(p) => void openFile(p)}
                onRan={onChanged}
                resetKey={resetKey}
              />
            </div>
            {gitEditor && <div className="min-h-[180px] min-w-0 flex-[3] overflow-hidden border-t border-rim-subtle">{gitEditor}</div>}
            </div>
            {onCheck && (
              <section className="flex min-h-[150px] flex-[1] flex-col overflow-hidden border-t border-rim-subtle bg-[var(--code-bg)]" data-testid="git-output">
                <div className="flex h-10 shrink-0 items-center justify-between border-b border-rim-subtle bg-card px-2">
                  <div className="flex h-full items-center">
                    <button
                      type="button"
                      onClick={() => setTab('tests')}
                      aria-pressed={tab === 'tests'}
                      className={cn('h-full border-b-2 px-3 text-xs font-semibold transition-colors', tab === 'tests' ? 'border-brand text-ink' : 'border-transparent text-ghost hover:text-dim')}
                    >
                      Tests
                      {checkResult && <span className="ml-1.5 rounded-full bg-raised px-1.5 py-0.5 text-[10px] text-dim">{checkResult.passed}/{checkResult.total}</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('graph')}
                      aria-pressed={tab === 'graph'}
                      className={cn('h-full border-b-2 px-3 text-xs font-semibold transition-colors', tab === 'graph' ? 'border-brand text-ink' : 'border-transparent text-ghost hover:text-dim')}
                    >
                      History
                    </button>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button size="sm" className="!px-2 !py-1 !text-xs" onClick={checkWork} disabled={isChecking} data-testid="git-check">
                      {isChecking
                        ? <><Loader2 size={14} className="animate-spin" /> Checking…</>
                        : 'Check'}
                    </Button>
                    <button type="button" onClick={() => void reset()} className="flex items-center gap-1 rounded-full p-1.5 text-[11px] text-dim transition-colors hover:bg-raised hover:text-ink sm:px-2 sm:py-1" data-testid="git-reset" title="Reset exercise" aria-label="Reset exercise">
                      <RotateCcw size={12} /><span>Reset</span>
                    </button>
                  </div>
                </div>
                <div ref={testOutputRef} className="min-h-0 flex-1 overflow-auto">
                  {tab === 'tests' ? <GitTestOutput result={checkResult ?? null} compact /> : <div className="min-h-full overflow-auto bg-[var(--code-bg)] p-2"><GitGraph state={state} /></div>}
                </div>
              </section>
            )}
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[180px_minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="hidden min-h-0 overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-card lg:flex lg:flex-col">{files}</div>
          <div className="flex min-h-[260px] min-w-0 flex-col gap-3 overflow-y-auto pr-1">
            <div className="shrink-0 overflow-hidden" style={{ height: 280, maxHeight: 280 }}>
              <GitTerminal className="h-full max-h-full" onState={(s) => { setState(s); setEditing((e) => e) }} onEdit={(p) => void openFile(p)} onRan={onChanged} resetKey={resetKey} />
            </div>
            {onCheck && <div ref={testOutputRef}><GitTestOutput result={checkResult ?? null} /></div>}
            {gitEditor}
          </div>
          {graphPanel}
        </div>
      )}
    </div>
  )
}

function GitFileEditor({ editing, theme, compact = false, onChange, onSave, onClose }: {
  editing: EditingFile
  theme: string
  compact?: boolean
  onChange: (content: string) => void
  onSave: () => void
  onClose: () => void
}) {
  const saveRef = useRef(onSave)
  useEffect(() => { saveRef.current = onSave }, [onSave])

  return (
    <div className={cn(
      'flex min-h-[180px] min-w-0 flex-1 flex-col overflow-hidden border border-rim-subtle bg-card',
      compact && 'rounded-none border-x-0 border-b-0'
    )} data-testid="git-editor">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-rim-subtle bg-card px-3 text-xs">
        <FileText size={13} className="text-dim" />
        <span className="min-w-0 truncate font-mono text-ink">{editing.path}</span>
        {!editing.saved && <span className="shrink-0 text-warning">unsaved</span>}
        <Button size="sm" className="ml-auto !px-3 !py-1 text-xs" onClick={onSave} disabled={editing.saved} data-testid="git-save">Save</Button>
        <button type="button" aria-label="Close editor" onClick={onClose} className="rounded-full p-1 text-ghost hover:bg-raised hover:text-ink"><X size={14} /></button>
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          value={editing.content}
          path={`gitlab:///${editing.path}`}
          keepCurrentModel
          language={monacoLanguage(editing.path)}
          theme={theme}
          beforeMount={defineDevCraftMonacoThemes}
          onChange={(value) => onChange(value ?? '')}
          onMount={(editor, monaco) => {
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => saveRef.current())
          }}
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            renderLineHighlight: 'gutter',
          }}
        />
      </div>
    </div>
  )
}

function GitTestOutput({ result, compact = false }: { result: CheckResult | null; compact?: boolean }) {
  return (
    <section className={cn(
      'shrink-0 overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-[var(--code-bg)]',
      compact && 'flex h-full min-h-0 flex-col rounded-none border-0'
    )} aria-live="polite" data-testid="git-results">
      {!compact && (
        <div className="flex h-8 shrink-0 items-center justify-between border-b border-rim-subtle bg-card px-3">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-ghost">Tests</span>
          {result && <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-medium text-dim">{result.passed}/{result.total} passed</span>}
        </div>
      )}
      <div className={cn(
        'code-console-output overflow-y-auto p-3 font-mono text-[13px]',
        compact ? 'min-h-0 flex-1' : 'min-h-[160px] max-h-48'
      )}>
        {!result ? (
          <p className="code-console-muted text-ghost">Check your work to run the exercise tests.</p>
        ) : result.results.length === 0 ? (
          <p className="code-console-muted text-ghost">No test results returned. Try checking again.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {result.results.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                {item.passed ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-success" /> : <XCircle size={15} className="mt-0.5 shrink-0 text-error" />}
                <span className="min-w-0"><span className={item.passed ? 'text-ink' : 'text-error'}>{item.name}</span>{item.reason && <span className="block pt-0.5 text-xs text-ghost">{item.reason}</span>}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
