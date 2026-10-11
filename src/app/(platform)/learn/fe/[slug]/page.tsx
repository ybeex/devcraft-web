import { LessonPageClient } from '@/components/editor/LessonPageClient'

export default async function FrontendLessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <LessonPageClient track="FE" slug={slug} />
}
