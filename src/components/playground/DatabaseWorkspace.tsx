'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Editor from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { Download, Play, RotateCcw, Table2, KeyRound, Link2, Database, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiRequestError } from '@/lib/api/client'
import { downloadSandboxExport, getSandbox, resetSandbox, runSandboxQuery, type QueryResult, type SandboxInfo } from '@/lib/api/sandbox'
import { ResultTable } from './ResultTable'

const STARTER = `-- Your own copy of the DevCraft Shop and Support data. Change anything: Reset puts it back.
SELECT status, count(*) AS orders
FROM orders
GROUP BY status
ORDER BY orders DESC;`

const SUPPORT_TABLES = ['agents', 'requesters', 'tickets', 'ticket_messages']
const mb = (b: number) => `${(b / 1_048_576).toFixed(1)} MB`

export function DatabaseWorkspace() {
  const { resolvedTheme } = useTheme()
  const [info, setInfo] = useState<SandboxInfo | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'pro' | 'down' | 'error'>('loading')
  const [sql, setSql] = useState(STARTER)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [open, setOpen] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const d = await getSandbox()
      if (!d.available) { setState('down'); return }
      setInfo(d); setState('ready')
    } catch (err) {
      setState(err instanceof ApiRequestError && err.statusCode === 402 ? 'pro' : 'error')
    }
  }, [])
  useEffect(() => { void load() }, [load])

  async function run() {
    if (!sql.trim() || running) return
    setRunning(true); setError(null)
    try {
      setResult(await runSandboxQuery(sql))
      void load()                                   // a CREATE/DROP changes the schema browser
    } catch (err) {
      setResult(null)
      setError(err instanceof ApiRequestError ? err.message : 'Could not reach the practice database. Try again.')
    } finally { setRunning(false) }
  }

  async function reset() {
    if (!window.confirm('Reset your practice database? Everything you changed is replaced with the original shop data.')) return
    setResetting(true); setError(null)
    try { await resetSandbox(); setResult(null); await load() }
    catch (err) { setError(err instanceof ApiRequestError ? err.message : 'Reset failed. Try again.') }
    finally { setResetting(false) }
  }

  async function exportDb() {
    setError(null)
    try { await downloadSandboxExport() } catch (err) { setError(err instanceof Error ? err.message : 'Export failed.') }
  }

  if (state === 'loading') return <Skeleton className="mt-6 h-[480px]" />
  if (state === 'pro') {
    return (
      <div className="mt-8 rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-8 text-center">
        <Lock className="mx-auto text-brand" size={28} />
        <h2 className="mt-3 font-display text-xl font-bold text-ink">Your own practice database is part of Pro</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-dim">
          A private copy of a real online shop (10,000 orders) for you to query, break and rebuild with real PostgreSQL — and the Backend database lessons run on it.
        </p>
        <Link href="/pro" className="mt-5 inline-block"><Button>See Pro</Button></Link>
      </div>
    )
  }
  if (state === 'down' || state === 'error') {
    return (
      <div className="mt-8 rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-8 text-center text-sm text-dim">
        {state === 'down' ? 'The practice database is not switched on right now.' : 'Could not load your practice database.'}{' '}
        <button className="font-semibold underline underline-offset-2" onClick={() => { setState('loading'); void load() }}>Try again</button>
      </div>
    )
  }

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-3 text-sm" aria-label="Schema">
        {[{ label: 'DevCraft Shop', names: null as string[] | null }, { label: 'DevCraft Support', names: SUPPORT_TABLES }].map((group) => {
          const list = info!.tables.filter((t) => (group.names ? group.names.includes(t.name) : !SUPPORT_TABLES.includes(t.name)))
          if (list.length === 0) return null
          return (
        <div key={group.label} className="mb-3">
        <p className="flex items-center gap-1.5 px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-ghost"><Database size={12} /> {group.label}</p>
        <ul className="flex flex-col gap-0.5">
          {list.map((t) => (
            <li key={t.name}>
              <button onClick={() => setOpen(open === t.name ? null : t.name)} className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-ink hover:bg-raised">
                <span className="flex items-center gap-1.5"><Table2 size={13} className="text-dim" />{t.name}</span>
                <span className="text-[11px] text-ghost">{t.rows.toLocaleString()}</span>
              </button>
              {open === t.name && (
                <ul className="mb-1 ml-6 mt-0.5 flex flex-col gap-0.5 border-l border-rim-subtle pl-2 font-mono text-[12px]">
                  {t.columns.map((c) => (
                    <li key={c.name} className="flex items-center gap-1 text-dim">
                      {c.primaryKey && <KeyRound size={11} className="text-brand" aria-label="primary key" />}
                      {c.references && <Link2 size={11} className="text-brand" aria-label={`references ${c.references}`} />}
                      <button className="text-ink hover:underline" onClick={() => setSql((s) => `${s.trimEnd()}\n-- ${t.name}.${c.name}`)}>{c.name}</button>
                      <span className="text-ghost">{c.type}{c.nullable ? '' : ' ·NN'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        </div>
          )
        })}
        <p className="mt-3 border-t border-rim-subtle px-1 pt-2 text-[11px] leading-relaxed text-ghost">
          {mb(info!.sizeBytes)} of {mb(info!.quotaBytes ?? 0)} used. Idle databases are removed after a while, and you get a fresh one next time.
        </p>
      </aside>

      <section className="flex min-w-0 flex-col gap-3">
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle">
          <div className="flex items-center justify-between gap-2 border-b border-rim-subtle bg-card px-3 py-2">
            <div className="flex gap-2">
              <Button size="sm" onClick={run} disabled={running || resetting}><Play size={13} /> {running ? 'Running…' : 'Run'}</Button>
              <Button size="sm" variant="outline" onClick={reset} disabled={running || resetting}><RotateCcw size={13} /> {resetting ? 'Resetting…' : 'Reset database'}</Button>
              <Button size="sm" variant="ghost" onClick={exportDb} disabled={running || resetting}><Download size={13} /> Export .sql</Button>
            </div>
            <span className="hidden text-[11px] text-ghost sm:block">One statement at a time · Ctrl/⌘+Enter to run</span>
          </div>
          <div className="h-[220px]" onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); void run() } }}>
            <Editor value={sql} language="sql" theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'} onChange={(v) => setSql(v ?? '')}
              options={{ fontSize: 13.5, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 12 }, automaticLayout: true, tabSize: 2 }} />
          </div>
        </div>

        <div className="min-h-[160px] rounded-[var(--radius-lg)] border border-rim-subtle bg-canvas p-3" aria-live="polite">
          {error && <pre className="whitespace-pre-wrap font-mono text-[13px] text-error">{error}</pre>}
          {!error && !result && <p className="text-sm text-ghost">Run a statement to see the result here.</p>}
          {result && <ResultTable result={result} />}
        </div>
      </section>
    </div>
  )
}
