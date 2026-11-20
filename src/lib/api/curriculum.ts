import { apiFetch } from './client'

export interface CurriculumLesson {
  id: string
  title: string
  slug: string
  order: number
  estimatedMins: number
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  xpReward: number
  isPremium: boolean
  conceptTags: string[]
}

export interface CurriculumModule {
  id: string
  title: string
  slug: string
  order: number
  estimatedHours: number
  isPremium: boolean
  lessons: CurriculumLesson[]
}

/** A module of the learning path that learners cannot open yet. It is never part of `modules`, so counts and hours stay honest. */
export interface ComingSoonModule {
  slug: string
  title: string
  description: string
  stage: number
  estimatedHours: number
  isPremium: boolean
  outcomes: string[]
  /** Slug of the nearest earlier available module, or null when it comes before all of them. */
  afterModuleSlug: string | null
}

export interface CurriculumTrack {
  id: string
  slug: 'FE' | 'BE'
  name: string
  description: string
  accentColor: string
  /** Available modules, already in the order a learner follows them (the learning path first). */
  modules: CurriculumModule[]
  comingSoon?: ComingSoonModule[]
  path?: { slug: string; title: string; description: string } | null
}

/** Public endpoint — no auth required, uses apiFetch directly (not authFetch). */
export function getTrackCurriculum(track: 'FE' | 'BE'): Promise<CurriculumTrack> {
  return apiFetch<CurriculumTrack>(`/curriculum/tracks/${track}`)
}
