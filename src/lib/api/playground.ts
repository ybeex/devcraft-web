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
    if (arg instanceof Error) return arg.stack || (arg.name + ': ' + arg.message)
    if (typeof arg === 'undefined') return 'undefined'
    var seen = new WeakSet()
    try {
      var text = JSON.stringify(arg, function(key, value) {
        if (typeof value === 'bigint') return String(value) + 'n'
        if (typeof value === 'function') return '[Function ' + (value.name || 'anonymous') + ']'
        if (value && typeof value === 'object') {
          if (seen.has(value)) return '[Circular]'
          seen.add(value)
        }
        return value
      }, 2)
      return text === undefined ? String(arg) : text
    } catch (e) { return String(arg) }
  }
  function send(level, args) {
    try {
      var message = args.map(serialize).join(' ')
      if (message.length > 20000) message = message.slice(0, 20000) + ' … [truncated]'
      window.parent.postMessage({ __devcraftConsole: true, level: level, message: message }, '*')
    } catch (e) {}
  }
  ['log', 'warn', 'error', 'info'].forEach(function(level) {
    var original = console[level]
    console[level] = function() {
      var args = Array.prototype.slice.call(arguments)
      send(level, args)
      try { if (typeof original === 'function') original.apply(console, args) } catch (e) {}
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

/** Builds an isolated browser preview for single-file React/Next.js TSX snippets. */
export function buildComponentPreviewDocument(code: string): string {
  // Escape '<' so a user's `</script>` cannot terminate this inline script.
  const safeCode = JSON.stringify(code).replace(/</g, '\\u003c')
  return `<!doctype html>
<html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'unsafe-inline'; img-src data: https:; connect-src 'none'; form-action 'none'; base-uri 'none'">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{margin:0;padding:20px;color:#201d18;font:14px/1.55 system-ui,sans-serif}#error{color:#b91c1c;white-space:pre-wrap;font:13px/1.5 ui-monospace,monospace}</style>
<script src="https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.27.6/babel.min.js"></script>
</head><body><div id="root">Loading TSX compiler…</div><script>
(function () {
  const root = document.getElementById('root');
  function showError(error) {
    root.innerHTML = '<pre id="error"></pre>';
    root.firstChild.textContent = error && error.message ? error.message : String(error);
  }
  window.onerror = function (message, source, line) { showError(message + (line ? ' (line ' + line + ')' : '')); };
  window.addEventListener('unhandledrejection', function (event) { showError(event.reason); });
  if (!window.React || !window.ReactDOM || !window.Babel) {
    showError('The TSX compiler could not load. Check that this page can reach cdn.jsdelivr.net, then refresh.');
    return;
  }

  const React = window.React;
  const NextLink = function (props) { return React.createElement('a', Object.assign({}, props, { href: props.href || '#' }), props.children); };
  const NextImage = function (props) { return React.createElement('img', Object.assign({}, props, { alt: props.alt || '' })); };
  const NextHead = function (props) { return React.createElement(React.Fragment, null, props.children); };
  const NextNavigation = {
    useRouter: function () { return { push: function () {}, replace: function () {}, back: function () {}, refresh: function () {} }; },
    usePathname: function () { return '/'; },
    useSearchParams: function () { return new URLSearchParams(); },
    useParams: function () { return {}; },
  };
  const source = ${safeCode};
  const bindings = [];
  let defaultName = '';
  let unsupportedImport = '';
  let prepared = source.replace(/^\\s*import\\s+type\\b[^\\n]*;?\\s*$/gm, '');
  prepared = prepared.replace(/^\\s*import\\s+([^\\n]+?)\\s+from\\s+['\"]([^'\"]+)['\"];?\\s*$/gm, function (_, clause, moduleName) {
    if (/\\.css['\"]?$/.test(moduleName)) return '';
    if (moduleName === 'react') {
      const named = /\\{([^}]+)\\}/.exec(clause);
      if (named) named[1].split(',').forEach(function (entry) {
        const part = entry.trim().replace(/^type\\s+/, '');
        if (!part) return;
        const pair = part.split(/\\s+as\\s+/);
        bindings.push('const ' + (pair[1] || pair[0]) + ' = React.' + pair[0] + ';');
      });
      const defaultImport = clause.split(',')[0].trim();
      if (defaultImport && defaultImport[0] !== '{' && defaultImport !== '*' && defaultImport !== 'React') bindings.push('const ' + defaultImport + ' = React;');
      const namespace = /\\*\\s+as\\s+([A-Za-z_$][\\w$]*)/.exec(clause);
      if (namespace && namespace[1] !== 'React') bindings.push('const ' + namespace[1] + ' = React;');
      return '';
    }
    const defaultImport = clause.split(',')[0].trim();
    if (moduleName === 'next/link' && defaultImport && defaultImport[0] !== '{') bindings.push('const ' + defaultImport + ' = NextLink;');
    else if (moduleName === 'next/image' && defaultImport && defaultImport[0] !== '{') bindings.push('const ' + defaultImport + ' = NextImage;');
    else if (moduleName === 'next/head' && defaultImport && defaultImport[0] !== '{') bindings.push('const ' + defaultImport + ' = NextHead;');
    else if (moduleName === 'next/navigation') {
      const named = /\\{([^}]+)\\}/.exec(clause);
      if (named) named[1].split(',').forEach(function (entry) {
        const pair = entry.trim().split(/\\s+as\\s+/);
        if (pair[0]) bindings.push('const ' + (pair[1] || pair[0]) + ' = NextNavigation.' + pair[0] + ';');
      });
    } else {
      unsupportedImport = moduleName;
    }
    return '';
  });
  prepared = prepared.replace(/^\\s*import\\s+['\"][^'\"]+['\"];?\\s*$/gm, '');
  if (unsupportedImport) {
    showError('This preview supports a single file. Import "' + unsupportedImport + '" is not available; paste that code into this file or use built-in React/Next imports.');
    return;
  }
  prepared = prepared.replace(/\\bexport\\s+default\\s+function\\s+([A-Za-z_$][\\w$]*)/g, function (_, name) { defaultName = name; return 'function ' + name; });
  prepared = prepared.replace(/\\bexport\\s+default\\s+/g, '__defaultExport = ');
  prepared = prepared.replace(/\\bexport\\s+(?=(const|let|var|function|class)\\b)/g, '');
  try {
    const compiled = Babel.transform(prepared, { filename: 'playground.tsx', presets: ['typescript', 'react'] }).code;
    const factory = new Function('React', 'ReactDOM', 'NextLink', 'NextImage', 'NextHead', 'NextNavigation',
      bindings.join('\\n') + '\\nlet __defaultExport;\\n' + compiled + '\\nreturn __defaultExport || ' + (defaultName || 'undefined') + ' || (typeof App !== "undefined" ? App : undefined) || (typeof Page !== "undefined" ? Page : undefined);');
    const Component = factory(React, ReactDOM, NextLink, NextImage, NextHead, NextNavigation);
    if (typeof Component !== 'function') throw new Error('Add a default exported React component (for example, export default function App() { ... }).');
    ReactDOM.createRoot(root).render(React.createElement(Component));
  } catch (error) { showError(error); }
})();
</script></body></html>`
}
