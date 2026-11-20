import { authFetch } from './auth-fetch'

export interface PreviewItem { id: string; slug: string; title: string; url: string; createdAt: string; updatedAt: string; viewCount: number; lastViewedAt: string | null; sizeBytes: number }
export interface PreviewList { available: boolean; pro: boolean; limit: number; maxKb: number; items: PreviewItem[] }

export const listPreviews = () => authFetch<PreviewList>('/previews')
export const createPreview = (title: string, html: string) => authFetch<PreviewItem>('/previews', { method: 'POST', body: { title, html } })
export const updatePreview = (id: string, patch: { title?: string; html?: string }) => authFetch<PreviewItem>(`/previews/${id}`, { method: 'PUT', body: patch })
export const deletePreview = (id: string) => authFetch<{ deleted: true }>(`/previews/${id}`, { method: 'DELETE' })

/** Publishes `html` under `title`: replaces the learner's preview of the same name, or makes a new one. */
export async function publishPreview(title: string, html: string): Promise<PreviewItem> {
  const t = title.slice(0, 80)
  const existing = (await listPreviews()).items.find((p) => p.title === t)
  return existing ? updatePreview(existing.id, { html }) : createPreview(t, html)
}

export interface AdminPreviewRow extends PreviewItem { username: string; email: string }
export const adminPreviews = (limit = 50, offset = 0) => authFetch<{ enabled: boolean; total: number; rows: AdminPreviewRow[] }>(`/admin/previews?limit=${limit}&offset=${offset}`)
export const adminDeletePreview = (id: string) => authFetch<{ deleted: true }>(`/admin/previews/${id}`, { method: 'DELETE' })
