import { isBundle, parseBundle } from '@/lib/lab-files'
import type { WebModeContent } from '@/lib/api/playground'

type LessonDraft = { code: string; webContent: WebModeContent }

export function readLessonDraft(slug: string): LessonDraft | null {
  try {
    const value = localStorage.getItem(`devcraft:lesson-draft:${slug}`)
    if (!value) return null
    const draft = JSON.parse(value) as Partial<LessonDraft>
    if (typeof draft.code !== 'string') return null
    return { code: draft.code, webContent: draft.webContent ?? { html: '', css: '', js: '' } }
  } catch {
    return null
  }
}

export function lessonWorkspaceContent(source: string): WebModeContent {
  if (isBundle(source)) {
    const files = parseBundle(source)
    return {
      html: files.find((file) => file.name.endsWith('.html'))?.content ?? '',
      css: files.filter((file) => file.name.endsWith('.css')).map((file) => file.content).join('\n\n'),
      js: files.filter((file) => /\.js$/.test(file.name)).map((file) => file.content).join('\n\n'),
    }
  }
  return lessonWebContent(source)
}

export function lessonWebContent(source: string): WebModeContent {
  try {
    const parsed = JSON.parse(source) as Partial<WebModeContent>
    if (parsed && (typeof parsed.html === 'string' || typeof parsed.css === 'string' || typeof parsed.js === 'string')) {
      return { html: parsed.html ?? '', css: parsed.css ?? '', js: parsed.js ?? '' }
    }
  } catch {
    // Existing lessons may store a complete HTML document.
  }
  const doc = new DOMParser().parseFromString(source, 'text/html')
  const css = Array.from(doc.querySelectorAll('style')).map((node) => node.textContent ?? '')
  const js = Array.from(doc.querySelectorAll('script:not([src])')).map((node) => node.textContent ?? '')
  doc.querySelectorAll('style, script:not([src])').forEach((node) => node.remove())
  return { html: doc.body.innerHTML, css: css.join('\n\n'), js: js.join('\n\n') }
}
