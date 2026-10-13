import type { AnovaObservation, OneWayResult } from './anovaStudio'
import { formatNum, formatP } from './anovaStudio'
import { qt } from '../analysis/engines/frequentist/dists'

export function mapAnovaRows(data: Record<string, unknown>[], groupColumn: string, valueColumn: string) {
  const rows: AnovaObservation[] = []
  let excluded = 0
  data.forEach((row, index) => {
    const group = row[groupColumn]
    const raw = row[valueColumn]
    const y = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() ? Number(raw) : NaN
    if (group == null || typeof group === 'object' || !String(group).trim() || !Number.isFinite(y)) { excluded++; return }
    rows.push({ id: `import-${index + 1}`, a: String(group).trim(), y })
  })
  return { rows, excluded }
}

export function validateAnovaRows(rows: AnovaObservation[]): string | null {
  if (new Set(rows.map((row) => row.id)).size !== rows.length) return 'Observation IDs must be unique.'
  if (rows.length > 5000) return 'Use 5,000 observations or fewer in this interactive lab.'
  if (rows.some((row) => !Number.isFinite(row.y) || !row.a.trim())) return 'Every observation needs a group and a finite numeric value.'
  const groups = [...new Set(rows.map((row) => row.a))]
  if (groups.length < 2) return 'Choose at least two groups.'
  if (groups.length > 6) return 'Choose a factor with two to six groups for this interactive lab.'
  if (groups.some((group) => rows.filter((row) => row.a === group).length < 2)) return 'Each group needs at least two valid observations.'
  if (!groups.some((group) => new Set(rows.filter((row) => row.a === group).map((row) => row.y)).size > 1)) return 'The within-group variance is zero. ANOVA cannot estimate an error term.'
  return null
}

export function omegaSquared(result: OneWayResult) {
  return result.sst + result.msw > 0 ? Math.max(0, (result.ssb - result.dfB * result.msw) / (result.sst + result.msw)) : NaN
}

export function groupMeanInterval(mean: number, sd: number, n: number, alpha: number): [number, number] {
  const margin = qt(1 - alpha / 2, n - 1) * sd / Math.sqrt(n)
  return [mean - margin, mean + margin]
}

function csvCell(value: string | number): string {
  const text = String(value)
  // Keep spreadsheet applications from executing group labels as formulas.
  const safe = typeof value === 'string' && /^[=+@\-\t\r]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

export function anovaRowsCsv(rows: AnovaObservation[]): string {
  return [['id', 'group', 'value'].join(','), ...rows.map((row) => [row.id, row.a, row.y].map(csvCell).join(','))].join('\r\n')
}

export function anovaReport(result: OneWayResult, source: string): string {
  if (!Number.isFinite(result.p)) return `One-way ANOVA — ${source}\nResult unavailable. Check group sizes and within-group variance before interpreting the analysis.`
  return [`One-way ANOVA — ${source}`, `N = ${result.n}; groups = ${result.k}; alpha = ${result.alpha}.`, `F(${result.dfB}, ${result.dfW}) = ${formatNum(result.f, 3)}, p = ${formatP(result.p)}.`, `Eta squared = ${formatNum(result.eta2, 4)}; omega squared = ${formatNum(omegaSquared(result), 4)}.`, result.significant ? 'Reject the equal-means null: at least one population mean differs. Use multiplicity-adjusted comparisons to locate differences.' : 'Fail to reject the equal-means null. This does not establish equal population means.', 'Check independence from the study design, residual normality, and equal variances before relying on the pooled ANOVA.', '', 'Group summaries:', ...result.groups.map((group) => { const [lo, hi] = groupMeanInterval(group.mean, group.sd, group.n, result.alpha); return `${group.name}: n = ${group.n}, mean = ${formatNum(group.mean)}, SD = ${formatNum(group.sd)}, ${Math.round((1 - result.alpha) * 100)}% mean CI [${formatNum(lo)}, ${formatNum(hi)}].` })].join('\n')
}

export function downloadText(name: string, content: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a'); link.href = url; link.download = name; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
