'use client'

import Editor from '@monaco-editor/react'
import { useTheme } from 'next-themes'

interface CodeFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  language: string
  hint?: string
  height?: number
}

/** Same Editor options as LessonEditorPane (the learner-facing practice editor) for visual consistency — just without its Run/Check/Reset toolbar, which doesn't apply here. */
export function CodeField({ label, value, onChange, language, hint, height = 200 }: CodeFieldProps) {
  const { resolvedTheme } = useTheme()

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink">{label}</span>
        {hint && <span className="text-xs text-dim">{hint}</span>}
      </div>
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-rim" style={{ height }}>
        <Editor
          value={value}
          language={language}
          theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
          onChange={(v) => onChange(v ?? '')}
          options={{
            fontSize: 13.5,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  )
}
