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

/**
 * Backend messages can contain provider names, hostnames, stack traces, or
 * database details. They are useful in server logs, but never safe UI copy.
 */
export function userFacingApiMessage(statusCode: number, code?: string): string {
  if (code === 'EMAIL_NOT_VERIFIED') return 'Please verify your email address to continue.'
  if (code === 'SANDBOX_FREE_QUOTA') return 'You have used today\'s free practice runs. They come back at midnight UTC, and Pro removes the limit.'
  if (code === 'SANDBOX_FREE_FULL') return 'The free practice database is full right now. Please try again in a little while, or unlock Pro.'
  if (statusCode === 401) return 'Your session has expired. Please sign in again.'
  if (statusCode === 403) return 'You do not have permission to do that.'
  if (statusCode === 404) return 'We could not find what you requested.'
  if (statusCode === 409) return 'That information changed. Refresh the page and try again.'
  if (statusCode === 422 || statusCode === 400) return 'Please check your details and try again.'
  if (statusCode === 429) return 'Too many requests. Please wait a moment and try again.'
  if (statusCode === 402) return 'This feature is available with Pro.'
  if (statusCode >= 500 || statusCode === 0) return 'Our service is temporarily unavailable. Please try again shortly.'
  return 'We could not complete that request. Please try again.'
}

/** Safe copy for execution output when the runner exposes infrastructure failures. */
export function userFacingExecutionError(message: string, fallback = 'The code runner is temporarily unavailable. Please try again shortly.'): string {
  const databaseFailure = /\b(eai_again|enotfound|econnrefused|econnreset|etimedout|getaddrinfo|neon\.tech|postgres(?:ql)?|database url|connection (?:refused|failed|terminated))\b/i
  if (databaseFailure.test(message)) return 'The practice database is temporarily unavailable. Please try again shortly.'
  return /\b(internal server error|stack trace)\b/i.test(message) ? fallback : message
}

export class ApiRequestError extends Error {
  code: string
  statusCode: number
  details?: Record<string, unknown>

  constructor(error: ApiError['error']) {
    super(userFacingApiMessage(error.statusCode, error.code))
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

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      credentials: 'include',   // the refresh token is an httpOnly cookie
      ...rest,
      headers: {
        // A FormData body (file upload) sets its own multipart boundary; everything else is JSON.
        ...(!(body instanceof FormData) && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(idempotencyKey && { 'Idempotency-Key': idempotencyKey }),
        'X-Auth-Mode': 'cookie',
        ...(browserTimezone() && { 'X-Timezone': browserTimezone()! }),
        ...headers,
      },
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    })
  } catch {
    throw new ApiRequestError({ code: 'NETWORK_ERROR', message: '', statusCode: 0 })
  }

  let json: ApiSuccess<T> | ApiError
  try {
    json = (await res.json()) as ApiSuccess<T> | ApiError
  } catch {
    throw new ApiRequestError({ code: 'INVALID_RESPONSE', message: '', statusCode: res.status || 500 })
  }

  if (!json.success) {
    const error = 'error' in json && json.error
      ? json.error
      : { code: 'INVALID_RESPONSE', message: '', statusCode: res.status || 500 }
    // Any action the server refuses because the email is unverified opens the same prompt, wherever it
    // was attempted; the caller still gets the error and can keep its own state consistent.
    if (error.code === 'EMAIL_NOT_VERIFIED') useVerifyPromptStore.getState().show()
    throw new ApiRequestError(error)
  }

  return json
}
