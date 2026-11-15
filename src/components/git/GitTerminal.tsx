'use client'

import { useEffect, useRef, useState } from 'react'
import { ApiRequestError } from '@/lib/api/client'
import { execGit } from '@/lib/api/git-lab'
import { cn } from '@/lib/utils'

interface Line { kind: 'cmd' | 'out' | 'err' | 'info'; text: string }

/** A terminal returns carriage returns for progress lines; keep what the line ends up showing. */
const tidy = (s: string) => s.split('\n').map((l) => (l.includes('\r') ? l.split('\r').filter(Boolean).pop() ?? '' : l)).join('\n')

export function GitTerminal({ onState, onEdit, onRan, className, resetKey, exec = execGit, hints, welcome = 'A real Git repository, just for you. Type "help" to see what you can run.', testId = 'git' }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onState: (s: any) => void
  exec?: (command: string) => Promise<{ stdout: string; stderr: string; edit?: string; state: unknown }>
  hints?: string[]
  welcome?: string
  testId?: string
  onEdit: (path: string) => void
  onRan?: () => void
  className?: string
  resetKey?: number
}) {
  const [lines, setLines] = useState<Line[]>([{ kind: 'info', text: welcome }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const history = useRef<string[]>([])
  const cursor = useRef(-1)
  const scroller = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLInputElement>(null)

  useEffect(() => { if (resetKey) setLines([{ kind: 'info', text: 'Exercise reset to its starting point.' }]) }, [resetKey])
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight }) }, [lines])

  async function submit(command: string) {
    const cmd = command.trim()
    if (!cmd || busy) return
    history.current.push(cmd); cursor.current = history.current.length
    setInput('')
    if (cmd === 'clear') { setLines([]); return }
    setLines((l) => [...l, { kind: 'cmd', text: cmd }])
    setBusy(true)
    try {
      const r = await exec(cmd)
      setLines((l) => [...l,
        ...(r.stdout ? [{ kind: 'out' as const, text: tidy(r.stdout).replace(/\n$/, '') }] : []),
        ...(r.stderr ? [{ kind: 'err' as const, text: tidy(r.stderr).replace(/\n$/, '') }] : []),
      ])
      onState(r.state)
      if (r.edit) onEdit(r.edit)
      onRan?.()
    } catch (e) {
      setLines((l) => [...l, { kind: 'err', text: e instanceof ApiRequestError ? e.message : 'Could not reach the lab. Try again.' }])
    } finally { setBusy(false); setTimeout(() => field.current?.focus(), 0) }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); void submit(input) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (cursor.current > 0) { cursor.current--; setInput(history.current[cursor.current] ?? '') } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (cursor.current < history.current.length - 1) { cursor.current++; setInput(history.current[cursor.current] ?? '') } else { cursor.current = history.current.length; setInput('') } }
    else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); setLines([]) }
  }

  return (
    <div className={cn('flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-rim bg-[var(--code-bg)] font-mono text-[13px] text-ink shadow-[var(--shadow-sm)]', className)} data-testid={`${testId}-terminal`} onClick={() => field.current?.focus()}>
      <div ref={scroller} className="min-h-0 flex-1 overflow-auto p-3" aria-live="polite">
        {lines.map((l, i) => (
          <pre key={i} className={cn('m-0 whitespace-pre-wrap break-words', l.kind === 'cmd' && 'mt-2 text-brand', l.kind === 'err' && 'text-error', l.kind === 'info' && 'text-ghost')}>{l.kind === 'cmd' ? `$ ${l.text}` : l.text}</pre>
        ))}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-brand">$</span>
          <input
            ref={field} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} disabled={busy}
            autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-label="Terminal input" data-testid={`${testId}-input`}
            className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ghost" placeholder={busy ? 'running…' : 'type a command'}
          />
        </div>
      </div>
      {hints && hints.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-rim-subtle bg-raised px-3 py-2">
          {hints.map((h) => (
            <button key={h} type="button" onClick={() => void submit(h)} className="rounded-full border border-rim-subtle bg-card px-2.5 py-1 text-[11px] text-dim hover:bg-canvas hover:text-ink">{h}</button>
          ))}
        </div>
      )}
    </div>
  )
}
