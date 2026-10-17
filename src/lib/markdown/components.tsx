import type { Components } from 'react-markdown'
import { SyntaxCode } from './SyntaxCode'

/**
 * Shared prose renderer for react-markdown. Originally lived inline in
 * LessonContentPane.tsx; extracted so the community post detail page (and
 * any future markdown surface) renders identically rather than drifting.
 */
export const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="font-display mb-3 mt-6 text-2xl font-bold text-ink first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="font-display mb-2.5 mt-6 text-xl font-bold text-ink">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-5 font-ui text-base font-bold text-ink">{children}</h3>,
  p: ({ children }) => <p className="mb-4 text-sm leading-relaxed text-dim">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-1.5 pl-5 text-sm text-dim">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-sm text-dim">{children}</ol>,
  a: ({ href, children }) => (
    <a href={href} className="text-brand underline underline-offset-2" target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  table: ({ children }) => (
    <div className="mb-4 overflow-x-auto rounded-[var(--radius-md)] border border-rim-subtle">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-raised">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-dim">{children}</th>,
  td: ({ children }) => <td className="border-t border-rim-subtle px-3 py-2 text-dim">{children}</td>,
  code: ({ className, children }) => {
    const isFenced = className?.includes('language-')
    if (!isFenced) {
      return <code className="rounded bg-raised px-1.5 py-0.5 font-mono text-[13px] text-brand">{children}</code>
    }
    const language = className?.replace('language-', '') ?? ''
    return (
      <div className="mb-4 overflow-hidden rounded-[var(--radius-md)] border border-rim-subtle">
        <div className="flex items-center gap-1.5 border-b border-rim-subtle bg-raised px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-error/60" />
          <span className="h-2 w-2 rounded-full bg-warning/60" />
          <span className="h-2 w-2 rounded-full bg-success/60" />
          {language && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-ghost">{language}</span>}
        </div>
        <pre className="overflow-x-auto bg-card p-4">
          <SyntaxCode code={String(children).replace(/\n$/, '')} language={language} />
        </pre>
      </div>
    )
  },
}
