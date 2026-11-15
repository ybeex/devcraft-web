import { apiFetch, apiFetchWithMeta } from './client'
import { authFetch } from './auth-fetch'

export interface ProjectListItem {
  id: string
  slug: string | null
  outcomes: string[]
  module?: { slug: string; title: string; track: { slug: 'FE' | 'BE'; name: string } } | null
  title: string
  description: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  estimatedHours: number
  xpReward: number
  isPremium: boolean
  techStack: string[]
  requirements: string[]
  thumbnailUrl: string | null
  hasStarter: boolean
  createdAt: string
}

export interface ProjectStage {
  id: string
  title: string
  description: string
  starterCode: string | null
  testCode: string | null
  hints: string[]
  order: number
}

export interface ProjectDetail extends ProjectListItem {
  stages: ProjectStage[]
  module: { slug: string; title: string; track: { slug: 'FE' | 'BE'; name: string } } | null
  submissionCount: number
}

export interface PeerReviewSummary {
  id: string
  score: number
  feedback: string
  createdAt: string
  reviewer: { username: string; displayName: string; avatar: string | null }
}

export interface MySubmission {
  id: string
  repoUrl: string | null
  liveUrl: string | null
  notes: string | null
  status: 'PENDING' | 'APPROVED' | 'NEEDS_REVISION'
  aiReview: string | null
  aiScore: number | null
  reviewFeedback?: string | null
  reviewedAt?: string | null
  createdAt: string
  updatedAt: string
  project: {
    id: string
    title: string
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    techStack: string[]
    module: { track: { slug: 'FE' | 'BE'; name: string } } | null
  }
  peerReviews: PeerReviewSummary[]
}

export interface ProjectListParams {
  page?: number
  limit?: number
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  track?: 'FE' | 'BE'
}

export interface SubmitProjectBody {
  repoUrl?: string
  liveUrl?: string
  notes?: string
}

/** Public endpoint. */
export async function listProjects(params: ProjectListParams = {}): Promise<{ projects: ProjectListItem[]; total: number }> {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.difficulty) qs.set('difficulty', params.difficulty)
  if (params.track) qs.set('track', params.track)

  const { data, meta } = await apiFetchWithMeta<ProjectListItem[]>(`/projects?${qs.toString()}`)
  return { projects: data, total: meta?.total ?? data.length }
}

/** Public endpoint. */
export function getProject(id: string): Promise<ProjectDetail> {
  return apiFetch<ProjectDetail>(`/projects/${id}`)
}

export function submitProject(id: string, body: SubmitProjectBody): Promise<{ id: string; status: string }> {
  // A fresh UUID per call, not a key derived from `id` alone: the backend
  // legitimately allows re-submitting the same project to update repoUrl/
  // liveUrl/notes (see the real submitProject service — first submission
  // awards XP, re-submission just updates fields and resets status to
  // PENDING). A static per-project key would make the SECOND legitimate
  // submission return the cached FIRST response for up to 24h (the
  // backend's idempotency TTL), silently discarding the update.
  return authFetch(`/projects/${id}/submit`, { method: 'POST', body, idempotencyKey: crypto.randomUUID() })
}

export function getMySubmissions(): Promise<MySubmission[]> {
  return authFetch<MySubmission[]>('/projects/my/submissions')
}

export function submitPeerReview(submissionId: string, score: number, feedback: string): Promise<{ id: string }> {
  return authFetch(`/submissions/${submissionId}/review`, { method: 'POST', body: { score, feedback } })
}

export interface StartedProject {
  id: string
  slug: string | null
  title: string
  description: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  estimatedHours: number
  xpReward: number
  isPremium: boolean
  thumbnailUrl: string | null
  techStack: string[]
  hasStarter: boolean
  starterName: string | null
  starterSize: number | null
  startedAt: string
  module: { title: string; track: { slug: 'FE' | 'BE' } }
  submissionStatus: 'PENDING' | 'APPROVED' | 'NEEDS_REVISION' | null
}

export function startProject(id: string): Promise<{ projectId: string; startedAt: string; alreadyStarted: boolean; starter: { name: string; size: number | null } | null }> {
  return authFetch(`/projects/${id}/start`, { method: 'POST' })
}

export function getMyStarted(): Promise<StartedProject[]> {
  return authFetch<StartedProject[]>('/projects/my/started')
}

/** The starter is private: it is fetched with the learner's token and saved through a temporary link. */
export async function downloadStarter(id: string, fallbackName = 'starter.zip'): Promise<void> {
  const { useAuthStore } = await import('@/stores/auth-store')
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'
  const go = (t: string | null) => fetch(`${base}/projects/${id}/starter`, { headers: t ? { Authorization: `Bearer ${t}` } : {}, credentials: 'include' })
  let res = await go(useAuthStore.getState().accessToken)
  if (res.status === 401) {
    await getMyStarted().catch(() => undefined) // refreshes the access token through the shared retry logic
    res = await go(useAuthStore.getState().accessToken)
  }
  if (!res.ok) throw new Error(res.status === 403 ? 'Start the project first' : 'The starter could not be downloaded')
  const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? fallbackName
  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
