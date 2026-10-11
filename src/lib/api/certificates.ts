import { apiFetch } from './client'
import { authFetch } from './auth-fetch'

export interface Certificate {
  id: string
  userId: string
  track: 'FE' | 'BE'
  verifyUrl: string
  metadata: {
    modulesCompleted?: number
    lessonsCompleted?: number
    issuedBy?: string
    [key: string]: unknown
  }
  issuedAt: string
}

export interface CertificateWithHolder extends Certificate {
  user: { username: string; displayName: string; avatar: string | null }
}

/**
 * Public endpoint — no auth. The backend's own verifyUrl field points at
 * `/cert/:id` (the frontend route this powers), but the API route itself
 * is `/certificates/:id` — verifyUrl is a page path, not the API path.
 */
export function getCertificateById(id: string): Promise<CertificateWithHolder> {
  return apiFetch<CertificateWithHolder>(`/certificates/${id}`)
}

/** Auth required — the current user's own earned certificates. */
export function listMyCertificates(): Promise<Certificate[]> {
  return authFetch<Certificate[]>('/certificates/me')
}
