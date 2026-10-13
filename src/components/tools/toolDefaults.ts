import type { AnalysisDef, AnalysisOptions } from '../../analysis/types'
import type { Dataset } from '../../types'
export function numericToolColumns(dataset: Dataset | null) { return (dataset?.schema.filter(c => c.type === 'numeric').map(c => c.name) ?? []).sort((a, b) => Number(/(^id$|_id$)/i.test(a)) - Number(/(^id$|_id$)/i.test(b))) }
export function defaultToolOptions(def: AnalysisDef, dataset: Dataset | null): AnalysisOptions {
  const numeric = numericToolColumns(dataset), cats = dataset?.schema.filter(c => c.type !== 'numeric').map(c => c.name) ?? [], all = dataset?.schema.map(c => c.name) ?? []
  const result: AnalysisOptions = { inference: 'frequentist', ciLevel: .95 }
  for (const field of def.fields) {
    const pool = 'role' in field ? field.role === 'numeric' ? numeric : field.role === 'categorical' ? cats : all : all
    if (field.kind === 'variables') result[field.key] = field.multiple ? field.required || field.key === 'covariates' || field.key === 'predictors' ? pool.slice(field.key === 'covariates' || field.key === 'predictors' ? 1 : 0, 3) : [] : pool[0] ?? ''
    else if (field.kind === 'select') result[field.key] = field.required ? pool[field.key === 'measure2' || field.key === 'columns' ? 1 : 0] ?? pool[0] ?? '' : ''
    else if (field.kind === 'choice') result[field.key] = field.key === 'alpha' ? field.options.find(o => o.value === '0.05')?.value ?? field.options[0]?.value ?? '' : field.options[0]?.value ?? ''
    else if (field.kind === 'number') result[field.key] = field.default ?? (field.key === 'ciLevel' ? .95 : field.min ?? 0)
    else if (field.kind === 'toggle') result[field.key] = field.default ?? false
    else result[field.key] = Object.fromEntries(field.items.map(i => [i.key, false]))
  }
  return result
}
