import type { AnalysisOptions, AnalysisResult, PlotSpec } from '../../types'
import { pnorm, pTailT, pf } from './dists'
import { groupedNumeric, mean, median, numericValues, pairedComplete, round, sampleSd, sampleVariance } from './numeric'
import { shapiroWilk } from './shapiroWilk'

export type Alternative = 'two-sided' | 'greater' | 'less'

export function asAlternative(value: unknown): Alternative {
  if (value === 'greater' || value === 'less') return value
  return 'two-sided'
}

function empty(analysisId: string, title: string, message: string): AnalysisResult {
  return { analysisId, title, interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

export function cohensDIndependent(a: number[], b: number[]): number {
  const sp = Math.sqrt(((a.length - 1) * sampleVariance(a) + (b.length - 1) * sampleVariance(b)) / (a.length + b.length - 2))
  return sp === 0 ? 0 : (mean(a) - mean(b)) / sp
}

export function studentT(a: number[], b: number[]): { t: number; df: number; se: number; diff: number } {
  const n1 = a.length
  const n2 = b.length
  const sp = ((n1 - 1) * sampleVariance(a) + (n2 - 1) * sampleVariance(b)) / (n1 + n2 - 2)
  const se = Math.sqrt(sp * (1 / n1 + 1 / n2))
  const diff = mean(a) - mean(b)
  return { t: se === 0 ? (diff === 0 ? 0 : Math.sign(diff) * Infinity) : diff / se, df: n1 + n2 - 2, se, diff }
}

export function welchT(a: number[], b: number[]): { t: number; df: number; se: number; diff: number } {
  const n1 = a.length
  const n2 = b.length
  const se2 = sampleVariance(a) / n1 + sampleVariance(b) / n2
  const se = Math.sqrt(se2)
  const diff = mean(a) - mean(b)
  const df = se2 ** 2 / ((sampleVariance(a) / n1) ** 2 / (n1 - 1) + (sampleVariance(b) / n2) ** 2 / (n2 - 1))
  return { t: se === 0 ? (diff === 0 ? 0 : Math.sign(diff) * Infinity) : diff / se, df, se, diff }
}

export function oneSampleT(x: number[], mu0: number): { t: number; df: number; se: number; mean: number } {
  const m = mean(x)
  const se = sampleSd(x) / Math.sqrt(x.length)
  const t = se === 0 ? (m === mu0 ? 0 : Math.sign(m - mu0) * Infinity) : (m - mu0) / se
  return { t, df: x.length - 1, se, mean: m }
}

export function leveneMedian(groups: number[][]): { f: number; df1: number; df2: number; p: number } {
  const z = groups.map((g) => {
    const med = median(g)
    return g.map((v) => Math.abs(v - med))
  })
  const all = z.flat()
  const grand = mean(all)
  const k = z.length
  const n = all.length
  let ssb = 0
  let ssw = 0
  for (const g of z) {
    const mg = mean(g)
    ssb += g.length * (mg - grand) ** 2
    ssw += g.reduce((s, v) => s + (v - mg) ** 2, 0)
  }
  const df1 = k - 1
  const df2 = n - k
  const f = df2 > 0 ? (ssb / df1) / (ssw / df2) : Number.NaN
  return { f, df1, df2, p: 1 - pf(f, df1, df2) }
}

function ranks(values: number[]): number[] {
  const order = values.map((value, i) => ({ value, i })).sort((a, b) => a.value - b.value)
  const out = Array<number>(values.length).fill(0)
  for (let i = 0; i < order.length; ) {
    let j = i
    while (j < order.length && order[j].value === order[i].value) j++
    const rank = (i + 1 + j) / 2
    for (let k = i; k < j; k++) out[order[k].i] = rank
    i = j
  }
  return out
}

export function mannWhitney(a: number[], b: number[], alternative: Alternative): { U: number; z: number; p: number; rrb: number; exact: boolean } {
  const n1 = a.length
  const n2 = b.length
  const labeled = [...a.map((v) => ({ v, g: 1 })), ...b.map((v) => ({ v, g: 2 }))]
  const r = ranks(labeled.map((x) => x.v))
  let r1 = 0
  for (let i = 0; i < labeled.length; i++) if (labeled[i].g === 1) r1 += r[i]
  const U1 = r1 - n1 * (n1 + 1) / 2
  const U = U1
  const rrb = (2 * U1) / (n1 * n2) - 1
  const n = n1 + n2
  const tieCounts = new Map<number, number>()
  for (const value of [...a, ...b]) tieCounts.set(value, (tieCounts.get(value) ?? 0) + 1)
  let tieAdj = 0
  for (const t of tieCounts.values()) tieAdj += t ** 3 - t
  const mu = n1 * n2 / 2
  const sigma = Math.sqrt((n1 * n2 / 12) * ((n + 1) - tieAdj / (n * (n - 1))))
  const exact = n1 + n2 <= 40 && [...tieCounts.values()].every((t) => t === 1)
  const z = sigma > 0 ? (U - mu) / sigma : 0
  if (exact) {
    return { U, z, p: mannWhitneyExact(n1, n2, U, alternative), rrb, exact: true }
  }
  const cont = U >= mu ? -0.5 : 0.5
  const zc = sigma > 0 ? (U + cont - mu) / sigma : 0
  let p: number
  if (alternative === 'greater') p = 1 - pnorm(zc)
  else if (alternative === 'less') p = pnorm(zc)
  else p = 2 * Math.min(pnorm(zc), 1 - pnorm(zc))
  return { U, z: zc, p: Math.min(1, Math.max(0, p)), rrb, exact: false }
}

function mannWhitneyExact(n1: number, n2: number, U: number, alternative: Alternative): number {
  const n = n1 + n2
  const minSum = n1 * (n1 + 1) / 2
  const maxSum = n1 * (2 * n - n1 + 1) / 2
  const dp = Array.from({ length: n1 + 1 }, () => Array<number>(maxSum + 1).fill(0))
  dp[0][0] = 1
  for (let rank = 1; rank <= n; rank++) {
    for (let k = Math.min(n1, rank); k >= 1; k--) {
      for (let s = maxSum; s >= rank; s--) dp[k][s] += dp[k - 1][s - rank]
    }
  }
  const counts = Array(n1 * n2 + 1).fill(0)
  for (let s = minSum; s <= maxSum; s++) {
    const u = s - minSum
    counts[u] += dp[n1][s]
  }
  const total = counts.reduce((sum, c) => sum + c, 0)
  const u = Math.round(U)
  const cdfLe = counts.slice(0, u + 1).reduce((sum, c) => sum + c, 0) / total
  const cdfLt = counts.slice(0, u).reduce((sum, c) => sum + c, 0) / total
  if (alternative === 'less') return cdfLe
  if (alternative === 'greater') return 1 - cdfLt
  return Math.min(1, 2 * Math.min(cdfLe, 1 - cdfLt))
}

export function wilcoxonSignedRank(diffs: number[], alternative: Alternative): { W: number; z: number; p: number; n: number; exact: boolean } {
  const nz = diffs.filter((d) => d !== 0)
  const n = nz.length
  const abs = nz.map((d) => Math.abs(d))
  const r = ranks(abs)
  let Wplus = 0
  for (let i = 0; i < n; i++) if (nz[i] > 0) Wplus += r[i]
  const ties = new Map<number, number>()
  for (const a of abs) ties.set(a, (ties.get(a) ?? 0) + 1)
  const hasTies = [...ties.values()].some((t) => t > 1)
  const mu = n * (n + 1) / 4
  let tieAdj = 0
  for (const t of ties.values()) tieAdj += t ** 3 - t
  const sigma = Math.sqrt((n * (n + 1) * (2 * n + 1) - tieAdj / 2) / 24)
  const exact = n <= 15 && !hasTies
  if (exact) {
    return { W: Wplus, z: sigma > 0 ? (Wplus - mu) / sigma : 0, p: wilcoxonExact(n, Wplus, alternative), n, exact: true }
  }
  const cont = Wplus >= mu ? -0.5 : 0.5
  const z = sigma > 0 ? (Wplus + cont - mu) / sigma : 0
  const p = alternative === 'greater' ? 1 - pnorm(z) : alternative === 'less' ? pnorm(z) : 2 * Math.min(pnorm(z), 1 - pnorm(z))
  return { W: Wplus, z, p: Math.min(1, Math.max(0, p)), n, exact: false }
}

function wilcoxonExact(n: number, W: number, alternative: Alternative): number {
  const total = 2 ** n
  let ge = 0
  let le = 0
  const limit = 1 << n
  for (let mask = 0; mask < limit; mask++) {
    let w = 0
    for (let i = 0; i < n; i++) if (mask & (1 << i)) w += i + 1
    if (w <= W) le++
    if (w >= W) ge++
  }
  if (alternative === 'less') return le / total
  if (alternative === 'greater') return ge / total
  return Math.min(1, 2 * Math.min(le, ge) / total)
}

function raincloud(groups: { name: string; values: number[] }[], yTitle: string): PlotSpec {
  return {
    id: 'raincloud',
    title: `Raincloud — ${yTitle}`,
    data: groups.map((item) => ({
      type: 'violin',
      y: item.values,
      x: item.values.map(() => item.name),
      name: item.name,
      side: 'positive',
      points: 'all',
      jitter: 0.35,
      pointpos: -1.35,
      spanmode: 'hard',
      box: { visible: true, width: 0.18 },
      meanline: { visible: true },
      line: { color: '#4f46e5' },
      marker: { size: 6, opacity: 0.55, color: '#4338ca' },
      fillcolor: 'rgba(79,70,229,0.28)',
    })),
    layout: { xaxis: { title: '' }, yaxis: { title: yTitle }, violinmode: 'overlay', showlegend: groups.length > 1, margin: { t: 40, r: 20, b: 48, l: 56 } },
  }
}

function describeRow(name: string, x: number[]): Array<string | number> {
  const sw = x.length >= 3 && x.length <= 5000 ? shapiroWilk(x) : { w: Number.NaN, p: Number.NaN }
  return [name, x.length, round(mean(x)), round(sampleSd(x)), round(sw.w), round(sw.p)]
}

export function runIndependentT(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const dependent = String(options.dependent ?? '')
  const group = String(options.group ?? '')
  const alternative = asAlternative(options.alternative)
  const welch = options.equalVariance !== true && options.equalVariance !== 'true'
  const nonparametric = Boolean(options.mannWhitney)
  const groups = groupedNumeric(rows, group, dependent).filter((g) => g.values.length > 0)
  if (!dependent || !group) return empty('t.independent', 'Independent Samples T-Test', 'Assign a numeric dependent variable and a grouping variable with two levels.')
  if (groups.length !== 2) {
    return empty('t.independent', 'Independent Samples T-Test', `Grouping variable must have exactly two levels (found ${groups.length}). Use ANOVA for more groups.`)
  }
  const a = groups[0].values
  const b = groups[1].values
  if (a.length < 2 || b.length < 2) return empty('t.independent', 'Independent Samples T-Test', 'Each group needs at least two observations.')

  const param = welch ? welchT(a, b) : studentT(a, b)
  const p = pTailT(param.t, param.df, alternative)
  const d = cohensDIndependent(a, b)
  const lev = leveneMedian([a, b])
  const mw = mannWhitney(a, b, alternative)
  const method = welch ? 'Welch' : 'Student'
  const assumptions = [
    lev.p < 0.05 ? `Levene (median-center) p = ${round(lev.p)}: variances appear unequal; Welch is the default.` : `Levene (median-center) p = ${round(lev.p)}: no strong evidence of unequal variances.`,
    a.length < 30 || b.length < 30 ? 'Small samples: check Shapiro–Wilk and the raincloud before relying on the t-test.' : 'n is moderate; t-test is reasonably robust to mild non-normality.',
  ]

  const tables = [
    {
      id: 'desc',
      title: 'Group descriptives',
      columns: ['Group', 'n', 'Mean', 'SD', 'Shapiro W', 'Shapiro p'],
      rows: [describeRow(groups[0].name, a), describeRow(groups[1].name, b)],
    },
    {
      id: 'test',
      title: `${method} independent-samples t-test`,
      columns: ['t', 'df', 'p', "Cohen's d", 'Mean difference', 'SE', 'Alternative'],
      rows: [[round(param.t), round(param.df, 4), round(p), round(d), round(param.diff), round(param.se), alternative]],
    },
    {
      id: 'levene',
      title: 'Levene test of equal variances (Brown–Forsythe)',
      columns: ['F', 'df1', 'df2', 'p'],
      rows: [[round(lev.f), lev.df1, lev.df2, round(lev.p)]],
    },
  ]
  if (nonparametric) {
    tables.push({
      id: 'mw',
      title: 'Mann–Whitney U',
      columns: ['U', 'z', 'p', 'Rank-biserial r', 'Exact'],
      rows: [[round(mw.U), round(mw.z), round(mw.p), round(mw.rrb), mw.exact ? 'yes' : 'normal approx']],
    })
  }

  return {
    analysisId: 't.independent',
    title: 'Independent Samples T-Test',
    interpretation: nonparametric
      ? `${method} t = ${round(param.t)}, p = ${round(p)} (${alternative}). Mann–Whitney U = ${round(mw.U)}, p = ${round(mw.p)}. Cohen's d = ${round(d)}.`
      : `${method} t(${round(param.df, 3)}) = ${round(param.t)}, p = ${round(p)} (${alternative}). Mean difference ${groups[0].name} − ${groups[1].name} = ${round(param.diff)}. Cohen's d = ${round(d)}.`,
    assumptions,
    footnotes: [
      'Student uses a pooled variance; Welch uses separate variances and Satterthwaite df (JASP default).',
      'Levene uses absolute deviations from group medians (Brown–Forsythe).',
      'Mann–Whitney uses midranks; exact enumeration when n1+n2 ≤ 30 and there are no ties, otherwise a continuity-corrected normal approximation with tie correction.',
      'Bayesian t-tests arrive in Phase 4.',
    ],
    tables,
    plots: [raincloud(groups, dependent)],
  }
}

export function runPairedT(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const m1 = String(options.measure1 ?? '')
  const m2 = String(options.measure2 ?? '')
  const alternative = asAlternative(options.alternative)
  const nonparametric = Boolean(options.wilcoxon)
  const pairs = pairedComplete(rows, m1, m2)
  if (!m1 || !m2) return empty('t.paired', 'Paired Samples T-Test', 'Assign two numeric measures observed on the same cases.')
  if (pairs.length < 2) return empty('t.paired', 'Paired Samples T-Test', 'Need at least two complete pairs.')
  const diffs = pairs.map((p) => p.x - p.y)
  const test = oneSampleT(diffs, 0)
  const p = pTailT(test.t, test.df, alternative)
  const d = sampleSd(diffs) === 0 ? 0 : mean(diffs) / sampleSd(diffs)
  const wx = wilcoxonSignedRank(diffs, alternative)
  const tables = [
    {
      id: 'desc',
      title: 'Pair descriptives',
      columns: ['Measure', 'n', 'Mean', 'SD', 'Shapiro W', 'Shapiro p'],
      rows: [
        describeRow(m1, pairs.map((p) => p.x)),
        describeRow(m2, pairs.map((p) => p.y)),
        describeRow(`${m1} − ${m2}`, diffs),
      ],
    },
    {
      id: 'test',
      title: 'Paired t-test',
      columns: ['t', 'df', 'p', "Cohen's dz", 'Mean difference', 'SE', 'Alternative'],
      rows: [[round(test.t), test.df, round(p), round(d), round(test.mean), round(test.se), alternative]],
    },
  ]
  if (nonparametric) {
    tables.push({
      id: 'wx',
      title: 'Wilcoxon signed-rank',
      columns: ['W+', 'z', 'p', 'n (nonzero)', 'Exact'],
      rows: [[round(wx.W), round(wx.z), round(wx.p), wx.n, wx.exact ? 'yes' : 'normal approx']],
    })
  }
  return {
    analysisId: 't.paired',
    title: 'Paired Samples T-Test',
    interpretation: `Paired t(${test.df}) = ${round(test.t)}, p = ${round(p)} (${alternative}). Mean of ${m1} − ${m2} = ${round(test.mean)}. Cohen's dz = ${round(d)}.`,
    assumptions: [
      'Pairs are the same observational units; differences are assumed i.i.d.',
      diffs.length < 30 ? 'Small sample of differences: inspect Shapiro–Wilk on the difference scores.' : 't on differences is reasonably robust for moderate n.',
    ],
    footnotes: [
      'Zeros are dropped for Wilcoxon (R/JASP convention). Exact signed-rank p-values are used for n≤15 with no ties.',
      'Bayesian paired t arrives in Phase 4.',
    ],
    tables,
    plots: [raincloud([{ name: `${m1} − ${m2}`, values: diffs }], 'Difference')],
  }
}

export function runOneSampleT(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variable = String(options.variable ?? '')
  const mu0 = Number(options.mu0 ?? 0)
  const alternative = asAlternative(options.alternative)
  const nonparametric = Boolean(options.wilcoxon)
  const x = numericValues(rows, variable)
  if (!variable) return empty('t.oneSample', 'One Sample T-Test', 'Assign a numeric variable.')
  if (x.length < 2) return empty('t.oneSample', 'One Sample T-Test', 'Need at least two observations.')
  const test = oneSampleT(x, mu0)
  const p = pTailT(test.t, test.df, alternative)
  const d = sampleSd(x) === 0 ? 0 : (test.mean - mu0) / sampleSd(x)
  const wx = wilcoxonSignedRank(x.map((v) => v - mu0), alternative)
  const tables = [
    {
      id: 'desc',
      title: 'Descriptives',
      columns: ['Variable', 'n', 'Mean', 'SD', 'Shapiro W', 'Shapiro p'],
      rows: [describeRow(variable, x)],
    },
    {
      id: 'test',
      title: 'One-sample t-test',
      columns: ['t', 'df', 'p', "Cohen's d", 'Mean', 'Test value', 'SE', 'Alternative'],
      rows: [[round(test.t), test.df, round(p), round(d), round(test.mean), mu0, round(test.se), alternative]],
    },
  ]
  if (nonparametric) {
    tables.push({
      id: 'wx',
      title: 'Wilcoxon signed-rank vs test value',
      columns: ['W+', 'z', 'p', 'n (nonzero)', 'Exact'],
      rows: [[round(wx.W), round(wx.z), round(wx.p), wx.n, wx.exact ? 'yes' : 'normal approx']],
    })
  }
  return {
    analysisId: 't.oneSample',
    title: 'One Sample T-Test',
    interpretation: `t(${test.df}) = ${round(test.t)}, p = ${round(p)} (${alternative}) for H0: mean = ${mu0}. Observed mean = ${round(test.mean)}. Cohen's d = ${round(d)}.`,
    assumptions: [
      x.length < 30 ? 'Small sample: inspect Shapiro–Wilk and the raincloud before relying on the t-test.' : 't-test is reasonably robust to mild non-normality at this sample size.',
    ],
    footnotes: [
      'Wilcoxon signed-rank tests the corresponding shift hypothesis about the test value; zeros are dropped.',
      'Bayesian one-sample t arrives in Phase 4.',
    ],
    tables,
    plots: [raincloud([{ name: variable, values: x }], variable)],
  }
}
