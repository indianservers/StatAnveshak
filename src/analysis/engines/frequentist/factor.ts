import type { AnalysisOptions, AnalysisResult } from '../../types'
import { inverse, jacobiEigen, multiply, transpose } from './linalg'
import { asFiniteNumber, mean, round, sampleVariance } from './numeric'

function empty(id: string, title: string, message: string): AnalysisResult {
  return { analysisId: id, title, interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

function completeMatrix(rows: Record<string, unknown>[], columns: string[]): number[][] {
  const out: number[][] = []
  for (const row of rows) {
    const vals = columns.map((col) => asFiniteNumber(row[col]))
    if (vals.every((v) => v !== null)) out.push(vals as number[])
  }
  return out
}

function centerScale(X: number[][], correlation: boolean): number[][] {
  const p = X[0].length
  const means = Array.from({ length: p }, (_, j) => mean(X.map((row) => row[j])))
  const sds = Array.from({ length: p }, (_, j) => {
    const sd = Math.sqrt(sampleVariance(X.map((row) => row[j])))
    return sd > 1e-12 ? sd : 1
  })
  return X.map((row) => row.map((v, j) => (v - means[j]) / (correlation ? sds[j] : 1)))
}

export function covOrCor(Z: number[][]): number[][] {
  const n = Z.length
  const p = Z[0].length
  const S = Array.from({ length: p }, () => Array(p).fill(0))
  for (let i = 0; i < n; i++) {
    for (let a = 0; a < p; a++) {
      for (let b = a; b < p; b++) {
        S[a][b] += Z[i][a] * Z[i][b]
      }
    }
  }
  const den = n - 1
  for (let a = 0; a < p; a++) {
    for (let b = a; b < p; b++) {
      S[a][b] /= den
      S[b][a] = S[a][b]
    }
  }
  return S
}

function loadingsFromEigen(values: number[], vectors: number[][], k: number): number[][] {
  const p = values.length
  return Array.from({ length: p }, (_, i) =>
    Array.from({ length: k }, (_, j) => vectors[i][j] * Math.sqrt(Math.max(values[j], 0))),
  )
}

function varimax(L: number[][], nIter = 40): number[][] {
  const p = L.length
  const k = L[0]?.length ?? 0
  if (k < 2) return L.map((row) => [...row])
  const A = L.map((row) => [...row])
  for (let iter = 0; iter < nIter; iter++) {
    for (let j = 0; j < k; j++) {
      for (let m = j + 1; m < k; m++) {
        let num = 0
        let den = 0
        for (let i = 0; i < p; i++) {
          const x = A[i][j]
          const y = A[i][m]
          const u = x * x - y * y
          const v = 2 * x * y
          num += 2 * u * v
          den += u * u - v * v
        }
        const phi = 0.25 * Math.atan2(num, den)
        const c = Math.cos(phi)
        const s = Math.sin(phi)
        for (let i = 0; i < p; i++) {
          const x = A[i][j]
          const y = A[i][m]
          A[i][j] = c * x + s * y
          A[i][m] = -s * x + c * y
        }
      }
    }
  }
  return A
}

function promax(L: number[][], power = 4): number[][] {
  const V = varimax(L)
  const p = V.length
  const k = V[0].length
  const H = V.map((row) => {
    const ss = Math.sqrt(row.reduce((s, v) => s + v * v, 0)) || 1
    return row.map((v) => v / ss)
  })
  const P = H.map((row) => row.map((v) => Math.sign(v) * Math.abs(v) ** power))
  const HtH = multiply(transpose(H), H)
  const HtP = multiply(transpose(H), P)
  const T = HtH.map((row, i) => {
    const rhs = HtP[i]
    const den = row[i] || 1
    return rhs.map((v, j) => (i === j ? v / den : 0))
  })
  const invDiag = T.map((row) => {
    const nrm = Math.sqrt(row.reduce((s, v) => s + v * v, 0)) || 1
    return row.map((v) => v / nrm)
  })
  const rotated = multiply(V, transpose(invDiag))
  return rotated.length === p && rotated[0]?.length === k ? rotated : V
}

function smc(R: number[][]): number[] {
  const inv = inverse(R)
  if (!inv) return R.map((row, i) => Math.max(...row.map((v, j) => (i === j ? 0 : Math.abs(v)))))
  return inv.map((row, i) => Math.max(0, Math.min(0.99, 1 - 1 / Math.max(row[i], 1e-8))))
}

function paf(R: number[][], k: number, maxIter = 40): { L: number[][]; uniqueness: number[] } {
  let h = smc(R)
  let L: number[][] = []
  for (let iter = 0; iter < maxIter; iter++) {
    const Rr = R.map((row, i) => row.map((v, j) => (i === j ? h[i] : v)))
    const eig = jacobiEigen(Rr)
    L = loadingsFromEigen(eig.values, eig.vectors, k)
    const hNew = L.map((row) => Math.min(0.99, row.reduce((s, v) => s + v * v, 0)))
    const delta = hNew.reduce((s, v, i) => s + Math.abs(v - h[i]), 0)
    h = hNew
    if (delta < 1e-6) break
  }
  return { L, uniqueness: h.map((hi) => 1 - hi) }
}

function mlApprox(R: number[][], k: number): { L: number[][]; uniqueness: number[] } {
  const pafFit = paf(R, k)
  const psi = pafFit.uniqueness.map((u) => Math.max(u, 0.05))
  const S = R.map((row, i) => row.map((v, j) => v / Math.sqrt(psi[i] * psi[j])))
  const eig = jacobiEigen(S)
  const Lstar = loadingsFromEigen(eig.values, eig.vectors, k)
  const L = Lstar.map((row, i) => row.map((v) => v * Math.sqrt(psi[i])))
  const uniqueness = L.map((row) => Math.max(0.05, 1 - row.reduce((s, v) => s + v * v, 0)))
  return { L, uniqueness }
}

function parallelMeanEigs(n: number, p: number, reps = 30): number[] {
  const acc = Array(p).fill(0)
  for (let r = 0; r < reps; r++) {
    const X = Array.from({ length: n }, () => Array.from({ length: p }, () => {
      let u = 0
      for (let k = 0; k < 6; k++) u += Math.random()
      return u - 3
    }))
    const Z = centerScale(X, true)
    const eig = jacobiEigen(covOrCor(Z))
    eig.values.forEach((v, i) => { acc[i] += v })
  }
  return acc.map((v) => v / reps)
}

export function runPca(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variables = Array.isArray(options.variables) ? options.variables.map(String) : []
  const matrix = String(options.matrix ?? 'correlation')
  if (variables.length < 2) return empty('factor.pca', 'Principal Component Analysis', 'Select at least two numeric variables.')
  const X = completeMatrix(rows, variables)
  if (X.length < variables.length + 1) return empty('factor.pca', 'Principal Component Analysis', 'Need more complete cases than variables.')
  const Z = centerScale(X, matrix !== 'covariance')
  const S = covOrCor(Z)
  const eig = jacobiEigen(S)
  const total = eig.values.reduce((s, v) => s + Math.max(v, 0), 0) || 1
  const kReq = Number(options.nComponents ?? 0)
  const k = kReq > 0 ? Math.min(variables.length, Math.floor(kReq)) : eig.values.filter((v) => v > 1).length || 2
  const kk = Math.max(1, Math.min(variables.length, k))
  const L = loadingsFromEigen(eig.values, eig.vectors, kk)
  const scores = Z.map((row) => {
    const out: number[] = []
    for (let j = 0; j < kk; j++) {
      let s = 0
      for (let i = 0; i < row.length; i++) s += row[i] * eig.vectors[i][j]
      out.push(s)
    }
    return out
  })
  const pa = parallelMeanEigs(X.length, variables.length)
  const suggested = eig.values.filter((v, i) => v > pa[i]).length
  return {
    analysisId: 'factor.pca',
    title: 'Principal Component Analysis',
    interpretation: `PCA on ${variables.length} variables (n = ${X.length}) using the ${matrix} matrix. PC1 explains ${round(100 * eig.values[0] / total)}% of variance. Parallel analysis retains ${suggested} component(s).`,
    assumptions: [
      'Components are linear combinations of the selected variables after listwise deletion.',
      matrix === 'correlation' ? 'Variables are standardized (correlation PCA).' : 'Covariance PCA retains original scales.',
    ],
    footnotes: [
      'Loadings are eigenvector × √eigenvalue.',
      'Horn parallel analysis compares observed eigenvalues to the mean of 30 random-normal correlation matrices of the same n × p.',
      'CFA is Phase 6 (SEM).',
    ],
    tables: [
      {
        id: 'eigen',
        title: 'Eigenvalues',
        columns: ['Component', 'Eigenvalue', '% variance', 'Cumulative %', 'PA mean (random)'],
        rows: eig.values.map((v, i) => {
          const pct = 100 * Math.max(v, 0) / total
          const cum = 100 * eig.values.slice(0, i + 1).reduce((s, x) => s + Math.max(x, 0), 0) / total
          return [`PC${i + 1}`, round(v), round(pct), round(cum), round(pa[i])]
        }),
      },
      {
        id: 'loadings',
        title: 'Loadings',
        columns: ['Variable', ...Array.from({ length: kk }, (_, i) => `PC${i + 1}`)],
        rows: variables.map((name, i) => [name, ...L[i].map((v) => round(v))]),
      },
    ],
    plots: [
      {
        id: 'scree',
        title: 'Scree and parallel analysis',
        data: [
          { type: 'scatter', mode: 'lines+markers', name: 'Observed', x: eig.values.map((_, i) => i + 1), y: eig.values },
          { type: 'scatter', mode: 'lines+markers', name: 'Parallel mean', x: pa.map((_, i) => i + 1), y: pa },
        ],
        layout: { xaxis: { title: 'Component' }, yaxis: { title: 'Eigenvalue' }, margin: { t: 40, r: 20, b: 48, l: 56 } },
      },
      {
        id: 'biplot',
        title: 'Biplot (PC1–PC2)',
        data: [
          { type: 'scatter', mode: 'markers', name: 'Scores', x: scores.map((s) => s[0]), y: scores.map((s) => s[1] ?? 0) },
          {
            type: 'scatter',
            mode: 'text',
            name: 'Loadings',
            x: L.map((row) => row[0] * 2),
            y: L.map((row) => (row[1] ?? 0) * 2),
            text: variables,
            textposition: 'top center',
          },
        ],
        layout: { xaxis: { title: 'PC1' }, yaxis: { title: 'PC2' }, margin: { t: 40, r: 20, b: 48, l: 56 } },
      },
    ],
  }
}

export function runEfa(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const variables = Array.isArray(options.variables) ? options.variables.map(String) : []
  const method = String(options.method ?? 'paf')
  const rotation = String(options.rotation ?? 'varimax')
  const nFactors = Math.max(1, Math.floor(Number(options.nFactors ?? 1)))
  if (variables.length < 3) return empty('factor.efa', 'Exploratory Factor Analysis', 'Select at least three numeric items.')
  const X = completeMatrix(rows, variables)
  if (X.length < variables.length + 2) return empty('factor.efa', 'Exploratory Factor Analysis', 'Need more complete cases than items.')
  const Z = centerScale(X, true)
  const R = covOrCor(Z)
  const k = Math.min(nFactors, variables.length - 1)
  const raw = method === 'ml' ? mlApprox(R, k) : paf(R, k)
  let L = raw.L
  if (rotation === 'varimax') L = varimax(L)
  if (rotation === 'promax') L = promax(L)
  const uniqueness = raw.uniqueness
  return {
    analysisId: 'factor.efa',
    title: 'Exploratory Factor Analysis',
    interpretation: `${method === 'ml' ? 'Approximate ML' : 'Principal axis'} EFA with ${k} factor(s), ${rotation} rotation, n = ${X.length}.`,
    assumptions: [
      'Common-factor model: observed correlations arise from k latent factors plus unique variance.',
      rotation === 'promax' ? 'Promax is an oblique rotation (factors may correlate).' : rotation === 'varimax' ? 'Varimax is orthogonal.' : 'Unrotated solution.',
    ],
    footnotes: [
      'PAF iterates communalities starting from squared multiple correlations.',
      'The ML option is a uniqueness-scaled eigen approximation (Jöreskog-style start), not full information ML.',
      'CFA with identification constraints is Phase 6.',
    ],
    tables: [
      {
        id: 'loadings',
        title: 'Factor loadings',
        columns: ['Variable', ...Array.from({ length: k }, (_, i) => `F${i + 1}`), 'Uniqueness'],
        rows: variables.map((name, i) => [name, ...L[i].map((v) => round(v)), round(uniqueness[i])]),
      },
    ],
    plots: [{
      id: 'load',
      title: 'Loadings (F1–F2)',
      data: [{
        type: 'scatter',
        mode: 'text+markers',
        x: L.map((row) => row[0]),
        y: L.map((row) => row[1] ?? 0),
        text: variables,
      }],
      layout: { xaxis: { title: 'F1' }, yaxis: { title: 'F2' }, margin: { t: 40, r: 20, b: 48, l: 56 } },
    }],
  }
}
