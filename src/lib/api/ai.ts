import { authFetch } from './auth-fetch'

export interface AiCredits {
  used: number
  limit: number
  tier: string
  unlimited: boolean
}

export function getAiCredits(): Promise<AiCredits> {
  return authFetch<AiCredits>('/ai/credits')
}

/** Socratic hint — never gives the answer directly. Costs 1 AI credit. */
export function getHint(lessonId: string, userCode: string, question: string): Promise<{ hint: string }> {
  return authFetch('/ai/hint', { method: 'POST', body: { lessonId, userCode, question } })
}

/**
 * Plain-language error explanation. Costs 1 AI credit.
 * lessonId is required now (previously omitted) so the exchange can be
 * persisted into the same per-lesson history as hint/review.
 */
export function explainError(
  lessonId: string,
  errorMessage: string,
  userCode: string,
  language: string
): Promise<{ explanation: string }> {
  return authFetch('/ai/explain', { method: 'POST', body: { lessonId, errorMessage, userCode, language } })
}

/** Structured code review (correctness / quality / best practices). Costs 1 AI credit. */
export function reviewCode(lessonId: string, userCode: string): Promise<{ review: string }> {
  return authFetch('/ai/review', { method: 'POST', body: { lessonId, userCode } })
}

export interface AiHistoryMessage {
  role: 'user' | 'assistant'
  content: string
  promptType: string | null
  createdAt: string
}

/**
 * True server-side conversation history for the AI Tutor pane, scoped to
 * one user + one lesson. Previously the pane only kept a client-side
 * transcript that reset on every page refresh.
 */
export function getAiHistory(lessonId: string): Promise<AiHistoryMessage[]> {
  return authFetch<AiHistoryMessage[]>(`/ai/history/${lessonId}`)
}
