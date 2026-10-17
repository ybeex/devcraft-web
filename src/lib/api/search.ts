import { apiFetch } from './client'

export interface SearchResultLesson {
  id: string
  title: string
  slug: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  track: 'FE' | 'BE'
}

export interface SearchResultPost {
  id: string
  title: string
  type: 'QUESTION' | 'SHOWCASE' | 'ARTICLE' | 'NOTE'
  upvotes: number
}

export interface SearchResultQuestion {
  id: string
  title: string
  track: 'FE' | 'BE'
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
}

export interface SearchResults {
  lessons: SearchResultLesson[]
  posts: SearchResultPost[]
  questions: SearchResultQuestion[]
  total: number
}

/** Public endpoint — GET /search?q=&type=. Min query length is 2 (enforced server-side). */
export function globalSearch(query: string, type: 'all' | 'lessons' | 'posts' | 'questions' = 'all'): Promise<SearchResults> {
  return apiFetch<SearchResults>(`/search?q=${encodeURIComponent(query)}&type=${type}`)
}
