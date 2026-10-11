import { InterviewQuestionDetail } from '@/components/interview/InterviewQuestionDetail'

export default async function InterviewQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <InterviewQuestionDetail id={id} />
}
