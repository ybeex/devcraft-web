'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TrustBanner } from '@/components/ui/TrustBanner'
import { ProjectSubmitSchema, type ProjectSubmitValues } from '@/lib/schemas/project-submit'
import { submitProject } from '@/lib/api/projects'
import { ApiRequestError } from '@/lib/api/client'
import { cn } from '@/lib/utils'

interface ProjectSubmitFormProps {
  projectId: string
  /** Called after a successful submission — parent decides what to show next. */
  onSubmitted: () => void
}

export function ProjectSubmitForm({ projectId, onSubmitted }: ProjectSubmitFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectSubmitValues>({ resolver: zodResolver(ProjectSubmitSchema) })

  async function onSubmit(values: ProjectSubmitValues) {
    setServerError(null)
    try {
      await submitProject(projectId, {
        repoUrl: values.repoUrl || undefined,
        liveUrl: values.liveUrl || undefined,
        notes: values.notes || undefined,
      })
      onSubmitted()
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {serverError && (
        <TrustBanner icon={<AlertCircle />} className="bg-[var(--negative-bg)] text-[var(--negative-text)]">
          {serverError}
        </TrustBanner>
      )}

      <Field label="Repository URL" error={errors.repoUrl?.message}>
        <input
          {...register('repoUrl')}
          type="url"
          placeholder="https://github.com/you/project"
          autoComplete="off"
          className={inputClass(!!errors.repoUrl)}
        />
      </Field>

      <Field label="Live URL" error={errors.liveUrl?.message}>
        <input
          {...register('liveUrl')}
          type="url"
          placeholder="https://your-project.vercel.app"
          autoComplete="off"
          className={inputClass(!!errors.liveUrl)}
        />
      </Field>

      <Field label="Notes (optional)" error={errors.notes?.message}>
        <textarea
          {...register('notes')}
          rows={4}
          placeholder="Anything reviewers should know — tradeoffs, what you'd do with more time, known gaps..."
          className={cn(inputClass(!!errors.notes), 'resize-none')}
        />
      </Field>

      <TrustBanner icon={<ShieldCheck />} tone="info">
        Your submission is reviewed by peers and AI — both feed into your project score.
      </TrustBanner>

      <Button type="submit" disabled={isSubmitting} className="justify-center">
        {isSubmitting ? 'Submitting...' : 'Submit project'}
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
