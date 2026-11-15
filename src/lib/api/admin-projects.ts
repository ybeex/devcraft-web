import { authFetch } from './auth-fetch'

export interface AdminProject {
  id: string; slug: string | null; title: string; description: string
  requirements: string[]; techStack: string[]; outcomes: string[]
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  estimatedHours: number; xpReward: number; isPremium: boolean; isPublished: boolean
  thumbnailUrl: string | null
  starterName: string | null; starterSize: number | null; hasStarter: boolean
  moduleId: string; moduleTitle: string; trackSlug: 'FE' | 'BE'
  startCount: number; createdAt: string; updatedAt: string
}

export type AdminProjectInput = Omit<AdminProject, 'id' | 'slug' | 'starterName' | 'starterSize' | 'hasStarter' | 'moduleTitle' | 'trackSlug' | 'startCount' | 'createdAt' | 'updatedAt'> & { slug?: string }

export const adminListProjects = () => authFetch<AdminProject[]>('/admin/projects')
export const adminGetProject = (id: string) => authFetch<AdminProject>(`/admin/projects/${id}`)
export const adminCreateProject = (body: AdminProjectInput) => authFetch<{ id: string }>('/admin/projects', { method: 'POST', body })
export const adminUpdateProject = (id: string, body: Partial<AdminProjectInput>) => authFetch<{ id: string }>(`/admin/projects/${id}`, { method: 'PATCH', body })
export const adminDeleteProject = (id: string) => authFetch<{ deleted: true }>(`/admin/projects/${id}`, { method: 'DELETE' })
export function adminUploadStarter(id: string, file: File) {
  if (!/\.zip$/i.test(file.name)) return Promise.reject(new Error('The starter must be a .zip file'))
  const fd = new FormData(); fd.append('file', file)
  return authFetch<{ name: string; size: number }>(`/admin/projects/${id}/starter`, { method: 'PUT', body: fd })
}
export const adminRemoveStarter = (id: string) => authFetch<{ removed: true }>(`/admin/projects/${id}/starter`, { method: 'DELETE' })
