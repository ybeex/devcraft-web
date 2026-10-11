import { apiFetch, apiFetchWithMeta } from './client'
import { authFetch } from './auth-fetch'

export type SDDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type SDStatus = 'REVIEWED' | 'NEEDS_PRACTICE'

export interface ChallengeSummary {
  id: string
  track: 'FE' | 'BE'
  slug: string
  title: string
  difficulty: SDDifficulty
  estimatedMins: number
  isPremium: boolean
}

export interface ChallengeStage {
  id: string
  order: number
  title: string
  guidingQuestions: string[]
  modelAnswer: string
  diagramImageUrl: string | null
}

export interface ChallengeDetail extends ChallengeSummary {
  scenario: string
  stages: ChallengeStage[]
}

export interface ListChallengesParams {
  page?: number
  limit?: number
  track?: 'FE' | 'BE'
  difficulty?: SDDifficulty
}

/** Public endpoint. */
export async function listChallenges(
  params: ListChallengesParams = {}
): Promise<{ challenges: ChallengeSummary[]; total: number }> {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.track) qs.set('track', params.track)
  if (params.difficulty) qs.set('difficulty', params.difficulty)

  const { data, meta } = await apiFetchWithMeta<ChallengeSummary[]>(`/system-design?${qs.toString()}`)
  return { challenges: data, total: meta?.total ?? data.length }
}

/** Public endpoint — by slug, not id (unlike interview questions), since a challenge is closer to a mini-lesson than a quick Q&A card. */
export function getChallenge(slug: string): Promise<ChallengeDetail> {
  return apiFetch<ChallengeDetail>(`/system-design/${slug}`)
}

/** Auth required — every challenge the current user has marked reviewed or needs-practice. No entry means unreviewed. Keyed by challenge id, same as the status endpoints below. */
export function getMyChallengeProgress(): Promise<Array<{ challengeId: string; status: SDStatus }>> {
  return authFetch('/system-design/progress')
}

export function setChallengeStatus(id: string, status: SDStatus): Promise<{ message: string }> {
  return authFetch(`/system-design/${id}/status`, { method: 'PUT', body: { status }, idempotencyKey: crypto.randomUUID() })
}

/** Clears a challenge back to unreviewed. */
export function clearChallengeStatus(id: string): Promise<{ message: string }> {
  return authFetch(`/system-design/${id}/status`, { method: 'DELETE', idempotencyKey: crypto.randomUUID() })
}
