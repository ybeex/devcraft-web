import { useVerifyPromptStore } from '@/stores/verify-prompt-store'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'

export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    statusCode: number
    details?: Record<string, unknown>
  }
}

export class ApiRequestError extends Error {
  code: string
  statusCode: number
  details?: Record<string, unknown>

  constructor(error: ApiError['error']) {
    super(error.message)
    this.name = 'ApiRequestError'
    this.code = error.code
    this.statusCode = error.statusCode
    this.details = error.details
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  token?: string
  idempotencyKey?: string
}

/**
 * Thin typed fetch wrapper matching the backend's { success, data } /
 * { success: false, error } envelope. Throws ApiRequestError on failure
 * so callers can use try/catch rather than checking `.success` everywhere.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const json = await rawApiFetch<T>(path, options)
  return json.data
}

/**
 * Like apiFetch, but also returns pagination `meta` when the backend
 * includes it — apiFetch alone discards it, which was fine until multiple
 * paginated list endpoints (projects, community, interview prep) each
 * needed `meta.total` and started duplicating raw fetch/parse/error-handling
 * logic to get at it. This is the one shared place that exposes it instead.
 */
export async function apiFetchWithMeta<T>(
  path: string,
  options: RequestOptions = {}
): Promise<{ data: T; meta?: ApiSuccess<T>['meta'] }> {
  const json = await rawApiFetch<T>(path, options)
  return { data: json.data, meta: json.meta }
}

/** The browser's IANA zone, so the server counts streak days on the learner's own calendar. */
function browserTimezone(): string | undefined {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined } catch { return undefined }
}

async function rawApiFetch<T>(path: string, options: RequestOptions = {}): Promise<ApiSuccess<T>> {
  const { body, token, idempotencyKey, headers, ...rest } = options

  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',   // the refresh token is an httpOnly cookie
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(idempotencyKey && { 'Idempotency-Key': idempotencyKey }),
      'X-Auth-Mode': 'cookie',
      ...(browserTimezone() && { 'X-Timezone': browserTimezone()! }),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const json = (await res.json()) as ApiSuccess<T> | ApiError

  if (!json.success) {
    // Any action the server refuses because the email is unverified opens the same prompt, wherever it
    // was attempted; the caller still gets the error and can keep its own state consistent.
    if (json.error.code === 'EMAIL_NOT_VERIFIED') useVerifyPromptStore.getState().show()
    throw new ApiRequestError(json.error)
  }

  return json
}
