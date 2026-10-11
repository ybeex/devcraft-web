// Ambient declaration for side-effect CSS imports (e.g. `import './globals.css'`).
// Next.js's own next/types/global.d.ts only declares `*.module.css`; this covers
// plain stylesheet imports so `tsc`/the build type-check step doesn't choke on them.
declare module '*.css'
