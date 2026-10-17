import { authFetch } from './auth-fetch'

export interface AnalyticsSummary {
  users: { total: number; verified: number; new7d: number; new30d: number; onboarded: number; deactivated: number; verifiedRate: number; onboardedRate: number }
  activity: { dau: number; wau: number; mau: number; stickiness: number }
  tracks: { fe: number; be: number; none: number }
  plans: { permanent: number; timeLimited: number; onTrial: number; free: number }
  totals: { lessonsCompleted: number; xpAwarded: number; certificates: number; submissions: number; submissionsPending: number; posts: number; comments: number; aiCalls: number; snippets: number }
}
export interface GrowthPoint { date: string; signups: number; active: number; lessons: number; xp: number; aiCalls: number; posts: number }
export interface RetentionCohort { week: string; size: number; week1: number | null; week2: number | null; week4: number | null }
export interface LessonStat { id: string; title: string; slug: string; difficulty: string; track: 'FE' | 'BE'; module: string; started: number; completed: number; completionRate: number | null; avgAttempts: number; avgMinutes: number }
export interface LessonAnalytics { topCompleted: LessonStat[]; hardest: LessonStat[]; untouched: number; published: number; minStarts: number }
export interface ProAnalytics {
  codes: { total: number; admin: number; reward: number; active: number; redemptions: number; redemptionRate: number }
  redeemedInPeriod: { count: number; daysGranted: number }
  redemptionsDaily: { date: string; redemptions: number }[]
  trials: { started: number; ended: number; running: number }
  rewardsByMonth: { period: string; granted: number; redeemed: number }[]
}
export interface EngagementAnalytics {
  community: { posts: number; comments: number; questions: number; resolved: number; resolveRate: number | null; contributors: number }
  topContributors: { username: string; displayName: string; contributions: number }[]
  interview: { track: 'FE' | 'BE'; reviewed: number; needsPractice: number; learners: number }[]
  placement: { track: string; level: string; count: number }[]
  goals: { goal: string; count: number }[]
  submissions: { status: string; count: number }[]
}

const base = '/admin/analytics'
export const getAnalyticsSummary = () => authFetch<AnalyticsSummary>(`${base}/summary`)
export const getGrowth = (days: number) => authFetch<{ series: GrowthPoint[] }>(`${base}/growth?days=${days}`)
export const getRetention = (weeks = 8) => authFetch<{ cohorts: RetentionCohort[] }>(`${base}/retention?weeks=${weeks}`)
export const getLessonAnalytics = (days: number) => authFetch<LessonAnalytics>(`${base}/lessons?days=${days}`)
export const getProAnalytics = (days: number) => authFetch<ProAnalytics>(`${base}/pro?days=${days}`)
export const getEngagement = (days: number) => authFetch<EngagementAnalytics>(`${base}/engagement?days=${days}`)

export interface JourneyStep { key: string; label: string; count: number; rate: number | null }
export interface JourneyAnalytics { days: number; cohort: number; onboarding: JourneyStep[]; pro: JourneyStep[] }
export const getJourney = (days: number) => authFetch<JourneyAnalytics>(`${base}/journey?days=${days}`)
