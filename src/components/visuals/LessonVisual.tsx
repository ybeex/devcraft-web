'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { parseVisualSpec, type Tone, type TreeNode, type VisualSpec } from '@/lib/visual-spec'
import { cn } from '@/lib/utils'
import { SequenceDiagram } from './SequenceDiagram'

const TONE: Record<Tone, string> = {
  brand: 'var(--brand)', info: 'var(--info)', success: 'var(--success)', warning: 'var(--warning)', error: 'var(--error)', muted: 'var(--dim)',
}
const PALETTE: Tone[] = ['info', 'brand', 'success', 'warning', 'error']
const toneOf = (t: Tone | undefined, i: number): string => TONE[t ?? PALETTE[i % PALETTE.length]!]

function Frame({ title, children, note }: { title?: string; children: React.ReactNode; note?: string | null }) {
  return (
    <figure className="my-5 overflow-hidden rounded-[var(--radius-md)] border border-rim-subtle bg-card" data-testid="lesson-visual">
      {title && <figcaption className="border-b border-rim-subtle px-3 py-2 text-xs font-semibold text-ink">{title}</figcaption>}
      <div className="p-3">{children}</div>
      {note !== undefined && <p className="min-h-9 border-t border-rim-subtle px-3 py-2 text-xs text-dim" aria-live="polite">{note ?? 'Select a part to read what it does.'}</p>}
    </figure>
  )
}

/** The text of the URL, split into labelled parts. Select a part to read what it is for. */
function UrlAnatomy({ spec }: { spec: Extract<VisualSpec, { type: 'url' }> }) {
  const [sel, setSel] = useState<number | null>(null)
  return (
    <Frame title={spec.title} note={sel === null ? null : `${spec.parts[sel]!.name}: ${spec.parts[sel]!.note}`}>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex min-w-full items-start justify-center font-mono text-[13px]" role="group" aria-label="Parts of the URL">
          {spec.parts.map((p, i) => {
            const color = toneOf(p.tone, i), on = sel === i
            return (
              <button key={i} type="button" onClick={() => setSel(on ? null : i)} onMouseEnter={() => setSel(i)} aria-pressed={on} className="flex flex-col items-center px-0.5 text-center">
                <span className="whitespace-pre rounded px-1 py-1.5 font-semibold transition-colors" style={{ color: 'var(--ink)', background: on ? `color-mix(in srgb, ${color} 22%, transparent)` : 'transparent' }}>{p.text}</span>
                <span className="h-1.5 w-full rounded-full" style={{ background: color, opacity: on || sel === null ? 1 : 0.35 }} />
                <span className="mt-1.5 font-ui text-[10.5px] font-bold uppercase tracking-wide" style={{ color }}>{p.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </Frame>
  )
}

function Flow({ spec }: { spec: Extract<VisualSpec, { type: 'flow' }> }) {
  const [sel, setSel] = useState<number | null>(null)
  const col = spec.direction === 'column'
  return (
    <Frame title={spec.title} note={sel === null ? null : `${spec.steps[sel]!.title}: ${spec.steps[sel]!.note ?? ''}`}>
      <ol className={cn('flex gap-1', col ? 'flex-col items-stretch' : 'flex-wrap items-stretch')}>
        {spec.steps.map((s, i) => {
          const color = toneOf(s.tone, i), on = sel === i
          return (
            <li key={i} className={cn('flex items-center gap-1', col ? 'flex-col' : '', !col && 'min-w-[120px] flex-1')}>
              <button type="button" onClick={() => setSel(on ? null : i)} aria-pressed={on} className="w-full flex-1 rounded-[var(--radius-sm)] border px-3 py-2.5 text-left transition-colors" style={{ borderColor: color, background: on ? `color-mix(in srgb, ${color} 16%, transparent)` : 'var(--raised)' }}>
                <span className="block text-[10px] font-bold uppercase tracking-wide" style={{ color }}>Step {i + 1}</span>
                <span className="block text-[13px] font-semibold text-ink">{s.title}</span>
              </button>
              {i < spec.steps.length - 1 && <ChevronRight size={16} className={cn('shrink-0 text-ghost', col && 'rotate-90')} aria-hidden />}
            </li>
          )
        })}
      </ol>
    </Frame>
  )
}

function Layers({ spec }: { spec: Extract<VisualSpec, { type: 'layers' }> }) {
  const [sel, setSel] = useState<number | null>(null)
  return (
    <Frame title={spec.title} note={sel === null ? null : `${spec.layers[sel]!.title}: ${spec.layers[sel]!.note ?? ''}`}>
      <ul className="mx-auto flex max-w-md flex-col gap-1">
        {spec.layers.map((l, i) => {
          const color = toneOf(l.tone, i), on = sel === i
          return (
            <li key={i}>
              <button type="button" onClick={() => setSel(on ? null : i)} aria-pressed={on} className="w-full rounded-[var(--radius-sm)] border px-3 py-2 text-center text-[13px] font-semibold text-ink transition-colors" style={{ borderColor: color, background: `color-mix(in srgb, ${color} ${on ? 28 : 12}%, transparent)` }}>{l.title}</button>
            </li>
          )
        })}
      </ul>
    </Frame>
  )
}

/** Work laid out over time, one row per actor: how blocking and waiting differ, how a request is spread across workers. */
function Lanes({ spec }: { spec: Extract<VisualSpec, { type: 'lanes' }> }) {
  const [sel, setSel] = useState<string | null>(null)
  const max = spec.max ?? Math.max(...spec.lanes.flatMap((l) => l.blocks.map((b) => b.start + b.len)))
  const picked = sel ? sel.split(':').map(Number) as [number, number] : null
  const block = picked ? spec.lanes[picked[0]]?.blocks[picked[1]] : null
  return (
    <Frame title={spec.title} note={block ? `${block.label} (${block.start} to ${block.start + block.len}${spec.unit ? ` ${spec.unit}` : ''})${block.note ? `: ${block.note}` : ''}` : null}>
      <div className="overflow-x-auto">
        <div className="min-w-[420px] space-y-2">
          {spec.lanes.map((lane, li) => (
            <div key={li} className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-right text-[11px] font-semibold text-dim">{lane.name}</span>
              <div className="relative h-8 flex-1 rounded bg-raised">
                {lane.blocks.map((b, bi) => {
                  const color = toneOf(b.tone, li + bi), on = sel === `${li}:${bi}`
                  return <button key={bi} type="button" onClick={() => setSel(on ? null : `${li}:${bi}`)} title={b.label} aria-label={`${lane.name}: ${b.label}`} className="absolute top-0.5 h-7 overflow-hidden rounded px-1 text-[10.5px] font-semibold leading-7 text-[#080D1C]" style={{ left: `${(b.start / max) * 100}%`, width: `calc(${(b.len / max) * 100}% - 2px)`, background: color, outline: on ? '2px solid var(--ink)' : undefined }}>{b.label}</button>
                })}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2"><span className="w-24 shrink-0" /><div className="flex flex-1 justify-between text-[10px] text-ghost"><span>0</span><span>time{spec.unit ? ` (${spec.unit})` : ''} →</span><span>{max}</span></div></div>
        </div>
      </div>
    </Frame>
  )
}

function TreeRow({ node, depth, i, sel, setSel, path }: { node: TreeNode; depth: number; i: number; sel: string | null; setSel: (p: string | null) => void; path: string }) {
  const color = toneOf(node.tone, depth + i), on = sel === path
  return (
    <li>
      <button type="button" onClick={() => setSel(on ? null : path)} aria-pressed={on} className="my-0.5 inline-flex items-center gap-2 rounded px-2 py-1 text-left text-[13px] text-ink transition-colors" style={{ background: on ? `color-mix(in srgb, ${color} 20%, transparent)` : 'transparent' }}>
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} /><span className="font-mono font-semibold">{node.label}</span>
      </button>
      {node.children && <ul className="ml-3 border-l border-rim pl-3">{node.children.map((c, ci) => <TreeRow key={ci} node={c} depth={depth + 1} i={ci} sel={sel} setSel={setSel} path={`${path}.${ci}`} />)}</ul>}
    </li>
  )
}
const findNode = (n: TreeNode, path: string): TreeNode | null => path.split('.').slice(1).reduce<TreeNode | null>((cur, k) => cur?.children?.[Number(k)] ?? null, n)

function Tree({ spec }: { spec: Extract<VisualSpec, { type: 'tree' }> }) {
  const [sel, setSel] = useState<string | null>(null)
  const node = sel ? findNode(spec.root, sel) : null
  return (
    <Frame title={spec.title} note={node ? `${node.label}${node.note ? `: ${node.note}` : ''}` : null}>
      <ul><TreeRow node={spec.root} depth={0} i={0} sel={sel} setSel={setSel} path="0" /></ul>
    </Frame>
  )
}

/** A commit graph: one row per branch, commits left to right, branch and HEAD labels above the commit they point at. */
function Commits({ spec }: { spec: Extract<VisualSpec, { type: 'commits' }> }) {
  const [sel, setSel] = useState<string | null>(null)
  const lanes = [...new Set(spec.commits.map((c) => c.branch))]
  const GX = 74, GY = 64, X0 = 44, Y0 = 62
  const pos = new Map(spec.commits.map((c, i) => [c.id, { x: X0 + i * GX, y: Y0 + lanes.indexOf(c.branch) * GY }]))
  const lastOnBranch = new Map<string, string>()
  const edges: Array<[string, string]> = []
  for (const c of spec.commits) { const parents = c.parents ?? (lastOnBranch.has(c.branch) ? [lastOnBranch.get(c.branch)!] : []); for (const p of parents) edges.push([p, c.id]); lastOnBranch.set(c.branch, c.id) }
  const refs = spec.refs ?? []
  const target = (name: string): string => { const r = refs.find((x) => x.name === name); return r ? (pos.has(r.at) ? r.at : target(r.at)) : name }
  const labelsAt = new Map<string, string[]>()
  for (const r of refs) { const t = target(r.name); labelsAt.set(t, [...(labelsAt.get(t) ?? []), r.name]) }
  const width = X0 * 2 + (spec.commits.length - 1) * GX, height = Y0 + (lanes.length - 1) * GY + (lanes.length > 1 ? 62 : 24)
  const picked = sel ? spec.commits.find((c) => c.id === sel) : null
  return (
    <Frame title={spec.title} note={picked ? `${picked.id}${picked.msg ? `: ${picked.msg}` : ''} (branch ${picked.branch}${(picked.parents?.length ?? 0) > 1 ? ', a merge: two parents' : ''})` : null}>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={spec.title ?? 'Commit graph'} style={{ minWidth: width, width: '100%', maxWidth: width * 1.2, height: 'auto', display: 'block', margin: '0 auto' }}>
          {edges.map(([a, b], i) => { const p = pos.get(a)!, q = pos.get(b)!; const lane = lanes.indexOf(spec.commits.find((c) => c.id === b)!.branch); return <path key={i} d={p.y === q.y ? `M${p.x} ${p.y}L${q.x} ${q.y}` : `M${p.x} ${p.y}C${p.x + 30} ${p.y} ${q.x - 30} ${q.y} ${q.x} ${q.y}`} fill="none" stroke={toneOf(undefined, lane)} strokeWidth={3} /> })}
          {spec.commits.map((c) => {
            const p = pos.get(c.id)!, color = toneOf(undefined, lanes.indexOf(c.branch)), on = sel === c.id, merge = (c.parents?.length ?? 0) > 1
            return (
              <g key={c.id} onClick={() => setSel(on ? null : c.id)} className="cursor-pointer" role="button" aria-label={`Commit ${c.id}`}>
                <circle cx={p.x} cy={p.y} r={on ? 13 : 11} fill={merge ? 'var(--card)' : color} stroke={color} strokeWidth={merge ? 4 : 2} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill={merge ? color : '#080D1C'}>{c.id.slice(0, 3)}</text>
                {(labelsAt.get(c.id) ?? []).map((name, li) => { const below = lanes.indexOf(c.branch) > 0, ly = below ? p.y + 18 + li * 20 : p.y - 44 - li * 20; return <g key={name}><rect x={p.x - 6 - name.length * 3.4} y={ly} width={12 + name.length * 6.8} height={17} rx={8} fill={name === 'HEAD' ? 'var(--ink)' : 'var(--raised)'} stroke={name === 'HEAD' ? 'var(--ink)' : 'var(--rim)'} /><text x={p.x} y={ly + 12} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={name === 'HEAD' ? 'var(--canvas)' : 'var(--ink)'}>{name}</text></g> })}
              </g>
            )
          })}
        </svg>
      </div>
    </Frame>
  )
}

/** Renders one ```visual block. A malformed block shows a plain message instead of breaking the lesson. */
export function LessonVisual({ source }: { source: string }) {
  const { spec, error } = parseVisualSpec(source)
  if (!spec) return <p role="alert" className="my-4 rounded border border-rim-subtle bg-card p-3 text-xs text-dim">This diagram could not be shown ({error}).</p>
  switch (spec.type) {
    case 'sequence': return <SequenceDiagram steps={spec.steps} actors={spec.actors} title={spec.title} autoPlay />
    case 'url': return <UrlAnatomy spec={spec} />
    case 'flow': return <Flow spec={spec} />
    case 'layers': return <Layers spec={spec} />
    case 'lanes': return <Lanes spec={spec} />
    case 'tree': return <Tree spec={spec} />
    case 'commits': return <Commits spec={spec} />
  }
}
