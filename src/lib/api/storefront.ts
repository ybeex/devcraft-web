import { authFetch } from './auth-fetch'

export interface StorefrontKeyInfo {
  pro: boolean
  key: string | null
  base_path: string
  per_minute?: number
  free_per_minute?: number
  demo_account?: { email: string; password: string }
  declined_card?: string
}

export const getStorefrontKey = () => authFetch<StorefrontKeyInfo>('/storefront-key')
export const resetStorefront = () => authFetch<{ cleared: number }>('/storefront-key/reset', { method: 'POST' })
export const getBrowserTests = (lessonId: string) => authFetch<{ testCode: string }>(`/lessons/${lessonId}/browser-tests`)

/** Where the Storefront API lives, as an absolute URL (the learner's page runs on another origin). */
export function storefrontBase(): string {
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'
  const root = /^https?:\/\//.test(api) ? api : `${typeof window !== 'undefined' ? window.location.origin : ''}${api}`
  return `${root.replace(/\/$/, '')}/storefront`
}
