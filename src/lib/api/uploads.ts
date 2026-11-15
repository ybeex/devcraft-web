import { authFetch } from './auth-fetch'

export type ImageKind = 'avatar' | 'thumbnail' | 'diagram'

export const MAX_IMAGE_MB = 2

/** Uploads straight to our storage; the returned URL is what goes in the field. */
export async function uploadImage(file: File, kind: ImageKind): Promise<string> {
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) throw new Error('Choose a PNG, JPEG, WebP or GIF image')
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) throw new Error(`Images can be at most ${MAX_IMAGE_MB} MB`)
  const fd = new FormData()
  fd.append('file', file)
  const r = await authFetch<{ url: string }>(`/uploads/image?kind=${kind}`, { method: 'POST', body: fd })
  return r.url
}
