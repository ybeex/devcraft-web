'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Box, CheckCircle2, FileText, HardDrive, Layers, Loader2, Lock, Network, RotateCcw, X, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ApiRequestError } from '@/lib/api/client'
import type { CheckResult } from '@/lib/api/lessons'
import { execDocker, getDockerLab, prepareDockerLesson, readDockerFile, resetDockerLab, writeDockerFile, type DockerView } from '@/lib/api/docker-lab'
import { GitTerminal } from '@/components/git/GitTerminal'
import { EngineNotice } from './EngineNotice'
import { cn } from '@/lib/utils'

const HINTS = ['docker ps -a', 'docker images', 'docker compose ps', 'docker volume ls', 'ls', 'help']
const sizeText = (b: number) => (b >= 1e9 ? `${(b / 1e9).toFixed(2)} GB` : `${Math.round(b / 1e6)} MB`)

const STATE_STYLE: Record<string, string> = {
  running: 'bg-[var(--positive-bg,#10b98126)] text-[var(--positive-text)]',
  exited: 'bg-raised text-dim', created: 'bg-warning/20 text-warning', restarting: 'bg-error/15 text-error', paused: 'bg-raised text-dim',
}

/** The Docker terminal, the project files and editor, and a live view of images, containers, networks and volumes. */
export function DockerLabWorkspace({ lessonId, compact, onChanged, checkResult, isChecking = false, onCheck }: {
  lessonId?: string
  compact?: boolean
  onChanged?: () => void
  checkResult?: CheckResult | null
  isChecking?: boolean
  onCheck?: () => void
}) {
  const [state, setState] = useState<DockerView | null>(null)
  const [load, setLoad] = useState<'loading' | 'ready' | 'pro' | 'error'>('loading')
  const [resetKey, setResetKey] = useState(0)
  const [editing, setEditing] = useState<{ path: string; content: string; saved: boolean } | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [tab, setTab] = useState<'terminal' | 'engine'>('terminal')
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
    ;(lessonId ? prepareDockerLesson(lessonId) : getDockerLab())
      .then((s) => { if (live) { setState(s); setLoad('ready') } })
      .catch((e) => { if (live) setLoad(e instanceof ApiRequestError && e.statusCode === 402 ? 'pro' : 'error') })
    return () => { live = false }
  }, [lessonId])

  const openFile = useCallback(async (path: string) => {
    try { const f = await readDockerFile(path); setEditing({ path, content: f.content, saved: true }) }
    catch { setMsg(`${path} could not be opened.`) }
  }, [])

  async function save() {
    if (!editing) return
    try { setState(await writeDockerFile(editing.path, editing.content)); setEditing({ ...editing, saved: true }); setMsg(`Saved ${editing.path}`); onChanged?.() }
    catch (e) { setMsg(e instanceof ApiRequestError ? e.message : 'Could not save the file.') }
  }

  async function refresh() {
    try { setState(await getDockerLab()) } catch { setMsg('Could not reach the Docker lab. Try again in a moment.') }
  }

  async function reset() {
    if (!window.confirm('Reset this exercise? Your containers, images and files are replaced with the starting point.')) return
    try { setState(await resetDockerLab(lessonId ? undefined : state?.scenario)); setEditing(null); setResetKey((k) => k + 1); onChanged?.() }
    catch (e) { setMsg(e instanceof ApiRequestError ? e.message : 'Could not reset.') }
  }

  function checkWork() {
    revealTestOutput.current = true
    setTab('terminal')
    onCheck?.()
  }

  if (load === 'loading') return <div className="flex h-48 items-center justify-center text-sm text-dim"><Loader2 className="mr-2 animate-spin" size={16} /> Starting your Docker lab…</div>
  if (load === 'pro') return (
    <div className="flex flex-col items-center gap-3 p-8 text-center" data-testid="docker-pro">
      <Lock size={22} className="text-brand" />
      <p className="max-w-sm text-sm text-dim">The Docker lab gives you a terminal that behaves like Docker, with your own images and containers. It is part of Pro.</p>
      <Link href="/pricing"><Button size="sm">View Pro plans</Button></Link>
    </div>
  )
  if (load === 'error' || !state) return <p className="p-8 text-center text-sm text-dim">The lab could not be loaded. Try refreshing.</p>

  const running = state.containers.filter((c) => c.state === 'running').length

  const files = (
    <div className="flex min-h-0 flex-col" data-testid="docker-files">
      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ghost">Project files</p>
      <ul className="min-h-0 flex-1 overflow-auto px-1 pb-2 text-[13px]">
        {state.files.map((f) => (
          <li key={f} style={{ paddingLeft: 8 + (f.split('/').length - 1) * 12 }}>
            <button type="button" onClick={() => void openFile(f)} className="flex w-full items-center gap-1.5 rounded py-0.5 text-left text-ink hover:bg-raised">
              <FileText size={12} className="shrink-0 text-ghost" /> <span className="truncate">{f}</span>
            </button>
          </li>
        ))}
        {state.files.length === 0 && <li className="px-2 py-1 text-xs text-ghost">No files yet.</li>}
      </ul>
    </div>
  )

  const section = (icon: React.ReactNode, title: string, count: number, body: React.ReactNode) => (
    <section className="border-b border-rim-subtle px-3 py-2 last:border-b-0">
      <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ghost">{icon} {title} <span className="rounded-full bg-raised px-1.5 text-[10px] text-dim">{count}</span></h3>
      <div className="mt-1.5 text-[13px]">{body}</div>
    </section>
  )
  const empty = (t: string) => <p className="text-xs text-ghost">{t}</p>

  const engine = (
    <div className="min-h-0 overflow-auto" data-testid="docker-engine">
      {section(<Box size={12} />, 'Containers', state.containers.length, state.containers.length === 0 ? empty('None yet. Try docker run.') : (
        <ul className="flex flex-col gap-1.5">
          {state.containers.map((c) => (
            <li key={c.id} className="rounded-[var(--radius-md)] border border-rim-subtle p-2" data-testid={`container-${c.name}`}>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono font-semibold text-ink">{c.name}</span>
                <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', STATE_STYLE[c.state])}>{c.state}</span>
                {c.health && <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', c.health === 'healthy' ? 'bg-[var(--positive-bg,#10b98126)] text-[var(--positive-text)]' : c.health === 'unhealthy' ? 'bg-error/15 text-error' : 'bg-raised text-dim')}>{c.health}</span>}
                {c.restarts > 0 && <span className="text-[10px] text-error">restarted {c.restarts}×</span>}
              </div>
              <p className="mt-0.5 truncate text-xs text-dim">{c.image} · {c.status}</p>
              {(c.ports || c.networks.length > 0) && <p className="truncate font-mono text-[11px] text-ghost">{c.ports || '-'}{c.networks.length ? ` · ${c.networks.join(', ')}${c.ip ? ' · ' + c.ip : ''}` : ''}</p>}
            </li>
          ))}
        </ul>
      ))}
      {section(<Layers size={12} />, 'Images', state.images.length, state.images.length === 0 ? empty('None yet. Build or pull one.') : (
        <ul className="flex flex-col gap-1">
          {state.images.map((i) => (
            <li key={i.id} className="flex items-baseline gap-2">
              <span className="truncate font-mono text-ink">{i.tags.length ? i.tags.join(', ') : '<none>'}</span>
              <span className="ml-auto shrink-0 text-xs text-dim">{sizeText(i.size)}</span>
            </li>
          ))}
        </ul>
      ))}
      {section(<Network size={12} />, 'Networks', state.networks.filter((n) => !n.builtin).length, state.networks.filter((n) => !n.builtin).length === 0 ? empty('Only the default bridge. Containers on it cannot find each other by name.') : (
        <ul className="flex flex-col gap-1">{state.networks.filter((n) => !n.builtin).map((n) => <li key={n.name}><span className="font-mono text-ink">{n.name}</span> <span className="text-xs text-dim">{n.containers.join(', ') || 'empty'}</span></li>)}</ul>
      ))}
      {section(<HardDrive size={12} />, 'Volumes', state.volumes.length, state.volumes.length === 0 ? empty('None. Data in containers is lost when they are removed.') : (
        <ul className="flex flex-col gap-1">{state.volumes.map((v) => <li key={v.name}><span className="font-mono text-ink">{v.name.length > 22 ? v.name.slice(0, 12) + '…' : v.name}</span> <span className="text-xs text-dim">{v.usedBy.length ? `used by ${v.usedBy.join(', ')}` : 'not in use'}</span></li>)}</ul>
      ))}
      {state.lastBuild && section(<Layers size={12} />, 'Last build', state.lastBuild.steps.length, (
        <div>
          <p className={cn('text-xs font-semibold', state.lastBuild.ok ? 'text-[var(--positive-text)]' : 'text-error')}>{state.lastBuild.ok ? 'Succeeded' : 'Failed'}{state.lastBuild.tag ? ` · ${state.lastBuild.tag}` : ''}</p>
          <ul className="mt-1 flex flex-col gap-0.5 font-mono text-[11px]">
            {state.lastBuild.steps.map((s, i) => <li key={i} className="flex gap-2"><span className={cn('w-14 shrink-0', s.cached ? 'text-[var(--positive-text)]' : 'text-ghost')}>{s.cached ? 'CACHED' : 'ran'}</span><span className="truncate text-dim">{s.text}</span></li>)}
          </ul>
        </div>
      ))}
    </div>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3" data-testid="docker-lab">
      <EngineNotice engine={state.engine} engineError={state.engineError} onRetry={() => void refresh()} />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-raised px-2.5 py-1 text-dim" data-testid="docker-summary">{running} running · {state.containers.length} containers · {state.images.length} images</span>
        <div className="ml-auto flex items-center gap-2">
          {onCheck && <Button size="sm" onClick={checkWork} disabled={isChecking} data-testid="docker-check">{isChecking ? <><Loader2 size={14} className="animate-spin" /> Checking…</> : 'Check my work'}</Button>}
          <button type="button" onClick={() => void reset()} className="flex items-center gap-1 rounded-full border border-rim px-2.5 py-1 text-dim hover:bg-raised hover:text-ink" data-testid="docker-reset"><RotateCcw size={12} /> Reset exercise</button>
        </div>
      </div>
      {msg && <p role="status" className="text-xs text-dim">{msg}</p>}

      {compact && (
        <div className="flex min-w-0 items-center gap-2 border-y border-rim-subtle bg-card px-2">
          <div className="flex shrink-0">
            {(['terminal', 'engine'] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={cn('border-b-2 px-3 py-2 text-xs font-semibold', tab === t ? 'border-brand text-ink' : 'border-transparent text-ghost hover:text-dim')}>{t === 'engine' ? 'Engine' : 'Terminal'}</button>)}
          </div>
        </div>
      )}

      <div className={cn('grid min-h-0 flex-1 gap-3', compact ? 'grid-cols-1' : 'lg:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)]')}>
        {!compact && <div className="hidden overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-card lg:flex lg:flex-col">{files}</div>}
        <div className={cn('flex min-h-[260px] min-w-0 flex-col gap-3 overflow-y-auto pr-1', compact && tab !== 'terminal' && 'hidden')}>
          <div className="shrink-0 overflow-hidden" style={{ height: 280, maxHeight: 280 }}>
            <GitTerminal
              className="h-full max-h-full" onState={(s: DockerView) => setState(s)} onEdit={(p) => void openFile(p)} onRan={onChanged} resetKey={resetKey}
              exec={execDocker} hints={HINTS} testId="docker" welcome={state.engine === 'real' ? 'A terminal connected to your own real Docker engine. Type "help" to see what you can run.' : 'A Docker practice terminal. It simulates Docker: nothing here starts a real container. Type "help" to see what you can run.'}
            />
          </div>
          {onCheck && <div ref={testOutputRef}><DockerTestOutput result={checkResult ?? null} /></div>}
          {compact && <div className="max-h-40 overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-card">{files}</div>}
          {editing && (
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-rim bg-card" data-testid="docker-editor">
              <div className="flex items-center gap-2 border-b border-rim-subtle px-3 py-1.5 text-xs">
                <FileText size={12} /> <span className="font-mono text-ink">{editing.path}</span>
                {!editing.saved && <span className="text-warning">unsaved</span>}
                <Button size="sm" className="ml-auto !px-3 !py-1 text-xs" onClick={() => void save()} disabled={editing.saved} data-testid="docker-save">Save</Button>
                <button type="button" aria-label="Close editor" onClick={() => setEditing(null)} className="text-ghost hover:text-ink"><X size={14} /></button>
              </div>
              <textarea
                value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value, saved: false })}
                spellCheck={false} aria-label={`Edit ${editing.path}`} data-testid="docker-editor-text"
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); void save() } }}
                className="block h-44 w-full resize-y bg-canvas p-3 font-mono text-[13px] text-ink outline-none"
              />
            </div>
          )}
        </div>
        <div className={cn('min-h-[260px] min-w-0 overflow-auto rounded-[var(--radius-lg)] border border-rim-subtle bg-card', compact && tab !== 'engine' && 'hidden')}>
          {engine}
        </div>
      </div>
    </div>
  )
}

function DockerTestOutput({ result }: { result: CheckResult | null }) {
  return (
    <section className="shrink-0 overflow-hidden rounded-[var(--radius-lg)] border border-rim shadow-[var(--shadow-sm)]" aria-live="polite" data-testid="docker-results">
      <div className="flex items-center justify-between border-b border-rim-subtle bg-raised px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ghost">Test output</span>
        {result && <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-medium text-dim">{result.passed}/{result.total} passed</span>}
      </div>
      <div className="code-console-output min-h-[160px] max-h-48 overflow-y-auto p-3 font-mono text-[13px]">
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
