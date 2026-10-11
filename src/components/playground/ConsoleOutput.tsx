'use client'

import { Play, Loader2, AlertTriangle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { RunResult } from '@/lib/api/playground'
import { cn } from '@/lib/utils'

interface ConsoleOutputProps {
  onRun: () => void
  isRunning: boolean
  result: RunResult | null
  error: string | null
}

export function ConsoleOutput({ onRun, isRunning, result, error }: ConsoleOutputProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-rim-subtle bg-raised px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ghost">Console</span>
        <Button size="sm" onClick={onRun} disabled={isRunning}>
          {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
          {isRunning ? 'Running...' : 'Run'}
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-canvas p-4 font-mono text-[13px] leading-relaxed">
        {!result && !error && !isRunning && (
          <p className="text-ghost">Click Run to execute — output shows up here.</p>
        )}

        {isRunning && (
          <p className="flex items-center gap-2 text-ghost">
            <Loader2 size={13} className="animate-spin" /> Running in a sandboxed environment...
          </p>
        )}

        {error && (
          <p className="flex items-start gap-2 text-error">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
          </p>
        )}

        {result && (
          <div className="flex flex-col gap-3">
            {result.timedOut && (
              <p className="flex items-center gap-2 text-warning">
                <Clock size={13} /> Timed out — check for an infinite loop or long-running operation.
              </p>
            )}
            {result.stdout && <pre className="whitespace-pre-wrap break-words text-ink">{result.stdout}</pre>}
            {result.stderr && <pre className="whitespace-pre-wrap break-words text-error">{result.stderr}</pre>}
            {!result.stdout && !result.stderr && !result.timedOut && (
              <p className="text-ghost">Ran with no output.</p>
            )}
            <p className={cn('text-xs', result.exitCode === 0 ? 'text-success' : 'text-ghost')}>
              {result.status}
              {result.exitCode !== null && ` · exit code ${result.exitCode}`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
