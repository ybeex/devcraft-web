import type { QueryResult } from '@/lib/api/sandbox'

export type TableResult = Pick<QueryResult, 'command' | 'columns' | 'rows' | 'rowCount' | 'truncated'> & { ms?: number }

function cell(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

/** A query result as a table. NULL is shown as NULL (not blank) because telling them apart is half of learning SQL. */
export function ResultTable({ result }: { result: TableResult }) {
  if (result.columns.length === 0) {
    return <p className="font-mono text-[13px] text-success">{result.command || 'OK'}{result.rowCount ? ` · ${result.rowCount} rows` : ''}{result.ms !== undefined ? ` · ${result.ms} ms` : ''}</p>
  }
  return (
    <div>
      <div className="max-h-[360px] overflow-auto rounded-[var(--radius-sm)] border border-rim-subtle">
        <table className="w-full border-collapse font-mono text-[12.5px]">
          <thead className="sticky top-0 bg-raised text-left text-dim">
            <tr>{result.columns.map((c) => <th key={c} className="whitespace-nowrap px-3 py-1.5 font-semibold">{c}</th>)}</tr>
          </thead>
          <tbody>
            {result.rows.map((r, i) => (
              <tr key={i} className="border-t border-rim-subtle">
                {r.map((v, j) => <td key={j} className={`whitespace-nowrap px-3 py-1 ${v === null ? 'italic text-ghost' : 'text-ink'}`}>{cell(v)}</td>)}
              </tr>
            ))}
            {result.rows.length === 0 && <tr><td colSpan={result.columns.length} className="px-3 py-3 text-ghost">No rows.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-2 font-sans text-[11px] text-ghost">
        {result.rowCount} row{result.rowCount === 1 ? '' : 's'}{result.truncated ? ' shown — there are more; add a LIMIT or a WHERE' : ''}{result.ms !== undefined ? ` · ${result.ms} ms` : ''}
      </p>
    </div>
  )
}
