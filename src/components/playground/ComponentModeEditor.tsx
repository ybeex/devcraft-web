'use client'

import { useEffect, useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import { RefreshCw } from 'lucide-react'
import { buildComponentPreviewDocument } from '@/lib/api/playground'

interface ComponentModeEditorProps {
  value: string
  onChange: (value: string) => void
  mode: 'react' | 'nextjs'
  theme: 'vs-dark' | 'light'
}

const PLAYGROUND_TYPES = `
declare namespace JSX {
  interface Element {}
  interface IntrinsicElements { [elementName: string]: any }
}
declare namespace React {
  type ReactNode = any;
  type CSSProperties = Record<string, string | number | undefined>;
  type SetStateAction<S> = S | ((previous: S) => S);
  type Dispatch<A> = (value: A) => void;
  type FC<P = {}> = (props: P) => JSX.Element;
  function useState<S>(initial: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  function useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  function useMemo<T>(factory: () => T, dependencies: readonly unknown[]): T;
  function useCallback<T extends (...args: any[]) => any>(callback: T, dependencies: readonly unknown[]): T;
  const Fragment: any;
  function createElement(type: any, props?: any, ...children: any[]): JSX.Element;
}
declare module 'react' { export = React; }
declare module 'react/jsx-runtime' {
  export function jsx(type: any, props: any, key?: any): JSX.Element;
  export function jsxs(type: any, props: any, key?: any): JSX.Element;
  export const Fragment: any;
}
declare module 'next/link' { const Link: any; export default Link; }
declare module 'next/image' { const Image: any; export default Image; }
declare module 'next/head' { const Head: any; export default Head; }
declare module 'next/navigation' {
  export function useRouter(): { push(path: string): void; replace(path: string): void; back(): void; refresh(): void };
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function useParams(): Record<string, string | string[]>;
}
`

export function ComponentModeEditor({ value, onChange, mode, theme }: ComponentModeEditorProps) {
  const [previewCode, setPreviewCode] = useState(value)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const timeout = window.setTimeout(() => setPreviewCode(value), 600)
    return () => window.clearTimeout(timeout)
  }, [value])

  const preview = useMemo(() => buildComponentPreviewDocument(previewCode), [previewCode, refreshKey])
  const starterCode = mode === 'react'
    ? `import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <main>
      <h1>Hello, React</h1>
      <button onClick={() => setCount((value) => value + 1)}>
        Clicked {count} times
      </button>
    </main>
  )
}`
    : `import Link from 'next/link'

export default function Page() {
  return (
    <main>
      <h1>Hello, Next.js</h1>
      <p>This page component is compiled in the playground preview.</p>
      <Link href="/about">About</Link>
    </main>
  )
}`

  return (
    <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-2">
      <div className="min-h-0 border-b border-rim-subtle lg:border-b-0 lg:border-r">
        <Editor
          value={value}
          // Monaco registers TSX files under the `typescript` language id.
          // `typescriptreact` is a VS Code id and is not registered by Monaco.
          language="typescript"
          path={`file:///playground/${mode}.tsx`}
          theme={theme}
          beforeMount={(monaco) => {
            const tsDefaults = monaco.languages.typescript.typescriptDefaults
            tsDefaults.setCompilerOptions({
              jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
              allowNonTsExtensions: true,
              allowSyntheticDefaultImports: true,
              noEmit: true,
              strict: false,
            })
            tsDefaults.addExtraLib(PLAYGROUND_TYPES, 'file:///node_modules/@types/playground/index.d.ts')
          }}
          onChange={(next) => onChange(next ?? '')}
          options={{
            fontSize: 13.5,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 16 },
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
      <div className="flex min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-rim-subtle bg-raised px-3 py-2">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-ghost">
              {mode === 'nextjs' ? 'Next.js page preview' : 'React preview'}
            </span>
            <p className="text-[10px] text-dim">Single-file TSX, compiled in an isolated preview.</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onChange(starterCode)}
              className="rounded-[var(--radius-sm)] px-2 py-1 text-[10px] font-semibold text-dim hover:bg-card hover:text-ink"
            >
              Insert starter
            </button>
            <button
              onClick={() => { setPreviewCode(value); setRefreshKey((current) => current + 1) }}
              title="Compile and refresh preview"
              aria-label="Compile and refresh preview"
              className="rounded-[var(--radius-sm)] p-1.5 text-ghost transition-colors hover:bg-card hover:text-dim"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
        <iframe
          key={refreshKey}
          srcDoc={preview}
          sandbox="allow-scripts"
          title={mode === 'nextjs' ? 'Next.js page preview' : 'React component preview'}
          className="min-h-0 flex-1 bg-white"
        />
      </div>
    </div>
  )
}
