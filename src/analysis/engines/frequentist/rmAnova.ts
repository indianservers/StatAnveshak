import type { AnalysisOptions, AnalysisResult } from '../../types'
import { pTailChi, pTailF } from './dists'
import { jacobiEigen } from './linalg'
import { asFiniteNumber, mean, round } from './numeric'

function empty(message: string): AnalysisResult {
  return { analysisId: 'anova.repeated', title: 'Repeated Measures ANOVA', interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function helmert(k: number): number[][] {
  const C: number[][] = []
  for (let i = 0; i < k - 1; i++) {
    const row = Array<number>(k).fill(0)
    const w = 1 / Math.sqrt((i + 1) * (i + 2))
    for (let j = 0; j <= i; j++) row[j] = w
    row[i + 1] = -(i + 1) * w
    C.push(row)
  }
  return C
}

function cov(M: number[][]): number[][] {
  const n = M.length
  const p = M[0].length
  const mu = Array.from({ length: p }, (_, j) => mean(M.map((r) => r[j])))
  const S = Array.from({ length: p }, () => Array<number>(p).fill(0))
  for (const row of M) {
    for (let i = 0; i < p; i++) {
      for (let j = 0; j < p; j++) S[i][j] += (row[i] - mu[i]) * (row[j] - mu[j])
    }
  }
  for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) S[i][j] /= n - 1
  return S
}

function detSym(A: number[][]): number {
  const { values } = jacobiEigen(A)
  return values.reduce((p, v) => p * v, 1)
}

export function runRepeatedAnova(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const measures = Array.isArray(options.measures) ? options.measures.map(String) : []
  if (measures.length < 2) return empty('Select at least two numeric repeated-measure columns (wide format: one row per subject).')
  const subjects: number[][] = []
  for (const row of rows) {
    const vals = measures.map((m) => asFiniteNumber(row[m]))
    if (vals.every((v) => v !== null)) subjects.push(vals as number[])
  }
  const n = subjects.length
  const k = measures.length
  if (n < 3) return empty('Need at least three complete subjects.')
  const grand = mean(subjects.flat())
  const condMeans = Array.from({ length: k }, (_, j) => mean(subjects.map((r) => r[j])))
  const subjMeans = subjects.map((r) => mean(r))
  const ssCond = n * condMeans.reduce((s, m) => s + (m - grand) ** 2, 0)
  const ssSubj = k * subjMeans.reduce((s, m) => s + (m - grand) ** 2, 0)
  const ssTotal = subjects.flat().reduce((s, v) => s + (v - grand) ** 2, 0)
  const ssErr = ssTotal - ssCond - ssSubj
  const dfCond = k - 1
  const dfErr = (n - 1) * (k - 1)
  const f = (ssCond / dfCond) / (ssErr / dfErr)
  const p = pTailF(f, dfCond, dfErr)

  let mauchlyW = 1
  let mauchlyChi = 0
  let mauchlyDf = 0
  let mauchlyP = 1
  let epsGG = 1
  let epsHF = 1
  if (k > 2) {
    const C = helmert(k)
    const W = subjects.map((y) => C.map((c) => c.reduce((s, cij, j) => s + cij * y[j], 0)))
    const S = cov(W)
    const pDim = k - 1
    const tr = S.reduce((s, row, i) => s + row[i], 0)
    const { values } = jacobiEigen(S)
    const tr2 = values.reduce((s, v) => s + v * v, 0)
    mauchlyW = detSym(S) / (tr / pDim) ** pDim
    const d = 1 - (2 * pDim * pDim + pDim + 2) / (6 * pDim * (n - 1))
    mauchlyChi = -(n - 1) * d * Math.log(Math.max(mauchlyW, 1e-16))
    mauchlyDf = pDim * (pDim + 1) / 2 - 1
    mauchlyP = pTailChi(mauchlyChi, mauchlyDf)
    epsGG = Math.min(1, Math.max(1 / pDim, (tr * tr) / (pDim * tr2)))
    const hf = (n * pDim * epsGG - 2) / (pDim * (n - 1 - pDim * epsGG))
    epsHF = Math.min(1, Math.max(epsGG, hf))
  }

  return {
    analysisId: 'anova.repeated',
    title: 'Repeated Measures ANOVA',
    interpretation: `Within-subjects effect of condition: F(${dfCond}, ${dfErr}) = ${round(f)}, p = ${round(p)} (sphericity assumed). Greenhouse–Geisser ε = ${round(epsGG)}; Huynh–Feldt ε = ${round(epsHF)}.`,
    assumptions: [
      k === 2 ? 'Two conditions: sphericity holds automatically.' : `Mauchly W = ${round(mauchlyW)}, χ²(${mauchlyDf}) = ${round(mauchlyChi)}, p = ${round(mauchlyP)}.`,
      'Wide format: each row is a subject and selected columns are the repeated conditions.',
    ],
    footnotes: [
      'Greenhouse–Geisser and Huynh–Feldt multiply both numerator and denominator df. Huynh–Feldt is truncated to [GG, 1].',
      'Bayesian RM ANOVA arrives in Phase 4.',
    ],
    tables: [
      {
        id: 'within',
        title: 'Within-subjects effects',
        columns: ['Correction', 'F', 'df1', 'df2', 'p'],
        rows: [
          ['Sphericity assumed', round(f), dfCond, dfErr, round(p)],
          ['Greenhouse–Geisser', round(f), round(dfCond * epsGG, 4), round(dfErr * epsGG, 4), round(pTailF(f, dfCond * epsGG, dfErr * epsGG))],
          ['Huynh–Feldt', round(f), round(dfCond * epsHF, 4), round(dfErr * epsHF, 4), round(pTailF(f, dfCond * epsHF, dfErr * epsHF))],
        ],
      },
      {
        id: 'mauchly',
        title: 'Mauchly test of sphericity',
        columns: ['W', 'χ²', 'df', 'p', 'GG ε', 'HF ε'],
        rows: [[round(mauchlyW), round(mauchlyChi), mauchlyDf, round(mauchlyP), round(epsGG), round(epsHF)]],
      },
      {
        id: 'desc',
        title: 'Condition means',
        columns: ['Condition', 'Mean'],
        rows: measures.map((m, j) => [m, round(condMeans[j])]),
      },
    ],
    plots: [{
      id: 'profile',
      title: 'Condition profile',
      data: [{ type: 'scatter', mode: 'lines+markers', x: measures, y: condMeans }],
      layout: { yaxis: { title: 'Mean' }, margin: { t: 40, r: 20, b: 60, l: 56 } },
    }],
  }
}
