import { ChallengeDetail } from '@/components/interview/ChallengeDetail'

export default async function SystemDesignChallengePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <ChallengeDetail slug={slug} />
}
