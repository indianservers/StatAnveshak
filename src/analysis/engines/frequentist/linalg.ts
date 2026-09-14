export function sse(y: number[], fitted: number[]): number {
  let sum = 0
  for (let i = 0; i < y.length; i++) sum += (y[i] - fitted[i]) ** 2
  return sum
}

export function sst(y: number[]): number {
  const m = y.reduce((s, v) => s + v, 0) / y.length
  return y.reduce((s, v) => s + (v - m) ** 2, 0)
}

export function transpose(A: number[][]): number[][] {
  const n = A.length
  const p = A[0]?.length ?? 0
  const T = Array.from({ length: p }, () => Array<number>(n).fill(0))
  for (let i = 0; i < n; i++) for (let j = 0; j < p; j++) T[j][i] = A[i][j]
  return T
}

export function multiply(A: number[][], B: number[][]): number[][] {
  const n = A.length
  const m = B[0].length
  const k = B.length
  const C = Array.from({ length: n }, () => Array<number>(m).fill(0))
  for (let i = 0; i < n; i++) {
    for (let t = 0; t < k; t++) {
      const a = A[i][t]
      if (a === 0) continue
      for (let j = 0; j < m; j++) C[i][j] += a * B[t][j]
    }
  }
  return C
}

export function multiplyVec(A: number[][], v: number[]): number[] {
  return A.map((row) => row.reduce((s, a, j) => s + a * v[j], 0))
}

export function solve(A: number[][], b: number[]): number[] | null {
  const n = A.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r
    if (Math.abs(M[pivot][col]) < 1e-12) return null
    ;[M[col], M[pivot]] = [M[pivot], M[col]]
    const div = M[col][col]
    for (let j = col; j <= n; j++) M[col][j] /= div
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = M[r][col]
      for (let j = col; j <= n; j++) M[r][j] -= f * M[col][j]
    }
  }
  return M.map((row) => row[n])
}

export function inverse(A: number[][]): number[][] | null {
  const n = A.length
  const M = A.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r
    if (Math.abs(M[pivot][col]) < 1e-12) return null
    ;[M[col], M[pivot]] = [M[pivot], M[col]]
    const div = M[col][col]
    for (let j = 0; j < 2 * n; j++) M[col][j] /= div
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = M[r][col]
      for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[col][j]
    }
  }
  return M.map((row) => row.slice(n))
}

export type LmFit = {
  beta: number[]
  fitted: number[]
  sse: number
  dfResidual: number
  rank: number
}

export function lm(y: number[], X: number[][]): LmFit | null {
  const n = y.length
  const p = X[0]?.length ?? 0
  if (n === 0 || p === 0 || X.length !== n) return null
  const Xt = transpose(X)
  const XtX = multiply(Xt, X)
  const Xty = multiplyVec(Xt, y)
  const beta = solve(XtX, Xty)
  if (!beta) return null
  const fitted = multiplyVec(X, beta)
  return { beta, fitted, sse: sse(y, fitted), dfResidual: n - p, rank: p }
}

export function wls(y: number[], X: number[][], weights: number[]): LmFit | null {
  const sqrtW = weights.map((w) => Math.sqrt(Math.max(w, 1e-12)))
  return lm(y.map((yi, i) => yi * sqrtW[i]), X.map((row, i) => row.map((x) => x * sqrtW[i])))
}

export function gram(X: number[][]): number[][] {
  return multiply(transpose(X), X)
}

/** Symmetric Jacobi eigen-decomposition. Returns eigenvalues descending. */
export function jacobiEigen(Ain: number[][]): { values: number[]; vectors: number[][] } {
  const n = Ain.length
  const A = Ain.map((row) => [...row])
  const V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => (i === j ? 1 : 0)))
  for (let iter = 0; iter < 80; iter++) {
    let p = 0
    let q = 1
    let max = 0
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = Math.abs(A[i][j])
        if (a > max) {
          max = a
          p = i
          q = j
        }
      }
    }
    if (max < 1e-14) break
    const app = A[p][p]
    const aqq = A[q][q]
    const apq = A[p][q]
    const tau = (aqq - app) / (2 * apq)
    const sgn = tau >= 0 ? 1 : -1
    const t = sgn / (Math.abs(tau) + Math.sqrt(1 + tau * tau))
    const c = 1 / Math.sqrt(1 + t * t)
    const s = t * c
    A[p][p] = app - t * apq
    A[q][q] = aqq + t * apq
    A[p][q] = 0
    A[q][p] = 0
    for (let k = 0; k < n; k++) {
      if (k === p || k === q) continue
      const akp = A[k][p]
      const akq = A[k][q]
      A[k][p] = A[p][k] = c * akp - s * akq
      A[k][q] = A[q][k] = s * akp + c * akq
    }
    for (let k = 0; k < n; k++) {
      const vkp = V[k][p]
      const vkq = V[k][q]
      V[k][p] = c * vkp - s * vkq
      V[k][q] = s * vkp + c * vkq
    }
  }
  const idx = Array.from({ length: n }, (_, i) => i).sort((i, j) => A[j][j] - A[i][i])
  return {
    values: idx.map((i) => A[i][i]),
    vectors: V.map((row) => idx.map((i) => row[i])),
  }
}

export function ones(n: number): number[][] {
  return Array.from({ length: n }, () => [1])
}

export function cbind(...blocks: number[][][]): number[][] {
  const n = blocks[0].length
  return Array.from({ length: n }, (_, i) => blocks.flatMap((b) => b[i]))
}

export function treatmentDummies(values: string[]): { levels: string[]; X: number[][] } {
  const levels = [...new Set(values)]
  const X = values.map((value) => levels.slice(1).map((level) => (value === level ? 1 : 0)))
  return { levels, X }
}

export function sumDummies(values: string[]): { levels: string[]; X: number[][] } {
  const levels = [...new Set(values)]
  const k = levels.length
  const X = values.map((value) => {
    const cols = Array<number>(Math.max(0, k - 1)).fill(0)
    const idx = levels.indexOf(value)
    if (idx < k - 1 && idx >= 0) cols[idx] = 1
    else if (idx === k - 1) for (let j = 0; j < k - 1; j++) cols[j] = -1
    return cols
  })
  return { levels, X }
}

export function interaction(A: number[][], B: number[][]): number[][] {
  return A.map((a, i) => {
    const b = B[i]
    const out: number[] = []
    for (const x of a) for (const y of b) out.push(x * y)
    return out
  })
}
