(function () {
  const config = window.__DEVCRAFT_LESSON
  const root = document.getElementById('root')
  const report = (error) => {
    const message = error instanceof Error ? error.message : String(error)
    window.__errors = window.__errors || []
    window.__errors.push(message)
    root.innerHTML = '<section role="alert" style="font:14px system-ui;padding:16px;color:#991b1b;background:#fef2f2;border:1px solid #fecaca;border-radius:8px"><strong>We could not run this lesson yet.</strong><p style="margin:8px 0 0">' + message.replace(/[<>&]/g, '') + '</p></section>'
    window.__lessonReady = Promise.resolve()
  }
  const normalize = (value) => {
    const out = []
    for (const part of value.replace(/\\/g, '/').split('/')) {
      if (!part || part === '.') continue
      if (part === '..') out.pop(); else out.push(part)
    }
    return out.join('/')
  }
  const dirname = (value) => value.slice(0, value.lastIndexOf('/') + 1)
  const candidates = (from, request) => {
    const base = request.startsWith('.') ? normalize(dirname(from) + request) : normalize(request)
    const values = [base]
    if (!/\.[a-z]+$/i.test(base)) values.push(base + '.js', base + '.jsx', base + '.ts', base + '.tsx', base + '.json', base + '.css', base + '/index.js', base + '/index.jsx', base + '/index.ts', base + '/index.tsx')
    return values
  }
  const createRouter = () => {
    let rerender = function () {}
    const go = (to) => { history.pushState({}, '', to); rerender() }
    addEventListener('popstate', rerender)
    return {
      bind: (fn) => { rerender = fn },
      Link: ({ href, children, ...props }) => React.createElement('a', Object.assign({}, props, { href, onClick: (event) => { event.preventDefault(); go(href) } }), children),
      useRouter: () => ({ push: go, replace: (to) => { history.replaceState({}, '', to); rerender() }, back: () => history.back() }),
      usePathname: () => location.pathname,
      useParams: () => ({}),
    }
  }
  Promise.resolve().then(() => {
    if (config.diagnostics && config.diagnostics.length) { const first = config.diagnostics[0]; const error = new Error((first.file || 'A file') + (first.line ? ' (line ' + first.line + (first.column ? ', column ' + first.column : '') + ')' : '') + ': ' + first.message); error.diagnostics = config.diagnostics; throw error }
    const compiled = config.modules || {}
    const cache = {}
    Object.keys(compiled).forEach((key) => { const clean = normalize(key).replace(/^\//, ''); if (clean !== key) { compiled[clean] = compiled[key] } })
    const styles = new Set()
    const router = createRouter()
    const external = {
      react: Object.assign({ default: React, __esModule: true }, React),
      'react-dom/client': { createRoot: ReactDOM.createRoot, default: ReactDOM, __esModule: true },
      'react-dom': Object.assign({ default: ReactDOM, __esModule: true }, ReactDOM),
      'next/link': { default: router.Link, __esModule: true },
      'next/navigation': Object.assign({ __esModule: true }, router),
      'next/image': { default: (props) => React.createElement('img', props), __esModule: true },
    }
    const run = (name) => {
      const file = normalize(name)
      if (cache[file]) return cache[file].exports
      if (external[file]) return external[file]
      const entry = compiled[file]
      if (!entry) throw new Error('Cannot find ' + file + '.')
      if (entry.kind === 'css') {
        if (!styles.has(file)) { const style = document.createElement('style'); style.dataset.lessonFile = file; style.textContent = entry.code; document.head.appendChild(style); styles.add(file) }
        return {}
      }
      if (entry.kind === 'json') return JSON.parse(entry.code)
      const module = { exports: {} }; cache[file] = module
      const localRequire = (request) => {
        if (external[request]) return external[request]
        const target = candidates(file, request).find((candidate) => compiled[candidate])
        if (!target) throw new Error('Import "' + request + '" from ' + file + ' is not available in this lesson.')
        return run(target)
      }
      new Function('require', 'module', 'exports', 'React', 'ReactDOM', entry.code)(localRequire, module, module.exports, React, ReactDOM)
      return module.exports
    }
    const first = (names) => names.find((name) => compiled[normalize(name)])
    const entryName = config.mode === 'next'
      ? first([config.start || '', 'app/page.tsx', 'app/page.jsx', 'app/page.js', 'pages/index.tsx', 'pages/index.jsx'])
      : first([config.start || '', 'src/App.tsx', 'src/App.jsx', 'App.tsx', 'App.jsx', 'index.tsx', 'index.jsx'])
    if (!entryName) throw new Error('Add an entry file for this lesson.')
    const pageModule = run(entryName)
    const Page = pageModule.default || pageModule.App
    if (typeof Page !== 'function') throw new Error('Export a React component as the default export from ' + entryName + '.')
    let View = Page
    if (config.mode === 'next') {
      const layoutName = first(['app/layout.tsx', 'app/layout.jsx', 'app/layout.js'])
      if (layoutName) {
        const Layout = run(layoutName).default
        if (typeof Layout === 'function') { const Child = View; View = () => React.createElement(Layout, null, React.createElement(Child)) }
      }
    }
    class Boundary extends React.Component {
      constructor(props) { super(props); this.state = { error: null } }
      static getDerivedStateFromError(error) { return { error } }
      componentDidCatch(error) { window.__errors = window.__errors || []; window.__errors.push(String(error && error.message || error)) }
      render() {
        if (!this.state.error) return this.props.children
        return React.createElement('section', { role: 'alert', style: { font: '14px system-ui', padding: 16, color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 } },
          React.createElement('strong', null, 'Your component threw an error while rendering.'),
          React.createElement('p', { style: { margin: '8px 0 0' } }, String(this.state.error && this.state.error.message || this.state.error)))
      }
    }
    const reactRoot = ReactDOM.createRoot(root)
    const render = () => reactRoot.render(React.createElement(Boundary, { key: location.pathname }, React.createElement(View)))
    router.bind(render)
    render()
    window.__lessonReady = Promise.resolve()
  }).catch(report)
})()
