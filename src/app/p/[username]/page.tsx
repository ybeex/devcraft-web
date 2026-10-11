import { notFound } from 'next/navigation'
import { getPublicPortfolio } from '@/lib/api/portfolio'
import { ApiRequestError } from '@/lib/api/client'
import { PortfolioView } from '@/components/portfolio/PortfolioView'

export default async function PublicPortfolioPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params

  try {
    const data = await getPublicPortfolio(username)
    return <PortfolioView data={data} />
  } catch (err) {
    if (err instanceof ApiRequestError && (err.code === 'NOT_FOUND' || err.statusCode === 404)) {
      notFound()
    }
    throw err
  }
}
