import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import type { Dataset } from '../../types'
import { importDatasetFile } from '../../lib/importDataset'
import { anovaReport, anovaRowsCsv, downloadText, groupMeanInterval, mapAnovaRows, omegaSquared, validateAnovaRows } from '../../lib/anovaWorkbench'
import { formatNum, formatP, oneWayAnova, oneWayResiduals, postHocComparisons, varianceTest, type AnovaObservation, type OneWayResult, type PostHocMethod } from '../../lib/anovaStudio'
import { AnovaCard, AnovaSelect, Insight } from './shared'
import { FDistPlot, ForestPlot, ResidualPlots } from './plots'
import { readLocalJson, writeLocalJson } from '../../lib/safeStorage'

type Snapshot = { id: string; source: string; rows: AnovaObservation[]; alpha: number; at: number }

export function AnovaWorkbench({ rows, result, source, setSource, onRows, alpha, setAlpha }: { rows: AnovaObservation[]; result: OneWayResult; source: string; setSource: (value: string) => void; onRows: (value: AnovaObservation[]) => void; alpha: number; setAlpha: (value: number) => void }) {
  const activeDataset = useStore((state) => state.activeDataset)
  const [imported, setImported] = useState<Dataset | null>(null)
  const [groupColumn, setGroupColumn] = useState('')
  const [valueColumn, setValueColumn] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState('All')
  const [method, setMethod] = useState<PostHocMethod>('holm')
  const [diagnostic, setDiagnostic] = useState<'qq' | 'hist'>('qq')
  const [snapshots, setSnapshots] = useState<Snapshot[]>(() => {
    const raw = readLocalJson<unknown>('anova-snapshots', [])
    return Array.isArray(raw) ? raw.filter((item): item is Snapshot => Boolean(item && typeof item === 'object' && typeof item.source === 'string' && typeof item.id === 'string' && Array.isArray(item.rows) && item.rows.every((row: AnovaObservation) => row && typeof row.id === 'string' && typeof row.a === 'string' && Number.isFinite(row.y)) && typeof item.alpha === 'number' && item.alpha > 0 && item.alpha < 1 && validateAnovaRows(item.rows) === null)).slice(0, 3) : []
  })
  const dataset = imported ?? activeDataset
  const activeFilter = result.groups.some((group) => group.name === filter) ? filter : 'All'
  const filtered = activeFilter === 'All' ? rows : rows.filter((row) => row.a === activeFilter)
  const maxPage = Math.max(0, Math.ceil(filtered.length / 10) - 1)
  const safePage = Math.min(page, maxPage)
  const visible = filtered.slice(safePage * 10, safePage * 10 + 10)
  const valid = validateAnovaRows(rows) === null && Number.isFinite(result.f)
  const residuals = useMemo(() => valid ? oneWayResiduals(rows) : [], [rows, valid])
  const variance = useMemo(() => valid ? varianceTest(rows) : null, [rows, valid])
  const pairs = useMemo(() => valid ? postHocComparisons(result, method, alpha) : null, [result, method, alpha, valid])
  const report = anovaReport(result, source)

  const apply = () => {
    if (!dataset || !groupColumn || !valueColumn || groupColumn === valueColumn) { setStatus('Choose separate group and numeric outcome columns.'); return }
    const mapped = mapAnovaRows(dataset.data, groupColumn, valueColumn)
    const error = validateAnovaRows(mapped.rows)
    if (error) { setStatus(error); return }
    onRows(mapped.rows); setSource(`${dataset.name}: ${groupColumn} → ${valueColumn}`); setPage(0); setFilter('All')
    setStatus(`Loaded ${mapped.rows.length} observations. Excluded ${mapped.excluded} rows with missing groups or nonnumeric outcomes.`)
  }
  const edit = (id: string, raw: string) => {
    const value = raw.trim() ? Number(raw) : NaN
    if (!Number.isFinite(value)) { setStatus('Enter a finite numeric value.'); return }
    onRows(rows.map((row) => row.id === id ? { ...row, y: value } : row))
    setStatus('Observation updated. Use Undo to restore it.')
  }

  return <div className="space-y-4">
    <AnovaCard title="Use your own data">
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">Map one grouping factor and one numeric outcome. This lab supports 2–6 independent groups and up to 5,000 rows.</p>
      <div className="grid gap-3 md:grid-cols-3"><label className="text-sm font-bold">CSV / Excel / JSON<input type="file" aria-label="Import ANOVA data" disabled={busy} accept=".csv,.tsv,.txt,.xlsx,.xls,.json" className="mt-1 block w-full text-xs" onChange={async (event) => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; setBusy(true); try { const next = await importDatasetFile(file); setImported(next); setGroupColumn(''); setValueColumn(''); setStatus(`Read ${next.name}. Choose the columns below; data is not uploaded to a server.`) } catch (error) { setStatus(error instanceof Error ? error.message : 'Import failed.') } finally { setBusy(false) } }} /></label><div><p className="text-sm font-bold">Dataset for mapping</p><p className="text-sm">{dataset?.name ?? 'No active dataset'}</p>{imported && <button className="anova-btn anova-btn-ghost mt-1" onClick={() => { setImported(null); setGroupColumn(''); setValueColumn('') }}>Use active dataset instead</button>}</div><p className="text-xs text-slate-600 dark:text-slate-300">{busy ? 'Reading file…' : 'Missing or invalid outcomes are excluded explicitly. Every remaining group needs at least two observations.'}</p></div>
      {dataset && <div className="mt-3 flex flex-wrap items-end gap-3"><AnovaSelect label="Group column" value={groupColumn} onChange={setGroupColumn} options={[{ value: '', label: 'Choose factor' }, ...dataset.schema.map((column) => ({ value: column.name, label: column.name }))]} /><AnovaSelect label="Outcome column" value={valueColumn} onChange={setValueColumn} options={[{ value: '', label: 'Choose outcome' }, ...dataset.schema.map((column) => ({ value: column.name, label: `${column.name} (${column.type})` }))]} /><button className="anova-btn" onClick={apply} disabled={busy}>Analyze mapped data</button></div>}
      <p role="status" className="mt-3 text-sm font-semibold">{status}</p>
    </AnovaCard>

    <AnovaCard title="Data explorer & keyboard editing">
      <div className="mb-3 flex flex-wrap items-end gap-3"><AnovaSelect label="Filter group" value={result.groups.some((group) => group.name === filter) ? filter : 'All'} onChange={(value) => { setFilter(value); setPage(0) }} options={[{ value: 'All', label: 'All groups' }, ...result.groups.map((group) => ({ value: group.name, label: group.name }))]} /><button className="anova-btn anova-btn-ghost" onClick={() => downloadText('anova-data.csv', anovaRowsCsv(rows), 'text/csv')}>Download data CSV</button></div>
      <p className="mb-2 text-xs">Edit a value and press Enter or leave the field to apply. Blank and nonnumeric values are rejected.</p>
      <div className="overflow-x-auto"><table className="anova-table"><caption className="sr-only">All observations, ten per page</caption><thead><tr><th scope="col">ID</th><th scope="col">Group</th><th scope="col">Outcome</th></tr></thead><tbody>{visible.map((row) => <tr key={`${row.id}-${row.y}`}><td>{row.id}</td><td>{row.a}</td><td><input aria-label={`Outcome for ${row.id}`} type="number" step="any" defaultValue={row.y} className="anova-select max-w-40" onBlur={(event) => { const raw = event.target.value; if (raw !== String(row.y)) edit(row.id, raw); if (!raw.trim() || !Number.isFinite(Number(raw))) event.target.value = String(row.y) }} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }} /></td></tr>)}</tbody></table></div>
      <div className="mt-3 flex items-center justify-between gap-2"><button className="anova-btn anova-btn-ghost" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous rows</button><p className="text-xs" role="status">Page {safePage + 1} / {maxPage + 1} · {filtered.length} observations</p><button className="anova-btn anova-btn-ghost" disabled={safePage >= maxPage} onClick={() => setPage(safePage + 1)}>Next rows</button></div>
    </AnovaCard>

    <div className="grid gap-4 xl:grid-cols-2"><AnovaCard title="Group summaries & confidence intervals">
      <p className="mb-2 text-xs">{Math.round((1 - alpha) * 100)}% t intervals for individual means; these are not simultaneous pairwise intervals.</p>
      <div className="overflow-x-auto"><table className="anova-table"><thead><tr><th>Group</th><th>n</th><th>Mean</th><th>SD</th><th>Mean CI</th></tr></thead><tbody>{result.groups.map((group) => { const [lo, hi] = groupMeanInterval(group.mean, group.sd, group.n, alpha); return <tr key={group.name}><td>{group.name}</td><td>{group.n}</td><td>{formatNum(group.mean)}</td><td>{formatNum(group.sd)}</td><td>[{formatNum(lo)}, {formatNum(hi)}]</td></tr> })}</tbody></table></div>
      <p className="mt-3 text-sm">{new Set(result.groups.map((group) => group.n)).size === 1 ? 'Balanced design: equal group sizes.' : 'Unbalanced design: group sizes differ. Pay particular attention to variance differences.'}</p>
    </AnovaCard><AnovaCard title="Effect size & decision threshold">
      <AnovaSelect label="Significance level α" value={String(alpha)} onChange={(value) => setAlpha(Number(value))} options={[{ value: '0.01', label: '0.01 (99% intervals)' }, { value: '0.05', label: '0.05 (95% intervals)' }, { value: '0.1', label: '0.10 (90% intervals)' }]} />
      <div className="mt-3 grid grid-cols-2 gap-3"><Insight title="η²">{formatNum(result.eta2, 4)} · Fraction of sample variation explained by groups.</Insight><Insight title="ω²">{formatNum(omegaSquared(result), 4)} · Bias-adjusted estimate, bounded below at zero here.</Insight></div><p className="mt-2 text-xs">Statistical significance does not measure practical importance. Interpret effect sizes in the study context.</p>
    </AnovaCard></div>

    {valid && <details className="anova-card p-5"><summary className="cursor-pointer font-bold">Assumption diagnostics & F distribution</summary><div className="mt-4 grid gap-4 xl:grid-cols-2"><div><AnovaSelect label="Residual diagnostic" value={diagnostic} onChange={(value) => setDiagnostic(value as 'qq' | 'hist')} options={[{ value: 'qq', label: 'Normal Q–Q plot' }, { value: 'hist', label: 'Residual histogram' }]} /><ResidualPlots residuals={residuals} mode={diagnostic} /><p className="text-xs">Inspect residual shape and outliers; plots do not establish independence.</p></div><div><FDistPlot df1={result.dfB} df2={result.dfW} fObs={result.f} fCrit={result.fCrit} alpha={alpha} /><p className="text-sm">Critical F = {formatNum(result.fCrit)}; observed F = {formatNum(result.f)}. The red tail is the rejection region at α = {alpha}.</p></div>{variance && <Insight title="Brown–Forsythe variance check" tone={variance.p < alpha ? 'warn' : 'info'}>F = {formatNum(variance.f)}, p = {formatP(variance.p)}. {Number.isFinite(variance.p) ? variance.p < alpha ? 'Evidence of unequal variances; consider Welch ANOVA.' : 'No detected variance difference; this does not prove equal variances.' : 'Variance check is undefined for these data.'}<Link className="mt-2 block underline" to="/statistics/anova/anova-assumptions">Explore assumptions →</Link></Insight>}<Insight title="Check the study design">Observations must be independent. For repeated measurements, use the repeated-measures lab. These diagnostics cannot verify how data were collected.</Insight></div></details>}

    {pairs && <details className="anova-card p-5"><summary className="cursor-pointer font-bold">Pairwise comparisons on these same data</summary><div className="mt-4"><AnovaSelect label="Multiple-comparison method" value={method} onChange={(value) => setMethod(value as PostHocMethod)} options={[{ value: 'holm', label: 'Holm-adjusted pooled t tests' }, { value: 'tukey', label: 'Tukey HSD / Tukey–Kramer' }]} /><p className="mt-2 text-xs">{pairs.methodTitle}. Pooled comparisons assume equal variances. {method === 'holm' ? 'p-values are Holm-adjusted; displayed intervals are individual unadjusted t intervals.' : 'Intervals are simultaneous Tukey intervals.'} {result.significant ? '' : 'The omnibus result is not significant; treat further comparisons according to your prespecified analysis plan.'}</p><ForestPlot pairs={pairs.pairs} height={Math.max(220, pairs.pairs.length * 32 + 50)} /><div className="overflow-x-auto"><table className="anova-table"><thead><tr><th>Pair</th><th>Difference</th><th>CI</th><th>Adjusted p</th><th>Decision</th></tr></thead><tbody>{pairs.pairs.map((pair) => <tr key={`${pair.a}-${pair.b}`}><td>{pair.a} − {pair.b}</td><td>{formatNum(pair.diff)}</td><td>[{formatNum(pair.ciLo)}, {formatNum(pair.ciHi)}]</td><td>{formatP(pair.pAdj)}</td><td>{pair.significant ? 'Reject' : 'Fail to reject'}</td></tr>)}</tbody></table></div></div></details>}

    <AnovaCard title="Save, compare & export">
      <div className="flex flex-wrap gap-2"><button className="anova-btn" disabled={!valid} onClick={async () => { try { await navigator.clipboard.writeText(report); setStatus('Report copied.') } catch { setStatus('Clipboard unavailable. Download the report instead.') } }}>Copy report</button><button className="anova-btn anova-btn-ghost" disabled={!valid} onClick={() => downloadText('anova-report.txt', report)}>Download report</button><button className="anova-btn anova-btn-ghost" disabled={!valid} onClick={() => { const next = [{ id: crypto.randomUUID(), source, rows: rows.map((row) => ({ ...row })), alpha, at: Date.now() }, ...snapshots].slice(0, 3); if (writeLocalJson('anova-snapshots', next)) { setSnapshots(next); setStatus('Snapshot saved locally (up to three).') } else setStatus('Could not save snapshot: browser storage is unavailable or full.') }}>Save snapshot</button></div>
      {snapshots.length > 0 && <ul className="mt-3 space-y-2">{snapshots.map((snapshot) => <li key={snapshot.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-950"><span className="min-w-0 flex-1 text-sm">{snapshot.source} · N = {snapshot.rows.length} · α = {snapshot.alpha} · {new Date(snapshot.at).toLocaleString()}</span><button className="anova-btn anova-btn-ghost" onClick={() => { onRows(snapshot.rows); setSource(snapshot.source); setAlpha(snapshot.alpha); setFilter('All'); setPage(0); setStatus('Snapshot restored. Undo restores the previous data.') }}>Restore snapshot</button><button className="anova-btn anova-btn-ghost" aria-label={`Delete snapshot ${snapshot.source}`} onClick={() => { const next = snapshots.filter((item) => item.id !== snapshot.id); if (writeLocalJson('anova-snapshots', next)) setSnapshots(next); else setStatus('Could not update stored snapshots.') }}>Delete</button></li>)}</ul>}
      {snapshots.length > 0 && <div className="mt-3 overflow-x-auto"><table className="anova-table"><caption className="mb-2 text-left text-sm font-bold">Compare saved results with current data</caption><thead><tr><th>Data</th><th>F</th><th>p</th><th>η²</th><th>α</th></tr></thead><tbody><tr><td>Current</td><td>{formatNum(result.f)}</td><td>{formatP(result.p)}</td><td>{formatNum(result.eta2, 4)}</td><td>{alpha}</td></tr>{snapshots.map((snapshot) => { const saved = oneWayAnova(snapshot.rows, snapshot.alpha); return <tr key={snapshot.id}><td>{snapshot.source}</td><td>{formatNum(saved.f)}</td><td>{formatP(saved.p)}</td><td>{formatNum(saved.eta2, 4)}</td><td>{snapshot.alpha}</td></tr> })}</tbody></table></div>}
      <details className="mt-3"><summary className="cursor-pointer text-sm font-bold">Report preview</summary><pre className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-950">{report}</pre></details>
      <p role="status" className="mt-2 text-sm">{status}</p>
    </AnovaCard>
  </div>
}
