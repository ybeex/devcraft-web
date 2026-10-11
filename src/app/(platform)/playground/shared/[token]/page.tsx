import { SharedSnippetView } from '@/components/playground/SharedSnippetView'

export default async function SharedSnippetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <SharedSnippetView token={token} />
}
