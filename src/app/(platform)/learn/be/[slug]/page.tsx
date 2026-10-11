import { LessonPageClient } from '@/components/editor/LessonPageClient'

export default async function BackendLessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <LessonPageClient track="BE" slug={slug} />
}
