import { useState } from 'react'
import { compareDatasets, duplicateIndices, isMissing, missingProfile, outlierIndices, parseCategoryOrder, prepareRows, validationRows, type PrepConfig, type ToolRow } from '../../lib/toolkit'
import { detectSchema } from '../../lib/schema'
import { saveDataset } from '../../lib/storage'
import { useStore } from '../../store/useStore'
import type { PanelProps } from './toolTypes'
import { ToolTable } from './ToolResults'
import { ToolPlot } from './ToolPlot'
import type { PlotSpec } from '../../analysis/types'
import { SpecificGuide } from '../learning/SpecificGuide'
import { preparationGuide } from '../../lib/guides/variantGuides'

export function PreparationTools({ feature, dataset, message }: PanelProps) {
  const datasets = useStore(s => s.datasets), addDataset = useStore(s => s.addDataset), setActive = useStore(s => s.setActiveDataset)
  const cols = dataset?.schema.map(c => c.name) ?? []
  const [config, setConfig] = useState<PrepConfig>({ column: dataset?.schema.find(c => c.type === 'numeric')?.name ?? cols[0] ?? '', output: 'derived_value', method: feature === 'scale' ? 'z' : feature === 'impute' ? 'mean' : feature === 'dates' ? 'month' : feature === 'transform' ? 'add' : 'iqr', group: '', other: '', constant: 0, mapping: '{}', minimum: 0, maximum: 100, required: true, expected: 'numeric', threshold: 1.5, keys: cols })
  const [preview, setPreview] = useState<ToolRow[] | null>(null), [detail, setDetail] = useState<{ columns: string[]; rows: (string | number | null)[][]; caption: string }[]>([]), [error, setError] = useState(''), [busy, setBusy] = useState(false), [otherDataset, setOtherDataset] = useState(datasets.find(d => d.id !== dataset?.id)?.id ?? '')
  const [missingPlot, setMissingPlot] = useState<PlotSpec | null>(null)
  if (!dataset) return <p>Load a dataset from Data → Upload to use preparation tools.</p>
  const rows = dataset.data
  const change = (patch: Partial<PrepConfig>) => { setConfig(c => ({ ...c, ...patch })); setPreview(null); setDetail([]) }
  const inspect = () => {
    setError(''); setPreview(null)
    try {
      if (feature === 'missing') { const profile = missingProfile(rows, cols); setDetail([{ caption: 'Missing values', columns: ['Column', 'Missing', 'Missing %'], rows: profile.counts.map(r => [...r]) }, { caption: 'Missing patterns', columns: ['Missing columns', 'Rows'], rows: profile.patterns }]); setMissingPlot({ id: 'missingness', title: 'Missingness pattern · first 1,000 rows (1 = missing)', data: [{ type: 'heatmap', x: cols, y: rows.slice(0, 1000).map((_, i) => i + 1), z: rows.slice(0, 1000).map(r => cols.map(c => isMissing(r[c]) ? 1 : 0)), zmin: 0, zmax: 1, colorscale: [[0, '#d1fae5'], [1, '#be123c']], hovertemplate: 'Row %{y}<br>%{x}<br>Missing: %{z}<extra></extra>' }], layout: { yaxis: { title: { text: 'Original row' } } } }); return }
      if (feature === 'validation') { if (config.minimum > config.maximum) throw new Error('Minimum must not exceed maximum.'); const issues = validationRows(rows, config); setDetail([{ caption: issues.length ? `${issues.length} validation issues` : 'All rows pass the rule', columns: ['Row', 'Value', 'Issue'], rows: issues }]); return }
      if (feature === 'dataset-compare') { const other = datasets.find(d => d.id === otherDataset); if (!other) throw new Error('Choose a second dataset.'); setDetail([{ caption: 'Dataset changes', columns: ['Key', 'Column / change', 'Before', 'After'], rows: compareDatasets(rows, other.data, config.column) }]); return }
      if (feature === 'duplicates' || feature === 'outliers') { const indices = feature === 'duplicates' ? duplicateIndices(rows, config.keys) : outlierIndices(rows, config.column, config.method, config.threshold); setDetail([{ caption: `${indices.length} ${feature === 'duplicates' ? 'duplicate copies' : 'flagged observations'} (original rows)`, columns: ['Original row', ...cols], rows: indices.map(i => [i + 1, ...cols.map(c => String(rows[i][c] ?? ''))]) }]) }
      const next = prepareRows(rows, feature, config); setPreview(next)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  }
  const apply = async () => {
    if (!preview) return
    setBusy(true); setError('')
    try {
      const schema = detectSchema(preview).map(c => feature === 'recode' && c.name === config.column ? { ...c, categoryOrder: parseCategoryOrder(config.categoryOrder) } : c), next = { ...dataset, id: crypto.randomUUID(), name: `${dataset.name} · ${feature}`, data: preview, schema, rows: preview.length, cols: schema.length, createdAt: Date.now(), sourceType: 'manual' as const, parseDetails: `Tools ${feature}; source ${dataset.id}; settings ${JSON.stringify(config)}` }
      await saveDataset(next); addDataset(next); setActive(next); message(`Saved ${next.name}. The source dataset is preserved.`)
    } catch (e) { setError(`Could not save prepared copy: ${e instanceof Error ? e.message : String(e)}`) }
    finally { setBusy(false) }
  }
  const methods = feature === 'impute' ? ['mean', 'median', 'group', 'constant'] : feature === 'scale' ? ['z', 'minmax'] : feature === 'transform' ? ['add', 'subtract', 'multiply', 'divide', 'log', 'sqrt', 'square'] : feature === 'dates' ? ['year', 'month', 'weekday', 'date', 'days'] : ['iqr', 'z', 'mad']
  return <div className="space-y-4">{preparationGuide(feature, config.method) && <SpecificGuide guide={preparationGuide(feature, config.method)!} />}<p className="text-sm">Preview changes before saving a prepared copy. Blank strings, null, and undefined are missing; zero remains a value.</p><div className="tool-fields">
    {!['missing', 'duplicates'].includes(feature) && <label>Column<select value={config.column} onChange={e => change({ column: e.target.value })}>{cols.map(c => <option key={c}>{c}</option>)}</select></label>}
    {!['missing', 'duplicates', 'validation', 'recode', 'dataset-compare'].includes(feature) && <label>Preparation method<select value={config.method} onChange={e => change({ method: e.target.value, threshold: e.target.value === 'iqr' ? 1.5 : 3 })}>{methods.map(c => <option key={c}>{c}</option>)}</select></label>}
    {['transform', 'scale', 'dates'].includes(feature) && <label>New column name<input value={config.output} onChange={e => change({ output: e.target.value })}/></label>}
    {feature === 'impute' && config.method === 'group' && <label>Imputation group<select value={config.group} onChange={e => change({ group: e.target.value })}><option value="">Choose group</option>{cols.filter(c => c !== config.column).map(c => <option key={c}>{c}</option>)}</select></label>}
    {((feature === 'impute' && config.method === 'constant') || feature === 'transform') && <label>Constant operand<input type="number" step="any" value={config.constant} onChange={e => change({ constant: Number(e.target.value) })}/></label>}
    {['transform', 'dates'].includes(feature) && <label>Second column (optional)<select value={config.other} onChange={e => change({ other: e.target.value })}><option value="">Use constant / no second date</option>{cols.map(c => <option key={c}>{c}</option>)}</select></label>}
    {feature === 'outliers' && <label>Outlier threshold<input type="number" min=".1" step=".1" value={config.threshold} onChange={e => change({ threshold: Number(e.target.value) })}/></label>}
    {feature === 'dataset-compare' && <label>Second dataset<select value={otherDataset} onChange={e => { setOtherDataset(e.target.value); setDetail([]) }}><option value="">Select dataset</option>{datasets.filter(d => d.id !== dataset.id).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>}
    {feature === 'validation' && <><label>Expected type<select value={config.expected} onChange={e => change({ expected: e.target.value })}><option value="numeric">Numeric</option><option value="date">Date</option><option value="any">Any</option></select></label><label>Minimum allowed<input type="number" value={config.minimum} onChange={e => change({ minimum: Number(e.target.value) })}/></label><label>Maximum allowed<input type="number" value={config.maximum} onChange={e => change({ maximum: Number(e.target.value) })}/></label><label className="flex items-center gap-2"><input type="checkbox" checked={config.required} onChange={e => change({ required: e.target.checked })}/>Required value</label></>}
  </div>
    {feature === 'duplicates' && <fieldset><legend className="font-bold">Duplicate key columns</legend><div className="flex flex-wrap gap-3">{cols.map(c => <label key={c} className="flex items-center gap-2"><input type="checkbox" checked={config.keys.includes(c)} onChange={e => change({ keys: e.target.checked ? [...config.keys, c] : config.keys.filter(k => k !== c) })}/>{c}</label>)}</div></fieldset>}
    {feature === 'recode' && <><label className="block">Category mapping (JSON)<textarea className="mt-1 w-full" rows={4} value={config.mapping} onChange={e => change({ mapping: e.target.value })} placeholder={'{"Old category":"New category"}'}/></label><label className="block">Category display order (JSON array)<input value={config.categoryOrder ?? '[]'} onChange={e => change({ categoryOrder: e.target.value })} placeholder={'["Low","Medium","High"]'}/></label><p className="text-xs">The saved order controls categories in Tools charts. It does not reorder dataset rows; statistical engines retain their own ordering rules.</p></>}
    {feature === 'impute' && <p className="text-xs">Single-value imputation reduces apparent variability. For inference, assess its impact rather than treating filled values as observed data.</p>}
    {feature === 'dates' && <p className="text-xs">Calendar extraction uses UTC. Weekday is 0 = Sunday through 6 = Saturday; elapsed days = first date − second date. Invalid dates become missing.</p>}
    <button className="tool-primary" onClick={inspect}>{['missing', 'validation', 'dataset-compare'].includes(feature) ? 'Inspect data' : 'Preview preparation'}</button>{error && <p role="alert" className="text-rose-600">{error}</p>}{detail.map(t => <ToolTable key={t.caption} {...t}/>)}
    {missingPlot && <ToolPlot plot={missingPlot}/>}
    {preview && <><p role="status">Prepared preview: {preview.length} rows. Source: {rows.length} rows. Undefined transform results become missing.</p><ToolTable caption="Prepared data preview" columns={Object.keys(preview[0] ?? rows[0])} rows={preview.slice(0, 20).map(r => Object.keys(preview[0] ?? rows[0]).map(c => String(r[c] ?? '')))}/><button className="tool-primary" disabled={busy} onClick={() => void apply()}>{busy ? 'Saving…' : 'Save prepared copy'}</button></>}
  </div>
}
