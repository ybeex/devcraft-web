'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Bot } from 'lucide-react'
import { getAiUsageTrends } from '@/lib/api/admin'
import { SectionCard } from './SectionCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

const LINE_COLORS = ['var(--chart-3)', 'var(--chart-1)', 'var(--chart-2)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * `date` comes from Postgres via postgres.js with no custom type parser
 * registered, so it arrives as a JS Date's default JSON serialization
 * ("2026-08-01T00:00:00.000Z"), not a bare "YYYY-MM-DD" — but this tolerates
 * either shape rather than assuming.
 */
function formatDateLabel(raw: string): string {
  const [, m, d] = raw.split('T')[0]!.split('-').map(Number)
  if (!m || !d) return raw
  return `${MONTH_LABELS[m - 1]} ${d}`
}

interface AiUsageSectionProps {
  days: number
}

export function AiUsageSection({ days }: AiUsageSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-ai-usage', days],
    queryFn: () => getAiUsageTrends(days),
  })

  // Pivot the long-format {date, promptType, calls} rows into one row per
  // date with one column per type — and explicitly zero-fill every known
  // type for every date that has *any* data, so a quiet day for one prompt
  // type dips to zero instead of getting smoothed over by a missing point.
  const { chartData, promptTypes } = useMemo(() => {
    if (!data) return { chartData: [] as Record<string, number | string>[], promptTypes: [] as string[] }
    const types = Array.from(new Set(data.dailyByType.map((r) => r.promptType)))
    const byDate = new Map<string, Record<string, number | string>>()
    for (const row of data.dailyByType) {
      if (!byDate.has(row.date)) {
        const zeroed: Record<string, number | string> = { date: row.date }
        for (const t of types) zeroed[t] = 0
        byDate.set(row.date, zeroed)
      }
      byDate.get(row.date)![row.promptType] = row.calls
    }
    const chartData = Array.from(byDate.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)))
    return { chartData, promptTypes: types }
  }, [data])

  const totalCalls = data?.byTier.reduce((sum, t) => sum + t.calls, 0) ?? 0

  return (
    <SectionCard
      title="AI tutor usage"
      description={`Daily call volume by prompt type, last ${days} days`}
      action={totalCalls > 0 ? <span className="text-xs text-dim">{totalCalls.toLocaleString()} total calls</span> : undefined}
    >
      {isLoading ? (
        <Skeleton className="h-[260px] w-full rounded-[var(--radius-md)]" />
      ) : chartData.length === 0 ? (
        <EmptyState
          icon={<Bot size={56} strokeWidth={1.25} className="text-ghost" />}
          headline="No AI tutor activity yet"
          body="Once learners start using the AI tutor, daily call volume will show up here."
        />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                stroke="var(--ghost)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis stroke="var(--ghost)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
              <Tooltip
                labelFormatter={(v) => formatDateLabel(String(v))}
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--rim-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--dim)' }} />
              {promptTypes.map((type, i) => (
                <Line
                  key={type}
                  type="monotone"
                  dataKey={type}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          {data && data.byTier.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-rim-subtle pt-4">
              {data.byTier.map((t) => (
                <span key={t.tier} className="rounded-full bg-raised px-3 py-1 text-xs text-dim">
                  <span className="font-semibold text-ink">{t.tier}</span> · {t.calls.toLocaleString()} calls
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </SectionCard>
  )
}
