import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import { NewPostForm } from '@/components/community/NewPostForm'
import { Skeleton } from '@/components/ui/Skeleton'

export default function NewCommunityPostPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <Link href="/community" className="inline-flex items-center gap-1.5 text-sm font-medium text-dim hover:text-ink">
        <ArrowLeft size={14} /> Community
      </Link>
      <h1 className="font-display mt-4 text-2xl font-bold text-ink sm:text-3xl">New post</h1>
      <p className="mt-1 text-sm text-dim">Ask a question, show off a build, or share what you learned.</p>
      <div className="mt-6">
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />}>
          <NewPostForm />
        </Suspense>
      </div>
    </div>
  )
}
