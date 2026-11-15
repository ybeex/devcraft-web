import { authFetch } from './auth-fetch'
import { userFacingExecutionError } from './client'

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
  module?: { id: string; slug: string; title: string }
  /** Rebuilt-curriculum fields. Original lessons leave them empty and curriculumVersion at 1. */
  curriculumVersion?: number
  stage?: number
  kind?: string
  objectives?: string[]
  hints?: string[]
  realWorld?: string | null
  errorHelp?: ErrorHelp[]
  knowledgeCheck?: KnowledgeCheckItem[]
  rubric?: { prompt: string; criteria: { criterion: string; evidence: string }[] } | null
  competencies?: string[]
  prerequisites?: Prerequisite[]
  next?: { slug: string; title: string; kind: string } | null
  // solutionCode and testCode are deliberately never sent by the backend
  // (see AUDIT_REPORT.md's data-exposure fix) — do not add them here even
  // if they appear to be present in a raw response.
  progress: {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
    xpEarned: number
    attempts: number
  }
}

/** When a run or check fails with a message matching `match` (a regular expression), the learner sees this explanation. */
export interface ErrorHelp { match: string; title: string; text: string }
export interface KnowledgeCheckItem { question: string; options: string[]; answer: number; explanation: string }
export interface Prerequisite { slug: string; title: string; required: boolean; completed: boolean }
/** The free plan's practice-database allowance for today. Pro has none. */
export interface FreeQuota { used: number; limit: number; remaining: number; resetsAt: string }

export interface RunResult {
  stdout: string
  stderr: string
  exitCode: number | null
  status: string
  timedOut: boolean
  /** Database lessons: the rows the learner's statement returned. */
  table?: { command: string; columns: string[]; rows: unknown[][]; rowCount: number; truncated: boolean }
  quota?: FreeQuota | null
}

export interface CheckResult {
  passed: number
  failed: number
  total: number
  allPassed: boolean
  results: { name: string; passed: boolean; reason?: string }[]
  quota?: FreeQuota | null
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

export async function runCode(lessonId: string, code: string, stdin?: string): Promise<RunResult> {
  const result = await authFetch<RunResult>(`/lessons/${lessonId}/run`, { method: 'POST', body: { code, stdin } })
  return { ...result, stdout: userFacingExecutionError(result.stdout), stderr: userFacingExecutionError(result.stderr) }
}

export function checkCode(lessonId: string, code: string): Promise<CheckResult> {
  return authFetch<CheckResult>(`/lessons/${lessonId}/check`, { method: 'POST', body: { code } })
}

export interface LessonFixtureSession { token: string; expiresAt: string; basePath: string; routes: Array<{ method: string; path: string }> }

export function getLessonFixtureSession(lessonId: string): Promise<LessonFixtureSession> {
  return authFetch<LessonFixtureSession>(`/lessons/${lessonId}/fixture-session`, { method: 'POST' })
}

export type FreeQuotaStatus = { plan: 'pro'; unlimited: true } | ({ plan: 'free'; unlimited: false } & FreeQuota)
export function getFreeQuota(): Promise<FreeQuotaStatus> {
  return authFetch<FreeQuotaStatus>('/sandbox/free-quota')
}
