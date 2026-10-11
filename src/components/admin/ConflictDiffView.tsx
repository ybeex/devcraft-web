'use client'

import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DiffField {
  key: string
  mine: unknown
  theirs: unknown
  changed: boolean
}

/**
 * Field-by-field diff between an attempted edit and what's currently saved.
 *
 * `attemptedChanges` is documented on the backend (optimistic-lock.ts) as
 * "the partial update payload the client submitted" — only the fields the
 * admin actually tried to change — while `currentSnapshot` is the full row.
 * So the diff only iterates `attempted`'s own keys, not the union of both:
 * comparing the union would flag every column the admin never touched as a
 * false-positive "change" just because it's absent from a partial payload.
 *
 * JSON.stringify equality, not a deep structural compare — fine for the
 * primitive-heavy content rows (title, order, body text, booleans) this
 * covers; a nested object field with re-ordered keys is the one case this
 * could miss, which isn't worth the extra complexity here.
 */
export function computeConflictDiff(
  attempted: Record<string, unknown>,
  current: Record<string, unknown>
): DiffField[] {
  const keys = Object.keys(attempted).sort()
  return keys.map((key) => {
    const mine = attempted[key]
    const theirs = current[key]
    return { key, mine, theirs, changed: JSON.stringify(mine) !== JSON.stringify(theirs) }
  })
}

function renderFieldValue(value: unknown): ReactNode {
  if (value === null || value === undefined) return <span className="italic text-ghost">empty</span>
  if (typeof value === 'string') {
    return <span className="whitespace-pre-wrap break-words">{value.length > 300 ? `${value.slice(0, 300)}…` : value}</span>
  }
  if (typeof value === 'number' || typeof value === 'boolean') return <span>{String(value)}</span>
  return (
    <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-snug">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

interface ConflictDiffViewProps {
  fields: DiffField[]
  /** Present → changed fields become clickable pickers, highlighted by whichever side this marks chosen. Omit for a fully read-only view. */
  choices?: Record<string, 'mine' | 'theirs'>
  onChoose?: (key: string, choice: 'mine' | 'theirs') => void
  mineLabel?: string
  theirsLabel?: string
}

/**
 * Deliberately neutral highlighting (brand accent on whichever side is
 * picked) rather than red/green — "mine" isn't wrong and "theirs" isn't
 * right, they're two valid edits that happened to collide. Green/red would
 * bias the reviewer before they've looked at either one.
 */
export function ConflictDiffView({
  fields,
  choices,
  onChoose,
  mineLabel = 'Attempted change',
  theirsLabel = 'Currently saved',
}: ConflictDiffViewProps) {
  const changed = fields.filter((f) => f.changed)
  const unchanged = fields.filter((f) => !f.changed)
  const interactive = !!onChoose

  if (changed.length === 0) {
    return (
      <p className="rounded-[var(--radius-md)] bg-raised px-4 py-6 text-center text-sm text-dim">
        No field differences — the attempted change matched what was already saved.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {changed.map((field) => {
        const choice = choices?.[field.key]
        return (
          <div key={field.key} className="overflow-hidden rounded-[var(--radius-md)] border border-rim-subtle">
            <div className="border-b border-rim-subtle bg-raised px-3 py-1.5 font-mono text-xs font-semibold text-dim">{field.key}</div>
            <div className="grid grid-cols-1 divide-y divide-rim-subtle sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {(
                [
                  ['mine', mineLabel, field.mine],
                  ['theirs', theirsLabel, field.theirs],
                ] as const
              ).map(([side, label, value]) => (
                <button
                  key={side}
                  type="button"
                  disabled={!interactive}
                  onClick={() => onChoose?.(field.key, side)}
                  className={cn(
                    'flex flex-col gap-1 p-3 text-left text-xs transition-colors',
                    interactive && 'cursor-pointer hover:bg-raised/50',
                    choice === side && 'bg-brand-muted'
                  )}
                >
                  <span className={cn('inline-flex items-center gap-1 font-semibold', choice === side ? 'text-brand' : 'text-dim')}>
                    {label}
                    {choice === side && <Check size={12} />}
                  </span>
                  {renderFieldValue(value)}
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {unchanged.length > 0 && (
        <details className="text-xs text-dim">
          <summary className="cursor-pointer select-none py-1">
            {unchanged.length} unchanged field{unchanged.length === 1 ? '' : 's'}
          </summary>
          <div className="mt-1 flex flex-wrap gap-1.5 pl-1">
            {unchanged.map((f) => (
              <code key={f.key} className="rounded bg-raised px-1.5 py-0.5 font-mono">
                {f.key}
              </code>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
