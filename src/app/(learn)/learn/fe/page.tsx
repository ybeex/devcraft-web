import type { Metadata } from 'next'
import { CurriculumTree } from '@/components/curriculum/CurriculumTree'
import { TrackGuard } from '@/components/curriculum/TrackGuard'

export const metadata: Metadata = {
  title: 'Frontend Curriculum',
  description: 'Your Frontend Engineering learning path.',
}

export default function FrontendCurriculumPage() {
  return <TrackGuard track="FE"><CurriculumTree track="FE" /></TrackGuard>
}
