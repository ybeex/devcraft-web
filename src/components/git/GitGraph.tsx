'use client'

import { useMemo } from 'react'
import type { LabState } from '@/lib/api/git-lab'

const ROW = 38, LANE = 24, PAD = 18
const COLORS = ['#3b82f6', '#f97316', '#10b981', '#a855f7', '#ef4444', '#14b8a6', '#eab308', '#ec4899']

interface Node { sha: string; row: number; lane: number; parents: string[]; subject: string; refs: string[]; author: string }

/** Lays the commits out top (newest) to bottom, one column ("lane") per line of history, like `git log --graph`. */
export function layout(commits: LabState['commits']): { nodes: Node[]; lanes: number } {
  const lanes: Array<string | null> = []
  const nodes: Node[] = []
  const seen = new Set<string>()
  commits.forEach((c, row) => {
    seen.add(c.sha)
    let lane = lanes.indexOf(c.sha)
    if (lane === -1) { lane = lanes.indexOf(null); if (lane === -1) { lane = lanes.length; lanes.push(null) } }
    // Other lanes waiting for this same commit end here.
    for (let i = 0; i < lanes.length; i++) if (i !== lane && lanes[i] === c.sha) lanes[i] = null
    nodes.push({ sha: c.sha, row, lane, parents: c.parents, subject: c.subject, refs: c.refs, author: c.author })
    const [first, ...others] = c.parents
    lanes[lane] = first ?? null
    for (const p of others) {
      if (lanes.includes(p)) continue
      let slot = lanes.indexOf(null); if (slot === -1) { slot = lanes.length; lanes.push(null) }
      lanes[slot] = p
    }
  })
  return { nodes, lanes: Math.max(1, nodes.reduce((m, n) => Math.max(m, n.lane + 1), 1)) }
}

function refLabel(r: string): { text: string; kind: 'head' | 'branch' | 'remote' | 'tag' } {
  if (r.startsWith('HEAD -> ')) return { text: r.slice(8), kind: 'head' }
  if (r === 'HEAD') return { text: 'HEAD', kind: 'head' }
  if (r.startsWith('tag: ')) return { text: r.slice(5), kind: 'tag' }
  if (r.includes('/')) return { text: r, kind: r.startsWith('origin/') ? 'remote' : 'branch' }
  return { text: r, kind: 'branch' }
}
const KIND: Record<string, string> = {
  head: 'bg-brand text-[#080D1C]', branch: 'bg-[var(--positive-bg)] text-[var(--positive-text)]', remote: 'bg-raised text-dim', tag: 'bg-warning/20 text-warning',
}

export function GitGraph({ state }: { state: LabState }) {
  const { nodes, lanes } = useMemo(() => layout(state.commits), [state.commits])
  const rowOf = useMemo(() => new Map(nodes.map((n) => [n.sha, n])), [nodes])
  const dirty = state.status.length
  const top = dirty > 0 || state.operation ? ROW : 0
  const w = PAD * 2 + lanes * LANE
  const h = top + nodes.length * ROW + PAD
  const x = (lane: number) => PAD + lane * LANE
  const y = (row: number) => top + PAD + row * ROW - 4
  const colour = (lane: number) => COLORS[lane % COLORS.length]!

  if (state.commits.length === 0) {
    return <p className="p-6 text-center text-sm text-dim" data-testid="git-graph-empty">No commits yet. Your first <code className="rounded bg-raised px-1">git commit</code> will appear here.</p>
  }
  return (
    <div className="relative" data-testid="git-graph" style={{ minHeight: h }}>
      <svg width={w} height={h} className="absolute left-0 top-0" aria-hidden>
        {nodes.map((n) => n.parents.map((p, i) => {
          const t = rowOf.get(p)
          if (!t) return null
          const x1 = x(n.lane), y1 = y(n.row), x2 = x(t.lane), y2 = y(t.row)
          const d = x1 === x2 ? `M${x1} ${y1} L${x2} ${y2}` : `M${x1} ${y1} C${x1} ${y1 + ROW * 0.6} ${x2} ${y2 - ROW * 0.6} ${x2} ${y2}`
          return <path key={`${n.sha}-${p}`} d={d} fill="none" stroke={colour(i === 0 ? t.lane : n.lane)} strokeWidth={2} opacity={0.85} />
        }))}
        {dirty > 0 && state.head.sha && rowOf.get(state.head.sha) && (
          <path d={`M${x(rowOf.get(state.head.sha)!.lane)} ${y(rowOf.get(state.head.sha)!.row)} L${x(rowOf.get(state.head.sha)!.lane)} ${PAD - 4}`} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={2} fill="none" />
        )}
        {(dirty > 0 || state.operation) && state.head.sha && rowOf.get(state.head.sha) && (
          <circle cx={x(rowOf.get(state.head.sha)!.lane)} cy={PAD - 4} r={6} fill="var(--canvas, #fff)" stroke="#94a3b8" strokeDasharray="2 2" strokeWidth={2} />
        )}
        {nodes.map((n) => {
          const isHead = n.sha === state.head.sha
          return (
            <g key={n.sha}>
              {isHead && <circle cx={x(n.lane)} cy={y(n.row)} r={10} fill="none" stroke={colour(n.lane)} strokeWidth={2} opacity={0.5} />}
              <circle cx={x(n.lane)} cy={y(n.row)} r={n.parents.length > 1 ? 7 : 6} fill={n.parents.length > 1 ? 'var(--canvas, #fff)' : colour(n.lane)} stroke={colour(n.lane)} strokeWidth={n.parents.length > 1 ? 3 : 2} />
            </g>
          )
        })}
      </svg>
      <ul style={{ paddingLeft: w + 6 }} className="m-0 list-none p-0">
        {top > 0 && (
          <li style={{ height: ROW }} className="flex items-center gap-2 text-xs text-dim" data-testid="git-graph-dirty">
            <span className="rounded-full border border-dashed border-rim px-2 py-0.5">
              {state.operation ? `${state.operation} in progress` : `${dirty} uncommitted change${dirty === 1 ? '' : 's'}`}
            </span>
          </li>
        )}
        {nodes.map((n) => (
          <li key={n.sha} style={{ height: ROW }} className="flex items-center gap-2 overflow-hidden text-sm" title={`${n.sha}\n${n.author}`} data-testid="git-commit">
            <span className="shrink-0 font-mono text-[11px] text-ghost">{n.sha.slice(0, 7)}</span>
            {n.refs.map((r) => { const l = refLabel(r); return <span key={r} className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${KIND[l.kind]}`}>{l.text}</span> })}
            <span className="truncate text-ink">{n.subject}</span>
          </li>
        ))}
      </ul>
      {state.truncated && <p className="py-2 text-center text-xs text-ghost">Showing the latest {state.commits.length} commits.</p>}
    </div>
  )
}
