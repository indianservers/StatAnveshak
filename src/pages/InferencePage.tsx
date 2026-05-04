import { useState } from 'react'
import { useStore } from '../store/useStore'
import { numericColumn } from '../lib/stats'
import {
  oneSampleTTest, twoSampleTTest, chiSquareGoodnessOfFit, confidenceIntervalMean
} from '../lib/inference'
import type { HypothesisTestResult } from '../types'
import { Link } from 'react-router-dom'
import { Upload, CheckCircle, XCircle, AlertTriangle, Copy } from 'lucide-react'

type TestType = 'one_sample_t' | 'two_sample_t' | 'chi2_gof' | 'ci_mean'

export function InferencePage() {
  const { activeDataset } = useStore()
  const numCols = activeDataset?.schema.filter((c) => c.type === 'numeric').map((c) => c.name) ?? []

  const [testType, setTestType] = useState<TestType>('one_sample_t')
  const [col1, setCol1] = useState(numCols[0] ?? '')
  const [col2, setCol2] = useState(numCols[1] ?? '')
  const [mu0, setMu0] = useState('0')
  const [alpha, setAlpha] = useState('0.05')
  const [result, setResult] = useState<HypothesisTestResult | null>(null)
  const [ciResult, setCiResult] = useState<ReturnType<typeof confidenceIntervalMean> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [testsRun, setTestsRun] = useState(0)

  const runTest = () => {
    setError(null)
    setResult(null)
    setCiResult(null)
    if (!activeDataset) return

    try {
      const a = Number(alpha)
      if (testType === 'one_sample_t') {
        const data = numericColumn(activeDataset.data, col1)
        if (data.length < 2) throw new Error('Need at least 2 data points')
        setResult(oneSampleTTest(data, Number(mu0), a))
      } else if (testType === 'two_sample_t') {
        const d1 = numericColumn(activeDataset.data, col1)
        const d2 = numericColumn(activeDataset.data, col2)
        if (d1.length < 2 || d2.length < 2) throw new Error('Need at least 2 data points per group')
        setResult(twoSampleTTest(d1, d2, a))
      } else if (testType === 'chi2_gof') {
        const data = numericColumn(activeDataset.data, col1)
        const n = data.length
        const bins = 5
        const min = Math.min(...data), max = Math.max(...data)
        const width = (max - min) / bins
        const observed = Array(bins).fill(0)
        data.forEach((v) => {
          const idx = Math.min(bins - 1, Math.floor((v - min) / width))
          observed[idx]++
        })
        const expected = Array(bins).fill(n / bins)
        setResult(chiSquareGoodnessOfFit(observed, expected, a))
      } else if (testType === 'ci_mean') {
        const data = numericColumn(activeDataset.data, col1)
        if (data.length < 2) throw new Error('Need at least 2 data points')
        setCiResult(confidenceIntervalMean(data, a))
      }
      setTestsRun((value) => value + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Computation error')
    }
  }

  const selectedData = activeDataset ? numericColumn(activeDataset.data, col1) : []
  const assumptionWarnings = selectedData.length > 2 ? buildAssumptionWarnings(selectedData) : []
  const copyLatex = async () => {
    const latex = result
      ? `\\text{${result.testName}}: t=${result.statistic.toFixed(4)},\\ p=${result.pValue.toFixed(4)},\\ \\alpha=${result.alpha},\\ \\text{decision}=${result.reject ? '\\text{reject }H_0' : '\\text{fail to reject }H_0'}`
      : ciResult
        ? `\\bar{x}=${ciResult.mean.toFixed(4)},\\ SE=${ciResult.se.toFixed(4)},\\ CI=[${ciResult.ciLow.toFixed(4)}, ${ciResult.ciHigh.toFixed(4)}]`
        : ''
    if (latex) await navigator.clipboard.writeText(latex)
  }

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
        <Upload size={48} />
        <p className="text-lg font-medium">No dataset loaded</p>
        <Link to="/data/upload" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Upload Data</Link>
      </div>
    )
  }

  const TESTS: { id: TestType; label: string; desc: string }[] = [
    { id: 'one_sample_t', label: 'One-Sample t-Test', desc: 'Test if mean equals a hypothesized value' },
    { id: 'two_sample_t', label: 'Two-Sample t-Test', desc: "Compare means of two independent groups (Welch's)" },
    { id: 'chi2_gof', label: 'Chi-Square GoF', desc: 'Goodness-of-fit test against uniform distribution' },
    { id: 'ci_mean', label: 'Confidence Interval', desc: 'Confidence interval for population mean' },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Inference Tests</h1>

      {/* Test selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {TESTS.map(({ id, label, desc }) => (
          <button
            key={id}
            onClick={() => { setTestType(id); setResult(null); setCiResult(null) }}
            className={`text-left p-4 rounded-xl border transition-all ${
              testType === id
                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
            }`}
          >
            <p className={`text-sm font-semibold mb-1 ${testType === id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>{label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
          </button>
        ))}
      </div>

      {/* Parameters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-5">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-4">Parameters</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {testType === 'two_sample_t' ? 'Group 1 Column' : 'Column'}
            </label>
            <select value={col1} onChange={(e) => setCol1(e.target.value)} className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              {numCols.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {testType === 'two_sample_t' && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Group 2 Column</label>
              <select value={col2} onChange={(e) => setCol2(e.target.value)} className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {numCols.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          )}

          {testType === 'one_sample_t' && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Hypothesized Mean (H₀: μ =)</label>
              <input
                type="number"
                value={mu0}
                onChange={(e) => setMu0(e.target.value)}
                className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Significance Level (α)</label>
            <select value={alpha} onChange={(e) => setAlpha(e.target.value)} className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              <option value="0.01">0.01 (99% confidence)</option>
              <option value="0.05">0.05 (95% confidence)</option>
              <option value="0.10">0.10 (90% confidence)</option>
            </select>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {assumptionWarnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                <AlertTriangle size={14} />
                Assumption warnings
              </div>
              {assumptionWarnings.map((warning) => <p key={warning} className="text-xs text-amber-700 dark:text-amber-300">{warning}</p>)}
            </div>
          )}

          {testsRun >= 3 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              Multiple tests detected. Consider a Bonferroni correction: adjusted alpha = {(Number(alpha) / testsRun).toFixed(4)}.
            </div>
          )}

          <button
            onClick={runTest}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Run Test
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className={`rounded-xl border p-5 ${result.reject ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-700' : 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700'}`}>
          <div className="flex items-center gap-2 mb-4">
            {result.reject
              ? <XCircle size={20} className="text-red-500" />
              : <CheckCircle size={20} className="text-green-500" />}
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">{result.testName}</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Test Statistic', value: result.statistic },
              { label: 'p-value', value: result.pValue },
              ...(result.degreesOfFreedom !== undefined ? [{ label: 'Degrees of Freedom', value: result.degreesOfFreedom }] : []),
              { label: 'α', value: result.alpha },
              { label: 'Decision', value: result.reject ? 'Reject H₀' : 'Fail to Reject H₀' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className={`text-sm font-bold ${label === 'Decision' ? (result.reject ? 'text-red-600' : 'text-green-600') : 'text-slate-700 dark:text-slate-200'}`}>{String(value)}</p>
              </div>
            ))}
          </div>

          {result.ciLow !== undefined && (
            <div className="mb-3 text-sm text-slate-600 dark:text-slate-300">
              95% CI: [{result.ciLow}, {result.ciHigh}]
            </div>
          )}

          <div className={`text-sm font-medium ${result.reject ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
            {result.interpretation}
          </div>
          <div className="mt-3 rounded-lg bg-white/70 p-3 text-sm text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
            p = {result.pValue.toFixed(4)} {result.reject ? `is below alpha ${result.alpha}, so reject H0 at ${(result.alpha * 100).toFixed(0)}% significance.` : `is not below alpha ${result.alpha}, so fail to reject H0 at ${(result.alpha * 100).toFixed(0)}% significance.`}
          </div>
          <button type="button" onClick={copyLatex} className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Copy size={13} />
            Copy as LaTeX
          </button>
        </div>
      )}

      {ciResult && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700 p-5">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">
            Confidence Interval for Mean ({(1 - Number(alpha)) * 100}%)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Sample Mean', value: ciResult.mean },
              { label: 'Standard Error', value: ciResult.se },
              { label: 'Margin of Error', value: ciResult.margin },
              { label: 'Lower Bound', value: ciResult.ciLow },
              { label: 'Upper Bound', value: ciResult.ciHigh },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{value.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-blue-700 dark:text-blue-300">
            We are {(1 - Number(alpha)) * 100}% confident the true population mean lies between {ciResult.ciLow} and {ciResult.ciHigh}.
          </p>
          <div className="mt-4">
            <div className="relative h-3 rounded-full bg-blue-100 dark:bg-blue-950">
              <div className="absolute left-[20%] right-[20%] h-3 rounded-full bg-blue-500" title="Confidence interval band" />
            </div>
            <div className="mt-1 flex justify-between text-xs text-blue-700 dark:text-blue-300">
              <span>{ciResult.ciLow.toLocaleString()}</span>
              <span>CI band</span>
              <span>{ciResult.ciHigh.toLocaleString()}</span>
            </div>
          </div>
          <button type="button" onClick={copyLatex} className="mt-3 inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-xs text-blue-700 hover:border-blue-300 dark:border-blue-800 dark:bg-slate-800 dark:text-blue-300">
            <Copy size={13} />
            Copy as LaTeX
          </button>
        </div>
      )}
    </div>
  )
}

function buildAssumptionWarnings(values: number[]) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(values.length - 1, 1)
  const sd = Math.sqrt(variance)
  const skew = sd === 0 ? 0 : values.reduce((sum, value) => sum + ((value - mean) / sd) ** 3, 0) / values.length
  const warnings: string[] = []
  if (values.length < 30) warnings.push('Small sample: t-tests are more sensitive to non-normal data below n = 30.')
  if (Math.abs(skew) > 1) warnings.push('Skewness is high; check normality before relying on parametric inference.')
  return warnings
}
