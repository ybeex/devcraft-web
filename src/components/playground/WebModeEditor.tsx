'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Editor from '@monaco-editor/react'
import { ChevronDown, ChevronUp, GripHorizontal, RefreshCw, Trash2 } from 'lucide-react'
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
  previewDoc?: string
  previewSandbox?: string
  previewKey?: number
  panelRevealKey?: number
  previewLoading?: boolean
  layout?: 'split' | 'stacked'
  testsPanel?: ReactNode
  testsBadge?: string
  activePanel?: WebBottomTab
  onActivePanelChange?: (panel: WebBottomTab) => void
  onActiveEditorTabChange?: (tab: keyof WebModeContent) => void
}

export type WebBottomTab = 'preview' | 'tests' | 'console'
export type WebEditorTab = keyof WebModeContent

export function WebModeEditor({ value, onChange, theme, previewDoc: providedPreviewDoc, previewSandbox = 'allow-scripts', previewKey = 0, panelRevealKey = 0, previewLoading = false, layout = 'split', testsPanel, testsBadge, activePanel: controlledPanel, onActivePanelChange, onActiveEditorTabChange }: WebModeEditorProps) {
  const [activeTab, setActiveTab] = useState<keyof WebModeContent>('html')
  const [internalPanel, setInternalPanel] = useState<WebBottomTab>('preview')
  const [bottomPanelHeight, setBottomPanelHeight] = useState(40)
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [logs, setLogs] = useState<ConsoleLine[]>([])
  // The console only matters while writing JS. On the HTML/CSS tabs it folds
  // away so the preview gets the full height; switching back to JS reopens it.
  // The header stays as a slim bar so it can still be toggled by hand.
  const [consoleOpen, setConsoleOpen] = useState(false)
  // Follow the active tab: open on JS, folded on HTML/CSS. A manual toggle sticks until the tab changes again.
  useEffect(() => {
    setConsoleOpen(activeTab === 'js')
  }, [activeTab])
  const logIdRef = useRef(0)
  const consoleEndRef = useRef<HTMLDivElement>(null)
  const activePanel = controlledPanel ?? internalPanel
  useEffect(() => {
    setBottomPanelCollapsed(false)
  }, [panelRevealKey])
  const setActivePanel = (panel: WebBottomTab) => {
    setInternalPanel(panel)
    setBottomPanelCollapsed(false)
    onActivePanelChange?.(panel)
  }

  // Live preview re-renders on every keystroke (no debounce) — an iframe
  // srcdoc swap is cheap, and immediate feedback is the entire point of a
  // live preview. refreshKey exists only for the manual refresh button,
  // for the rare case someone's script leaves the page in a broken state
  // (e.g. an infinite loop) and they want to force a clean re-render.
  const previewDoc = useMemo(() => providedPreviewDoc ?? buildWebPreviewDocument(value), [providedPreviewDoc, value])

  // Each srcDoc change destroys the old iframe's script context and
  // starts a fresh one — clearing logs in step with that is correct, not
  // just tidy: old logs belonged to the previous version of the code.
  useEffect(() => {
    setLogs([])
  }, [previewDoc])

  // Errors/console output from inside the iframe arrive via postMessage
  // (see CONSOLE_BRIDGE_SCRIPT in lib/api/playground.ts) rather than only
  // being visible in the browser's own devtools.
  useLayoutEffect(() => {
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

  const editor = (
    <div className={cn('flex h-full min-h-0 flex-col border-b border-rim-subtle', layout === 'split' && 'lg:border-b-0 lg:border-r')}>
        <div className="flex items-center gap-1 border-b border-rim-subtle bg-raised px-2 py-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                onActiveEditorTabChange?.(tab.key)
              }}
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
  )

  const previewFrame = previewLoading ? (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-canvas p-6 text-center font-sans text-xs text-ghost">Getting your Storefront key…</div>
  ) : (
    <iframe
      key={`${refreshKey}-${previewKey}`}
      srcDoc={previewDoc}
      sandbox={previewSandbox}
      title="Live preview"
      className="min-h-0 flex-1 bg-white"
    />
  )

  const consoleContent = (
    <div className="min-h-0 flex-1 overflow-y-auto bg-canvas px-3 py-2 font-mono text-[12px] leading-relaxed">
      {logs.length === 0 ? (
        <p className="text-ghost">console.log and errors from your script show up here — not just in devtools.</p>
      ) : (
        logs.map((line, index) => (
          <p key={`${line.id}-${index}`} className={cn('whitespace-pre-wrap wrap-break-words', LEVEL_STYLE[line.level])}>
            {line.message}
          </p>
        ))
      )}
      <div ref={consoleEndRef} />
    </div>
  )

  const preview = (
    <div className="flex min-h-0 flex-1 flex-col">
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
      {previewFrame}
    </div>
  )

  if (layout === 'stacked') {
    const bottomTabs: { key: WebBottomTab; label: string; badge?: string; disabled?: boolean }[] = [
      { key: 'preview', label: 'Preview' },
      { key: 'tests', label: 'Tests', badge: testsBadge, disabled: !testsPanel },
      { key: 'console', label: 'Console', badge: logs.length ? String(logs.length) : undefined },
    ]
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0" style={{ flex: bottomPanelCollapsed ? '1 1 0%' : `${100 - bottomPanelHeight} 1 0%` }}>{editor}</div>
        {!bottomPanelCollapsed && (
          <div
            role="separator"
            aria-label="Resize preview panel"
            aria-orientation="horizontal"
            aria-valuemin={20}
            aria-valuemax={70}
            aria-valuenow={bottomPanelHeight}
            tabIndex={0}
            onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
            onPointerMove={(event) => {
              if (event.buttons !== 1) return
              const bounds = event.currentTarget.parentElement?.getBoundingClientRect()
              if (!bounds) return
              setBottomPanelHeight(Math.max(20, Math.min(70, ((bounds.bottom - event.clientY) / bounds.height) * 100)))
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowUp') setBottomPanelHeight((height) => Math.min(70, height + 3))
              if (event.key === 'ArrowDown') setBottomPanelHeight((height) => Math.max(20, height - 3))
            }}
            className="z-10 flex h-2 shrink-0 touch-none cursor-row-resize items-center justify-center bg-raised text-ghost transition-colors hover:bg-brand/10 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          >
            <GripHorizontal size={14} />
          </div>
        )}
        <div
          className="flex min-h-0 flex-col border-t border-rim-subtle"
          style={{ flex: bottomPanelCollapsed ? '0 0 36px' : `${bottomPanelHeight} 1 0%` }}
        >
          <div role="tablist" aria-label="Preview panels" className="flex h-9 shrink-0 items-stretch border-b border-rim-subtle bg-raised px-2">
            {bottomTabs.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activePanel === tab.key}
                disabled={tab.disabled}
                onClick={() => setActivePanel(tab.key)}
                className={cn(
                  'border-b-2 px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-40',
                  activePanel === tab.key ? 'border-brand text-ink' : 'border-transparent text-ghost hover:text-dim'
                )}
              >
                {tab.label}{tab.badge && <span className="ml-1.5 rounded-full bg-card px-1.5 py-0.5 text-[10px] text-dim">{tab.badge}</span>}
              </button>
            ))}
            {activePanel === 'console' && (
              <button onClick={() => setLogs([])} title="Clear console" className="ml-auto self-center rounded-[var(--radius-sm)] p-1 text-ghost transition-colors hover:text-dim">
                <Trash2 size={12} />
              </button>
            )}
            <button
              onClick={() => setBottomPanelCollapsed((collapsed) => !collapsed)}
              aria-label={bottomPanelCollapsed ? 'Expand preview panel' : 'Collapse preview panel'}
              title={bottomPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
              className="self-center rounded-[var(--radius-sm)] p-1 text-ghost transition-colors hover:text-dim"
            >
              {bottomPanelCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
          <div className={cn('min-h-0 flex-1', bottomPanelCollapsed && 'hidden')}>
            <div className={cn('flex h-full min-h-0', activePanel !== 'preview' && 'hidden')}>{preview}</div>
            <div className={cn('flex h-full min-h-0', activePanel !== 'tests' && 'hidden')}>{testsPanel}</div>
            <div className={cn('flex h-full min-h-0', activePanel !== 'console' && 'hidden')}>{consoleContent}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-2">
      {editor}
      <div className="flex min-h-0 flex-col">
        <div className="flex min-h-0 flex-[3] flex-col">
          {preview}
        </div>

        <div
          data-testid="web-console"
          data-open={consoleOpen}
          className={cn('flex min-h-0 flex-col border-t border-rim-subtle', consoleOpen ? 'flex-[2]' : 'flex-none')}
        >
          <div className="flex items-center justify-between border-b border-rim-subtle bg-raised px-3 py-1.5">
            <button
              onClick={() => setConsoleOpen((o) => !o)}
              aria-expanded={consoleOpen}
              className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-ghost hover:text-dim"
            >
              {consoleOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              Console{logs.length > 0 && ` (${logs.length})`}
            </button>
            {consoleOpen && (
              <button
                onClick={() => setLogs([])}
                title="Clear console"
                className="rounded-[var(--radius-sm)] p-1 text-ghost transition-colors hover:text-dim"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
          <div className={cn('min-h-0 flex-1', !consoleOpen && 'hidden')}>{consoleContent}</div>
        </div>
      </div>
    </div>
  )
}
