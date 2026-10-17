import { authFetch, authFetchWithMeta } from './auth-fetch'
import { ApiRequestError } from './client'

/**
 * Full pagination envelope, unlike community.ts/interview.ts which discard
 * everything but `total` (their pages use infinite-scroll and only need to
 * know "is there more?"). The admin browsers here use page-number pagination
 * instead, so `totalPages`/`hasNext`/`hasPrev` are load-bearing, not extra.
 */
export interface PageMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ─── Analytics ────────────────────────────────────────────────────────────────
// All four ADMIN-only, mounted at /admin/analytics/*. Response shapes read
// directly from analytics.service.ts rather than assumed — routes type their
// `data` as z.unknown() so the zod schema gives no shape guarantee.

export interface FunnelStage {
  stage: string
  count: number
  percentOfPrevious: number | null
}

export interface LearnerFunnel {
  stages: FunnelStage[]
  period: { days: number; since: string }
}

export function getLearnerFunnel(days = 30): Promise<LearnerFunnel> {
  return authFetch(`/admin/analytics/funnel?days=${days}`)
}

export interface TrackEngagement {
  trackSlug: string
  trackName: string
  activeLearners: number
  avgCompletionPercent: number
  highestDropoffLesson: { title: string; slug: string; dropoffRatio: number } | null
}

/** Returned as a bare array, not wrapped in {data: [...]} at the service level — route still wraps as {success, data}. */
export function getTrackEngagement(days = 30): Promise<TrackEngagement[]> {
  return authFetch(`/admin/analytics/tracks?days=${days}`)
}

export interface AiUsageTrends {
  dailyByType: { date: string; promptType: string; calls: number }[]
  byTier: { tier: string; calls: number }[]
  period: { days: number }
}

export function getAiUsageTrends(days = 30): Promise<AiUsageTrends> {
  return authFetch(`/admin/analytics/ai-usage?days=${days}`)
}

export interface ContentHealthIssue {
  contentType: 'MODULE' | 'LESSON' | 'INTERVIEW_QUESTION'
  id: string
  title: string
  issue: string
}

export async function getContentHealth(
  page = 1,
  limit = 20
): Promise<{ issues: ContentHealthIssue[]; meta: PageMeta }> {
  const { data, meta } = await authFetchWithMeta<ContentHealthIssue[]>(
    `/admin/analytics/content-health?page=${page}&limit=${limit}`
  )
  return { issues: data, meta: meta as PageMeta }
}

// ─── Audit log ────────────────────────────────────────────────────────────────
// Read-only browsing surface, mounted at /admin/audit-log/*. Deliberately a
// different path than the pre-existing GET /admin/audit list — see that
// route's own comment in audit-log-view.routes.ts.

export interface AuditLogEntry {
  id: string
  adminId: string
  action: string
  targetType: string
  targetId: string
  payload: Record<string, unknown> | null
  ip: string | null
  createdAt: string
  admin: { username: string; displayName: string; avatar: string | null }
}

/** Only extra field over the list row is the admin's email — findFirst's `with` includes it, findMany's doesn't. */
export interface AuditLogDetail extends Omit<AuditLogEntry, 'admin'> {
  admin: { username: string; displayName: string; avatar: string | null; email: string }
}

export interface AuditLogListParams {
  page?: number
  limit?: number
  adminId?: string
  action?: string
  targetType?: string
  /** ISO date string. Backend coerces with z.coerce.date(). */
  from?: string
  to?: string
  /** Free-text, matched against `action` via ILIKE on the backend. */
  search?: string
}

export async function listAuditLogs(
  params: AuditLogListParams = {}
): Promise<{ logs: AuditLogEntry[]; meta: PageMeta }> {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.adminId) qs.set('adminId', params.adminId)
  if (params.action) qs.set('action', params.action)
  if (params.targetType) qs.set('targetType', params.targetType)
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)
  if (params.search) qs.set('search', params.search)

  const { data, meta } = await authFetchWithMeta<AuditLogEntry[]>(`/admin/audit-log?${qs.toString()}`)
  return { logs: data, meta: meta as PageMeta }
}

export function getAuditLogDetail(id: string): Promise<AuditLogDetail> {
  return authFetch(`/admin/audit-log/${id}`)
}

/** Distinct action values seen in the log — powers the action filter dropdown. */
export function listAuditActions(): Promise<string[]> {
  return authFetch('/admin/audit-log/meta/actions')
}

export interface AdminActivitySummary {
  admins: {
    adminId: string
    username: string
    displayName: string
    totalActions: number
    actions: { action: string; count: number }[]
  }[]
  period: { days: number; since: string }
}

export function getAdminActivitySummary(days = 30): Promise<AdminActivitySummary> {
  return authFetch(`/admin/audit-log/meta/activity-summary?days=${days}`)
}

// ─── Conflicts ────────────────────────────────────────────────────────────────
// Mounted at /admin/conflicts/*. listConflicts/getPendingConflictCount/
// getConflictDetail/resolveConflict are all wired here now per the roadmap's
// "API client to start" instruction — the resolution UI itself (step 4,
// /admin/conflicts) is a separate checkpoint; the nav badge is the one piece
// of this surfaced in the shell already, via getPendingConflictCount.

export type ConflictStatus = 'PENDING' | 'RESOLVED_KEPT_MINE' | 'RESOLVED_KEPT_THEIRS' | 'RESOLVED_MERGED'
export type ConflictContentType = 'TRACK' | 'MODULE' | 'LESSON' | 'INTERVIEW_QUESTION'

export interface ContentConflict {
  id: string
  contentType: ConflictContentType
  contentId: string
  adminId: string
  baseUpdatedAt: string
  attemptedChanges: Record<string, unknown>
  currentSnapshot: Record<string, unknown>
  status: ConflictStatus
  resolvedBy: string | null
  resolvedAt: string | null
  mergedData: Record<string, unknown> | null
  createdAt: string
  admin: { username: string; displayName: string; avatar: string | null }
}

export interface ConflictDetail extends ContentConflict {
  resolver: { username: string; displayName: string; avatar: string | null } | null
}

export async function listConflicts(
  page = 1,
  limit = 20,
  status?: ConflictStatus
): Promise<{ conflicts: ContentConflict[]; meta: PageMeta }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) qs.set('status', status)

  const { data, meta } = await authFetchWithMeta<ContentConflict[]>(`/admin/conflicts?${qs.toString()}`)
  return { conflicts: data, meta: meta as PageMeta }
}

/** Powers the Conflicts nav badge — cheap enough to poll from the admin layout. */
export function getPendingConflictCount(): Promise<{ count: number }> {
  return authFetch('/admin/conflicts/pending-count')
}

export function getConflictDetail(id: string): Promise<ConflictDetail> {
  return authFetch(`/admin/conflicts/${id}`)
}

export type ResolveConflictBody =
  | { resolution: 'RESOLVED_KEPT_MINE' }
  | { resolution: 'RESOLVED_KEPT_THEIRS' }
  | { resolution: 'RESOLVED_MERGED'; mergedData: Record<string, unknown> }

export function resolveConflict(id: string, body: ResolveConflictBody): Promise<ContentConflict> {
  return authFetch(`/admin/conflicts/${id}/resolve`, {
    method: 'POST',
    body,
    idempotencyKey: crypto.randomUUID(),
  })
}

// ─── Content: tracks, modules, lessons, interview questions ──────────────────
// Reads (get/list) call the standalone admin-content-read.routes.ts module
// added this checkpoint to fill a gap: admin.routes.ts had create/update
// (/delete) for all of these but no way to read one back for an edit form,
// and no list at all for lessons or questions. Writes call the pre-existing
// admin.routes.ts endpoints unchanged.

export type ContentDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

export interface AdminModuleSummary {
  id: string
  title: string
  slug: string
  order: number
  isPublished: boolean
  isPremium: boolean
}

export interface AdminTrack {
  id: string
  slug: 'FE' | 'BE'
  name: string
  description: string
  accentColor: string
  iconUrl: string | null
  order: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
  modules: AdminModuleSummary[]
}

/** Includes a trimmed nested module list per track — enough to drive the content browser without a separate modules-list call. */
export function listAdminTracks(): Promise<AdminTrack[]> {
  return authFetch('/admin/tracks')
}

export interface CreateTrackInput {
  slug: 'FE' | 'BE'
  name: string
  description: string
  accentColor?: string
  order?: number
  isPublished?: boolean
}

export function createAdminTrack(body: CreateTrackInput): Promise<AdminTrack> {
  return authFetch('/admin/tracks', { method: 'POST', body, idempotencyKey: crypto.randomUUID() })
}

export interface UpdateTrackInput {
  name?: string
  description?: string
  accentColor?: string
  order?: number
  isPublished?: boolean
  /** The updatedAt this edit was loaded against — verbatim from the last read, unchanged, so the backend's 1ms-tolerance comparison round-trips cleanly. */
  expectedUpdatedAt: string
}

export function updateAdminTrack(id: string, body: UpdateTrackInput): Promise<AdminTrack> {
  return authFetch(`/admin/tracks/${id}`, { method: 'PATCH', body, idempotencyKey: crypto.randomUUID() })
}

export interface AdminModule {
  id: string
  trackId: string
  slug: string
  title: string
  description: string
  objectives: string[]
  order: number
  estimatedHours: number
  isPublished: boolean
  isPremium: boolean
  createdAt: string
  updatedAt: string
}

export function getAdminModule(id: string): Promise<AdminModule> {
  return authFetch(`/admin/modules/${id}`)
}

export interface CreateModuleInput {
  trackId: string
  slug: string
  title: string
  description: string
  objectives?: string[]
  order: number
  estimatedHours?: number
  isPublished?: boolean
  isPremium?: boolean
}

export function createAdminModule(body: CreateModuleInput): Promise<AdminModule> {
  return authFetch('/admin/modules', { method: 'POST', body, idempotencyKey: crypto.randomUUID() })
}

export interface UpdateModuleInput {
  title?: string
  description?: string
  objectives?: string[]
  order?: number
  estimatedHours?: number
  isPublished?: boolean
  isPremium?: boolean
  expectedUpdatedAt: string
}

export function updateAdminModule(id: string, body: UpdateModuleInput): Promise<AdminModule> {
  return authFetch(`/admin/modules/${id}`, { method: 'PATCH', body, idempotencyKey: crypto.randomUUID() })
}

export interface AdminLessonSummary {
  id: string
  title: string
  slug: string
  order: number
  isPublished: boolean
  isPremium: boolean
  difficulty: ContentDifficulty
  xpReward: number
  estimatedMins: number
  updatedAt: string
}

/** Light columns only — no content/code, matching the read module's list endpoint. */
export function listAdminLessons(moduleId: string): Promise<AdminLessonSummary[]> {
  return authFetch(`/admin/lessons?moduleId=${moduleId}`)
}

export interface AdminLesson {
  id: string
  moduleId: string
  slug: string
  title: string
  content: string
  starterCode: string | null
  solutionCode: string | null
  testCode: string | null
  language: string
  xpReward: number
  estimatedMins: number
  order: number
  difficulty: ContentDifficulty
  isPublished: boolean
  isPremium: boolean
  conceptTags: string[]
  createdAt: string
  updatedAt: string
}

export function getAdminLesson(id: string): Promise<AdminLesson> {
  return authFetch(`/admin/lessons/${id}`)
}

export interface CreateLessonInput {
  moduleId: string
  slug: string
  title: string
  content: string
  starterCode?: string
  solutionCode?: string
  testCode?: string
  language?: string
  xpReward?: number
  estimatedMins?: number
  order: number
  difficulty?: ContentDifficulty
  isPublished?: boolean
  isPremium?: boolean
  conceptTags?: string[]
}

export function createAdminLesson(body: CreateLessonInput): Promise<AdminLesson> {
  return authFetch('/admin/lessons', { method: 'POST', body, idempotencyKey: crypto.randomUUID() })
}

export interface UpdateLessonInput {
  title?: string
  content?: string
  starterCode?: string
  solutionCode?: string
  testCode?: string
  language?: string
  xpReward?: number
  estimatedMins?: number
  order?: number
  difficulty?: ContentDifficulty
  isPublished?: boolean
  isPremium?: boolean
  conceptTags?: string[]
  expectedUpdatedAt: string
}

export function updateAdminLesson(id: string, body: UpdateLessonInput): Promise<AdminLesson> {
  return authFetch(`/admin/lessons/${id}`, { method: 'PATCH', body, idempotencyKey: crypto.randomUUID() })
}

export function deleteAdminLesson(id: string): Promise<{ message: string }> {
  return authFetch(`/admin/lessons/${id}`, { method: 'DELETE' })
}

export interface AdminQuestionSummary {
  id: string
  title: string
  track: 'FE' | 'BE'
  difficulty: ContentDifficulty
  topic: string
  order: number
  isPublished: boolean
  updatedAt: string
}

export interface ListQuestionsParams {
  track?: 'FE' | 'BE'
  page?: number
  limit?: number
}

/** Light columns only — no answer/codeExample, matching the read module's list endpoint. */
export async function listAdminQuestions(
  params: ListQuestionsParams = {}
): Promise<{ questions: AdminQuestionSummary[]; meta: PageMeta }> {
  const qs = new URLSearchParams()
  if (params.track) qs.set('track', params.track)
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))

  const { data, meta } = await authFetchWithMeta<AdminQuestionSummary[]>(`/admin/interview-questions?${qs.toString()}`)
  return { questions: data, meta: meta as PageMeta }
}

export interface AdminQuestion {
  id: string
  track: 'FE' | 'BE'
  title: string
  answer: string
  codeExample: string | null
  difficulty: ContentDifficulty
  topic: string
  order: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export function getAdminQuestion(id: string): Promise<AdminQuestion> {
  return authFetch(`/admin/interview-questions/${id}`)
}

export interface CreateQuestionInput {
  track: 'FE' | 'BE'
  title: string
  answer: string
  codeExample?: string
  difficulty: ContentDifficulty
  topic: string
  order?: number
  isPublished?: boolean
}

export function createAdminQuestion(body: CreateQuestionInput): Promise<AdminQuestion> {
  return authFetch('/admin/interview-questions', { method: 'POST', body, idempotencyKey: crypto.randomUUID() })
}

export interface UpdateQuestionInput {
  track?: 'FE' | 'BE'
  title?: string
  answer?: string
  codeExample?: string
  difficulty?: ContentDifficulty
  topic?: string
  order?: number
  isPublished?: boolean
  expectedUpdatedAt: string
}

export function updateAdminQuestion(id: string, body: UpdateQuestionInput): Promise<AdminQuestion> {
  return authFetch(`/admin/interview-questions/${id}`, { method: 'PATCH', body, idempotencyKey: crypto.randomUUID() })
}

export function deleteAdminQuestion(id: string): Promise<{ message: string }> {
  return authFetch(`/admin/interview-questions/${id}`, { method: 'DELETE' })
}

/**
 * Every content PATCH can 409 with code CONTENT_CONFLICT when someone else's
 * write landed first — checkOptimisticLock (backend) records a conflict row
 * and throws with the new conflict's id in `details`, specifically so the
 * caller can route the admin straight to reviewing it. Returns null for any
 * other error (including non-conflict errors), so callers can do
 * `const conflictId = getConflictIdFromError(err); if (conflictId) {...} else {...}`.
 */
export function getConflictIdFromError(error: unknown): string | null {
  if (error instanceof ApiRequestError && error.code === 'CONTENT_CONFLICT') {
    const id = error.details?.['conflictId']
    return typeof id === 'string' ? id : null
  }
  return null
}

// ─── Users ────────────────────────────────────────────────────────────────────

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN'
export type UserTier = 'FREE' | 'PRO' | 'TEAM'

export interface AdminUserSummary {
  id: string
  email: string
  username: string
  displayName: string
  role: UserRole
  tier: UserTier
  xp: number
  level: number
  currentStreak: number
  isActive: boolean
  emailVerified: boolean
  primaryTrack: 'FE' | 'BE' | null
  lastActiveAt: string | null
  createdAt: string
}

export interface ListUsersParams {
  page?: number
  limit?: number
  role?: UserRole
  tier?: UserTier
  search?: string
  isActive?: boolean
  track?: 'FE' | 'BE'
  sortBy?: 'createdAt' | 'xp' | 'lastActiveAt'
  sortDir?: 'asc' | 'desc'
}

export async function listAdminUsers(params: ListUsersParams = {}): Promise<{ users: AdminUserSummary[]; meta: PageMeta }> {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.role) qs.set('role', params.role)
  if (params.tier) qs.set('tier', params.tier)
  if (params.search) qs.set('search', params.search)
  if (params.isActive !== undefined) qs.set('isActive', String(params.isActive))
  if (params.track) qs.set('track', params.track)
  if (params.sortBy) qs.set('sortBy', params.sortBy)
  if (params.sortDir) qs.set('sortDir', params.sortDir)

  const { data, meta } = await authFetchWithMeta<AdminUserSummary[]>(`/admin/users?${qs.toString()}`)
  return { users: data, meta: meta as PageMeta }
}

export interface AdminUserDetail {
  id: string
  email: string
  username: string
  displayName: string
  avatar: string | null
  bio: string | null
  primaryTrack: 'FE' | 'BE' | null
  role: UserRole
  tier: UserTier
  xp: number
  level: number
  currentStreak: number
  longestStreak: number
  emailVerified: boolean
  isActive: boolean
  lastActiveAt: string | null
  createdAt: string
  updatedAt: string
  lessonsCompleted: number
  portfolio: { headline: string | null; isPublic: boolean } | null
  projectSubmissions: {
    id: string
    status: 'PENDING' | 'APPROVED' | 'NEEDS_REVISION'
    aiScore: number | null
    createdAt: string
  }[]
  xpEvents: { id: string; eventType: string; xpAwarded: number; description: string | null; createdAt: string }[]
}

/** ALL user columns except passwordHash (stripped server-side), plus recent activity — not the trimmed listAdminUsers shape. */
export function getAdminUserDetail(id: string): Promise<AdminUserDetail> {
  return authFetch(`/admin/users/${id}`)
}

export interface UpdateUserInput {
  role?: UserRole
  tier?: UserTier
  isActive?: boolean
  emailVerified?: boolean
  xp?: number
  displayName?: string
}

/** No expectedUpdatedAt — this endpoint isn't behind the optimistic-lock system the content CRUD endpoints use. */
export function updateAdminUser(id: string, body: UpdateUserInput): Promise<AdminUserSummary> {
  return authFetch(`/admin/users/${id}`, { method: 'PATCH', body, idempotencyKey: crypto.randomUUID() })
}

/** Soft delete: sets isActive=false and appends '.deleted' to the email so it can't be logged into again. The backend refuses this for ADMIN-role accounts. */
export function deleteAdminUser(id: string): Promise<{ message: string }> {
  return authFetch(`/admin/users/${id}`, { method: 'DELETE', idempotencyKey: crypto.randomUUID() })
}

export function grantAdminXp(id: string, xpAmount: number, reason: string): Promise<{ id: string; xp: number }> {
  return authFetch(`/admin/users/${id}/grant-xp`, {
    method: 'POST',
    body: { xpAmount, reason },
    idempotencyKey: crypto.randomUUID(),
  })
}

// ─── Project submissions ──────────────────────────────────────────────────────

export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'NEEDS_REVISION'

export interface AdminSubmission {
  id: string
  userId: string
  projectId: string
  repoUrl: string | null
  liveUrl: string | null
  notes: string | null
  aiReview: string | null
  aiScore: number | null
  aiReviewedAt: string | null
  status: SubmissionStatus
  reviewFeedback?: string | null
  reviewedAt?: string | null
  createdAt: string
  updatedAt: string
  user: { username: string; displayName: string; email: string }
  project: { title: string; difficulty: ContentDifficulty }
  peerReviews: { score: number }[]
}

export async function listAdminSubmissions(
  page = 1,
  limit = 20,
  status?: SubmissionStatus
): Promise<{ submissions: AdminSubmission[]; meta: PageMeta }> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) qs.set('status', status)

  const { data, meta } = await authFetchWithMeta<AdminSubmission[]>(`/admin/submissions?${qs.toString()}`)
  return { submissions: data, meta: meta as PageMeta }
}

export function updateAdminSubmission(id: string, status: SubmissionStatus, note?: string): Promise<AdminSubmission> {
  return authFetch(`/admin/submissions/${id}`, {
    method: 'PATCH',
    body: { status, note },
    idempotencyKey: crypto.randomUUID(),
  })
}

/** Rate-limited on the backend to 20/hour. Writes aiReview + aiScore onto the submission and returns the updated row. */
export function triggerAdminAiReview(id: string): Promise<AdminSubmission> {
  return authFetch(`/admin/submissions/${id}/ai-review`, { method: 'POST', idempotencyKey: crypto.randomUUID() })
}

// ─── Community moderation ─────────────────────────────────────────────────────

export interface AdminPost {
  id: string
  type: 'QUESTION' | 'SHOWCASE' | 'ARTICLE' | 'NOTE'
  title: string
  upvotes: number
  viewCount: number
  resolved: boolean
  createdAt: string
  user: { username: string; email: string; role: UserRole }
}

export async function listAdminPosts(page = 1, limit = 20): Promise<{ posts: AdminPost[]; meta: PageMeta }> {
  const { data, meta } = await authFetchWithMeta<AdminPost[]>(`/admin/posts?page=${page}&limit=${limit}`)
  return { posts: data, meta: meta as PageMeta }
}

export function deleteAdminPost(id: string): Promise<{ message: string }> {
  return authFetch(`/admin/posts/${id}`, { method: 'DELETE', idempotencyKey: crypto.randomUUID() })
}

// ─── System design challenges ─────────────────────────────────────────────────
// No expectedUpdatedAt on these updates — see admin-system-design.routes.ts's
// own doc comment for why (extending the fixed ConflictContentType enum for
// a new content type was judged out of scope for adding the content type
// itself; simple last-write-wins instead, matching Users).

export interface SystemDesignChallenge {
  id: string
  track: 'FE' | 'BE'
  slug: string
  title: string
  scenario: string
  difficulty: ContentDifficulty
  estimatedMins: number
  order: number
  isPublished: boolean
  isPremium: boolean
  createdAt: string
  updatedAt: string
}

export interface ListChallengesParams {
  page?: number
  limit?: number
  track?: 'FE' | 'BE'
}

export async function listAdminChallenges(
  params: ListChallengesParams = {}
): Promise<{ challenges: SystemDesignChallenge[]; meta: PageMeta }> {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.track) qs.set('track', params.track)

  const { data, meta } = await authFetchWithMeta<SystemDesignChallenge[]>(`/admin/system-design/challenges?${qs.toString()}`)
  return { challenges: data, meta: meta as PageMeta }
}

export function getAdminChallenge(id: string): Promise<SystemDesignChallenge> {
  return authFetch(`/admin/system-design/challenges/${id}`)
}

export interface CreateChallengeInput {
  track: 'FE' | 'BE'
  slug: string
  title: string
  scenario: string
  difficulty: ContentDifficulty
  estimatedMins?: number
  order?: number
  isPublished?: boolean
  isPremium?: boolean
}

export function createAdminChallenge(body: CreateChallengeInput): Promise<SystemDesignChallenge> {
  return authFetch('/admin/system-design/challenges', { method: 'POST', body, idempotencyKey: crypto.randomUUID() })
}

export interface UpdateChallengeInput {
  track?: 'FE' | 'BE'
  title?: string
  scenario?: string
  difficulty?: ContentDifficulty
  estimatedMins?: number
  order?: number
  isPublished?: boolean
  isPremium?: boolean
}

export function updateAdminChallenge(id: string, body: UpdateChallengeInput): Promise<SystemDesignChallenge> {
  return authFetch(`/admin/system-design/challenges/${id}`, { method: 'PATCH', body, idempotencyKey: crypto.randomUUID() })
}

export function deleteAdminChallenge(id: string): Promise<{ message: string }> {
  return authFetch(`/admin/system-design/challenges/${id}`, { method: 'DELETE', idempotencyKey: crypto.randomUUID() })
}

export interface SystemDesignStage {
  id: string
  challengeId: string
  order: number
  title: string
  guidingQuestions: string[]
  modelAnswer: string
  diagramImageUrl: string | null
  createdAt: string
  updatedAt: string
}

export function listAdminStages(challengeId: string): Promise<SystemDesignStage[]> {
  return authFetch(`/admin/system-design/stages?challengeId=${challengeId}`)
}

export interface CreateStageInput {
  challengeId: string
  order: number
  title: string
  guidingQuestions?: string[]
  modelAnswer: string
  diagramImageUrl?: string
}

export function createAdminStage(body: CreateStageInput): Promise<SystemDesignStage> {
  return authFetch('/admin/system-design/stages', { method: 'POST', body, idempotencyKey: crypto.randomUUID() })
}

export interface UpdateStageInput {
  order?: number
  title?: string
  guidingQuestions?: string[]
  modelAnswer?: string
  diagramImageUrl?: string
}

export function updateAdminStage(id: string, body: UpdateStageInput): Promise<SystemDesignStage> {
  return authFetch(`/admin/system-design/stages/${id}`, { method: 'PATCH', body, idempotencyKey: crypto.randomUUID() })
}

export function deleteAdminStage(id: string): Promise<{ message: string }> {
  return authFetch(`/admin/system-design/stages/${id}`, { method: 'DELETE', idempotencyKey: crypto.randomUUID() })
}
