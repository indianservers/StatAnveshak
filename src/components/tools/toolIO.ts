import type { ToolRun } from './toolTypes'
import { readLocalJson } from '../../lib/safeStorage'
export function downloadText(name: string, text: string, type = 'text/plain') { const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) }
export function runsFromStorage(): ToolRun[] {
  const raw = readLocalJson<unknown>('tools-runs', [])
  return Array.isArray(raw) ? raw.filter((r): r is ToolRun => Boolean(r && typeof r === 'object' && typeof r.id === 'string' && typeof r.analysis === 'string' && r.options && r.result && Array.isArray(r.result.tables) && Array.isArray(r.result.plots))).slice(0, 20) : []
}
export function reportText(runs: ToolRun[], notes: string) { return ['# Analysis report', notes, ...runs.map(r => [`## ${r.result.title}`, `Dataset: ${r.dataset} · ${r.rows} rows · ${r.fingerprint}`, `Method: ${r.analysis}`, `Settings: ${JSON.stringify(r.options)}`, r.result.interpretation, 'Assumptions:', ...r.result.assumptions.map(s => `- ${s}`), ...r.result.tables.map(t => [t.title, t.columns.join('\t'), ...t.rows.map(row => row.join('\t'))].join('\n')), ...r.result.footnotes].join('\n\n'))].join('\n\n') }
