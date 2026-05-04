import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  Brain,
  Calculator,
  CheckCircle2,
  FlaskConical,
  Layers,
  LineChart,
  ListChecks,
  Sigma,
  SlidersHorizontal,
  Upload,
} from 'lucide-react'
import * as ss from 'simple-statistics'
import { useStore } from '../store/useStore'
import { detectOutliersIQR, numericColumn, pearsonCorrelation } from '../lib/stats'

type FeatureGroup = 'Data Prep' | 'EDA' | 'Inference' | 'Modeling' | 'Teaching' | 'Output'
type Goal = 'describe' | 'compare_means' | 'association' | 'predict_numeric' | 'predict_category' | 'time_series' | 'quality'
type OutcomeType = 'numeric' | 'categorical' | 'time'
type PredictorType = 'none' | 'numeric' | 'categorical' | 'mixed'

const FEATURE_GROUPS: Record<FeatureGroup, string[]> = {
  'Data Prep': [
    'Data dictionary and variable roles',
    'Missing-value profile and handling plan',
    'Duplicate and ID validation',
    'Outlier detection with IQR and z-score rules',
    'Type conversion and recoding',
    'Scale, standardize, normalize, and winsorize',
    'Derived columns and formula builder',
    'Merge, append, reshape, and pivot workflows',
  ],
  EDA: [
    'Descriptive statistics by group',
    'Frequency and cross-tab tables',
    'Correlation matrix with flags',
    'Distribution diagnostics',
    'Box, violin, density, scatter, and residual plots',
    'Skewness, kurtosis, and robust summaries',
    'Interactive drill-down dashboard',
    'Automated data quality report',
  ],
  Inference: [
    'Hypothesis-test chooser',
    'One-sample, paired, and independent t-tests',
    'ANOVA, Welch ANOVA, and post-hoc tests',
    'Chi-square, Fisher exact, and proportion tests',
    'Nonparametric tests',
    'Confidence intervals',
    'Effect sizes with interpretation',
    'Power and sample-size calculators',
  ],
  Modeling: [
    'Simple and multiple linear regression',
    'Logistic regression',
    'Regression diagnostics',
    'Model comparison and validation',
    'PCA and factor analysis',
    'Clustering and segmentation',
    'Forecasting and decomposition',
    'Control charts and capability analysis',
  ],
  Teaching: [
    'Assumption checklist for every method',
    'Plain-language result interpretation',
    'Formula and calculation walkthroughs',
    'Guided lesson paths',
    'Practice datasets by topic',
    'Warnings about p-hacking and bias',
    'Simulation playground',
    'Glossary with examples',
  ],
  Output: [
    'Publication-ready tables',
    'Export charts as PNG/SVG',
    'Export reports to PDF/HTML',
    'Save reusable analysis sessions',
    'Notebook-style analysis history',
    'Reproducible script export',
    'Shareable dashboards',
    'Audit trail for transformations',
  ],
}

const GOAL_HELP: Record<Goal, { title: string; methods: string[]; assumptions: string[] }> = {
  describe: {
    title: 'Describe a dataset',
    methods: ['Summary statistics', 'Frequency tables', 'Grouped summaries', 'Distribution plots'],
    assumptions: ['Variables are correctly typed', 'Missing values are understood', 'Outliers are reviewed before reporting means'],
  },
  compare_means: {
    title: 'Compare group means',
    methods: ['Independent t-test', 'Paired t-test', 'One-way ANOVA', 'Welch ANOVA', 'Mann-Whitney or Kruskal-Wallis'],
    assumptions: ['Numeric outcome', 'Independent observations unless paired', 'Check group sizes, outliers, and approximate normality'],
  },
  association: {
    title: 'Measure association',
    methods: ['Pearson correlation', 'Spearman correlation', 'Chi-square test', 'Crosstabs', 'Scatterplot matrix'],
    assumptions: ['Choose Pearson for linear numeric relationships', 'Use Spearman for monotonic or ordinal relationships', 'Use chi-square for categorical variables'],
  },
  predict_numeric: {
    title: 'Predict a numeric outcome',
    methods: ['Simple linear regression', 'Multiple regression', 'Regularized regression', 'Regression tree'],
    assumptions: ['Linear model needs residual checks', 'Watch multicollinearity', 'Validate on holdout data for prediction'],
  },
  predict_category: {
    title: 'Predict a category',
    methods: ['Logistic regression', 'Classification tree', 'Naive Bayes', 'Confusion matrix and ROC analysis'],
    assumptions: ['Outcome is categorical', 'Classes should be checked for imbalance', 'Use validation metrics beyond accuracy'],
  },
  time_series: {
    title: 'Analyze time-ordered data',
    methods: ['Line chart', 'Moving average', 'Seasonal decomposition', 'AR(1)/ETS teaching baseline'],
    assumptions: ['Rows are correctly ordered by time', 'Seasonality and trend are separated', 'Forecast accuracy should be back-tested'],
  },
  quality: {
    title: 'Monitor process quality',
    methods: ['Control charts', 'Capability analysis', 'Pareto chart', 'Defect-rate analysis'],
    assumptions: ['Process is measured consistently', 'Subgroups are rational', 'Special-cause variation should be investigated'],
  },
}

const outcomeOptions: { value: OutcomeType; label: string }[] = [
  { value: 'numeric', label: 'Numeric' },
  { value: 'categorical', label: 'Categorical' },
  { value: 'time', label: 'Time ordered' },
]

const predictorOptions: { value: PredictorType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'categorical', label: 'Categorical' },
  { value: 'mixed', label: 'Mixed' },
]

const zForConfidence: Record<string, number> = {
  '0.90': 1.645,
  '0.95': 1.96,
  '0.99': 2.576,
}

const round = (value: number, digits = 3) => Number.isFinite(value) ? Number(value.toFixed(digits)) : 0

function cohenD(a: number[], b: number[]) {
  if (a.length < 2 || b.length < 2) return null
  const sd1 = ss.standardDeviation(a)
  const sd2 = ss.standardDeviation(b)
  const pooled = Math.sqrt(((a.length - 1) * sd1 ** 2 + (b.length - 1) * sd2 ** 2) / (a.length + b.length - 2))
  if (pooled === 0) return null
  const d = (ss.mean(a) - ss.mean(b)) / pooled
  const correction = 1 - 3 / (4 * (a.length + b.length) - 9)
  return { d, hedgesG: d * correction }
}

function effectLabel(absValue: number) {
  if (absValue < 0.2) return 'negligible'
  if (absValue < 0.5) return 'small'
  if (absValue < 0.8) return 'medium'
  return 'large'
}

function recommendedMethod(goal: Goal, outcome: OutcomeType, predictor: PredictorType) {
  if (goal === 'compare_means' && outcome === 'numeric' && predictor === 'categorical') return 't-test or ANOVA'
  if (goal === 'association' && outcome === 'numeric' && predictor === 'numeric') return 'Pearson or Spearman correlation'
  if (goal === 'association' && outcome === 'categorical' && predictor === 'categorical') return 'Chi-square test or Fisher exact test'
  if (goal === 'predict_numeric') return predictor === 'mixed' ? 'Multiple linear regression' : 'Simple linear regression'
  if (goal === 'predict_category') return 'Logistic regression with confusion matrix'
  if (goal === 'time_series' || outcome === 'time') return 'Time-series decomposition and forecasting'
  if (goal === 'quality') return 'Control chart and process capability'
  return 'Descriptive statistics and exploratory charts'
}

export function AdvancedAnalysisPage() {
  const { activeDataset } = useStore()
  const [goal, setGoal] = useState<Goal>('compare_means')
  const [outcomeType, setOutcomeType] = useState<OutcomeType>('numeric')
  const [predictorType, setPredictorType] = useState<PredictorType>('categorical')
  const [colA, setColA] = useState('')
  const [colB, setColB] = useState('')
  const [confidence, setConfidence] = useState('0.95')
  const [margin, setMargin] = useState('5')
  const [sigma, setSigma] = useState('15')

  const numCols = useMemo(
    () => activeDataset?.schema.filter((col) => col.type === 'numeric').map((col) => col.name) ?? [],
    [activeDataset]
  )
  const catCols = useMemo(
    () => activeDataset?.schema.filter((col) => col.type === 'categorical' || col.type === 'boolean').map((col) => col.name) ?? [],
    [activeDataset]
  )

  const firstNum = colA || numCols[0] || ''
  const secondNum = colB || numCols.find((col) => col !== firstNum) || ''

  const audit = useMemo(() => {
    if (!activeDataset) return null
    const rowCount = activeDataset.data.length
    const missingCells = activeDataset.schema.reduce((sum, col) => sum + col.missing, 0)
    const totalCells = rowCount * activeDataset.schema.length
    const numericAudits = numCols.map((col) => {
      const nums = numericColumn(activeDataset.data, col)
      const outlierResult = nums.length > 3 ? detectOutliersIQR(nums) : { outliers: [] }
      return {
        col,
        n: nums.length,
        missing: rowCount - nums.length,
        skewness: nums.length > 2 ? ss.sampleSkewness(nums) : 0,
        kurtosis: nums.length > 3 ? ss.sampleKurtosis(nums) : 0,
        outliers: outlierResult.outliers.length,
      }
    })
    return {
      rows: rowCount,
      cols: activeDataset.schema.length,
      numericCount: numCols.length,
      categoricalCount: catCols.length,
      missingPct: totalCells === 0 ? 0 : missingCells / totalCells * 100,
      highMissing: activeDataset.schema.filter((col) => col.missingPct >= 20).map((col) => col.name),
      numericAudits,
    }
  }, [activeDataset, catCols.length, numCols])

  const effect = useMemo(() => {
    if (!activeDataset || !firstNum || !secondNum) return null
    const a = numericColumn(activeDataset.data, firstNum)
    const b = numericColumn(activeDataset.data, secondNum)
    const d = cohenD(a, b)
    const r = pearsonCorrelation(activeDataset.data, firstNum, secondNum)
    return {
      cohen: d,
      correlation: Number.isFinite(r) ? r : null,
      n: Math.min(a.length, b.length),
    }
  }, [activeDataset, firstNum, secondNum])

  const sampleSize = useMemo(() => {
    const z = zForConfidence[confidence]
    const e = Math.max(Number(margin), 0.0001)
    const s = Math.max(Number(sigma), 0.0001)
    return Math.ceil((z * s / e) ** 2)
  }, [confidence, margin, sigma])

  const method = recommendedMethod(goal, outcomeType, predictorType)
  const goalHelp = GOAL_HELP[goal]

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
        <Upload size={48} />
        <p className="text-lg font-medium">No dataset loaded</p>
        <Link to="/data/upload" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Upload Data</Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical size={24} className="text-indigo-500" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Advanced Analysis</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            SPSS/MATLAB-style method selection, data audit, assumptions, effect sizes, and planning tools.
          </p>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Active dataset: <span className="font-semibold text-slate-700 dark:text-slate-200">{activeDataset.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Rows', value: audit?.rows.toLocaleString(), icon: Layers },
          { label: 'Columns', value: audit?.cols, icon: ListChecks },
          { label: 'Numeric', value: audit?.numericCount, icon: Sigma },
          { label: 'Missing Cells', value: `${round(audit?.missingPct ?? 0, 2)}%`, icon: AlertTriangle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Icon size={16} />
              <span className="text-xs font-medium">{label}</span>
            </div>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Method Chooser</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Goal</label>
              <select value={goal} onChange={(event) => setGoal(event.target.value as Goal)} className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {Object.entries(GOAL_HELP).map(([key, item]) => <option key={key} value={key}>{item.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Outcome</label>
              <select value={outcomeType} onChange={(event) => setOutcomeType(event.target.value as OutcomeType)} className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {outcomeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Predictors</label>
              <select value={predictorType} onChange={(event) => setPredictorType(event.target.value as PredictorType)} className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {predictorOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>
          <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 mb-4">
            <p className="text-xs font-semibold text-indigo-500 mb-1">Recommended method</p>
            <p className="text-lg font-bold text-indigo-800 dark:text-indigo-200">{method}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Useful methods</p>
              <div className="space-y-2">
                {goalHelp.methods.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Assumptions to check</p>
              <div className="space-y-2">
                {goalHelp.assumptions.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Effect Size</h2>
          </div>
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Column A</label>
              <select value={firstNum} onChange={(event) => setColA(event.target.value)} className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {numCols.map((col) => <option key={col}>{col}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Column B</label>
              <select value={secondNum} onChange={(event) => setColB(event.target.value)} className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {numCols.map((col) => <option key={col}>{col}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3">
              <p className="text-xs text-slate-400 mb-1">Cohen d</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{effect?.cohen ? round(effect.cohen.d) : '-'}</p>
              <p className="text-xs text-slate-500">{effect?.cohen ? effectLabel(Math.abs(effect.cohen.d)) : 'needs 2 columns'}</p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3">
              <p className="text-xs text-slate-400 mb-1">Pearson r</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{effect?.correlation !== null ? round(effect?.correlation ?? 0) : '-'}</p>
              <p className="text-xs text-slate-500">{effect?.correlation !== null ? effectLabel(Math.abs(effect?.correlation ?? 0)) : 'needs paired data'}</p>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Data Audit</h2>
          </div>
          <div className="overflow-auto max-h-80">
            <table className="w-full text-xs">
              <thead className="text-slate-400">
                <tr>
                  <th className="text-left py-2">Column</th>
                  <th className="text-right py-2">Outliers</th>
                  <th className="text-right py-2">Skew</th>
                  <th className="text-right py-2">Missing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {audit?.numericAudits.map((item) => (
                  <tr key={item.col}>
                    <td className="py-2 pr-2 text-slate-700 dark:text-slate-200">{item.col}</td>
                    <td className="py-2 text-right text-slate-500">{item.outliers}</td>
                    <td className="py-2 text-right text-slate-500">{round(item.skewness, 2)}</td>
                    <td className="py-2 text-right text-slate-500">{item.missing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(audit?.highMissing.length ?? 0) > 0 && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-300">
              High missingness: {audit?.highMissing.join(', ')}
            </p>
          )}
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sample Size</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Confidence</label>
              <select value={confidence} onChange={(event) => setConfidence(event.target.value)} className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                <option value="0.90">90%</option>
                <option value="0.95">95%</option>
                <option value="0.99">99%</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Sigma</label>
              <input value={sigma} onChange={(event) => setSigma(event.target.value)} type="number" className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Margin</label>
              <input value={margin} onChange={(event) => setMargin(event.target.value)} type="number" className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" />
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-4">
            <p className="text-xs text-slate-400 mb-1">Estimated n for a mean</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{sampleSize.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">Formula: n = (z * sigma / margin)^2</p>
          </div>
        </section>

        <section className="xl:col-span-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Top Statistical Workbench Features</h2>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(Object.entries(FEATURE_GROUPS) as [FeatureGroup, string[]][]).map(([group, items]) => (
              <div key={group} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  {group === 'Modeling' ? <LineChart size={16} className="text-indigo-500" /> : <Sigma size={16} className="text-indigo-500" />}
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{group}</h3>
                </div>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <CheckCircle2 size={13} className="text-green-500 shrink-0 mt-0.5" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
