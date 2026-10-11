'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Editor from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { Save, Share2, Check, Info, Sparkles, LayoutTemplate } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TrustBanner } from '@/components/ui/TrustBanner'
import { Skeleton } from '@/components/ui/Skeleton'
import { SnippetBrowser } from '@/components/playground/SnippetBrowser'
import { WebModeEditor } from '@/components/playground/WebModeEditor'
import { ConsoleOutput } from '@/components/playground/ConsoleOutput'
import {
  createSnippet, runCode, serializeWebContent, parseWebContent,
  type Snippet, type ExecutableLanguage, type WebModeContent, type RunResult,
} from '@/lib/api/playground'
import { ApiRequestError } from '@/lib/api/client'
import { COMPONENT_TEMPLATE, SCRIPT_TEMPLATE } from '@/lib/playground-templates'

const ALL_LANGUAGES = [
  { value: 'web', label: 'Web (HTML/CSS/JS)' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
]

// A backend lesson has no use for HTML/CSS/web-mode (no browser rendering
// involved); a frontend lesson has little use for SQL. Scoping to what's
// actually relevant beats showing a generic 9-language list regardless of
// where someone arrived from — the PRD's ask here specifically.
const FE_LANGUAGES = ALL_LANGUAGES.filter((l) => l.value !== 'python' && l.value !== 'sql')
const BE_LANGUAGES = ALL_LANGUAGES.filter((l) => l.value !== 'web' && l.value !== 'html' && l.value !== 'css')

const EXECUTABLE_LANGUAGES = new Set<string>(['javascript', 'typescript', 'python', 'sql'])

const DEFAULT_CODE = '// Start typing — save to keep this snippet, share to send it to someone.\n'
const BLANK_WEB_CONTENT: WebModeContent = { html: '', css: '', js: '' }

function defaultLanguageFor(track: 'FE' | 'BE' | null): string {
  if (track === 'BE') return 'javascript'
  return 'web'
}

function PlaygroundContent() {
  const { resolvedTheme } = useTheme()
  const searchParams = useSearchParams()

  const rawTrack = searchParams.get('track')
  const track: 'FE' | 'BE' | null = rawTrack === 'FE' || rawTrack === 'BE' ? rawTrack : null
  const [scopeCleared, setScopeCleared] = useState(false)
  const isScoped = track !== null && !scopeCleared
  const languages = !isScoped ? ALL_LANGUAGES : track === 'BE' ? BE_LANGUAGES : FE_LANGUAGES

  const urlLanguage = searchParams.get('language')
  const initialLanguage =
    urlLanguage && languages.some((l) => l.value === urlLanguage) ? urlLanguage : defaultLanguageFor(track)
  const urlCode = searchParams.get('code')

  const [title, setTitle] = useState('Untitled snippet')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState(initialLanguage)
  const [code, setCode] = useState(urlCode ?? DEFAULT_CODE)
  const [webContent, setWebContent] = useState<WebModeContent>(BLANK_WEB_CONTENT)
  const [isPublic, setIsPublic] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState<Snippet | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [copied, setCopied] = useState(false)

  const [isRunning, setIsRunning] = useState(false)
  const [runResult, setRunResult] = useState<RunResult | null>(null)
  const [runError, setRunError] = useState<string | null>(null)

  const isWeb = language === 'web'
  const isExecutable = EXECUTABLE_LANGUAGES.has(language)

  function changeLanguage(next: string) {
    setLanguage(next)
    setRunResult(null)
    setRunError(null)
  }

  function loadSnippet(snippet: Snippet) {
    setTitle(snippet.title)
    setDescription(snippet.description ?? '')
    setLanguage(snippet.language)
    if (snippet.language === 'web') {
      setWebContent(parseWebContent(snippet.code))
    } else {
      setCode(snippet.code)
    }
    setIsPublic(snippet.isPublic)
    setSaved(snippet)
    setRunResult(null)
    setRunError(null)
  }

  function resetToBlank() {
    setTitle('Untitled snippet')
    setDescription('')
    setCode(DEFAULT_CODE)
    setWebContent(BLANK_WEB_CONTENT)
    setSaved(null)
    setRunResult(null)
    setRunError(null)
  }

  function applyTemplate(template: typeof COMPONENT_TEMPLATE | typeof SCRIPT_TEMPLATE) {
    setTitle(template.title)
    setLanguage(template.language)
    if (template.language === 'web') {
      setWebContent(template.content)
    } else {
      setCode(template.content)
    }
    setSaved(null)
    setRunResult(null)
    setRunError(null)
  }

  async function handleSave() {
    setIsSaving(true)
    setSaveError(null)
    try {
      const result = await createSnippet({
        title: title.trim() || 'Untitled snippet',
        description: description.trim() || undefined,
        language,
        code: isWeb ? serializeWebContent(webContent) : code,
        isPublic,
      })
      setSaved(result)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setSaveError(err instanceof ApiRequestError ? err.message : 'Could not save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCopyShareLink() {
    if (!saved?.shareToken) return
    const url = `${window.location.origin}/playground/shared/${saved.shareToken}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRun() {
    if (!isExecutable) return
    setIsRunning(true)
    setRunError(null)
    try {
      const result = await runCode(code, language as ExecutableLanguage)
      setRunResult(result)
    } catch (err) {
      setRunError(err instanceof ApiRequestError ? err.message : 'Could not run code. Please try again.')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Playground</h1>
          <p className="mt-1 text-sm text-dim">
            {isScoped
              ? `Scoped to ${track === 'BE' ? 'Backend' : 'Frontend'} — execute code and inspect the output.`
              : 'Scratch space for trying things out — save and share what you build.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {track !== 'BE' && (
            <Button size="sm" variant="outline" onClick={() => applyTemplate(COMPONENT_TEMPLATE)}>
              <Sparkles size={13} /> Component starter
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => applyTemplate(SCRIPT_TEMPLATE)}>
            <Sparkles size={13} /> Script starter
          </Button>
          <Button size="sm" variant="ghost" onClick={resetToBlank}>
            Blank
          </Button>
        </div>
      </div>

      {isScoped && (
        <TrustBanner icon={<LayoutTemplate />} tone="info" className="mt-4">
          Showing {track === 'BE' ? 'backend' : 'frontend'}-relevant languages only.{' '}
          <button onClick={() => setScopeCleared(true)} className="font-semibold underline underline-offset-2">
            Show all languages
          </button>
        </TrustBanner>
      )}

      {saveError && (
        <TrustBanner icon={<Info />} className="mt-4 bg-[var(--negative-bg)] text-[var(--negative-text)]">
          {saveError}
        </TrustBanner>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="flex h-[65vh] min-h-[480px] flex-col overflow-hidden rounded-[var(--radius-xl)] border border-rim-subtle bg-card">
          <div className="flex flex-wrap items-center gap-2 border-b border-rim-subtle px-3 py-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Snippet title"
              className="min-w-0 flex-1 rounded-[var(--radius-sm)] bg-transparent px-2 py-1 text-sm font-semibold text-ink outline-none focus:bg-raised"
            />
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-rim bg-canvas px-2.5 py-1.5 text-xs font-medium text-ink outline-none focus:border-brand"
            >
              {languages.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <label
              className="flex items-center gap-1.5 text-xs font-medium text-dim"
              title="Public snippets can be opened via their share link and appear in Community browsing"
            >
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-3.5 w-3.5 accent-brand"
              />
              Public
            </label>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save size={13} /> {isSaving ? 'Saving...' : 'Save'}
            </Button>
            {saved?.shareToken && (
              <Button size="sm" variant="outline" onClick={handleCopyShareLink} disabled={!saved.isPublic}>
                {copied ? <Check size={13} /> : <Share2 size={13} />} {copied ? 'Copied' : 'Share'}
              </Button>
            )}
          </div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a short description (optional)"
            className="w-full border-b border-rim-subtle bg-transparent px-3 py-1.5 text-xs text-dim outline-none placeholder:text-ghost focus:bg-raised"
          />

          <div className="min-h-0 flex-1">
            {isWeb ? (
              <WebModeEditor value={webContent} onChange={setWebContent} theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'} />
            ) : isExecutable ? (
              <div className="flex h-full flex-col lg:flex-row">
                <div className="min-h-0 flex-1 border-b border-rim-subtle lg:w-2/3 lg:border-b-0 lg:border-r">
                  <Editor
                    value={code}
                    language={language}
                    theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                    onChange={(v) => setCode(v ?? '')}
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
                <div className="min-h-0 flex-1 lg:w-1/3">
                  <ConsoleOutput onRun={handleRun} isRunning={isRunning} result={runResult} error={runError} />
                </div>
              </div>
            ) : (
              <Editor
                value={code}
                language={language}
                theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                onChange={(v) => setCode(v ?? '')}
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
            )}
          </div>
        </div>

        <div className="h-[65vh] min-h-[480px] overflow-hidden rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-4">
          <SnippetBrowser onLoad={loadSnippet} refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  )
}

export default function PlaygroundPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <Skeleton className="h-9 w-1/3" />
          <Skeleton className="mt-6 h-[65vh] w-full rounded-[var(--radius-xl)]" />
        </div>
      }
    >
      <PlaygroundContent />
    </Suspense>
  )
}
