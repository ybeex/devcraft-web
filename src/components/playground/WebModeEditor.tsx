'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { RefreshCw, Trash2 } from 'lucide-react'
import { buildWebPreviewDocument, type WebModeContent } from '@/lib/api/playground'
import { cn } from '@/lib/utils'

const TABS: { key: keyof WebModeContent; label: string; language: string }[] = [
  { key: 'html', label: 'HTML', language: 'html' },
  { key: 'css', label: 'CSS', language: 'css' },
  { key: 'js', label: 'JS', language: 'javascript' },
]

const EDITOR_OPTIONS = {
  fontSize: 13.5,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  padding: { top: 16 },
  automaticLayout: true,
  tabSize: 2,
}

interface ConsoleLine {
  id: number
  level: 'log' | 'warn' | 'error' | 'info'
  message: string
}

const LEVEL_STYLE: Record<ConsoleLine['level'], string> = {
  log: 'text-ink',
  info: 'text-info',
  warn: 'text-warning',
  error: 'text-error',
}

interface WebModeEditorProps {
  value: WebModeContent
  onChange: (value: WebModeContent) => void
  theme: 'vs-dark' | 'light'
}

export function WebModeEditor({ value, onChange, theme }: WebModeEditorProps) {
  const [activeTab, setActiveTab] = useState<keyof WebModeContent>('html')
  const [refreshKey, setRefreshKey] = useState(0)
  const [logs, setLogs] = useState<ConsoleLine[]>([])
  const logIdRef = useRef(0)
  const consoleEndRef = useRef<HTMLDivElement>(null)

  // Live preview re-renders on every keystroke (no debounce) — an iframe
  // srcdoc swap is cheap, and immediate feedback is the entire point of a
  // live preview. refreshKey exists only for the manual refresh button,
  // for the rare case someone's script leaves the page in a broken state
  // (e.g. an infinite loop) and they want to force a clean re-render.
  const previewDoc = useMemo(() => buildWebPreviewDocument(value), [value])

  // Each srcDoc change destroys the old iframe's script context and
  // starts a fresh one — clearing logs in step with that is correct, not
  // just tidy: old logs belonged to the previous version of the code.
  useEffect(() => {
    setLogs([])
  }, [previewDoc])

  // Errors/console output from inside the iframe arrive via postMessage
  // (see CONSOLE_BRIDGE_SCRIPT in lib/api/playground.ts) rather than only
  // being visible in the browser's own devtools.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data as { __devcraftConsole?: boolean; level?: ConsoleLine['level']; message?: string } | undefined
      if (!data?.__devcraftConsole) return
      logIdRef.current += 1
      setLogs((prev) => [...prev, { id: logIdRef.current, level: data.level ?? 'log', message: data.message ?? '' }])
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ block: 'nearest' })
  }, [logs])

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-2">
      <div className="flex min-h-0 flex-col border-b border-rim-subtle lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-1 border-b border-rim-subtle bg-raised px-2 py-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'rounded-[var(--radius-sm)] px-3 py-1 text-xs font-semibold transition-colors',
                activeTab === tab.key ? 'bg-card text-ink shadow-elev-sm' : 'text-dim hover:text-ink'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1">
          {TABS.map((tab) => (
            <div key={tab.key} className={cn('h-full', activeTab !== tab.key && 'hidden')}>
              <Editor
                value={value[tab.key]}
                language={tab.language}
                theme={theme}
                onChange={(v) => onChange({ ...value, [tab.key]: v ?? '' })}
                options={EDITOR_OPTIONS}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-col">
        <div className="flex min-h-0 flex-[3] flex-col">
          <div className="flex items-center justify-between border-b border-rim-subtle bg-raised px-3 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-ghost">Live preview</span>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              title="Force a clean refresh"
              className="rounded-[var(--radius-sm)] p-1 text-ghost transition-colors hover:text-dim"
            >
              <RefreshCw size={12} />
            </button>
          </div>
          <iframe
            key={refreshKey}
            srcDoc={previewDoc}
            sandbox="allow-scripts"
            title="Live preview"
            className="min-h-0 flex-1 bg-white"
          />
        </div>

        <div className="flex min-h-0 flex-[2] flex-col border-t border-rim-subtle">
          <div className="flex items-center justify-between border-b border-rim-subtle bg-raised px-3 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-ghost">
              Console{logs.length > 0 && ` (${logs.length})`}
            </span>
            <button
              onClick={() => setLogs([])}
              title="Clear console"
              className="rounded-[var(--radius-sm)] p-1 text-ghost transition-colors hover:text-dim"
            >
              <Trash2 size={12} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-canvas px-3 py-2 font-mono text-[12px] leading-relaxed">
            {logs.length === 0 ? (
              <p className="text-ghost">console.log and errors from your script show up here — not just in devtools.</p>
            ) : (
              logs.map((line) => (
                <p key={line.id} className={cn('whitespace-pre-wrap break-words', LEVEL_STYLE[line.level])}>
                  {line.message}
                </p>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
