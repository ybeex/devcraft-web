'use client'

import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, ResponsiveContainer } from 'recharts'
import { BarChart3 } from 'lucide-react'
import { getLearnerFunnel, type FunnelStage } from '@/lib/api/admin'
import { SectionCard } from './SectionCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

interface FunnelSectionProps {
  days: number
}

export function FunnelSection({ days }: FunnelSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-funnel', days],
    queryFn: () => getLearnerFunnel(days),
  })

  const stages = data?.stages ?? []

  return (
    <SectionCard title="Learner funnel" description={`Registered → certified, last ${days} days`}>
      {isLoading ? (
        <Skeleton className="h-[260px] w-full rounded-[var(--radius-md)]" />
      ) : stages.length === 0 || stages.every((s) => s.count === 0) ? (
        <EmptyState
          icon={<BarChart3 size={56} strokeWidth={1.25} className="text-ghost" />}
          headline="No signal in this window"
          body="Nobody registered in the selected period — try a wider date range."
        />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={stages} layout="vertical" margin={{ left: 4, right: 36, top: 4, bottom: 4 }}>
            <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
            <XAxis type="number" stroke="var(--ghost)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="stage"
              stroke="var(--dim)"
              fontSize={12}
              width={150}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: 'var(--raised)' }}
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--rim-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
              }}
              formatter={(value, _name, item) => {
                const pct = (item?.payload as FunnelStage | undefined)?.percentOfPrevious
                const numeric = typeof value === 'number' ? value : Number(value)
                return [
                  `${numeric.toLocaleString()}${pct !== null && pct !== undefined ? ` · ${pct}% of prior stage` : ''}`,
                  'Learners',
                ]
              }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={26}>
              {stages.map((_, i) => (
                <Cell key={i} fill="var(--chart-1)" fillOpacity={1 - i * 0.14} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                fontSize={12}
                fill="var(--dim)"
                formatter={(v) => (typeof v === 'number' ? v.toLocaleString() : String(v ?? ''))}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  )
}
