import { authFetch } from './auth-fetch'

export interface Suggestion {
  id: string
  slug: string
  title: string
  estimatedMins: number
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  xpReward: number
  isPremium: boolean
  moduleId: string
  moduleSlug: string
  moduleTitle: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  /** Why this lesson is here, in the learner's terms ("Core for job interviews"). */
  reason: string
}

export interface Suggestions {
  track: 'FE' | 'BE' | null
  items: Suggestion[]
  /** A free learner's next lessons are all Pro: the module they would continue in. */
  lockedFrom: { moduleSlug: string; moduleTitle: string } | null
  basis: { goals: string[]; placementStartSlug: string | null }
}

export function getSuggestions(limit = 4): Promise<Suggestions> {
  return authFetch<Suggestions>(`/suggestions?limit=${limit}`)
}
