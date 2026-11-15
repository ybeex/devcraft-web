'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import Editor, { type BeforeMount } from '@monaco-editor/react'
import { ChevronDown, ChevronUp, RefreshCw, Trash2 } from 'lucide-react'
import { buildWebPreviewDocument, type WebModeContent } from '@/lib/api/playground'
import { cn } from '@/lib/utils'
import { LessonActions } from '@/components/editor/LessonActions'
import { defineDevCraftMonacoThemes } from '@/lib/monaco-theme'

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
  theme: 'devcraft-dark' | 'devcraft-light' | 'vs-dark' | 'light'
  beforeMount?: BeforeMount
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
  onActiveEditorTabChange?: (tab: WebEditorTab) => void
  onRun?: () => void
  onCheck?: () => void
  onReset?: () => void
  onAskForHelp?: () => void
  isRunning?: boolean
  isChecking?: boolean
}

export type WebBottomTab = 'preview' | 'console' | 'tests'
export type WebEditorTab = keyof WebModeContent

export function WebModeEditor({
  value,
  onChange,
  theme,
  beforeMount,
  previewDoc: suppliedPreviewDoc,
  previewSandbox,
  previewKey,
  panelRevealKey,
  previewLoading,
  testsPanel,
  testsBadge,
  activePanel,
  onActivePanelChange,
  onActiveEditorTabChange,
  onRun,
  onCheck,
  onReset,
  onAskForHelp,
  isRunning = false,
  isChecking = false,
}: WebModeEditorProps) {
  const [activeTab, setActiveTab] = useState<keyof WebModeContent>('html')
  const [refreshKey, setRefreshKey] = useState(0)
  const [localOutputTab, setLocalOutputTab] = useState<WebBottomTab>('preview')
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

  // Live preview re-renders on every keystroke (no debounce) — an iframe
  // srcdoc swap is cheap, and immediate feedback is the entire point of a
  // live preview. refreshKey exists only for the manual refresh button,
  // for the rare case someone's script leaves the page in a broken state
  // (e.g. an infinite loop) and they want to force a clean re-render.
  const generatedPreviewDoc = useMemo(() => buildWebPreviewDocument(value), [value])
  const currentOutputTab = activePanel ?? localOutputTab
  const lessonOutputMode = Boolean(testsPanel)
  const effectivePreviewDoc = suppliedPreviewDoc ?? generatedPreviewDoc
  const editorTheme = theme === 'vs-dark' || theme === 'devcraft-dark' ? 'devcraft-dark' : 'devcraft-light'
  function selectOutputTab(tab: WebBottomTab) {
    setLocalOutputTab(tab)
    onActivePanelChange?.(tab)
  }

  // Each srcDoc change destroys the old iframe's script context and
  // starts a fresh one — clearing logs in step with that is correct, not
  // just tidy: old logs belonged to the previous version of the code.
  useEffect(() => {
    setLogs([])
  }, [effectivePreviewDoc])

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
              onClick={() => {
                setActiveTab(tab.key)
                onActiveEditorTabChange?.(tab.key)
              }}
              className={cn(
                'rounded-sm px-3 py-1 text-xs font-semibold transition-colors',
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
                theme={editorTheme}
                beforeMount={beforeMount ?? defineDevCraftMonacoThemes}
                onChange={(v) => onChange({ ...value, [tab.key]: v ?? '' })}
                options={EDITOR_OPTIONS}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-col">
        {lessonOutputMode && onRun && onCheck && onReset && onAskForHelp && (
          <div className="flex h-10 shrink-0 items-center border-b border-rim-subtle bg-card px-2">
            <LessonActions
              onRun={onRun}
              onCheck={onCheck}
              onReset={onReset}
              onAskForHelp={onAskForHelp}
              isRunning={isRunning}
              isChecking={isChecking}
            />
          </div>
        )}
        {lessonOutputMode ? (
          <>
            <div className="flex shrink-0 items-center gap-1 border-b border-rim-subtle bg-raised px-2">
              <OutputTab active={currentOutputTab === 'preview'} onClick={() => selectOutputTab('preview')} label="Preview" />
              <OutputTab active={currentOutputTab === 'console'} onClick={() => selectOutputTab('console')} label="Console" badge={logs.length ? `${logs.length}` : undefined} />
              <OutputTab active={currentOutputTab === 'tests'} onClick={() => selectOutputTab('tests')} label="Tests" badge={testsBadge} />
              {currentOutputTab === 'preview' && (
                <button onClick={() => setRefreshKey((k) => k + 1)} title="Force a clean refresh" className="ml-auto rounded-sm p-1.5 text-ghost transition-colors hover:text-dim">
                  <RefreshCw size={12} />
                </button>
              )}
              {currentOutputTab === 'console' && (
                <button onClick={() => setLogs([])} title="Clear console" className="ml-auto rounded-[var(--radius-sm)] p-1.5 text-ghost transition-colors hover:text-dim">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
            <div className="min-h-0 flex-1">
              {currentOutputTab === 'preview' && (
                previewLoading ? (
                  <div role="status" className="flex h-full items-center justify-center bg-canvas p-6 text-center text-xs text-ghost">Loading preview…</div>
                ) : (
                  <iframe
                    key={`${panelRevealKey ?? 0}-${previewKey ?? 0}-${refreshKey}`}
                    srcDoc={effectivePreviewDoc}
                    sandbox={previewSandbox ?? 'allow-scripts'}
                    title="Live preview"
                    className="h-full w-full bg-white"
                  />
                )
              )}
              {currentOutputTab === 'console' && <ConsoleView logs={logs} endRef={consoleEndRef} />}
              {currentOutputTab === 'tests' && <div className="h-full overflow-y-auto">{testsPanel}</div>}
            </div>
          </>
        ) : (
          <>
            <div className="flex min-h-0 flex-[3] flex-col">
              <div className="flex items-center justify-between border-b border-rim-subtle bg-raised px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-ghost">Live preview</span>
                <button
                  onClick={() => setRefreshKey((k) => k + 1)}
                  title="Force a clean refresh"
                  className="rounded-sm p-1 text-ghost transition-colors hover:text-dim"
                >
                  <RefreshCw size={12} />
                </button>
              </div>
              <iframe
                key={refreshKey}
                srcDoc={effectivePreviewDoc}
                sandbox={previewSandbox ?? 'allow-scripts'}
                title="Live preview"
                className="min-h-0 flex-1 bg-white"
              />
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
              <div className={cn('min-h-0 flex-1 overflow-y-auto bg-canvas px-3 py-2 font-mono text-[12px] leading-relaxed', !consoleOpen && 'hidden')}>
                <ConsoleView logs={logs} endRef={consoleEndRef} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function OutputTab({ active, onClick, label, badge }: { active: boolean; onClick: () => void; label: string; badge?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn('border-b-2 px-2.5 py-2 text-[10px] font-semibold transition-colors', active ? 'border-brand text-ink' : 'border-transparent text-ghost hover:text-dim')}
    >
      {label}{badge && <span className="ml-1 rounded-full bg-card px-1.5 py-0.5 text-[9px] text-dim">{badge}</span>}
    </button>
  )
}

function ConsoleView({ logs, endRef }: { logs: ConsoleLine[]; endRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div className="h-full overflow-y-auto bg-canvas px-3 py-2 font-mono text-[12px] leading-relaxed">
      {logs.length === 0 ? (
        <p className="text-ghost">console.log and errors from your script show up here — not just in devtools.</p>
      ) : (
        logs.map((line) => (
          <p key={line.id} className={cn('whitespace-pre-wrap break-words', LEVEL_STYLE[line.level])}>
            {line.message}
          </p>
        ))
      )}
      <div ref={endRef} />
    </div>
  )
}
