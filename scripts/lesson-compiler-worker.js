// Persistent lesson compiler. Runs in a module-less classic Worker created by the *host page* (never inside the
// sandboxed preview iframe, whose opaque origin cannot construct Workers). One worker serves every compile.
import { transform } from 'sucrase'

const SOURCE = /\.(?:[cm]?[jt]sx?)$/i

function diagnostic(file, error) {
  const loc = error && error.loc ? error.loc : null
  const message = String((error && error.message) || error).replace(/^Error transforming [^:]+: /, '').replace(/\s*\(\d+:\d+\)\s*$/, '')
  return { file, line: loc ? loc.line : null, column: loc ? loc.column + 1 : null, message }
}

function transformsFor(name) {
  const ts = /\.[cm]?tsx?$/i.test(name)
  const jsx = /\.(?:jsx|tsx)$/i.test(name) || /\.[cm]?js$/i.test(name)
  return ['imports', ...(ts ? ['typescript'] : []), ...(jsx ? ['jsx'] : [])]
}

self.onmessage = ({ data }) => {
  const { id, files } = data
  const started = performance.now()
  const modules = {}
  const diagnostics = []
  for (const [name, source] of Object.entries(files)) {
    if (/\.css$/i.test(name)) { modules[name] = { kind: 'css', code: source }; continue }
    if (/\.json$/i.test(name)) {
      try { JSON.parse(source); modules[name] = { kind: 'json', code: source } } catch (e) { diagnostics.push({ file: name, line: null, column: null, message: 'This JSON file is not valid: ' + e.message }) }
      continue
    }
    if (!SOURCE.test(name)) continue
    try {
      modules[name] = { kind: 'module', code: transform(source, { transforms: transformsFor(name), jsxRuntime: 'classic', production: true, filePath: name }).code }
    } catch (error) {
      diagnostics.push(diagnostic(name, error))
    }
  }
  self.postMessage({ id, modules, diagnostics, ms: Math.round(performance.now() - started) })
}
