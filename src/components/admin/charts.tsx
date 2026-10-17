'use client'

import { useId, useState } from 'react'
import { cn } from '@/lib/utils'

export interface Series { key: string; label: string; color: string; values: number[] }

const W = 640, H = 200, PAD = { l: 36, r: 12, t: 12, b: 24 }

function niceMax(v: number): number {
  if (v <= 5) return 5
  const p = 10 ** Math.floor(Math.log10(v))
  return Math.ceil(v / p) * p
}

/**
 * Line chart for 1 to 3 series sharing ONE y-axis. Hover shows a crosshair and a tooltip with every series'
 * value for that day; the legend is always present for 2+ series; the same numbers are available as a table
 * (`aria-label` summary plus the optional <details> table) so nothing depends on seeing colour.
 */
export function LineChart({ labels, series, height = H, format = (n) => n.toLocaleString() }: {
  labels: string[]; series: Series[]; height?: number; format?: (n: number) => string
}) {
  const id = useId()
  const [hover, setHover] = useState<number | null>(null)
  const n = labels.length
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)))
  const x = (i: number) => PAD.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - PAD.l - PAD.r))
  const y = (v: number) => PAD.t + (1 - v / max) * (height - PAD.t - PAD.b)
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f))

  return (
    <figure className="w-full">
      {series.length > 1 && (
        <figcaption className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-dim">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded" style={{ background: s.color }} aria-hidden /> {s.label}
            </span>
          ))}
        </figcaption>
      )}
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${height}`}
          className="w-full"
          role="img"
          aria-label={`${series.map((s) => s.label).join(', ')} by day, ${labels[0]} to ${labels[n - 1]}`}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            const px = ((e.clientX - r.left) / r.width) * W
            setHover(Math.max(0, Math.min(n - 1, Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (n - 1)))))
          }}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--rim-subtle, #8884)" strokeWidth={1} />
              <text x={PAD.l - 6} y={y(t) + 3} textAnchor="end" fontSize={10} fill="currentColor" className="text-ghost">{t.toLocaleString()}</text>
            </g>
          ))}
          {[0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => n > 0 && a.indexOf(v) === i).map((i) => (
            <text key={i} x={x(i)} y={height - 6} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize={10} fill="currentColor" className="text-ghost">
              {labels[i]?.slice(5)}
            </text>
          ))}
          {series.map((s) => (
            <path key={s.key} id={`${id}-${s.key}`} d={s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')}
              fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={height - PAD.b} stroke="currentColor" className="text-ghost" strokeDasharray="3 3" />
              {series.map((s) => <circle key={s.key} cx={x(hover)} cy={y(s.values[hover] ?? 0)} r={4} fill={s.color} stroke="var(--card, #fff)" strokeWidth={2} />)}
            </g>
          )}
        </svg>
        {hover !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 rounded-[var(--radius-md)] border border-rim-subtle bg-card px-3 py-2 text-xs shadow-elev-md"
            style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > n / 2 ? '-105%' : '5%'})` }}
          >
            <p className="font-semibold text-ink">{labels[hover]}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center gap-1.5 text-dim">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden /> {s.label}: <span className="font-semibold text-ink">{format(s.values[hover] ?? 0)}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </figure>
  )
}

/** Horizontal bars for a labelled list. Values print as text next to each bar, so nothing relies on colour. */
export function BarList({ rows, format = (n) => n.toLocaleString(), color = 'var(--brand, #6366f1)' }: {
  rows: { label: string; value: number; hint?: string }[]; format?: (n: number) => string; color?: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (rows.length === 0) return <p className="text-sm text-dim">No data yet.</p>
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => (
        <li key={r.label} title={r.hint}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate text-dim">{r.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-ink">{format(r.value)}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-raised">
            <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** A stat with the label underneath: used for headline numbers where a chart would be decoration. */
export function Stat({ label, value, sub, className }: { label: string; value: string | number; sub?: string; className?: string }) {
  return (
    <div className={cn('rounded-[var(--radius-lg)] border border-rim-subtle bg-card px-4 py-3.5', className)}>
      <p className="font-display text-2xl font-bold tabular-nums text-ink">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="mt-0.5 text-xs font-medium text-dim">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-ghost">{sub}</p>}
    </div>
  )
}

export function Panel({ title, note, children, className }: { title: string; note?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-5', className)}>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {note && <p className="mt-0.5 text-xs text-dim">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}
