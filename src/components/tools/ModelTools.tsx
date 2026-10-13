import { numericToolColumns } from './toolDefaults'
import { useState } from 'react'
import type { AnalysisResult } from '../../analysis/types'
import { crossValidate, decompose, forecastCompare, linearFitSummary, numberValue, predictLinear, valuesFor } from '../../lib/toolkit'
import type { PanelProps } from './toolTypes'
import { ToolResults } from './ToolResults'

export function ModelTools({ feature, dataset, record, initialOptions: initial = {} }: PanelProps) {
  const nums = numericToolColumns(dataset)
  const initialPredictors = Array.isArray(initial.predictors) ? initial.predictors as string[] : nums.slice(1, 3)
  const [outcome, setOutcome] = useState(String(initial.outcome ?? nums[0] ?? '')), [predictors, setPredictors] = useState(initialPredictors), [folds, setFolds] = useState(Number(initial.folds ?? 5)), [repeats, setRepeats] = useState(Number(initial.repeats ?? 2)), [seed, setSeed] = useState(Number(initial.seed ?? 42)), [period, setPeriod] = useState(Number(initial.period ?? 4)), [holdout, setHoldout] = useState(Number(initial.holdout ?? 8)), [time, setTime] = useState(String(initial.time ?? '')), [inputs, setInputs] = useState<Record<string, number>>(() => Object.fromEntries(initialPredictors.map((c, i) => [c, Array.isArray(initial.predictionInputs) ? Number(initial.predictionInputs[i] ?? 0) : 0]))), [result, setResult] = useState<AnalysisResult | null>(null), [error, setError] = useState('')
  const series = ['decomposition', 'forecast'].includes(feature)
  const reset = () => setResult(null)
  const run = () => {
    setError('')
    try {
      if (!dataset) throw new Error('Load a dataset first.')
      const tables: AnalysisResult['tables'] = [], plots: AnalysisResult['plots'] = [], assumptions: string[] = []
      let interpretation = ''
      if (series) {
        const ordered = [...dataset.data]
        if (time) { const stamps = ordered.map(r => numberValue(r[time]) ?? Date.parse(String(r[time]))); if (stamps.some(v => !Number.isFinite(v)) || new Set(stamps).size !== stamps.length) throw new Error('Time values must be valid, unique numbers or dates.'); ordered.sort((a, b) => (numberValue(a[time]) ?? Date.parse(String(a[time]))) - (numberValue(b[time]) ?? Date.parse(String(b[time])))) }
        const a = valuesFor(ordered, outcome); if (a.length !== ordered.length) throw new Error('Fill or remove missing series values before analysis; silently dropping them would alter the time spacing.')
        assumptions.push('Observations must be evenly spaced in the chosen order. Calendar spacing is not automatically inferred. Holdout validation uses only the training prefix to forecast.')
        if (feature === 'decomposition') { const values = decompose(a, period); tables.push({ id: 'decompose', title: 'Additive moving-average decomposition', columns: ['Index', 'Observed', 'Trend', 'Seasonal', 'Remainder'], rows: values.map(r => r.map(v => v ?? '—')) }); plots.push({ id: 'decomp', title: 'Observed, trend, and seasonal components', data: [{ type: 'scatter', y: a, name: 'Observed' }, { type: 'scatter', y: values.map(r => r[2]), name: 'Trend' }, { type: 'scatter', y: values.map(r => r[3]), name: 'Seasonal' }], layout: {} }); interpretation = `Additive decomposition with period ${period}; endpoint trends are undefined where a centered window is unavailable.` }
        else { const comparison = forecastCompare(a, holdout, period), cut = a.length - Math.floor(holdout); tables.push({ id: 'forecast', title: 'Holdout forecast accuracy', columns: ['Method', 'RMSE', 'MAE', 'Train n', 'Test n'], rows: comparison.map(c => [c.name, c.rmse, c.mae, cut, Math.floor(holdout)]) }); plots.push({ id: 'forecast', title: 'Observed and holdout forecasts', data: [{ type: 'scatter', y: a, name: 'Observed' }, ...comparison.map(c => ({ type: 'scatter', x: c.predicted.map((_, i) => cut + i), y: c.predicted, name: c.name }))], layout: {} }); interpretation = 'Compare naïve, drift, and seasonal-naïve forecasts on the same held-out observations. These are transparent baseline models.' }
      } else if (feature === 'prediction') {
        const inputValues = predictors.map(c => inputs[c] ?? 0), p = predictLinear(dataset.data, outcome, predictors, inputValues)
        tables.push({ id: 'prediction', title: 'Linear prediction with 95% prediction interval', columns: ['Prediction', 'Lower', 'Upper'], rows: [[p.value, p.low, p.high]] }, { id: 'coefficients', title: 'Coefficients', columns: ['Term', 'Estimate'], rows: ['Intercept', ...predictors].map((c, i) => [c, p.coefficients[i]]) })
        const outside = predictors.filter((c, i) => { const a = valuesFor(dataset.data, c); return inputValues[i] < Math.min(...a) || inputValues[i] > Math.max(...a) })
        interpretation = `Predicted ${outcome}: ${p.value.toFixed(4)}.${outside.length ? ` Extrapolation: inputs outside the observed range for ${outside.join(', ')}.` : ''}`; assumptions.push('Linear conditional mean, independent homoscedastic normal errors, and a full-rank design. The interval predicts an individual future outcome.')
      } else {
        const common = dataset.data.filter(r => [outcome, ...predictors].every(c => numberValue(r[c]) !== null)), models = feature === 'model-compare' ? [predictors.slice(0, 1), predictors] : [predictors]
        if (feature === 'model-compare' && predictors.length < 2) throw new Error('Select at least two predictors to compare a one-predictor and full model.')
        const evaluated = models.map(model => ({ model, cv: crossValidate(common, outcome, model, folds, repeats, seed) }))
        tables.push({ id: 'cv-summary', title: 'Repeated cross-validation', columns: ['Model predictors', 'Pooled RMSE', 'Complete n', 'Folds', 'Repeats', 'Seed'], rows: evaluated.map(e => [e.model.join(', '), e.cv.rmse, e.cv.complete, folds, repeats, seed]) })
        if (feature === 'model-compare') tables.push({ id: 'fit-summary', title: 'In-sample fit (same observations)', columns: ['Predictors', 'R²', 'Adjusted R²', 'AIC', 'BIC'], rows: models.map(model => { const fit = linearFitSummary(common, outcome, model); return [model.join(', '), fit.rSquared, fit.adjustedRSquared, fit.aic, fit.bic] }) })
        evaluated.forEach((e, i) => tables.push({ id: `folds-${i}`, title: `Fold scores: ${e.model.join(', ')}`, columns: ['Repeat', 'Fold', 'Test n', 'RMSE', 'MAE'], rows: e.cv.results }))
        interpretation = 'Lower held-out RMSE indicates smaller prediction error on these folds. Models use the same complete-case rows and seeded fold assignments.'; assumptions.push('Shuffled folds assume independent rows; use time-aware validation for time series. Preprocessing and feature selection outside folds can leak information.')
      }
      const next: AnalysisResult = { analysisId: `tools.${feature}`, title: feature.replaceAll('-', ' '), interpretation, assumptions, footnotes: [], tables, plots }; setResult(next); record(next.analysisId, { outcome, predictors, folds, repeats, seed, period, holdout, time, predictionInputs: predictors.map(c => String(inputs[c] ?? 0)) }, next)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  }
  return <div className="space-y-4"><div className="tool-fields"><label>Outcome / series<select value={outcome} onChange={e => { setOutcome(e.target.value); setPredictors(p => p.filter(c => c !== e.target.value)); reset() }}>{nums.map(c => <option key={c}>{c}</option>)}</select></label>{series ? <><label>Time column<select value={time} onChange={e => { setTime(e.target.value); reset() }}><option value="">Use dataset row order</option>{dataset?.schema.filter(c => c.name !== outcome).map(c => <option key={c.name}>{c.name}</option>)}</select></label><label>Seasonal period<input type="number" min="2" value={period} onChange={e => { setPeriod(Number(e.target.value)); reset() }}/></label>{feature === 'forecast' && <label>Holdout observations<input type="number" min="1" value={holdout} onChange={e => { setHoldout(Number(e.target.value)); reset() }}/></label>}</> : <label>Predictor columns<select multiple size={4} value={predictors} onChange={e => { setPredictors(Array.from(e.target.selectedOptions, o => o.value)); reset() }}>{nums.filter(c => c !== outcome).map(c => <option key={c}>{c}</option>)}</select></label>}
    {!series && feature !== 'prediction' && <><label>Validation folds<input type="number" min="2" max="10" value={folds} onChange={e => { setFolds(Number(e.target.value)); reset() }}/></label><label>Validation repeats<input type="number" min="1" max="10" value={repeats} onChange={e => { setRepeats(Number(e.target.value)); reset() }}/></label><label>Validation seed<input type="number" value={seed} onChange={e => { setSeed(Number(e.target.value)); reset() }}/></label></>}
    {feature === 'prediction' && predictors.map(c => <label key={c}>Predict {c}<input type="number" step="any" value={inputs[c] ?? 0} onChange={e => { setInputs(v => ({ ...v, [c]: Number(e.target.value) })); reset() }}/></label>)}
  </div><button className="tool-primary" onClick={run}>Evaluate models</button>{error && <p role="alert" className="text-rose-600">{error}</p>}<ToolResults result={result}/></div>
}

