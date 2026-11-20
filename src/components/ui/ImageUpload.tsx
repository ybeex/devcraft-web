'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { uploadImage, type ImageKind } from '@/lib/api/uploads'
import { Button } from './Button'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  kind: ImageKind
  value: string | null
  onChange: (url: string | null) => void
  hint?: string
  className?: string
  /** Shape of the preview. */
  shape?: 'wide' | 'round'
}

/** Pick a file, upload it right away, hand back its URL. There is no URL box: images always come from an upload. */
export function ImageUpload({ label, kind, value, onChange, hint, className, shape = 'wide' }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pick(file: File | undefined) {
    if (!file) return
    setBusy(true); setError(null)
    try { onChange(await uploadImage(file, kind)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Upload failed') }
    finally { setBusy(false); if (input.current) input.current.value = '' }
  }

  return (
    <div className={className}>
      <p className="text-sm font-semibold text-ink">{label}</p>
      <div className="mt-2 flex items-center gap-4">
        <div className={cn('flex shrink-0 items-center justify-center overflow-hidden border border-dashed border-rim bg-raised text-ghost', shape === 'round' ? 'h-16 w-16 rounded-full' : 'h-24 w-40 rounded-[var(--radius-md)]')}>
          {value
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={value} alt="" className="h-full w-full object-cover" />
            : <ImagePlus size={22} />}
        </div>
        <div className="flex flex-col items-start gap-2">
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" aria-label={label} data-testid={`upload-${kind}`} onChange={(e) => void pick(e.target.files?.[0])} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
              {busy ? <><Loader2 size={13} className="animate-spin" /> Uploading…</> : value ? 'Replace image' : 'Upload image'}
            </Button>
            {value && !busy && <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}><Trash2 size={13} /> Remove</Button>}
          </div>
          <p className="text-xs text-ghost">{hint ?? 'PNG, JPEG, WebP or GIF, up to 2 MB.'}</p>
          {error && <p role="alert" className="text-xs text-error">{error}</p>}
        </div>
      </div>
    </div>
  )
}
