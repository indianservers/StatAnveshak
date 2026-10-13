import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ANALYSIS_BY_ID, ANALYSIS_CATALOG } from '../../analysis/catalog'
import type { AnalysisOptions, AnalysisResult } from '../../analysis/types'
import { isAbortError, runAnalysisInWorker } from '../../lib/workerClient'
import { defaultToolOptions } from './toolDefaults'
import { numberValue } from '../../lib/toolkit'
import type { PanelProps, ToolPreset } from './toolTypes'
import { ToolResults } from './ToolResults'
import { SpecificGuide } from '../learning/SpecificGuide'
import { analysisGuide } from '../../lib/guides/analysisGuides'

export function AnalysisTool({ dataset, record, analysisId = 'descriptives.statistics', initialOptions, savePreset }: PanelProps & { analysisId?: string; initialOptions?: AnalysisOptions; savePreset?: (preset: ToolPreset) => void }) {
  const [analysis, setAnalysis] = useState(analysisId), def = ANALYSIS_BY_ID[analysis]
  const [options, setOptions] = useState<AnalysisOptions>(() => initialOptions ?? defaultToolOptions(def, dataset))
  const selectedNumeric = [...new Set(def.fields.filter(f => 'role' in f && f.role === 'numeric').flatMap(f => Array.isArray(options[f.key]) ? options[f.key] as string[] : typeof options[f.key] === 'string' && options[f.key] ? [options[f.key] as string] : []))]
  const completeCases = dataset?.data.filter(row => selectedNumeric.every(c => numberValue(row[c]) !== null)).length ?? 0
  const [result, setResult] = useState<AnalysisResult | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [name, setName] = useState('My configuration')
  const abort = useRef<AbortController | null>(null)
  useEffect(() => () => abort.current?.abort(), [])
  const update = (key: string, value: AnalysisOptions[string]) => { abort.current?.abort(); setBusy(false); setOptions(o => ({ ...o, [key]: value })); setResult(null) }
  const run = async () => {
    setError('')
    if (!dataset && !def.allowEmptyData) { setError('Load a dataset first.'); return }
    const missing = def.fields.filter(f => 'required' in f && f.required && (Array.isArray(options[f.key]) ? (options[f.key] as string[]).length === 0 : options[f.key] === '' || options[f.key] === undefined))
    if (missing.length) { setError(`Choose ${missing.map(f => f.label).join(', ')}.`); return }
    const invalidNumbers = def.fields.filter(f => f.kind === 'number' && (!Number.isFinite(Number(options[f.key])) || (f.min !== undefined && Number(options[f.key]) < f.min) || (f.max !== undefined && Number(options[f.key]) > f.max)))
    if (invalidNumbers.length) { setError(`Check valid ranges for ${invalidNumbers.map(f => f.label).join(', ')}.`); return }
    if (options.dependent && ['covariates', 'predictors', 'factors'].some(key => Array.isArray(options[key]) && (options[key] as string[]).includes(String(options.dependent)))) { setError('The outcome must not also be selected as a predictor.'); return }
    abort.current?.abort(); const controller = new AbortController(); abort.current = controller; setBusy(true)
    try { const next = await runAnalysisInWorker(analysis, dataset?.data ?? [], options, controller.signal); if (!controller.signal.aborted) { setResult(next); record(analysis, options, next) } }
    catch (e) { if (!isAbortError(e)) setError(e instanceof Error ? e.message : String(e)) }
    finally { if (abort.current === controller) setBusy(false) }
  }
  return <div className="space-y-4"><div className="tool-fields"><label>Analysis method<select aria-label="Analysis method" value={analysis} onChange={e => { abort.current?.abort(); setBusy(false); setAnalysis(e.target.value); setOptions(defaultToolOptions(ANALYSIS_BY_ID[e.target.value], dataset)); setResult(null) }}>{ANALYSIS_CATALOG.filter(d => d.implemented && d.frequentist).map(d => <option key={d.id} value={d.id}>{d.moduleLabel} · {d.title}</option>)}</select></label></div><p className="text-sm">{def.description}</p>{analysisGuide(analysis, options) && <SpecificGuide guide={analysisGuide(analysis, options)!} />}<div className="tool-fields">
    {def.fields.map(f => {
      const pool = 'role' in f ? (dataset?.schema ?? []).filter(c => f.role === 'numeric' ? c.type === 'numeric' : f.role === 'categorical' ? c.type !== 'numeric' : true).map(c => c.name) : dataset?.schema.map(c => c.name) ?? []
      if (f.kind === 'checkboxGroup') return <fieldset key={f.key}><legend>{f.label}</legend>{f.items.map(i => <label key={i.key} className="flex gap-2"><input type="checkbox" checked={Boolean((options[f.key] as Record<string, boolean>)?.[i.key])} onChange={e => update(f.key, { ...(options[f.key] as Record<string, boolean>), [i.key]: e.target.checked })}/>{i.label}</label>)}</fieldset>
      if (f.kind === 'toggle') return <label key={f.key} className="flex items-center gap-2"><input type="checkbox" checked={Boolean(options[f.key])} onChange={e => update(f.key, e.target.checked)}/>{f.label}</label>
      return <label key={f.key}>{f.label}{f.kind === 'number' ? <input aria-label={f.label} type="number" min={f.min} max={f.max} step={f.step ?? 'any'} value={Number(options[f.key] ?? 0)} onChange={e => update(f.key, Number(e.target.value))}/> : f.kind === 'choice' ? <select aria-label={f.label} value={String(options[f.key] ?? '')} onChange={e => update(f.key, e.target.value)}>{f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : f.kind === 'variables' && f.multiple ? <select aria-label={f.label} multiple size={Math.min(5, Math.max(3, pool.length))} value={options[f.key] as string[] ?? []} onChange={e => update(f.key, Array.from(e.target.selectedOptions, o => o.value))}>{pool.map(c => <option key={c}>{c}</option>)}</select> : <select aria-label={f.label} value={String(options[f.key] ?? '')} onChange={e => update(f.key, e.target.value)}><option value="">Select column</option>{pool.map(c => <option key={c}>{c}</option>)}</select>}</label>
    })}
  </div>{dataset && selectedNumeric.length > 0 && <details><summary className="cursor-pointer font-bold">Pre-analysis checks</summary><p className="text-sm">{completeCases} of {dataset.data.length} rows are complete across selected numeric columns: {selectedNumeric.join(', ')}. Missing numeric values are excluded according to the method. Confirm independence and the study design; use Automatic assumption checks to inspect spread and outliers.</p></details>}<div className="flex flex-wrap gap-3"><button className="tool-primary" disabled={busy} onClick={() => void run()}>{busy ? 'Running analysis…' : 'Run analysis'}</button>{busy && <button onClick={() => { abort.current?.abort(); setBusy(false) }}>Cancel analysis</button>}<Link className="tool-button" to={`/analysis/${analysis}`}>Open full analysis workspace</Link></div>
  {savePreset && <div className="tool-fields"><label>Configuration name<input value={name} onChange={e => setName(e.target.value)}/></label><button className="tool-button self-end" disabled={!name.trim()} onClick={() => { savePreset({ id: crypto.randomUUID(), name: name.trim(), analysis, options }) }}>Save configuration</button></div>}{error && <p role="alert" className="text-rose-600">{error}</p>}<ToolResults result={result}/></div>
}


