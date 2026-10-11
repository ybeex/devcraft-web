import type { Metadata } from 'next'
import { CurriculumTree } from '@/components/curriculum/CurriculumTree'

export const metadata: Metadata = {
  title: 'Backend Curriculum',
  description: 'Your Backend Engineering learning path.',
}

export default function BackendCurriculumPage() {
  return <CurriculumTree track="BE" />
}
