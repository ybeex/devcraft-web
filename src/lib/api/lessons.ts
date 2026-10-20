import { authFetch } from './auth-fetch'

export interface LessonDetail {
  id: string
  moduleId: string
  slug: string
  title: string
  content: string
  starterCode: string | null
  language: string
  xpReward: number
  estimatedMins: number
  order: number
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  isPremium: boolean
  conceptTags: string[]
  // solutionCode and testCode are deliberately never sent by the backend
  // (see AUDIT_REPORT.md's data-exposure fix) — do not add them here even
  // if they appear to be present in a raw response.
  progress: {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
    xpEarned: number
    attempts: number
  }
}

export interface RunResult {
  stdout: string
  stderr: string
  exitCode: number | null
  status: string
  timedOut: boolean
  /** Database lessons: the rows the learner's statement returned. */
  table?: { command: string; columns: string[]; rows: unknown[][]; rowCount: number; truncated: boolean }
}

export interface CheckResult {
  passed: number
  failed: number
  total: number
  allPassed: boolean
  results: { name: string; passed: boolean; reason?: string }[]
}

export interface CompleteLessonResult {
  xpEarned: number
  alreadyCompleted: boolean
  certificateIssued: boolean
}

export function getLesson(slug: string): Promise<LessonDetail> {
  return authFetch<LessonDetail>(`/lessons/${slug}`)
}

export function startLesson(lessonId: string): Promise<{ message: string }> {
  return authFetch(`/lessons/${lessonId}/start`, { method: 'POST' })
}

export function completeLesson(lessonId: string, timeSpentMs: number): Promise<CompleteLessonResult> {
  // A fresh UUID per call is correct here: this key only needs to be STABLE
  // across retries of the *same* logical attempt, which authFetch already
  // guarantees (its 401-refresh-and-retry reuses the same options/body,
  // so the same key naturally carries over). Deriving the key from
  // timeSpentMs instead would be wrong — elapsed time keeps advancing even
  // between an original request and its retry, so a genuine retry could get
  // a different key and lose deduplication entirely.
  return authFetch<CompleteLessonResult>(`/lessons/${lessonId}/complete`, {
    method: 'POST',
    body: { timeSpentMs },
    idempotencyKey: crypto.randomUUID(),
  })
}

export function runCode(lessonId: string, code: string, stdin?: string): Promise<RunResult> {
  return authFetch<RunResult>(`/lessons/${lessonId}/run`, { method: 'POST', body: { code, stdin } })
}

export function checkCode(lessonId: string, code: string): Promise<CheckResult> {
  return authFetch<CheckResult>(`/lessons/${lessonId}/check`, { method: 'POST', body: { code } })
}
