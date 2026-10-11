'use client'

import { useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Same visual language as LoginForm's inputClass / the audit-log and conflicts filter bars. */
function inputClass(hasError?: boolean): string {
  return cn(
    'w-full rounded-[var(--radius-md)] border bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition-colors',
    'placeholder:text-ghost focus:border-brand',
    hasError ? 'border-error' : 'border-rim'
  )
}

function FieldWrapper({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {error ? <span className="text-xs font-medium text-error">{error}</span> : hint ? <span className="text-xs text-dim">{hint}</span> : null}
    </label>
  )
}

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  error?: string
  maxLength?: number
}

export function TextField({ label, value, onChange, placeholder, hint, error, maxLength }: TextFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint} error={error}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={inputClass(!!error)}
      />
    </FieldWrapper>
  )
}

interface TextAreaFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  error?: string
  rows?: number
  mono?: boolean
}

export function TextAreaField({ label, value, onChange, placeholder, hint, error, rows = 4, mono }: TextAreaFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint} error={error}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(inputClass(!!error), 'resize-y leading-relaxed', mono && 'font-mono text-xs')}
      />
    </FieldWrapper>
  )
}

interface NumberFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  hint?: string
}

export function NumberField({ label, value, onChange, min, max, step, hint }: NumberFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint}>
      <input
        type="number"
        value={Number.isNaN(value) ? '' : value}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        min={min}
        max={max}
        step={step}
        className={inputClass()}
      />
    </FieldWrapper>
  )
}

interface SelectFieldProps<T extends string> {
  label: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  hint?: string
}

export function SelectField<T extends string>({ label, value, onChange, options, hint }: SelectFieldProps<T>) {
  return (
    <FieldWrapper label={label} hint={hint}>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className={inputClass()}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  )
}

interface ToggleFieldProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  hint?: string
}

export function ToggleField({ label, checked, onChange, hint }: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-rim bg-canvas px-3.5 py-2.5">
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs text-dim">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-brand' : 'bg-raised')}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-elev-sm transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  )
}

interface TagsFieldProps {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  hint?: string
}

/** Enter or comma commits a tag; used for `objectives` and `conceptTags` string arrays. */
export function TagsField({ label, value, onChange, placeholder, hint }: TagsFieldProps) {
  const [draft, setDraft] = useState('')

  function commitDraft() {
    const trimmed = draft.trim()
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed])
    setDraft('')
  }

  return (
    <FieldWrapper label={label} hint={hint}>
      <div className="flex flex-wrap gap-1.5 rounded-[var(--radius-md)] border border-rim bg-canvas p-2 focus-within:border-brand">
        {value.map((tag) => (
          <span key={tag} className="flex items-center gap-1 rounded-full bg-raised px-2.5 py-1 text-xs text-ink">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} className="text-ghost hover:text-error">
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              commitDraft()
            }
          }}
          onBlur={commitDraft}
          placeholder={value.length === 0 ? placeholder : undefined}
          className="min-w-[100px] flex-1 bg-transparent px-1 py-1 text-sm text-ink outline-none placeholder:text-ghost"
        />
      </div>
    </FieldWrapper>
  )
}
