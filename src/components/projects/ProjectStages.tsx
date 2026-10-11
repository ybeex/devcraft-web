'use client'

import { useState } from 'react'
import { ChevronDown, Lightbulb } from 'lucide-react'
import type { ProjectStage } from '@/lib/api/projects'
import { cn } from '@/lib/utils'

export function ProjectStages({ stages }: { stages: ProjectStage[] }) {
  const ordered = [...stages].sort((a, b) => a.order - b.order)
  const [openId, setOpenId] = useState<string | null>(ordered[0]?.id ?? null)

  return (
    <div className="flex flex-col gap-3">
      {ordered.map((stage, i) => {
        const isOpen = openId === stage.id
        return (
          <div key={stage.id} className="overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-card">
            <button
              onClick={() => setOpenId(isOpen ? null : stage.id)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-muted text-xs font-bold text-brand">
                {i + 1}
              </span>
              <span className="flex-1 font-ui text-sm font-semibold text-ink">{stage.title}</span>
              <ChevronDown size={16} className={cn('shrink-0 text-ghost transition-transform', isOpen && 'rotate-180')} />
            </button>

            {isOpen && (
              <div className="border-t border-rim-subtle px-5 py-4">
                <p className="text-sm leading-relaxed text-dim">{stage.description}</p>

                {stage.starterCode && (
                  <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-rim-subtle">
                    <div className="flex items-center gap-1.5 border-b border-rim-subtle bg-raised px-3 py-2">
                      <span className="h-2 w-2 rounded-full bg-error/60" />
                      <span className="h-2 w-2 rounded-full bg-warning/60" />
                      <span className="h-2 w-2 rounded-full bg-success/60" />
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-ghost">Starter</span>
                    </div>
                    <pre className="overflow-x-auto bg-canvas p-4">
                      <code className="font-mono text-[13px] leading-relaxed text-ink">{stage.starterCode}</code>
                    </pre>
                  </div>
                )}

                {stage.hints.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2">
                    {stage.hints.map((hint, hIdx) => (
                      <HintReveal key={hIdx} hint={hint} index={hIdx} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function HintReveal({ hint, index }: { hint: string; index: number }) {
  const [revealed, setRevealed] = useState(false)

  if (!revealed) {
    return (
      <button
        onClick={() => setRevealed(true)}
        className="flex items-center gap-2 rounded-[var(--radius-md)] bg-raised px-4 py-3 text-sm font-medium text-brand transition-colors hover:bg-brand-muted"
      >
        <Lightbulb size={14} /> Reveal hint {index + 1}
      </button>
    )
  }

  return (
    <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-raised px-4 py-3 text-sm text-dim">
      <Lightbulb size={14} className="mt-0.5 shrink-0 text-warning" />
      {hint}
    </div>
  )
}
