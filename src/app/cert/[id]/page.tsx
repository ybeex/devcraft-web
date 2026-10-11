import { notFound } from 'next/navigation'
import { getCertificateById } from '@/lib/api/certificates'
import { ApiRequestError } from '@/lib/api/client'
import { CertificateView } from '@/components/certificates/CertificateView'

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const cert = await getCertificateById(id)
    return <CertificateView cert={cert} />
  } catch (err) {
    if (err instanceof ApiRequestError && err.statusCode === 404) {
      notFound()
    }
    throw err
  }
}
