import { apiFetch, apiFetchWithMeta } from './client'
import { authFetch, authFetchWithMeta } from './auth-fetch'

/**
 * Verified against the real backend (playground.routes.ts / .service.ts /
 * db/schema/snippets.ts) during the PRD gap-analysis pass — this replaces
 * the best-effort guesses from checkpoint 17, which had four wrong endpoint
 * paths and an invented `viewCount` field. Both are now real: the backend
 * gained a `view_count` column (incremented atomically on each share-link
 * open) and `json`/`markdown` were added to its language allow-list to
 * match this frontend's existing dropdown, rather than trimming the
 * dropdown down to match the backend.
 *
 * 'web' is a frontend-only convention added for the multi-tab HTML/CSS/JS
 * mode — the backend stores it as a plain language string like any other
 * and never executes it; this file serializes/deserializes the {html,
 * css, js} bundle into the same `code` text column other languages use
 * for a single file.
 */
export type ExecutableLanguage = 'javascript' | 'typescript' | 'python' | 'sql'

export interface Snippet {
  id: string
  title: string
  language: string
  code: string
  description: string | null
  isPublic: boolean
  shareToken: string | null
  viewCount: number
  createdAt: string
  updatedAt: string
  /** Only present on community/shared snippets — never populated for "my snippets" rows (always the caller). */
  user?: { username: string; displayName: string; avatar: string | null }
}

export interface CreateSnippetBody {
  title: string
  language: string
  code: string
  description?: string
  isPublic?: boolean
}

export function createSnippet(body: CreateSnippetBody): Promise<Snippet> {
  return authFetch<Snippet>('/playground/snippets', { method: 'POST', body, idempotencyKey: crypto.randomUUID() })
}

/** Auth required — the current user's own snippets, paginated. */
export async function listMySnippets(page = 1, limit = 20): Promise<{ snippets: Snippet[]; total: number }> {
  const { data, meta } = await authFetchWithMeta<Snippet[]>(`/playground/snippets?page=${page}&limit=${limit}`)
  return { snippets: data, total: meta?.total ?? data.length }
}

/** Auth required — fetch one of the current user's own snippets by id. */
export function getOwnSnippet(id: string): Promise<Snippet> {
  return authFetch<Snippet>(`/playground/snippets/${id}`)
}

export function deleteSnippet(id: string): Promise<{ message: string }> {
  return authFetch(`/playground/snippets/${id}`, { method: 'DELETE', idempotencyKey: crypto.randomUUID() })
}

/**
 * Public endpoint — view any snippet via its share link, no auth needed.
 * The backend 404s (not 403 — it doesn't leak existence) if the snippet
 * isn't public, so a snippet must be saved/marked public for its link to
 * actually resolve for anyone else.
 */
export function getSnippetByShareToken(token: string): Promise<Snippet> {
  return apiFetch<Snippet>(`/playground/share/${token}`)
}

export interface CommunitySnippetParams {
  page?: number
  limit?: number
  language?: string
}

/** Public endpoint — browse snippets the community has made public. */
export async function listCommunitySnippets(params: CommunitySnippetParams = {}): Promise<{ snippets: Snippet[]; total: number }> {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.language) qs.set('language', params.language)

  const { data, meta } = await apiFetchWithMeta<Snippet[]>(`/playground/community?${qs.toString()}`)
  return { snippets: data, total: meta?.total ?? data.length }
}

export interface RunResult {
  stdout: string
  stderr: string
  exitCode: number | null
  status: string
  timedOut: boolean
}

/**
 * Reuses the exact same sandbox as the lesson runner (Judge0 — network
 * disabled, 5s CPU limit, 128MB memory), just stateless: no snippet needs
 * to be saved first. Not tier-gated — running code is core here, not a
 * Pro perk.
 */
export function runCode(code: string, language: ExecutableLanguage, stdin?: string): Promise<RunResult> {
  return authFetch<RunResult>('/playground/run', { method: 'POST', body: { code, language, stdin } })
}

export interface WebModeContent {
  html: string
  css: string
  js: string
}

/** Serializes a {html, css, js} bundle into the single `code` column 'web'-language snippets use. */
export function serializeWebContent(content: WebModeContent): string {
  return JSON.stringify(content)
}

/** Parses a 'web'-language snippet's `code` back into {html, css, js} — falls back to an empty bundle if malformed. */
export function parseWebContent(code: string): WebModeContent {
  try {
    const parsed = JSON.parse(code) as Partial<WebModeContent>
    return { html: parsed.html ?? '', css: parsed.css ?? '', js: parsed.js ?? '' }
  } catch {
    return { html: '', css: '', js: '' }
  }
}

/** Combines a {html, css, js} bundle into one self-contained document — used for the live-preview iframe and as what "copy code" copies for web-mode snippets, since the raw JSON storage format isn't what anyone actually wants to reuse. */
/**
 * Injected into the preview iframe before the user's own script. Wraps
 * console.log/warn/error/info to also postMessage back to the parent
 * window (namespaced under __devcraftConsole to avoid colliding with
 * unrelated postMessage traffic — browser extensions, etc.), and catches
 * uncaught errors/rejections the same way. The original console methods
 * still run too, so browser devtools keep working exactly as before —
 * this adds a second listener, it doesn't replace anything.
 */
const CONSOLE_BRIDGE_SCRIPT = `
(function() {
  function serialize(arg) {
    if (typeof arg === 'string') return arg
    try { return JSON.stringify(arg) } catch (e) { return String(arg) }
  }
  function send(level, args) {
    try {
      window.parent.postMessage({ __devcraftConsole: true, level: level, message: args.map(serialize).join(' ') }, '*')
    } catch (e) {}
  }
  ['log', 'warn', 'error', 'info'].forEach(function(level) {
    var original = console[level]
    console[level] = function() {
      send(level, Array.prototype.slice.call(arguments))
      original.apply(console, arguments)
    }
  })
  window.addEventListener('error', function(e) {
    send('error', [e.message + ' (line ' + e.lineno + ')'])
  })
  window.addEventListener('unhandledrejection', function(e) {
    send('error', ['Unhandled promise rejection: ' + serialize(e.reason)])
  })
})();
`

export function buildWebPreviewDocument(content: WebModeContent): string {
  return `<!DOCTYPE html>
<html>
<head><style>${content.css}</style></head>
<body>${content.html}
<script>${CONSOLE_BRIDGE_SCRIPT}</script>
<script>${content.js}</script>
</body>
</html>`
}
