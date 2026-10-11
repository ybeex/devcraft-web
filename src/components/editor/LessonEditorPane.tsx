'use client'

import Editor from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { Play, CheckCircle, RotateCcw, HelpCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LessonEditorPaneProps {
  code: string
  language: string
  onChange: (value: string) => void
  onRun: () => void
  onCheck: () => void
  onReset: () => void
  onAskForHelp: () => void
  isRunning: boolean
  isChecking: boolean
}

export function LessonEditorPane({
  code,
  language,
  onChange,
  onRun,
  onCheck,
  onReset,
  onAskForHelp,
  isRunning,
  isChecking,
}: LessonEditorPaneProps) {
  const { resolvedTheme } = useTheme()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-rim-subtle bg-card px-3 py-2">
        <div className="flex items-center gap-1.5">
          <ActionButton icon={<Play size={14} />} label="Run" onClick={onRun} loading={isRunning} disabled={isChecking} />
          <ActionButton
            icon={<CheckCircle size={14} />}
            label="Check"
            onClick={onCheck}
            loading={isChecking}
            disabled={isRunning}
            primary
          />
          <ActionButton icon={<RotateCcw size={14} />} label="Reset" onClick={onReset} disabled={isRunning || isChecking} />
        </div>
        <button
          onClick={onAskForHelp}
          className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-medium text-dim hover:bg-raised hover:text-ink"
        >
          <HelpCircle size={14} /> Stuck?
        </button>
      </div>

      <div className="min-h-0 flex-1">
        <Editor
          value={code}
          language={language}
          theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
          onChange={(value) => onChange(value ?? '')}
          options={{
            fontSize: 13.5,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 16 },
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
  loading,
  disabled,
  primary,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50',
        primary ? 'bg-brand text-white hover:bg-brand-h' : 'text-dim hover:bg-raised hover:text-ink'
      )}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {label}
    </button>
  )
}
