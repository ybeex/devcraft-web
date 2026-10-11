import { authFetch } from './auth-fetch'

export type SelfReport = 'new' | 'some' | 'test'

export interface PlacementQuestion {
  id: string
  prompt: string
  options: string[]
  /** 1-based position in this check. */
  number: number
  /** The check is about this long; it can run one longer. */
  ofAbout: number
}

export interface PlacementResult {
  track: 'FE' | 'BE'
  selfReport: SelfReport
  level: 'beginner' | 'intermediate' | 'advanced'
  startModuleSlug: string | null
  startModule: { slug: string; title: string } | null
  tested: number
  correct: number
  passedModules: string[]
  completedAll: boolean
  takenAt: string
  moduleCount: number
}

export type PlacementStep =
  | { done: false; sessionId?: string; question: PlacementQuestion }
  | { done: true; result: PlacementResult }

export const PLACEMENT_STALE = 'PLACEMENT_STALE'

export function startPlacement(track: 'FE' | 'BE', selfReport: SelfReport): Promise<PlacementStep> {
  return authFetch<PlacementStep>('/placement/start', { method: 'POST', body: { track, selfReport } })
}

/** choice = the option position on screen, or null for "Not sure". The server holds the answers. */
export function answerPlacement(sessionId: string, questionId: string, choice: number | null): Promise<PlacementStep> {
  return authFetch<PlacementStep>('/placement/answer', { method: 'POST', body: { sessionId, questionId, choice } })
}
