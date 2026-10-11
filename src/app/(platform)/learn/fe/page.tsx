import type { Metadata } from 'next'
import { CurriculumTree } from '@/components/curriculum/CurriculumTree'

export const metadata: Metadata = {
  title: 'Frontend Curriculum',
  description: 'Your Frontend Engineering learning path.',
}

export default function FrontendCurriculumPage() {
  return <CurriculumTree track="FE" />
}
