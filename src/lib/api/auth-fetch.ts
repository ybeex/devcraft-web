import { apiFetch, apiFetchWithMeta, ApiRequestError, type ApiSuccess } from './client'
import { useAuthStore } from '@/stores/auth-store'

interface AuthFetchOptions extends Omit<Parameters<typeof apiFetch>[1], 'token'> {}
type FetchOptionsWithToken = Parameters<typeof apiFetch>[1]

let refreshInFlight: Promise<void> | null = null

/**
 * Shared 401-refresh-and-retry logic behind both authFetch and
 * authFetchWithMeta — the only difference between the two is which raw
 * fetcher (apiFetch vs apiFetchWithMeta) they delegate to, so the retry/dedup
 * logic lives here once rather than being copy-pasted per variant.
 *
 * De-dupes concurrent refreshes: if five requests all 401 at the same
 * moment (access token just expired), only one POST /auth/refresh fires —
 * the other four await the same in-flight promise.
 */
async function authFetchInternal<R>(
  path: string,
  options: AuthFetchOptions,
  fetcher: (path: string, options: FetchOptionsWithToken) => Promise<R>,
): Promise<R> {
  const { accessToken } = useAuthStore.getState()

  try {
    return await fetcher(path, { ...options, token: accessToken ?? undefined })
  } catch (err) {
    if (!(err instanceof ApiRequestError) || err.statusCode !== 401) throw err

    const { user, logout, setTokens } = useAuthStore.getState()
    if (!user) {
      // Not signed in at all: nothing to refresh.
      throw err
    }

    try {
      if (!refreshInFlight) {
        refreshInFlight = (async () => {
          // The refresh token travels in the httpOnly cookie; the server rotates it and answers with a new access token.
          const result = await apiFetch<{ accessToken: string; expiresIn: number }>('/auth/refresh', { method: 'POST', body: {} })
          setTokens({ accessToken: result.accessToken })
        })().finally(() => {
          refreshInFlight = null
        })
      }
      await refreshInFlight
    } catch (refreshErr) {
      // Only a definitive "this session is over" answer from the server ends the session. A network blip or
      // a 5xx during refresh must not log someone out of a week-long session; they just retry next request.
      const definitive = refreshErr instanceof ApiRequestError && (refreshErr.statusCode === 401 || refreshErr.statusCode === 403)
      if (definitive) logout()
      throw err
    }

    // Retry once with the freshly-rotated token. If this also fails, let it throw.
    const { accessToken: newAccessToken } = useAuthStore.getState()
    return fetcher(path, { ...options, token: newAccessToken ?? undefined })
  }
}

/**
 * Calls apiFetch with the current access token attached, and transparently
 * refreshes-and-retries exactly once on a 401 before giving up. This is the
 * one place that knows about the store's tokens — every authenticated call
 * elsewhere in the app should go through this or authFetchWithMeta, not
 * apiFetch directly.
 */
export function authFetch<T>(path: string, options: AuthFetchOptions = {}): Promise<T> {
  return authFetchInternal<T>(path, options, (p, o) => apiFetch<T>(p, o))
}

/**
 * Like authFetch, but for authenticated endpoints that also return
 * pagination meta (e.g. GET /playground/snippets — "my snippets" is
 * auth-scoped *and* paginated, so neither authFetch nor apiFetchWithMeta
 * alone covers it).
 */
export function authFetchWithMeta<T>(
  path: string,
  options: AuthFetchOptions = {}
): Promise<{ data: T; meta?: ApiSuccess<T>['meta'] }> {
  return authFetchInternal(path, options, (p, o) => apiFetchWithMeta<T>(p, o))
}
