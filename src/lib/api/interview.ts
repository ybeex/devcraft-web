import { apiFetch, apiFetchWithMeta } from './client'
import { authFetch } from './auth-fetch'

export interface InterviewQuestion {
  id: string
  track: 'FE' | 'BE'
  title: string
  answer: string
  codeExample: string | null
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  topic: string
}

export type ReviewStatus = 'REVIEWED' | 'NEEDS_PRACTICE'

export interface InterviewListParams {
  page?: number
  limit?: number
  track?: 'FE' | 'BE'
  difficulty?: string
  topic?: string
  /** 'random' re-shuffles on every request — not meant for stable pagination, meant for "surprise me." */
  sort?: 'default' | 'random'
}

/** Public endpoint. */
export async function listInterviewQuestions(
  params: InterviewListParams = {}
): Promise<{ questions: InterviewQuestion[]; total: number }> {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.track) qs.set('track', params.track)
  if (params.difficulty) qs.set('difficulty', params.difficulty)
  if (params.topic) qs.set('topic', params.topic)
  if (params.sort) qs.set('sort', params.sort)

  const { data, meta } = await apiFetchWithMeta<InterviewQuestion[]>(`/interview?${qs.toString()}`)
  return { questions: data, total: meta?.total ?? data.length }
}

/** Public endpoint. */
export function getInterviewQuestion(id: string): Promise<InterviewQuestion> {
  return apiFetch<InterviewQuestion>(`/interview/${id}`)
}

/** Auth required, Pro-gated — throws ApiRequestError with statusCode 402 on the FREE tier. */
export function runMockInterview(body: {
  questionId: string
  questionTitle: string
  userAnswer: string
  track: 'FE' | 'BE'
  difficulty: string
}): Promise<{ feedback: string }> {
  return authFetch('/interview/mock', { method: 'POST', body, idempotencyKey: crypto.randomUUID() })
}

/** Auth required — every question the current user has marked reviewed or needs-practice. No entry means unreviewed. */
export function getMyInterviewProgress(): Promise<Array<{ questionId: string; status: ReviewStatus }>> {
  return authFetch('/interview/progress')
}

export function setQuestionStatus(id: string, status: ReviewStatus): Promise<{ message: string }> {
  return authFetch(`/interview/${id}/status`, { method: 'PUT', body: { status }, idempotencyKey: crypto.randomUUID() })
}

/** Clears a question back to unreviewed. */
export function clearQuestionStatus(id: string): Promise<{ message: string }> {
  return authFetch(`/interview/${id}/status`, { method: 'DELETE', idempotencyKey: crypto.randomUUID() })
}
