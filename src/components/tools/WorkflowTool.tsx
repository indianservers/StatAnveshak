import { useState } from 'react'
import type { AnalysisResult } from '../../analysis/types'
import { bootstrapMean, datasetFingerprint, meanInterval, prepareRows, valuesFor, type PrepConfig } from '../../lib/toolkit'
import { readLocalJson, writeLocalJson } from '../../lib/safeStorage'
import { ToolResults } from './ToolResults'
import { downloadText } from './toolIO'
import type { PanelProps } from './toolTypes'
const STAGES = ['impute-mean', 'impute-median', 'standardize', 'descriptives', 'bootstrap', 'report']
export function WorkflowTool({ dataset, record, message, initialOptions: initial = {} }: PanelProps) {
  const [stages, setStages] = useState<string[]>(() => { const raw = initial.stages ?? readLocalJson<unknown>('tools-workflow', null); return Array.isArray(raw) && raw.every(s => typeof s === 'string' && STAGES.includes(s)) ? raw as string[] : ['impute-mean', 'descriptives', 'report'] })
  const [column, setColumn] = useState(String(initial.column ?? dataset?.schema.find(c => c.type === 'numeric')?.name ?? '')), [stage, setStage] = useState('bootstrap'), [seed, setSeed] = useState(Number(initial.seed ?? 42)), [result, setResult] = useState<AnalysisResult | null>(null), [report, setReport] = useState(''), [error, setError] = useState('')
  const edit = (next: string[]) => { setStages(next); setResult(null); setReport('') }
  const run = () => {
    try {
      setError(''); if (!dataset) throw new Error('Load a dataset to run a workflow.'); if (!stages.length || stages.length > 12) throw new Error('Use between one and twelve workflow steps.')
      let rows = dataset.data, current = column, analyzed = false
      const tables: AnalysisResult['tables'] = [], log: string[] = []
      stages.forEach((s, index) => {
        if (s === 'report' && index !== stages.length - 1) throw new Error('Move the report step to the end.')
        if (['impute-mean', 'impute-median', 'standardize'].includes(s)) {
          if (analyzed) throw new Error('Place preparation steps before analysis steps.')
          const output = `${column}_scaled_${index + 1}`, config: PrepConfig = { column: current, output, method: s === 'standardize' ? 'z' : s === 'impute-median' ? 'median' : 'mean', group: '', other: '', constant: 0, mapping: '{}', minimum: 0, maximum: 100, required: false, expected: 'numeric', threshold: 1.5, keys: [] }
          rows = prepareRows(rows, s === 'standardize' ? 'scale' : 'impute', config); if (s === 'standardize') current = output
        } else if (s === 'descriptives') { const ci = meanInterval(valuesFor(rows, current)); tables.push({ id: `stage-${index}`, title: `Step ${index + 1}: mean interval`, columns: ['Column', 'n', 'Mean', 'SE', 'Low', 'High'], rows: [[current, ci.n, ci.mean, ci.se, ci.low, ci.high]] }); analyzed = true }
        else if (s === 'bootstrap') { const b = bootstrapMean(valuesFor(rows, current), 1000, seed); tables.push({ id: `stage-${index}`, title: `Step ${index + 1}: bootstrap mean`, columns: ['Column', 'Mean', 'Low', 'High', 'Seed'], rows: [[current, b.mean, b.low, b.high, seed]] }); analyzed = true }
        else if (!analyzed) throw new Error('Add an analysis step before reporting.')
        log.push(`${index + 1}. ${s}: ${current} (${rows.length} rows)`)
      })
      if (!analyzed) throw new Error('Add at least one descriptives or bootstrap analysis step.')
      const fingerprint = datasetFingerprint(rows), next: AnalysisResult = { analysisId: 'tools.workflow', title: 'Workflow results', interpretation: `Completed ${stages.length} steps on a prepared copy in memory. Source dataset is unchanged.`, assumptions: ['Mean intervals and resampling assume independent observations. Imputation reduces apparent variation.'], footnotes: [...log, `Prepared fingerprint: ${fingerprint}`], tables, plots: [] }
      setResult(next); setReport([next.title, dataset.name, `Source: ${datasetFingerprint(dataset.data)}`, `Prepared: ${fingerprint}`, `Seed: ${seed}`, ...log, ...tables.map(t => [t.title, t.columns.join('\t'), ...t.rows.map(r => r.join('\t'))].join('\n'))].join('\n\n')); record(next.analysisId, { column, seed, stages, preparedFingerprint: fingerprint }, next)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  }
  return <div className="space-y-4"><div className="tool-fields"><label>Workflow numeric column<select value={column} onChange={e => { setColumn(e.target.value); setResult(null) }}>{dataset?.schema.filter(c => c.type === 'numeric').map(c => <option key={c.name}>{c.name}</option>)}</select></label><label>Workflow seed<input type="number" value={seed} onChange={e => { setSeed(Number(e.target.value)); setResult(null) }}/></label><label>Add workflow stage<select value={stage} onChange={e => setStage(e.target.value)}>{STAGES.map(s => <option key={s}>{s}</option>)}</select></label><button className="tool-button self-end" onClick={() => edit([...stages, stage])}>Add stage</button></div><ol className="space-y-2">{stages.map((s, i) => <li key={`${s}-${i}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700"><span className="mr-auto font-bold">{i + 1}. {s}</span><button aria-label={`Move step ${i + 1} up`} disabled={i === 0} onClick={() => { const next = [...stages]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; edit(next) }}>↑</button><button aria-label={`Move step ${i + 1} down`} disabled={i === stages.length - 1} onClick={() => { const next = [...stages]; [next[i + 1], next[i]] = [next[i], next[i + 1]]; edit(next) }}>↓</button><button aria-label={`Remove step ${i + 1}`} onClick={() => edit(stages.filter((_, j) => j !== i))}>Remove</button></li>)}</ol><div className="flex flex-wrap gap-3"><button className="tool-primary" onClick={run}>Run workflow</button><button onClick={() => message(writeLocalJson('tools-workflow', stages) ? 'Workflow stages saved.' : 'Browser storage is unavailable; workflow was not saved.')}>Save workflow</button>{report && result && stages.at(-1) === 'report' && <button onClick={() => downloadText('workflow-report.txt', report)}>Export workflow report</button>}</div>{error && <p role="alert" className="text-rose-600">{error}</p>}<ToolResults result={result}/></div>
}
