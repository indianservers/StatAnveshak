import type { Dataset } from '../types'

export type Guardrail = {
  id: string
  tone: 'warn' | 'risk' | 'info'
  title: string
  detail: string
}

const sensitivePatterns = [
  /email/i,
  /phone/i,
  /mobile/i,
  /aadhaar/i,
  /ssn/i,
  /pan/i,
  /passport/i,
  /patient/i,
  /address/i,
]

export function datasetGuardrails(dataset: Dataset | null): Guardrail[] {
  if (!dataset) return []
  const guards: Guardrail[] = []
  const rows = dataset.rows
  const highMissing = dataset.schema.filter((col) => col.missingPct >= 20)
  const idLike = dataset.schema.filter((col) => col.type === 'id' || col.unique / Math.max(rows, 1) > 0.95)
  const sensitive = dataset.schema.filter((col) => sensitivePatterns.some((pattern) => pattern.test(col.name)))
  const numeric = dataset.schema.filter((col) => col.type === 'numeric')

  if (sensitive.length > 0) {
    guards.push({
      id: 'privacy',
      tone: 'risk',
      title: 'Sensitive columns possible',
      detail: `${sensitive.slice(0, 4).map((col) => col.name).join(', ')} look personally identifying or regulated.`,
    })
  }
  if (highMissing.length > 0) {
    guards.push({
      id: 'missing',
      tone: 'warn',
      title: 'High missingness',
      detail: `${highMissing.length} columns have at least 20% missing values. Prefer imputation or complete-case notes before inference.`,
    })
  }
  if (rows < 30) {
    guards.push({
      id: 'small-sample',
      tone: 'warn',
      title: 'Small sample',
      detail: 'Many normal approximations, p-values, and intervals are unstable below 30 rows.',
    })
  }
  if (idLike.length > 0) {
    guards.push({
      id: 'id-leakage',
      tone: 'info',
      title: 'ID leakage risk',
      detail: `${idLike.slice(0, 4).map((col) => col.name).join(', ')} are likely identifiers and should not be treated as predictors.`,
    })
  }
  numeric.forEach((col) => {
    if (typeof col.mean === 'number' && typeof col.std === 'number' && col.std > 0 && typeof col.min === 'number' && typeof col.max === 'number') {
      const extreme = Math.max(Math.abs((col.min - col.mean) / col.std), Math.abs((col.max - col.mean) / col.std))
      if (extreme >= 5) {
        guards.push({
          id: `outlier-${col.name}`,
          tone: 'info',
          title: `Outliers in ${col.name}`,
          detail: 'A value is at least 5 standard deviations from the mean. Inspect before parametric modeling.',
        })
      }
    }
  })

  return guards.slice(0, 8)
}

export function recommendTest(dataset: Dataset | null, outcomeType: string, groupCount: string, paired: boolean) {
  if (!dataset) return 'Load a dataset first, then choose outcome and study design.'
  if (outcomeType === 'categorical' && groupCount !== 'one') return 'Chi-square independence; use Fisher exact for small expected counts.'
  if (outcomeType === 'categorical') return 'One-proportion or binomial test; logistic regression when predictors matter.'
  if (groupCount === 'one') return 'One-sample t-test; use Wilcoxon signed-rank if symmetry or normality is doubtful.'
  if (groupCount === 'two' && paired) return 'Paired t-test; use Wilcoxon signed-rank for non-normal paired differences.'
  if (groupCount === 'two') return 'Welch two-sample t-test; use Mann-Whitney or bootstrap CI for robust comparison.'
  return 'ANOVA for parametric comparison; Kruskal-Wallis for robust ranks; add multiple-comparison correction.'
}
