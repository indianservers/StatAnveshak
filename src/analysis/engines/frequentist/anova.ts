import type { AnalysisOptions, AnalysisResult } from '../../types'
import { pTailF, pTailT, ptukey } from './dists'
import { cbind, interaction, lm, ones, sumDummies, treatmentDummies } from './linalg'
import { groupedNumeric, mean, round, sampleVariance } from './numeric'
import { welchT } from './ttests'

type SsType = 'I' | 'II' | 'III'

function optString(options: AnalysisOptions, key: string): string {
  const value = options[key]
  return typeof value === 'string' ? value : ''
}

function factorList(options: AnalysisOptions): string[] {
  const raw = options.factors
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean).slice(0, 2)
  if (typeof raw === 'string' && raw) return [raw]
  return []
}

function postHocFlags(options: AnalysisOptions): Record<string, boolean> {
  const raw = options.postHoc
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, boolean>
  return { tukey: true }
}

function empty(message: string): AnalysisResult {
  return { analysisId: 'anova.between', title: 'ANOVA', interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function holm(p: number[]): number[] {
  const n = p.length
  const order = p.map((value, i) => ({ value, i })).sort((a, b) => a.value - b.value)
  const out = Array<number>(n).fill(1)
  let running = 0
  for (let k = 0; k < n; k++) {
    const adj = Math.min(1, order[k].value * (n - k))
    running = Math.max(running, adj)
    out[order[k].i] = running
  }
  return out
}

export function pairwisePostHoc(
  groups: { name: string; values: number[] }[],
  mse: number,
  dfErr: number,
  methods: Record<string, boolean>,
): { columns: string[]; rows: Array<Array<string | number>> } {
  const k = groups.length
  const m = k * (k - 1) / 2
  type Pair = { a: string; b: string; diff: number; se: number; t: number; pRaw: number; q: number }
  const pairs: Pair[] = []
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const ni = groups[i].values.length
      const nj = groups[j].values.length
      const diff = mean(groups[i].values) - mean(groups[j].values)
      const se = Math.sqrt(mse * (1 / ni + 1 / nj))
      const t = se === 0 ? 0 : diff / se
      const q = se === 0 ? 0 : Math.abs(diff) / Math.sqrt(mse / 2 * (1 / ni + 1 / nj))
      const pRaw = pTailT(t, dfErr, 'two-sided')
      pairs.push({ a: groups[i].name, b: groups[j].name, diff, se, t, q, pRaw })
    }
  }
  const pBonf = pairs.map((p) => Math.min(1, p.pRaw * m))
  const pHolm = holm(pairs.map((p) => p.pRaw))
  const columns = ['Comparison', 'Difference', 'SE', 't']
  if (methods.tukey) columns.push('Tukey p')
  if (methods.bonferroni) columns.push('Bonferroni p')
  if (methods.holm) columns.push('Holm p')
  if (methods.scheffe) columns.push('Scheffé p')
  if (methods.gamesHowell) columns.push('Games-Howell p')
  const rows = pairs.map((p, idx) => {
    const row: Array<string | number> = [`${p.a} − ${p.b}`, round(p.diff), round(p.se), round(p.t)]
    if (methods.tukey) row.push(round(1 - ptukey(p.q, k, dfErr)))
    if (methods.bonferroni) row.push(round(pBonf[idx]))
    if (methods.holm) row.push(round(pHolm[idx]))
    if (methods.scheffe) {
      const f = p.t ** 2 / (k - 1)
      row.push(round(pTailF(f, k - 1, dfErr)))
    }
    if (methods.gamesHowell) {
      const g1 = groups.find((g) => g.name === p.a)!
      const g2 = groups.find((g) => g.name === p.b)!
      const w = welchT(g1.values, g2.values)
      const qgh = Math.abs(w.t) * Math.SQRT2
      row.push(round(1 - ptukey(qgh, k, w.df)))
    }
    return row
  })
  return { columns, rows }
}

function raincloud(groups: { name: string; values: number[] }[], y: string) {
  return {
    id: 'groups',
    title: `Groups — ${y}`,
    data: groups.map((g) => ({ type: 'box', y: g.values, name: g.name, boxmean: true })),
    layout: { yaxis: { title: y }, showlegend: true, margin: { t: 40, r: 20, b: 48, l: 56 } },
  }
}

export function runBetweenAnova(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const yName = optString(options, 'dependent')
  const factors = factorList(options)
  const ssType = (['I', 'II', 'III'].includes(String(options.ssType)) ? String(options.ssType) : 'III') as SsType
  if (!yName || factors.length === 0) return empty('Assign a numeric dependent variable and one or two factors.')

  const complete: { y: number; a: string; b: string }[] = []
  for (const row of rows) {
    const y = Number(row[yName])
    if (!Number.isFinite(y)) continue
    const a = String(row[factors[0]] ?? '(missing)')
    const b = factors[1] ? String(row[factors[1]] ?? '(missing)') : ''
    complete.push({ y, a, b })
  }
  if (complete.length < 4) return empty('Need at least four complete observations.')

  const y = complete.map((r) => r.y)
  const n = y.length
  const intercept = ones(n)

  if (factors.length === 1) {
    const groups = groupedNumeric(rows, factors[0], yName).filter((g) => g.values.length > 0)
    if (groups.length < 2) return empty('The factor must have at least two levels.')
    const grand = mean(y)
    let ssb = 0
    let ssw = 0
    for (const g of groups) {
      const m = mean(g.values)
      ssb += g.values.length * (m - grand) ** 2
      ssw += g.values.reduce((s, v) => s + (v - m) ** 2, 0)
    }
    const dfb = groups.length - 1
    const dfw = n - groups.length
    const msb = ssb / dfb
    const msw = ssw / dfw
    const f = msb / msw
    const p = pTailF(f, dfb, dfw)
    const eta2 = ssb / (ssb + ssw)
    const partial = eta2
    const methods = postHocFlags(options)
    const post = pairwisePostHoc(groups, msw, dfw, methods)
    return {
      analysisId: 'anova.between',
      title: 'ANOVA',
      interpretation: `One-way ANOVA on ${yName} by ${factors[0]}: F(${dfb}, ${dfw}) = ${round(f)}, p = ${round(p)}. η² = ${round(eta2)}. Type ${ssType} SS coincide in the one-way design.`,
      assumptions: [
        groups.some((g) => g.values.length < 3) ? 'Some cells are very small; F and post-hoc tests are unstable.' : 'Cell sizes are adequate for a one-way F test.',
        'Independence, normality of residuals, and homogeneous variances are assumed for the parametric F.',
      ],
      footnotes: [
        'Tukey–Kramer uses the studentized range with the residual MSE (unequal n allowed).',
        'Games–Howell uses Welch df and the studentized range (does not assume equal variances).',
        'Bayesian ANOVA arrives in Phase 4.',
      ],
      tables: [
        {
          id: 'anova',
          title: `ANOVA table (Type ${ssType})`,
          columns: ['Source', 'SS', 'df', 'MS', 'F', 'p', 'η²', 'partial η²'],
          rows: [
            [factors[0], round(ssb), dfb, round(msb), round(f), round(p), round(eta2), round(partial)],
            ['Residual', round(ssw), dfw, round(msw), '—', '—', '—', '—'],
          ],
        },
        {
          id: 'desc',
          title: 'Descriptives',
          columns: ['Group', 'n', 'Mean', 'SD'],
          rows: groups.map((g) => [g.name, g.values.length, round(mean(g.values)), round(Math.sqrt(sampleVariance(g.values)))]),
        },
        { id: 'posthoc', title: 'Post-hoc comparisons', columns: post.columns, rows: post.rows },
      ],
      plots: [raincloud(groups, yName)],
    }
  }

  const aVals = complete.map((r) => r.a)
  const bVals = complete.map((r) => r.b)
  const Atr = treatmentDummies(aVals)
  const Btr = treatmentDummies(bVals)
  const Asum = sumDummies(aVals)
  const Bsum = sumDummies(bVals)
  const sst = y.reduce((s, v) => s + (v - mean(y)) ** 2, 0)

  const fit = (X: number[][]) => {
    const model = lm(y, X)
    if (!model) throw new Error('Design matrix is rank-deficient. Check empty cells.')
    return model
  }

  const XfullI = cbind(intercept, Atr.X, Btr.X, interaction(Atr.X, Btr.X))
  const fullI = fit(XfullI)
  const Xa = cbind(intercept, Atr.X)
  const Xb = cbind(intercept, Btr.X)
  const Xab = cbind(intercept, Atr.X, Btr.X)
  const fa = fit(Xa)
  const fb = fit(Xb)
  const fab = fit(Xab)
  const f0 = fit(intercept)

  const XfullIII = cbind(intercept, Asum.X, Bsum.X, interaction(Asum.X, Bsum.X))
  const fullIII = fit(XfullIII)
  const XA_III = cbind(intercept, Bsum.X, interaction(Asum.X, Bsum.X))
  const XB_III = cbind(intercept, Asum.X, interaction(Asum.X, Bsum.X))
  const XAB_III = cbind(intercept, Asum.X, Bsum.X)

  let ssA: number
  let ssB: number
  let ssAB: number
  let sse: number
  let dfe: number
  if (ssType === 'I') {
    ssA = f0.sse - fa.sse
    ssB = fa.sse - fab.sse
    ssAB = fab.sse - fullI.sse
    sse = fullI.sse
    dfe = fullI.dfResidual
  } else if (ssType === 'II') {
    ssA = fb.sse - fab.sse
    ssB = fa.sse - fab.sse
    ssAB = fab.sse - fullI.sse
    sse = fullI.sse
    dfe = fullI.dfResidual
  } else {
    ssA = fit(XA_III).sse - fullIII.sse
    ssB = fit(XB_III).sse - fullIII.sse
    ssAB = fit(XAB_III).sse - fullIII.sse
    sse = fullIII.sse
    dfe = fullIII.dfResidual
  }

  const dfA = Atr.levels.length - 1
  const dfB = Btr.levels.length - 1
  const dfAB = dfA * dfB
  const terms = [
    { name: factors[0], ss: ssA, df: dfA },
    { name: factors[1], ss: ssB, df: dfB },
    { name: `${factors[0]} × ${factors[1]}`, ss: ssAB, df: dfAB },
  ]
  const mse = sse / dfe
  const anovaRows = terms.map((t) => {
    const ms = t.ss / t.df
    const f = ms / mse
    const p = pTailF(f, t.df, dfe)
    const eta2 = t.ss / sst
    const partial = t.ss / (t.ss + sse)
    return { ...t, ms, f, p, eta2, partial }
  })

  const groupsA = groupedNumeric(complete.map((r) => ({ [factors[0]]: r.a, y: r.y })), factors[0], 'y')
  const methods = postHocFlags(options)
  const post = pairwisePostHoc(groupsA, mse, dfe, methods)

  return {
    analysisId: 'anova.between',
    title: 'ANOVA',
    interpretation: `Two-way ANOVA (Type ${ssType} SS) of ${yName} on ${factors[0]} and ${factors[1]}. Interaction F(${dfAB}, ${dfe}) = ${round(anovaRows[2].f)}, p = ${round(anovaRows[2].p)}.`,
    assumptions: [
      'Type I is sequential (A then B then AB). Type II tests each main effect after the other, ignoring interaction. Type III uses sum-to-zero contrasts so each term is after all others.',
      'Empty cells make interaction Type III unidentified; the engine reports an error if the design matrix is singular.',
    ],
    footnotes: [
      'Post-hoc pairs are shown for the first factor using the residual MSE of the full model.',
      'Bayesian ANOVA arrives in Phase 4.',
    ],
    tables: [
      {
        id: 'anova',
        title: `ANOVA table (Type ${ssType})`,
        columns: ['Source', 'SS', 'df', 'MS', 'F', 'p', 'η²', 'partial η²'],
        rows: [
          ...anovaRows.map((t) => [t.name, round(t.ss), t.df, round(t.ms), round(t.f), round(t.p), round(t.eta2), round(t.partial)]),
          ['Residual', round(sse), dfe, round(mse), '—', '—', '—', '—'],
        ],
      },
      { id: 'posthoc', title: `Post-hoc (${factors[0]})`, columns: post.columns, rows: post.rows },
    ],
    plots: [raincloud(groupsA.map((g) => ({ name: g.name, values: g.values })), yName)],
  }
}

export function runAncova(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const yName = optString(options, 'dependent')
  const group = optString(options, 'group')
  const cov = optString(options, 'covariate')
  if (!yName || !group || !cov) {
    return { analysisId: 'anova.ancova', title: 'ANCOVA', interpretation: 'Assign a dependent variable, a grouping factor, and a numeric covariate.', assumptions: [], footnotes: [], tables: [], plots: [] }
  }
  const complete: { y: number; g: string; x: number }[] = []
  for (const row of rows) {
    const y = Number(row[yName])
    const x = Number(row[cov])
    if (!Number.isFinite(y) || !Number.isFinite(x)) continue
    complete.push({ y, g: String(row[group] ?? '(missing)'), x })
  }
  if (complete.length < 6) {
    return { analysisId: 'anova.ancova', title: 'ANCOVA', interpretation: 'Need at least six complete cases.', assumptions: [], footnotes: [], tables: [], plots: [] }
  }
  const y = complete.map((r) => r.y)
  const n = y.length
  const intercept = ones(n)
  const xCol = complete.map((r) => [r.x])
  const G = sumDummies(complete.map((r) => r.g))
  const GX = interaction(G.X, xCol)
  const reduced = lm(y, cbind(intercept, xCol))
  const full = lm(y, cbind(intercept, xCol, G.X))
  const slopes = lm(y, cbind(intercept, xCol, G.X, GX))
  if (!reduced || !full || !slopes) {
    return { analysisId: 'anova.ancova', title: 'ANCOVA', interpretation: 'Design matrix is rank-deficient.', assumptions: [], footnotes: [], tables: [], plots: [] }
  }
  const ssCov = lm(y, cbind(intercept, G.X))!.sse - full.sse
  const ssG = reduced.sse - full.sse
  const sse = full.sse
  const dfG = G.levels.length - 1
  const dfE = full.dfResidual
  const fG = (ssG / dfG) / (sse / dfE)
  const fCov = (ssCov / 1) / (sse / dfE)
  const ssInt = slopes.sse >= 0 ? full.sse - slopes.sse : Number.NaN
  const dfInt = GX[0].length
  const fInt = (ssInt / dfInt) / (slopes.sse / slopes.dfResidual)
  const groups = groupedNumeric(complete.map((r) => ({ g: r.g, y: r.y })), 'g', 'y')
  return {
    analysisId: 'anova.ancova',
    title: 'ANCOVA',
    interpretation: `Group effect of ${group} on ${yName} adjusted for ${cov}: F(${dfG}, ${dfE}) = ${round(fG)}, p = ${round(pTailF(fG, dfG, dfE))}. Covariate F(1, ${dfE}) = ${round(fCov)}, p = ${round(pTailF(fCov, 1, dfE))}.`,
    assumptions: [
      `Homogeneity of slopes (group × covariate): F(${dfInt}, ${slopes.dfResidual}) = ${round(fInt)}, p = ${round(pTailF(fInt, dfInt, slopes.dfResidual))}.`,
      'ANCOVA assumes a linear covariate relation and independent residuals.',
    ],
    footnotes: [
      'Type II SS: group after covariate, covariate after group (sum-to-zero group coding).',
      'Bayesian ANCOVA arrives in Phase 4.',
    ],
    tables: [{
      id: 'ancova',
      title: 'ANCOVA table (Type II)',
      columns: ['Source', 'SS', 'df', 'MS', 'F', 'p'],
      rows: [
        [cov, round(ssCov), 1, round(ssCov), round(fCov), round(pTailF(fCov, 1, dfE))],
        [group, round(ssG), dfG, round(ssG / dfG), round(fG), round(pTailF(fG, dfG, dfE))],
        ['Residual', round(sse), dfE, round(sse / dfE), '—', '—'],
        [`${group} × ${cov} (slopes)`, round(ssInt), dfInt, round(ssInt / dfInt), round(fInt), round(pTailF(fInt, dfInt, slopes.dfResidual))],
      ],
    }, {
      id: 'desc',
      title: 'Unadjusted group means',
      columns: ['Group', 'n', 'Mean'],
      rows: groups.map((g) => [g.name, g.values.length, round(mean(g.values))]),
    }],
    plots: [{
      id: 'scatter',
      title: `${yName} vs ${cov}`,
      data: groups.map((g) => {
        const pts = complete.filter((r) => r.g === g.name)
        return { type: 'scatter', mode: 'markers', x: pts.map((p) => p.x), y: pts.map((p) => p.y), name: g.name }
      }),
      layout: { xaxis: { title: cov }, yaxis: { title: yName }, margin: { t: 40, r: 20, b: 48, l: 56 } },
    }],
  }
}
