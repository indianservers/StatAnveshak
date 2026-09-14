export type JaspModuleId =
  | 'descriptives'
  | 'tTests'
  | 'anova'
  | 'mixedModels'
  | 'regression'
  | 'frequencies'
  | 'factor'
  | 'acceptanceSampling'
  | 'audit'
  | 'bain'
  | 'bayesFactorFunctions'
  | 'bfpack'
  | 'bsts'
  | 'circular'
  | 'cochrane'
  | 'distributions'
  | 'equivalence'
  | 'jags'
  | 'learnBayes'
  | 'learnStats'
  | 'machineLearning'
  | 'metaAnalysis'
  | 'network'
  | 'power'
  | 'predictiveAnalytics'
  | 'process'
  | 'prophet'
  | 'qualityControl'
  | 'reliability'
  | 'robustTTests'
  | 'sem'
  | 'survival'
  | 'timeSeries'
  | 'summaryStatistics'
  | 'visualModeling'

export type ColumnRole = 'numeric' | 'categorical' | 'any' | 'time'

export type AnalysisOptionField =
  | { key: string; kind: 'variables'; label: string; role: ColumnRole; multiple: boolean; required: boolean }
  | { key: string; kind: 'select'; label: string; role?: ColumnRole; required: boolean }
  | { key: string; kind: 'choice'; label: string; options: { value: string; label: string }[]; required: boolean }
  | { key: string; kind: 'number'; label: string; min?: number; max?: number; step?: number; required: boolean; default?: number }
  | { key: string; kind: 'toggle'; label: string; default?: boolean }
  | { key: string; kind: 'checkboxGroup'; label: string; items: { key: string; label: string }[] }

export type AnalysisDef = {
  id: string
  module: JaspModuleId
  moduleLabel: string
  title: string
  description: string
  phase: number
  implemented: boolean
  frequentist: boolean
  bayesian: boolean
  fields: AnalysisOptionField[]
  allowEmptyData?: boolean
}

export type AnalysisOptions = Record<string, string | string[] | number | boolean | Record<string, boolean>>

export type AnalysisTable = {
  id: string
  title: string
  columns: string[]
  rows: Array<Array<string | number>>
  notes?: string[]
}

export type PlotSpec = {
  id: string
  title: string
  data: Record<string, unknown>[]
  layout: Record<string, unknown>
}

export type AnalysisResult = {
  analysisId: string
  title: string
  interpretation: string
  assumptions: string[]
  footnotes: string[]
  tables: AnalysisTable[]
  plots: PlotSpec[]
}

export type AnalysisRequest = {
  id: string
  type: 'run-analysis'
  analysisId: string
  rows: Record<string, unknown>[]
  options: AnalysisOptions
}

export type AnalysisWorkerResponse =
  | { id: string; type: 'result'; result: AnalysisResult }
  | { id: string; type: 'error'; message: string }
  | { id: string; type: 'progress'; percent: number; message: string }
