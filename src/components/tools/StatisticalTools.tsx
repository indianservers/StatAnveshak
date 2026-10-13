import { numericToolColumns } from './toolDefaults'
import { useState } from 'react'
import type { AnalysisResult } from '../../analysis/types'
import { adjustP, average, bootstrapMean, effectSize, meanInterval, missingProfile, outlierIndices, permutationMean, valuesFor, variance } from '../../lib/toolkit'
import type { PanelProps } from './toolTypes'
import { ToolResults } from './ToolResults'

export function StatisticalTools({ feature, dataset, record, initialOptions: initial = {} }: PanelProps) {
  const nums = numericToolColumns(dataset), cols = dataset?.schema.map(c => c.name) ?? []
  const [column, setColumn] = useState(String(initial.column ?? nums[0] ?? '')), [group, setGroup] = useState(String(initial.group ?? dataset?.schema.find(c => c.type === 'categorical')?.name ?? '')), [aGroup, setAGroup] = useState(String(initial.groupA ?? '')), [bGroup, setBGroup] = useState(String(initial.groupB ?? ''))
  const [level, setLevel] = useState(Number(initial.ciLevel ?? .95)), [iterations, setIterations] = useState(Number(initial.iterations ?? 1000)), [seed, setSeed] = useState(Number(initial.seed ?? 42)), [pText, setPText] = useState(String(initial.pValues ?? '0.01, 0.04, 0.03, 0.2')), [error, setError] = useState(''), [result, setResult] = useState<AnalysisResult | null>(null)
  const levels = [...new Set((dataset?.data ?? []).filter(r => r[group] != null && String(r[group]).trim()).map(r => String(r[group])))], ga = aGroup || levels[0] || '', gb = bGroup || levels[1] || ''
  const grouped = ['effect', 'permutation'].includes(feature)
  const run = () => {
    setError('')
    try {
      const rows = dataset?.data ?? [], values = valuesFor(rows, column), assumptions = ['Independent observations are assumed; the tool cannot verify independence or the sampling design.'], tables: AnalysisResult['tables'] = [], plots: AnalysisResult['plots'] = []
      let interpretation = ''
      if (!(level >= .8 && level <= .99) || !Number.isInteger(iterations) || iterations < 100 || iterations > 5000 || !Number.isFinite(seed)) throw new Error('Use confidence .80–.99, integer iterations 100–5000, and a finite seed.')
      if (feature === 'multiplicity') { const p = pText.split(/[\s,;]+/).filter(Boolean).map(Number), holm = adjustP(p, 'holm'), bh = adjustP(p, 'bh'); tables.push({ id: 'adjust', title: 'Adjusted p-values', columns: ['Test', 'Raw p', 'Holm (FWER)', 'BH (FDR)'], rows: p.map((v, i) => [i + 1, v, holm[i], bh[i]]) }); interpretation = 'Holm controls family-wise error; Benjamini–Hochberg controls false discovery rate under its dependence conditions. Define the test family before inspecting results.' }
      else if (!dataset || !values.length) throw new Error('Load data and select a numeric column.')
      else if (grouped) {
        if (!group || !ga || !gb || ga === gb) throw new Error('Choose two distinct groups.')
        const a = valuesFor(rows.filter(r => String(r[group]) === ga), column), b = valuesFor(rows.filter(r => String(r[group]) === gb), column)
        if (feature === 'effect') { const e = effectSize(a, b); tables.push({ id: 'effect', title: `${ga} minus ${gb}`, columns: ['n A', 'n B', 'Cohen d', 'Hedges g', 'Pooled SD'], rows: [[a.length, b.length, e.d, e.g, e.pooledSD]] }); interpretation = `Signed standardized mean difference: ${e.d.toFixed(3)}. Group order determines the sign.`; assumptions.push('Pooled-SD effect sizes assume a meaningful common measurement scale; Hedges correction is approximate.') }
        else { const p = permutationMean(a, b, iterations, seed); tables.push({ id: 'perm', title: 'Two-sided permutation mean test', columns: ['Difference A−B', 'Monte Carlo p', 'Shuffles', 'Seed'], rows: [[p.observed, p.p, p.iterations, seed]] }); plots.push({ id: 'null', title: 'Shuffled mean differences', data: [{ type: 'histogram', x: p.differences }], layout: {} }); interpretation = `Observed mean difference ${p.observed.toFixed(4)}; two-sided Monte Carlo p = ${p.p.toFixed(4)}.`; assumptions.push('Label exchangeability under the null; this test is unsuitable for paired/dependent data or a design with nonexchangeable groups.') }
      } else if (feature === 'assumptions') {
        const missing = missingProfile(rows, [column]), flags = outlierIndices(rows, column)
        tables.push({ id: 'checks', title: 'Pre-analysis data checks', columns: ['Check', 'Value'], rows: [['Complete n', values.length], ['Missing %', missing.counts[0][2]], ['Distinct values', new Set(values).size], ['Sample SD', Math.sqrt(variance(values))], ['IQR outliers', flags.length]] })
        interpretation = 'Review missingness, spread, and flagged values before choosing a method. Sample size and outlier checks do not establish normality or validate a study design.'
        plots.push({ id: 'distribution', title: 'Observed distribution', data: [{ type: 'histogram', x: values }], layout: {} })
      } else if (feature === 'sensitivity') {
        const flags = new Set(outlierIndices(rows, column)), trimmed = rows.filter((_, i) => !flags.has(i)), before = meanInterval(values, level), after = meanInterval(valuesFor(trimmed, column), level)
        tables.push({ id: 'sensitivity', title: 'Sensitivity to IQR exclusions', columns: ['Specification', 'n', 'Mean', 'CI low', 'CI high'], rows: [['All observations', before.n, before.mean, before.low, before.high], ['Exclude flagged IQR observations', after.n, after.mean, after.low, after.high]] }); interpretation = `${flags.size} observations flagged. Compare the estimates; removing observations requires a substantive justification and does not change the source dataset.`
      } else {
        const t = meanInterval(values, level), b = bootstrapMean(values, iterations, seed, level)
        tables.push({ id: 'interval', title: `${Math.round(level * 100)}% mean intervals`, columns: ['Method', 'n', 'Mean', 'Lower', 'Upper'], rows: feature === 'bootstrap' ? [['Percentile bootstrap', values.length, b.mean, b.low, b.high]] : [['Student t', t.n, t.mean, t.low, t.high], ['Percentile bootstrap', values.length, b.mean, b.low, b.high]] })
        if (feature === 'bootstrap') plots.push({ id: 'means', title: 'Bootstrap mean distribution', data: [{ type: 'histogram', x: b.means }], layout: {} })
        interpretation = `Estimated mean ${average(values).toFixed(4)} using ${values.length} finite observations. The interval describes estimation uncertainty, not the spread of individual observations.`
        assumptions.push('Student-t mean intervals require approximately normal sample means; percentile bootstrap intervals can perform poorly with small or highly skewed samples.')
      }
      const next: AnalysisResult = { analysisId: `tools.${feature}`, title: feature.replaceAll('-', ' '), interpretation, assumptions, footnotes: ['Missing and non-finite numeric values are excluded; counts refer to complete observations.'], tables, plots }
      setResult(next); record(`tools.${feature}`, { column, group, groupA: ga, groupB: gb, ciLevel: level, iterations, seed, pValues: pText }, next)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  }
  return <div className="space-y-4"><div className="tool-fields">{feature !== 'multiplicity' && <label>Numeric column<select value={column} onChange={e => { setColumn(e.target.value); setResult(null) }}>{nums.map(c => <option key={c}>{c}</option>)}</select></label>}{grouped && <><label>Grouping column<select value={group} onChange={e => { setGroup(e.target.value); setAGroup(''); setBGroup(''); setResult(null) }}><option value="">Select group</option>{cols.filter(c => c !== column).map(c => <option key={c}>{c}</option>)}</select></label><label>Group A<select value={ga} onChange={e => { setAGroup(e.target.value); setResult(null) }}>{levels.map(c => <option key={c}>{c}</option>)}</select></label><label>Group B<select value={gb} onChange={e => { setBGroup(e.target.value); setResult(null) }}>{levels.map(c => <option key={c}>{c}</option>)}</select></label></>}
    {['intervals', 'bootstrap', 'sensitivity'].includes(feature) && <label>Confidence level<input type="number" min=".8" max=".99" step=".01" value={level} onChange={e => { setLevel(Number(e.target.value)); setResult(null) }}/></label>}
    {['bootstrap', 'intervals', 'permutation'].includes(feature) && <><label>Resampling iterations<input type="number" min="100" max="5000" value={iterations} onChange={e => { setIterations(Number(e.target.value)); setResult(null) }}/></label><label>Random seed<input type="number" value={seed} onChange={e => { setSeed(Number(e.target.value)); setResult(null) }}/></label></>}
  </div>{feature === 'multiplicity' && <label className="block">P-values (comma or space separated)<textarea className="w-full" value={pText} onChange={e => { setPText(e.target.value); setResult(null) }}/></label>}<button className="tool-primary" onClick={run}>Calculate results</button>{error && <p role="alert" className="text-rose-600">{error}</p>}<ToolResults result={result}/></div>
}

