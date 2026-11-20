import { build } from 'esbuild'
import { copyFileSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'public', 'lesson-runtime')
rmSync(output, { recursive: true, force: true })
mkdirSync(output, { recursive: true })

const shared = { bundle: true, minify: true, format: 'iife', target: 'es2020', define: { 'process.env.NODE_ENV': '"production"' } }

// React + ReactDOM vendor bundle, loaded by the preview iframe (cacheable, versioned with the app).
await build({ ...shared, entryPoints: [path.join(root, 'scripts', 'lesson-react-entry.js')], outfile: path.join(output, 'react.js') })
// Compiler: Sucrase bundled into one small worker file. Created by the host page, not by the preview iframe.
await build({ ...shared, entryPoints: [path.join(root, 'scripts', 'lesson-compiler-worker.js')], outfile: path.join(output, 'compiler-worker.js') })
copyFileSync(path.join(root, 'scripts', 'lesson-iframe-runner.js'), path.join(output, 'runner.js'))
