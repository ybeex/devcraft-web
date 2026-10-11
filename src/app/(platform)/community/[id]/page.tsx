import { CommunityPostDetailClient } from '@/components/community/CommunityPostDetailClient'

export default async function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CommunityPostDetailClient id={id} />
}
