import { apiFetch, apiFetchWithMeta } from './client'
import { authFetch } from './auth-fetch'

export interface CommunityPost {
  id: string
  type: 'QUESTION' | 'SHOWCASE' | 'ARTICLE' | 'NOTE'
  title: string
  tags: string[]
  resolved: boolean
  upvotes: number
  viewCount: number
  isPinned: boolean
  commentCount: number
  createdAt: string
  updatedAt: string
  user: { username: string; displayName: string; avatar: string | null; tier: string; role: 'USER' | 'MODERATOR' | 'ADMIN' }
}

export interface CommunityListParams {
  page?: number
  limit?: number
  type?: CommunityPost['type']
  sort?: 'createdAt' | 'upvotes' | 'viewCount'
  /** Not a post type — staff-authored posts of any type. The Announcements tab, not a `type` filter. */
  announcements?: boolean
}

/** Public endpoint. */
export async function listCommunityPosts(
  params: CommunityListParams = {}
): Promise<{ posts: CommunityPost[]; total: number }> {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.type) qs.set('type', params.type)
  if (params.sort) qs.set('sort', params.sort)
  if (params.announcements) qs.set('announcements', 'true')

  const { data, meta } = await apiFetchWithMeta<CommunityPost[]>(`/community?${qs.toString()}`)
  return { posts: data, total: meta?.total ?? data.length }
}

export interface CommunityPostDetail extends CommunityPost {
  content: string
  codeSnippet: string | null
  language: string | null
  comments: CommunityComment[]
  reactions: { userId: string; emoji: string }[]
}

export interface CommunityComment {
  id: string
  content: string
  endorsed: boolean
  upvotes: number
  createdAt: string
  user: { username: string; displayName: string; avatar: string | null }
}

/** Public endpoint. */
export function getCommunityPost(id: string): Promise<CommunityPostDetail> {
  return apiFetch<CommunityPostDetail>(`/community/${id}`)
}

export function createCommunityPost(body: {
  type: 'QUESTION' | 'SHOWCASE' | 'ARTICLE' | 'NOTE'
  title: string
  content: string
  codeSnippet?: string
  language?: string
  tags?: string[]
}): Promise<{ id: string }> {
  return authFetch('/community', { method: 'POST', body, idempotencyKey: crypto.randomUUID() })
}

export function addComment(postId: string, content: string): Promise<{ id: string }> {
  return authFetch(`/community/${postId}/comments`, {
    method: 'POST',
    body: { content },
    idempotencyKey: crypto.randomUUID(),
  })
}

export function toggleReaction(
  postId: string,
  emoji: 'helpful' | 'inspiring' | 'learned'
): Promise<{ action: 'added' | 'removed' }> {
  return authFetch(`/community/${postId}/reactions`, {
    method: 'POST',
    body: { emoji },
    idempotencyKey: crypto.randomUUID(),
  })
}

export function resolveQuestion(postId: string, commentId: string): Promise<{ message: string }> {
  return authFetch(`/community/${postId}/resolve`, {
    method: 'POST',
    body: { commentId },
    idempotencyKey: crypto.randomUUID(),
  })
}

/**
 * Staff/mentor-only — distinct from resolveQuestion above. That's the
 * asker marking their own question resolved; this is staff recognizing a
 * good answer on any question, independent of the asker's own resolution.
 */
export function endorseComment(commentId: string): Promise<{ message: string }> {
  return authFetch(`/community/comments/${commentId}/endorse`, { method: 'PUT', idempotencyKey: crypto.randomUUID() })
}

export function unendorseComment(commentId: string): Promise<{ message: string }> {
  return authFetch(`/community/comments/${commentId}/endorse`, { method: 'DELETE', idempotencyKey: crypto.randomUUID() })
}
