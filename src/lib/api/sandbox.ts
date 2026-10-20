import { authFetch } from './auth-fetch'

export interface SandboxColumn { name: string; type: string; nullable: boolean; primaryKey: boolean; references?: string | null }
export interface SandboxTable { name: string; rows: number; columns: SandboxColumn[] }
export interface SandboxInfo {
  available: boolean
  tables: SandboxTable[]
  sizeBytes: number
  quotaBytes?: number
  resetCount?: number
  expiresAt?: string
}
export interface QueryResult { command: string; columns: string[]; rows: unknown[][]; rowCount: number; truncated: boolean; ms: number }

export const getSandbox = () => authFetch<SandboxInfo>('/sandbox')
export const runSandboxQuery = (sql: string) => authFetch<QueryResult>('/sandbox/query', { method: 'POST', body: { sql } })
export const resetSandbox = () => authFetch<{ resetCount: number }>('/sandbox/reset', { method: 'POST' })

/** Downloads the learner's practice database as a SQL script. */
export async function downloadSandboxExport(): Promise<void> {
  const { useAuthStore } = await import('@/stores/auth-store')
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'
  const res = await fetch(`${base}/sandbox/export`, { headers: { Authorization: `Bearer ${useAuthStore.getState().accessToken ?? ''}` }, credentials: 'include' })
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { error?: { message?: string } } | null
    throw new Error(body?.error?.message ?? 'Could not export your database. Try again.')
  }
  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement('a')
  a.href = url; a.download = 'devcraft-practice.sql'; a.click()
  URL.revokeObjectURL(url)
}

export interface AdminSandboxRow {
  userId: string; username: string; email: string; schemaName: string; sizeBytes: number
  createdAt: string; lastUsedAt: string; resetCount: number; queryCount: number; expiresAt: string; expiresInDays: number
}
export interface AdminSandboxOverview {
  enabled: boolean; idleDays: number; quotaBytes: number; totalSandboxes: number; totalBytes: number; expiringSoon: number; rows: AdminSandboxRow[]
}
export const adminSandboxes = (limit = 50, offset = 0) => authFetch<AdminSandboxOverview>(`/admin/sandboxes?limit=${limit}&offset=${offset}`)
export const adminSweepSandboxes = () => authFetch<{ expired: number; orphans: number }>('/admin/sandboxes/sweep', { method: 'POST' })
