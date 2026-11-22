// Compiles the app's Tailwind stylesheet for the harness: node build-css.mjs <out.css>
import postcss from 'postcss'
import tailwind from '@tailwindcss/postcss'
import { readFileSync, writeFileSync } from 'node:fs'
const from = new URL('../../src/app/globals.css', import.meta.url).pathname
const r = await postcss([tailwind()]).process(readFileSync(from, 'utf8'), { from })
writeFileSync(process.argv[2], r.css)
