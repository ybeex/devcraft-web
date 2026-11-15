'use client'

import { CheckCircle, HelpCircle, Loader2, Play, RotateCcw } from 'lucide-react'

interface LessonActionsProps {
  onRun: () => void
  onCheck: () => void
  onReset: () => void
  onAskForHelp: () => void
  isRunning: boolean
  isChecking: boolean
}

export function LessonActions({
  onRun,
  onCheck,
  onReset,
  onAskForHelp,
  isRunning,
  isChecking,
}: LessonActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <ActionButton icon={<Play size={14} />} label="Run" onClick={onRun} loading={isRunning} disabled={isChecking} />
      <ActionButton
        icon={<CheckCircle size={14} />}
        label="Check"
        onClick={onCheck}
        loading={isChecking}
        disabled={isRunning}
        primary
      />
      <ActionButton
        icon={<RotateCcw size={14} />}
        label="Reset"
        onClick={onReset}
        disabled={isRunning || isChecking}
      />
      <button
        onClick={onAskForHelp}
        title="Get help"
        aria-label="Get help"
        className="rounded-full p-2 text-dim transition-colors hover:bg-raised hover:text-ink"
      >
        <HelpCircle size={14} />
      </button>
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
      title={label}
      aria-label={label}
      className={`flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 sm:px-2.5 ${
        primary ? 'bg-brand text-[#080D1C] hover:bg-brand-h' : 'text-dim hover:bg-raised hover:text-ink'
      }`}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
