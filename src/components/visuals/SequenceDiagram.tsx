'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, StepForward } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StepKind = 'request' | 'response' | 'query' | 'answer' | 'referral' | 'note' | 'error'
export interface SequenceStep { from: string; to: string; label: string; detail?: string; kind?: StepKind }

const COLOR: Record<StepKind, string> = {
  request: 'var(--info)', query: 'var(--info)', response: 'var(--success)', answer: 'var(--success)',
  referral: 'var(--warning)', error: 'var(--error)', note: 'var(--dim)',
}

const COL = 170, TOP = 54, ROW = 58

/**
 * A sequence diagram: actors across the top, one arrow per message, revealed step by step. Used by the HTTP and DNS labs
 * (fed by the simulator) and by lesson text (fed by a ```visual block). With reduced motion everything is shown at once.
 */
export function SequenceDiagram({ steps, actors: given, title, autoPlay = false, className, replayKey }: { steps: SequenceStep[]; actors?: string[]; title?: string; autoPlay?: boolean; className?: string; replayKey?: string | number }) {
  const actors = useMemo(() => given ?? [...new Set(steps.flatMap((s) => [s.from, s.to]))], [given, steps])
  const [shown, setShown] = useState(steps.length)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const total = steps.length

  const stop = () => { if (timer.current) clearInterval(timer.current); timer.current = null; setPlaying(false) }
  const play = () => {
    stop()
    setShown(0); setPlaying(true)
    let n = 0
    timer.current = setInterval(() => { n += 1; setShown(n); if (n >= total) stop() }, 800)
  }
  useEffect(() => { stop(); if (autoPlay && !reduced) play(); else setShown(total); return stop /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [replayKey, total])

  if (total === 0) return null
  const width = Math.max(actors.length * COL, 360), height = TOP + total * ROW + 14
  const x = (a: string) => COL / 2 + actors.indexOf(a) * (width / actors.length)
  const current = Math.min(Math.max(shown, 1), total) - 1
  const step = steps[current]!

  return (
    <figure className={cn('my-5 overflow-hidden rounded-[var(--radius-md)] border border-rim-subtle bg-card', className)} data-testid="sequence-diagram">
      {title && <figcaption className="border-b border-rim-subtle px-3 py-2 text-xs font-semibold text-ink">{title}</figcaption>}
      <div className="overflow-x-auto px-2 pt-2">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title ?? 'Message sequence'} style={{ minWidth: Math.min(width, 520), width: '100%', maxWidth: width * 1.15, height: 'auto', display: 'block', margin: '0 auto' }}>
          <defs>{(Object.keys(COLOR) as StepKind[]).map((k) => <marker key={k} id={`seq-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill={COLOR[k]} /></marker>)}</defs>
          {actors.map((a) => (
            <g key={a}>
              <rect x={x(a) - 56} y={6} width={112} height={28} rx={8} fill="var(--raised)" stroke="var(--rim)" />
              <text x={x(a)} y={24} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--ink)">{a}</text>
              <line x1={x(a)} y1={36} x2={x(a)} y2={height - 6} stroke="var(--rim)" strokeDasharray="4 4" />
            </g>
          ))}
          {steps.map((s, i) => {
            const kind = s.kind ?? 'note', y = TOP + 22 + i * ROW, visible = i < shown
            const color = COLOR[kind], x1 = x(s.from), x2 = x(s.to), self = s.from === s.to
            return (
              <g key={i} style={{ opacity: visible ? 1 : 0.08, transition: 'opacity 350ms ease' }} onClick={() => setShown(Math.max(shown, i + 1))} className="cursor-pointer">
                {self ? (
                  <g><rect x={x1 - 78} y={y - 16} width={156} height={26} rx={6} fill="var(--raised)" stroke={color} /><text x={x1} y={y + 2} textAnchor="middle" fontSize={11} fontWeight={600} fill={color}>{s.label.length > 24 ? `${s.label.slice(0, 23)}…` : s.label}</text></g>
                ) : (
                  <g>
                    <line x1={x1 + (x2 > x1 ? 3 : -3)} y1={y} x2={x2 + (x2 > x1 ? -3 : 3)} y2={y} stroke={color} strokeWidth={2} markerEnd={`url(#seq-${kind})`} strokeDasharray={kind === 'response' || kind === 'answer' || kind === 'referral' ? '6 3' : undefined} />
                    <text x={(x1 + x2) / 2} y={y - 8} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="var(--ink)" paintOrder="stroke" stroke="var(--card)" strokeWidth={4}>{s.label.length > 34 ? `${s.label.slice(0, 33)}…` : s.label}</text>
                  </g>
                )}
                {i === current && visible && <circle cx={self ? x1 + 84 : x2 + (x2 > x1 ? 10 : -10)} cy={y} r={4} fill={color} />}
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-rim-subtle px-3 py-2">
        <button type="button" onClick={playing ? stop : play} className="flex items-center gap-1 rounded-full bg-raised px-2.5 py-1 text-xs font-semibold text-ink hover:text-brand" aria-label={playing ? 'Pause' : 'Play the sequence'}>{playing ? <Pause size={12} /> : <Play size={12} />}{playing ? 'Pause' : 'Play'}</button>
        <button type="button" onClick={() => { stop(); setShown((n) => Math.min(total, n + 1)) }} disabled={shown >= total} className="flex items-center gap-1 rounded-full bg-raised px-2.5 py-1 text-xs font-semibold text-ink hover:text-brand disabled:opacity-40" aria-label="Next step"><StepForward size={12} />Step</button>
        <button type="button" onClick={() => { stop(); setShown(0) }} className="flex items-center gap-1 rounded-full bg-raised px-2.5 py-1 text-xs font-semibold text-ink hover:text-brand" aria-label="Start over"><RotateCcw size={12} />Reset</button>
        <p className="min-w-0 flex-1 text-xs text-dim" aria-live="polite"><span className="font-semibold text-ink">{shown === 0 ? 'Press Play or Step.' : `${current + 1}/${total} `}</span> {shown === 0 ? '' : step.detail ?? step.label}</p>
      </div>
      <ol className="sr-only">{steps.map((s, i) => <li key={i}>{`${s.from} to ${s.to}: ${s.label}. ${s.detail ?? ''}`}</li>)}</ol>
    </figure>
  )
}
