import { parseBundle } from './lab-files'

/**
 * Host-side compiler for React and Next lessons.
 *
 * The preview iframe is sandboxed without `allow-same-origin`, so its origin is opaque and the browser refuses to
 * construct a Worker from it. Compilation therefore lives here, in the trusted host page, in ONE long-lived worker
 * that is reused for every compile (previews, test frames, lesson navigation) instead of loading a compiler per run.
 */
export interface CompiledModule { kind: 'module' | 'css' | 'json'; code: string }
export interface CompileDiagnostic { file: string; line: number | null; column: number | null; message: string }
export interface CompileOutput { modules: Record<string, CompiledModule>; diagnostics: CompileDiagnostic[]; ms: number; cached: boolean }

const WORKER_URL = '/lesson-runtime/compiler-worker.js'
const COMPILE_TIMEOUT_MS = 8_000
const CACHE_LIMIT = 24

let worker: Worker | null = null
let sequence = 0
const pending = new Map<number, { resolve: (out: CompileOutput) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>()
const cache = new Map<string, CompileOutput>()

export interface LessonMetric { name: string; ms: number; at: number; detail?: string }
declare global { interface Window { __lessonRuntimeMetrics?: LessonMetric[] } }

/** Timings are kept in memory (and as performance measures) so startup and compile cost can be inspected and compared. */
export function recordLessonMetric(name: string, ms: number, detail?: string): void {
  if (typeof window === 'undefined') return
  const list = (window.__lessonRuntimeMetrics ??= [])
  list.push({ name, ms, at: Date.now(), detail })
  if (list.length > 200) list.splice(0, list.length - 200)
  try { performance.measure(`lesson:${name}`, { start: performance.now() - ms, duration: ms }) } catch { /* unsupported */ }
}

function failAll(error: Error): void {
  for (const [id, entry] of pending) { clearTimeout(entry.timer); entry.reject(error); pending.delete(id) }
}

function ensureWorker(): Worker {
  if (worker) return worker
  const created = new Worker(WORKER_URL)
  created.onmessage = ({ data }: MessageEvent<{ id: number; modules: Record<string, CompiledModule>; diagnostics: CompileDiagnostic[]; ms: number }>) => {
    const entry = pending.get(data.id)
    if (!entry) return
    clearTimeout(entry.timer); pending.delete(data.id)
    entry.resolve({ modules: data.modules, diagnostics: data.diagnostics, ms: data.ms, cached: false })
  }
  created.onerror = () => { worker = null; created.terminate(); failAll(new Error('The lesson compiler could not start. Refresh the page and try again.')) }
  worker = created
  return created
}

/** Warm the compiler while the learner reads the instructions, so their first Run is instant. */
export function preloadLessonCompiler(): void {
  if (typeof window === 'undefined') return
  try { ensureWorker() } catch { /* surfaced on the first real compile */ }
}

export function compileLessonFiles(files: Record<string, string>): Promise<CompileOutput> {
  const key = JSON.stringify(files)
  const hit = cache.get(key)
  if (hit) { cache.delete(key); cache.set(key, hit); return Promise.resolve({ ...hit, cached: true }) }
  return new Promise<CompileOutput>((resolve, reject) => {
    let target: Worker
    try { target = ensureWorker() } catch (error) { reject(error instanceof Error ? error : new Error(String(error))); return }
    const id = ++sequence
    const timer = setTimeout(() => {
      // A stuck compile must never leave the learner waiting: drop the worker so the next attempt starts clean.
      pending.delete(id); worker?.terminate(); worker = null; failAll(new Error('Compilation took too long. Check for an unfinished expression and try again.'))
      reject(new Error('Compilation took too long. Check for an unfinished expression and try again.'))
    }, COMPILE_TIMEOUT_MS)
    pending.set(id, {
      resolve: (out) => {
        recordLessonMetric('compile', out.ms, `${Object.keys(files).length} files`)
        if (!out.diagnostics.length) { cache.set(key, out); if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string) }
        resolve(out)
      },
      reject, timer,
    })
    target.postMessage({ id, files })
  })
}

export const bundleFilesMap = (code: string): Record<string, string> => Object.fromEntries(parseBundle(code).map((f) => [f.name, f.content]))
