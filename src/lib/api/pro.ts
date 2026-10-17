import { authFetch, authFetchWithMeta } from './auth-fetch'
import { useAuthStore } from '@/stores/auth-store'

export interface ProStatus {
  tier: 'FREE' | 'PRO' | 'TEAM'
  permanent: boolean
  proUntil: string | null
  proSource: 'TRIAL' | 'CODE' | 'REWARD' | 'ADMIN' | null
  daysLeft: number
  trialDays: number
  history: { daysAdded: number; redeemedAt: string; kind: 'ADMIN' | 'REWARD' }[]
  rewards: { code: string; durationDays: number; expiresAt: string | null; createdAt: string }[]
}

export const getProStatus = () => authFetch<ProStatus>('/pro/status')

/** Redeems a code, then adopts the fresh access token (already PRO) and the new end date locally. */
export async function redeemProCode(code: string) {
  const r = await authFetch<{ daysAdded: number; tier: 'PRO' | 'TEAM'; proUntil: string | null; proSource: 'CODE' | 'REWARD' | null; accessToken: string }>(
    '/pro/redeem', { method: 'POST', body: { code } },
  )
  const { setTokens, updateUser } = useAuthStore.getState()
  setTokens({ accessToken: r.accessToken })
  updateUser({ tier: r.tier, proUntil: r.proUntil, proSource: r.proSource })
  return r
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export type CodeStatus = 'ACTIVE' | 'USED_UP' | 'EXPIRED' | 'REVOKED'
export interface AdminProCode {
  id: string; code: string; kind: 'ADMIN' | 'REWARD'; durationDays: number
  maxRedemptions: number; redemptionCount: number; status: CodeStatus
  expiresAt: string | null; note: string | null; assignedTo: string | null; createdAt: string
}
export interface CreateCodesInput { count: number; durationDays: number; maxRedemptions: number; validForDays?: number; note?: string }

export const adminProOverview = () => authFetch<{ activeCodes: number; totalRedemptions: number; onTrial: number; onCodePro: number }>('/pro/admin/overview')
export const adminCreateCodes = (body: CreateCodesInput) =>
  authFetch<{ batchId: string; codes: string[]; durationDays: number; maxRedemptions: number; expiresAt: string | null }>('/pro/admin/codes', { method: 'POST', body })
export const adminListCodes = (q: { page?: number; status?: CodeStatus; kind?: 'ADMIN' | 'REWARD'; search?: string }) => {
  const qs = new URLSearchParams()
  Object.entries(q).forEach(([k, v]) => v !== undefined && v !== '' && qs.set(k, String(v)))
  return authFetchWithMeta<AdminProCode[]>(`/pro/admin/codes?${qs}`)
}
export const adminRevokeCode = (id: string) => authFetch(`/pro/admin/codes/${id}/revoke`, { method: 'POST' })
export const adminIssueRewards = (period?: string) =>
  authFetch<{ period: string; issued: number; alreadyIssued: number; entries: { username: string; rank: number; xp: number; code: string | null; alreadyIssued: boolean }[] }>(
    '/pro/admin/rewards/issue', { method: 'POST', body: period ? { period } : {} })
export const adminRewardGrants = (period?: string) =>
  authFetch<{ period: string; grants: { rank: number; xp: number; username: string; displayName: string; code: string | null; redeemed: boolean }[] }>(
    `/pro/admin/rewards${period ? `?period=${period}` : ''}`)

export const adminGrantPro = (userId: string, days: number, note?: string) =>
  authFetch<{ userId: string; daysAdded: number; proUntil: string | null }>(`/pro/admin/users/${userId}/grant`, { method: 'POST', body: { days, note: note || undefined } })
export const adminRunReminders = () => authFetch<{ reminded: number }>('/pro/admin/reminders/run', { method: 'POST' })
