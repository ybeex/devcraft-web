'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Skeleton } from '@/components/ui/Skeleton'
import { LineChart, BarList, Stat, Panel } from '@/components/admin/charts'
import { FunnelSection } from '@/components/admin/FunnelSection'
import { JourneySection } from '@/components/admin/JourneySection'
import { AiUsageSection } from '@/components/admin/AiUsageSection'
import {
  getAnalyticsSummary, getGrowth, getRetention, getLessonAnalytics, getProAnalytics, getEngagement, type LessonStat,
} from '@/lib/api/admin-analytics'

const RANGES = { '7D': 7, '30D': 30, '90D': 90 } as const
const pct = (v: number | null | undefined) => (v === null || v === undefined ? '–' : `${Math.round(v * 100)}%`)
const GOAL_LABEL: Record<string, string> = { 'job-ready': 'Get job-ready', 'level-up': 'Level up at work', curious: 'Just curious', 'career-switch': 'Switch careers' }

// Two series colours from the theme, never the status colours. Identity is also carried by the legend and tooltip.
const C1 = 'var(--brand, #6366f1)'
const C2 = 'var(--info, #0ea5e9)'

function LessonTable({ rows, empty }: { rows: LessonStat[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-dim">{empty}</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-ghost"><tr><th className="py-1.5 pr-3 font-medium">Lesson</th><th className="px-2 font-medium">Track</th><th className="px-2 text-right font-medium">Started</th><th className="px-2 text-right font-medium">Done</th><th className="px-2 text-right font-medium">Rate</th><th className="px-2 text-right font-medium">Tries</th><th className="pl-2 text-right font-medium">Min</th></tr></thead>
        <tbody className="divide-y divide-rim-subtle">
          {rows.map((l) => (
            <tr key={l.id}>
              <td className="max-w-[16rem] truncate py-2 pr-3 text-ink" title={`${l.module} · ${l.title}`}>{l.title}</td>
              <td className="px-2 text-dim">{l.track}</td>
              <td className="px-2 text-right tabular-nums text-dim">{l.started}</td>
              <td className="px-2 text-right tabular-nums text-dim">{l.completed}</td>
              <td className="px-2 text-right font-semibold tabular-nums text-ink">{pct(l.completionRate)}</td>
              <td className="px-2 text-right tabular-nums text-dim">{l.avgAttempts}</td>
              <td className="pl-2 text-right tabular-nums text-dim">{l.avgMinutes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<keyof typeof RANGES>('30D')
  const days = RANGES[range]

  const summary = useQuery({ queryKey: ['an-summary'], queryFn: getAnalyticsSummary })
  const growth = useQuery({ queryKey: ['an-growth', days], queryFn: () => getGrowth(days) })
  const retention = useQuery({ queryKey: ['an-retention'], queryFn: () => getRetention(8) })
  const lessons = useQuery({ queryKey: ['an-lessons', days], queryFn: () => getLessonAnalytics(days) })
  const pro = useQuery({ queryKey: ['an-pro', days], queryFn: () => getProAnalytics(days) })
  const eng = useQuery({ queryKey: ['an-engagement', days], queryFn: () => getEngagement(days) })

  const s = summary.data
  const g = growth.data?.series ?? []
  const labels = g.map((p) => p.date)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Analytics</h1>
          <p className="mt-1 text-sm text-dim">Who is here, whether they come back, what they learn and where they get stuck. Cached for five minutes.</p>
        </div>
        <SegmentedControl options={Object.keys(RANGES)} value={range} onChange={(v) => setRange(v as keyof typeof RANGES)} />
      </div>

      {/* Headline numbers */}
      {summary.isLoading || !s ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-[var(--radius-lg)]" />)}</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Learners" value={s.users.total} sub={`+${s.users.new7d} this week · +${s.users.new30d} this month`} />
          <Stat label="Active today (DAU)" value={s.activity.dau} sub={`${s.activity.wau} weekly · ${s.activity.mau} monthly`} />
          <Stat label="Stickiness (DAU / MAU)" value={pct(s.activity.stickiness)} sub="share of monthly users active today" />
          <Stat label="Verified email" value={pct(s.users.verifiedRate)} sub={`${s.users.verified} of ${s.users.total}`} />
          <Stat label="Finished onboarding" value={pct(s.users.onboardedRate)} sub={`${s.users.onboarded} learners`} />
          <Stat label="Lessons completed" value={s.totals.lessonsCompleted} sub={`${s.totals.xpAwarded.toLocaleString()} XP awarded`} />
          <Stat label="Project submissions" value={s.totals.submissions} sub={`${s.totals.submissionsPending} waiting for review`} />
          <Stat label="Certificates" value={s.totals.certificates} sub={`${s.totals.aiCalls.toLocaleString()} AI calls · ${s.totals.snippets} snippets`} />
        </div>
      )}

      {/* Growth */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Signups and active learners" note="Active = earned XP that day. One axis, both series are people per day.">
          {growth.isLoading ? <Skeleton className="h-52" /> : (
            <LineChart labels={labels} series={[
              { key: 'signups', label: 'New signups', color: C1, values: g.map((p) => p.signups) },
              { key: 'active', label: 'Active learners', color: C2, values: g.map((p) => p.active) },
            ]} />
          )}
        </Panel>
        <Panel title="Lessons completed per day">
          {growth.isLoading ? <Skeleton className="h-52" /> : <LineChart labels={labels} series={[{ key: 'lessons', label: 'Lessons completed', color: C1, values: g.map((p) => p.lessons) }]} />}
        </Panel>
        <Panel title="XP awarded per day" note="A proxy for how much real learning work is happening.">
          {growth.isLoading ? <Skeleton className="h-52" /> : <LineChart labels={labels} series={[{ key: 'xp', label: 'XP', color: C1, values: g.map((p) => p.xp) }]} />}
        </Panel>
        <Panel title="AI tutor calls and community posts per day" note="Both are counts per day on the same axis.">
          {growth.isLoading ? <Skeleton className="h-52" /> : (
            <LineChart labels={labels} series={[
              { key: 'ai', label: 'AI calls', color: C1, values: g.map((p) => p.aiCalls) },
              { key: 'posts', label: 'Community posts', color: C2, values: g.map((p) => p.posts) },
            ]} />
          )}
        </Panel>
      </div>

      {/* Retention */}
      <Panel title="Do new learners come back?" note="Weekly signup cohorts. Each cell is the share who earned XP in that window after joining. A dash means the window has not finished yet.">
        {retention.isLoading ? <Skeleton className="h-40" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" data-testid="retention-table">
              <thead className="text-ghost"><tr><th className="py-1.5 pr-3 font-medium">Joined week of</th><th className="px-2 text-right font-medium">Learners</th><th className="px-2 text-right font-medium">Days 2–7</th><th className="px-2 text-right font-medium">Days 8–14</th><th className="pl-2 text-right font-medium">Days 15–28</th></tr></thead>
              <tbody>
                {retention.data?.cohorts.map((c) => (
                  <tr key={c.week} className="border-t border-rim-subtle">
                    <td className="py-2 pr-3 text-ink">{c.week}</td>
                    <td className="px-2 text-right tabular-nums text-dim">{c.size}</td>
                    {[c.week1, c.week2, c.week4].map((v, i) => (
                      <td key={i} className="px-1 py-1 text-right">
                        <span className="inline-block min-w-[3.5rem] rounded px-2 py-1 font-semibold tabular-nums text-ink" style={{ background: v === null ? 'transparent' : `color-mix(in srgb, var(--brand, #6366f1) ${Math.round(v * 70)}%, transparent)` }}>
                          {pct(v)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <JourneySection days={days} />

      {/* Funnel and AI (existing sections) */}
      <div className="grid gap-5 lg:grid-cols-2">
        <FunnelSection days={days} />
        <AiUsageSection days={days} />
      </div>

      {/* Audience */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Tracks" note="Primary track chosen by learners.">
          <BarList rows={[{ label: 'Frontend', value: s?.tracks.fe ?? 0 }, { label: 'Backend', value: s?.tracks.be ?? 0 }, { label: 'Not chosen yet', value: s?.tracks.none ?? 0 }]} />
        </Panel>
        <Panel title="Plans" note="Time-limited Pro covers the welcome trial, codes and rewards.">
          <BarList rows={[
            { label: 'Free', value: s?.plans.free ?? 0 },
            { label: 'Pro (paid / admin set)', value: s?.plans.permanent ?? 0 },
            { label: 'Pro (trial, code, reward)', value: s?.plans.timeLimited ?? 0, hint: `${s?.plans.onTrial ?? 0} of them on the welcome trial` },
          ]} />
        </Panel>
        <Panel title="Goals" note="What learners said brings them here.">
          <BarList rows={(eng.data?.goals ?? []).map((x) => ({ label: GOAL_LABEL[x.goal] ?? x.goal, value: x.count }))} />
        </Panel>
      </div>

      {/* Lessons */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={`Most completed lessons (${range})`}>
          {lessons.isLoading ? <Skeleton className="h-48" /> : <LessonTable rows={lessons.data?.topCompleted ?? []} empty="No lesson was completed in this period." />}
        </Panel>
        <Panel title={`Where learners get stuck (${range})`} note={`Lowest completion rate among lessons at least ${lessons.data?.minStarts ?? 3} learners started. ${lessons.data?.untouched ?? 0} of ${lessons.data?.published ?? 0} published lessons were never started.`}>
          {lessons.isLoading ? <Skeleton className="h-48" /> : <LessonTable rows={lessons.data?.hardest ?? []} empty="Not enough activity yet to rank lessons by difficulty." />}
        </Panel>
      </div>

      {/* Pro */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Pro codes and trials" note="Billing is not connected yet, so this shows access given, not revenue.">
          {pro.isLoading || !pro.data ? <Skeleton className="h-52" /> : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat label="Active codes" value={pro.data.codes.active} sub={`${pro.data.codes.total} made in total`} />
                <Stat label="Redemptions" value={pro.data.codes.redemptions} sub={`${pct(pro.data.codes.redemptionRate)} of capacity`} />
                <Stat label={`Trials started (${range})`} value={pro.data.trials.started} sub={`${pro.data.trials.running} running · ${pro.data.trials.ended} ended`} />
              </div>
              <div className="mt-4">
                <LineChart height={150} labels={pro.data.redemptionsDaily.map((d) => d.date)} series={[{ key: 'r', label: 'Codes redeemed', color: C1, values: pro.data.redemptionsDaily.map((d) => d.redemptions) }]} />
              </div>
            </>
          )}
        </Panel>
        <Panel title="Monthly rewards" note="Granted vs redeemed, last six months.">
          {pro.data && pro.data.rewardsByMonth.length === 0 ? <p className="text-sm text-dim">No monthly rewards have been issued yet.</p> : (
            <BarList rows={(pro.data?.rewardsByMonth ?? []).map((r) => ({ label: `${r.period} · ${r.redeemed} of ${r.granted} redeemed`, value: r.granted }))} />
          )}
        </Panel>
      </div>

      {/* Community and interview */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title={`Community (${range})`}>
          {eng.isLoading || !eng.data ? <Skeleton className="h-40" /> : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Posts" value={eng.data.community.posts} />
                <Stat label="Comments" value={eng.data.community.comments} />
                <Stat label="Questions answered" value={pct(eng.data.community.resolveRate)} sub={`${eng.data.community.resolved} of ${eng.data.community.questions}`} />
                <Stat label="Contributors" value={eng.data.community.contributors} />
              </div>
              <h3 className="mt-4 text-xs font-semibold text-ink">Top contributors</h3>
              <div className="mt-2"><BarList rows={eng.data.topContributors.map((c) => ({ label: c.displayName, value: c.contributions }))} /></div>
            </>
          )}
        </Panel>
        <Panel title="Interview prep" note="Questions marked by learners, per track.">
          <BarList rows={(eng.data?.interview ?? []).flatMap((i) => [
            { label: `${i.track} · reviewed`, value: i.reviewed },
            { label: `${i.track} · needs practice`, value: i.needsPractice },
          ])} />
        </Panel>
        <Panel title="Placement results and submissions" note="Where the placement quiz put learners; review state of project submissions.">
          <BarList rows={(eng.data?.placement ?? []).map((p) => ({ label: `${p.track} · ${p.level}`, value: p.count }))} />
          <div className="mt-4"><BarList rows={(eng.data?.submissions ?? []).map((x) => ({ label: `Submissions · ${x.status.toLowerCase()}`, value: x.count }))} /></div>
        </Panel>
      </div>
    </div>
  )
}
