import type { AnalysisResult } from '../../analysis/types'
import { ToolPlot } from './ToolPlot'
export function ToolTable({ columns, rows, caption }: { columns: string[]; rows: (string | number | null)[][]; caption: string }) {
  const fmt = (v: string | number | null) => v === null ? '—' : typeof v === 'number' ? Number.isFinite(v) ? Number(v.toPrecision(6)).toString() : 'Undefined' : v
  return <div className="overflow-auto rounded-xl border border-slate-200 dark:border-slate-700"><table className="w-full text-left text-sm"><caption className="p-3 text-left font-bold">{caption}</caption><thead className="bg-slate-100 dark:bg-slate-800"><tr>{columns.map((c, i) => <th key={i} scope="col" className="p-3">{c}</th>)}</tr></thead><tbody>{rows.slice(0, 200).map((r, i) => <tr key={i} className="border-t border-slate-200 dark:border-slate-700">{r.map((v, j) => <td key={j} className="p-3 tabular-nums">{fmt(v)}</td>)}</tr>)}</tbody></table>{rows.length > 200 && <p className="p-3 text-xs">Showing the first 200 of {rows.length} rows. Export results for the complete table.</p>}</div>
}
export function ToolResults({ result }: { result: AnalysisResult | null }) {
  if (!result) return null
  return <section aria-label="Tool results" className="space-y-4"><p role="status" className="rounded-xl bg-indigo-50 p-4 font-medium dark:bg-indigo-950">{result.interpretation}</p>{result.assumptions.length > 0 && <details open><summary className="font-bold">Assumptions & limitations</summary><ul className="list-disc space-y-1 pl-5 text-sm">{result.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul></details>}{result.tables.map(t => <ToolTable key={t.id} caption={t.title} columns={t.columns} rows={t.rows}/>)}{result.plots.map(p => <ToolPlot key={p.id} plot={p}/>)}{result.footnotes.map((n, i) => <p key={i} className="text-sm text-slate-600 dark:text-slate-300">{n}</p>)}</section>
}
