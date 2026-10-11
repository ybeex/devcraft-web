'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TrustBanner } from '@/components/ui/TrustBanner'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { CommunityPostSchema, type CommunityPostFormValues } from '@/lib/schemas/community'
import { createCommunityPost, type CommunityPost } from '@/lib/api/community'
import { ApiRequestError } from '@/lib/api/client'
import { cn } from '@/lib/utils'

const TYPE_OPTIONS = ['Question', 'Showcase', 'Article', 'Note']

export function NewPostForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // "Ask about this lesson" pre-fill (PRD §8.1) — a lesson page links here
  // with these params; nothing structural links the post back to the
  // lesson in the database, the reference just becomes part of the
  // post's own text, which is what "pre-fills lesson URL and code
  // snippet" describes.
  const lessonTitle = searchParams.get('lessonTitle')
  const lessonUrl = searchParams.get('lessonUrl')
  const prefillCode = searchParams.get('code')
  const prefillLanguage = searchParams.get('language')

  const [typeLabel, setTypeLabel] = useState('Question')
  const [showCode, setShowCode] = useState(!!prefillCode)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CommunityPostFormValues>({
    resolver: zodResolver(CommunityPostSchema),
    defaultValues: {
      title: lessonTitle ? `Question about: ${lessonTitle}` : undefined,
      content: lessonTitle
        ? `I'm working through [${lessonTitle}](${lessonUrl ?? ''}) and...\n\n`
        : undefined,
      codeSnippet: prefillCode ?? undefined,
      language: prefillLanguage ?? undefined,
    },
  })

  async function onSubmit(values: CommunityPostFormValues) {
    setServerError(null)
    try {
      const tags = values.tags
        ? values.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined

      const { id } = await createCommunityPost({
        type: typeLabel.toUpperCase() as CommunityPost['type'],
        title: values.title,
        content: values.content,
        codeSnippet: values.codeSnippet || undefined,
        language: values.language || undefined,
        tags,
      })
      router.push(`/community/${id}`)
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {lessonTitle && (
        <TrustBanner icon={<Sparkles />} tone="info">
          Pre-filled from <strong>{lessonTitle}</strong> — edit anything below before posting.
        </TrustBanner>
      )}

      {serverError && (
        <TrustBanner icon={<AlertCircle />} className="bg-[var(--negative-bg)] text-[var(--negative-text)]">
          {serverError}
        </TrustBanner>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-dim">Post type</span>
        <SegmentedControl options={TYPE_OPTIONS} value={typeLabel} onChange={setTypeLabel} />
      </div>

      <Field label="Title" error={errors.title?.message}>
        <input
          {...register('title')}
          type="text"
          placeholder="What's your question or update?"
          className={inputClass(!!errors.title)}
        />
      </Field>

      <Field label="Content" error={errors.content?.message}>
        <textarea
          {...register('content')}
          rows={7}
          placeholder="Add as much detail as you can — code, error messages, what you've tried..."
          className={cn(inputClass(!!errors.content), 'resize-none')}
        />
      </Field>

      {!showCode ? (
        <button
          type="button"
          onClick={() => setShowCode(true)}
          className="self-start text-xs font-semibold text-brand hover:underline"
        >
          + Add a code snippet
        </button>
      ) : (
        <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
          <Field label="Code snippet" error={errors.codeSnippet?.message}>
            <textarea
              {...register('codeSnippet')}
              rows={6}
              placeholder="Paste code here..."
              className={cn(inputClass(!!errors.codeSnippet), 'resize-none font-mono text-xs')}
            />
          </Field>
          <Field label="Language" error={errors.language?.message}>
            <input
              {...register('language')}
              type="text"
              placeholder="typescript"
              className={inputClass(!!errors.language)}
            />
          </Field>
        </div>
      )}

      <Field label="Tags (optional, comma-separated)" error={errors.tags?.message}>
        <input
          {...register('tags')}
          type="text"
          placeholder="react, hooks, performance"
          className={inputClass(!!errors.tags)}
        />
      </Field>

      <Button type="submit" disabled={isSubmitting} className="justify-center">
        {isSubmitting ? 'Posting...' : 'Post'}
      </Button>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-dim">{label}</span>
      {children}
      {error && <span className="text-xs font-medium text-error">{error}</span>}
    </label>
  )
}

function inputClass(hasError: boolean): string {
  return cn(
    'w-full rounded-[var(--radius-md)] border bg-canvas px-4 py-2.5 text-sm text-ink outline-none transition-colors',
    'placeholder:text-ghost focus:border-brand',
    hasError ? 'border-error' : 'border-rim'
  )
}
