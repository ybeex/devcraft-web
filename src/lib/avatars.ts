/**
 * Built-in avatars: small generated SVGs stored as data URLs (the API accepts https URLs and these only).
 * Generated rather than uploaded so there is no file storage to run, nothing to moderate, and every
 * avatar stays a few hundred bytes in the lists that show many of them (leaderboard, community).
 */
const PALETTES: [string, string][] = [
  ['#6366f1', '#22d3ee'], ['#f43f5e', '#fb923c'], ['#10b981', '#a3e635'], ['#8b5cf6', '#ec4899'],
  ['#0ea5e9', '#6366f1'], ['#f59e0b', '#ef4444'], ['#14b8a6', '#3b82f6'], ['#d946ef', '#f97316'],
]
const SHAPES = [
  '<circle cx="64" cy="64" r="26" fill="#fff" fill-opacity=".85"/>',
  '<path d="M64 34 96 92H32Z" fill="#fff" fill-opacity=".85"/>',
  '<rect x="38" y="38" width="52" height="52" rx="12" fill="#fff" fill-opacity=".85"/>',
  '<path d="M40 64h48M64 40v48" stroke="#fff" stroke-opacity=".9" stroke-width="12" stroke-linecap="round"/>',
  '<path d="M36 78c10-30 46-30 56 0" stroke="#fff" stroke-opacity=".9" stroke-width="12" fill="none" stroke-linecap="round"/>',
  '<path d="M64 32l9 22 23 2-18 15 6 23-20-13-20 13 6-23-18-15 23-2z" fill="#fff" fill-opacity=".85"/>',
]

function build(i: number): string {
  const [a, b] = PALETTES[i % PALETTES.length]
  const shape = SHAPES[i % SHAPES.length]
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>` +
    `<rect width="128" height="128" fill="url(#g)"/>${shape}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const AVATAR_PRESETS: string[] = Array.from({ length: 12 }, (_, i) => build(i))
