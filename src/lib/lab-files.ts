/**
 * Multi-file lessons keep their files in the single `code` string every lesson already has, one section per file:
 *
 *   === index.html ===
 *   <h1>Hello</h1>
 *   === styles.css (readonly) ===
 *   h1 { color: red }
 *
 * Plain single-document code (no marker on the first line) is still valid and is treated as one file.
 */
export interface LabFile { name: string; content: string; readonly: boolean }

const MARKER = /^=== ([^\s=][^=]*?)(?: \((readonly)\))? ===[ \t]*$/

export function isBundle(code: string): boolean {
  return MARKER.test(code.split('\n', 1)[0] ?? '')
}

export function parseBundle(code: string): LabFile[] {
  if (!isBundle(code)) return [{ name: 'index.html', content: code, readonly: false }]
  const files: LabFile[] = []
  const lines: string[][] = []
  for (const line of code.split('\n')) {
    const m = MARKER.exec(line)
    if (m) { files.push({ name: m[1]!.trim(), content: '', readonly: m[2] === 'readonly' }); lines.push([]); continue }
    lines[lines.length - 1]!.push(line)
  }
  return files.map((f, i) => ({ ...f, content: lines[i]!.join('\n') }))
}

export function serializeBundle(files: LabFile[]): string {
  return files.map((f) => `=== ${f.name}${f.readonly ? ' (readonly)' : ''} ===\n${f.content}`).join('\n')
}

export function filesMap(code: string): Record<string, string> {
  return Object.fromEntries(parseBundle(code).map((f) => [f.name, f.content]))
}

export function setFile(code: string, name: string, content: string): string {
  return serializeBundle(parseBundle(code).map((f) => (f.name === name ? { ...f, content } : f)))
}

export function monacoLanguage(name: string): string {
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase()
  return ({ html: 'html', css: 'css', js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', json: 'json', md: 'markdown' } as Record<string, string>)[ext] ?? 'plaintext'
}

export const MAX_LAB_FILES = 30

/** Returns a learner-facing problem, or null when `name` can be added to the bundle. */
export function validateNewFile(files: LabFile[], name: string): string | null {
  if (!name) return 'Give the file a name, like src/Button.jsx.'
  if (name.length > 80) return 'That path is too long.'
  if (!/^[\w@.\-\[\]()]+(?:\/[\w@.\-\[\]()]+)*$/.test(name) || name.split('/').some((part) => part === '.' || part === '..')) return 'Use letters, numbers, dashes and slashes only, with no "..".'
  if (!/\.[a-z0-9]+$/i.test(name)) return 'Add a file extension, like .jsx or .css.'
  if (files.some((f) => f.name.toLowerCase() === name.toLowerCase())) return 'A file with that name already exists.'
  if (files.length >= MAX_LAB_FILES) return `A lesson can hold up to ${MAX_LAB_FILES} files.`
  return null
}

export function addFile(code: string, name: string, content = ''): string {
  return serializeBundle([...parseBundle(code), { name, content, readonly: false }])
}

export function removeFile(code: string, name: string): string {
  return serializeBundle(parseBundle(code).filter((f) => f.name !== name || f.readonly))
}
