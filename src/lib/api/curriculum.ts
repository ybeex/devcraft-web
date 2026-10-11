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

export interface CurriculumTrack {
  id: string
  slug: 'FE' | 'BE'
  name: string
  description: string
  accentColor: string
  modules: CurriculumModule[]
}

/** Public endpoint — no auth required, uses apiFetch directly (not authFetch). */
export function getTrackCurriculum(track: 'FE' | 'BE'): Promise<CurriculumTrack> {
  return apiFetch<CurriculumTrack>(`/curriculum/tracks/${track}`)
}
