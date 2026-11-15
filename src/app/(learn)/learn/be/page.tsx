import type { Metadata } from 'next'
import { CurriculumTree } from '@/components/curriculum/CurriculumTree'
import { TrackGuard } from '@/components/curriculum/TrackGuard'

export const metadata: Metadata = {
  title: 'Backend Curriculum',
  description: 'Your Backend Engineering learning path.',
}

export default function BackendCurriculumPage() {
  return <TrackGuard track="BE"><CurriculumTree track="BE" /></TrackGuard>
}
