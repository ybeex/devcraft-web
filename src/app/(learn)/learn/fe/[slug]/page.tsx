import { TrackGuard } from '@/components/curriculum/TrackGuard'
import { LessonPageClient } from '@/components/editor/LessonPageClient'

export default async function FrontendLessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <TrackGuard track="FE"><LessonPageClient track="FE" slug={slug} /></TrackGuard>
}
