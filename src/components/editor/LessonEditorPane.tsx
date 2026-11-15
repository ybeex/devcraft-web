'use client'

import Editor from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'
import { addFile, isBundle, monacoLanguage, parseBundle, removeFile, setFile, validateNewFile } from '@/lib/lab-files'
import { FileExplorer } from './FileExplorer'
import { WebModeEditor } from '@/components/playground/WebModeEditor'
import { defineDevCraftMonacoThemes } from '@/lib/monaco-theme'
import type { WebBottomTab, WebEditorTab } from '@/components/playground/WebModeEditor'
import type { WebModeContent } from '@/lib/api/playground'
import type { ReactNode } from 'react'

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
   webContent?: WebModeContent
  onWebContentChange?: (value: WebModeContent) => void
  webPreviewDoc?: string
  webPreviewSandbox?: string
  webPreviewKey?: number
  webPanelRevealKey?: number
  webPreviewLoading?: boolean
  webLayout?: 'split' | 'stacked'
  webTestsPanel?: ReactNode
  webTestsBadge?: string
  webActivePanel?: WebBottomTab
  onWebPanelChange?: (panel: WebBottomTab) => void
  onWebEditorTabChange?: (tab: WebEditorTab) => void
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
  webContent,
  onWebContentChange,
  webPreviewDoc,
  webPreviewSandbox,
  webPreviewKey,
  webPanelRevealKey,
  webPreviewLoading,
  webLayout,
  webTestsPanel,
  webTestsBadge,
  webActivePanel,
  onWebPanelChange,
  onWebEditorTabChange,
}: LessonEditorPaneProps) {
  const { resolvedTheme } = useTheme()
  const editorTheme = resolvedTheme === 'dark' ? 'devcraft-dark' : 'devcraft-light'
  const multi = isBundle(code)
  const files = useMemo(() => (multi ? parseBundle(code) : []), [multi, code])
  const [active, setActive] = useState('')
  // Open on the first editable file (the readonly ones are the page the lesson gives you), and recover if files change.
  useEffect(() => {
    if (!multi) return
    if (!files.some((f) => f.name === active)) setActive((files.find((f) => !f.readonly) ?? files[0])?.name ?? '')
  }, [multi, files, active])
  const current = files.find((f) => f.name === active)
  // Learners may add and remove their own files in the React and Next labs; other bundles keep the lesson's file set.
  const editableTree = multi && (language === 'react-lab' || language === 'next-lab')

  return (
    <div className="flex h-full flex-col">
      {multi && (
        <div className="flex items-center gap-2 border-b border-rim-subtle bg-card px-3 py-1.5 sm:hidden">
          <label htmlFor="lesson-file-select" className="text-[11px] font-semibold uppercase tracking-wide text-ghost">File</label>
          <select id="lesson-file-select" value={active} onChange={(event) => setActive(event.target.value)} className="min-w-0 flex-1 rounded border border-rim-subtle bg-canvas px-2 py-1 font-mono text-xs text-ink">
            {files.map((f) => <option key={f.name} value={f.name}>{f.name}{f.readonly ? ' (read only)' : ''}</option>)}
          </select>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {multi && !webContent && (
          <div className="hidden sm:flex">
            <FileExplorer
              files={files}
              active={active}
              onSelect={setActive}
              onCreate={editableTree ? (name) => { const problem = validateNewFile(files, name); if (problem) return problem; onChange(addFile(code, name)); setActive(name); return null } : undefined}
              onDelete={editableTree ? (name) => { onChange(removeFile(code, name)); if (name === active) setActive('') } : undefined}
            />
          </div>
        )}
        <div className="min-h-0 min-w-0 flex-1">
        {webContent && onWebContentChange ? (
          <WebModeEditor
            value={webContent}
            onChange={onWebContentChange}
            theme={editorTheme}
            beforeMount={defineDevCraftMonacoThemes}
            onRun={onRun}
            onCheck={onCheck}
            onReset={onReset}
            onAskForHelp={onAskForHelp}
            isRunning={isRunning}
            isChecking={isChecking}
            previewDoc={webPreviewDoc}
            previewSandbox={webPreviewSandbox}
            previewKey={webPreviewKey}
            panelRevealKey={webPanelRevealKey}
            previewLoading={webPreviewLoading}
            layout={webLayout}
            testsPanel={webTestsPanel}
            testsBadge={webTestsBadge}
            activePanel={webActivePanel}
            onActivePanelChange={onWebPanelChange}
            onActiveEditorTabChange={onWebEditorTabChange}
          />
        ) : <Editor
          value={multi ? current?.content ?? '' : code}
          path={multi && current ? `file:///${current.name}` : undefined}
          keepCurrentModel
          language={multi && current ? monacoLanguage(current.name) : language === 'postgresql' ? 'sql' : language === 'nodejs-db' ? 'javascript' : language === 'webapp' ? 'html' : language === 'css' ? 'javascript' : language}
          theme={editorTheme}
          beforeMount={defineDevCraftMonacoThemes}
          onChange={(value) => (multi ? current && !current.readonly && onChange(setFile(code, current.name, value ?? '')) : onChange(value ?? ''))}
          options={{
            readOnly: multi && !!current?.readonly,
            fontSize: 13.5,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 16 },
            automaticLayout: true,
            tabSize: 2,
          }}
        />}
        </div>
      </div>
    </div>
  )
}
