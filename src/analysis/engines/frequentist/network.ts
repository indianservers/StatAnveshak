import type { AnalysisOptions, AnalysisResult } from '../../types'
import { covOrCor } from './factor'
import { inverse } from './linalg'
import { asFiniteNumber, mean, round, sampleSd } from './numeric'

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

export function ridgePrecision(S: number[][], rho: number): number[][] | null {
  const A = S.map((row, i) => row.map((v, j) => v + (i === j ? rho : 0)))
  return inverse(A)
}

export function partialFromPrecision(P: number[][]): number[][] {
  const p = P.length
  return Array.from({ length: p }, (_, i) =>
    Array.from({ length: p }, (__, j) => {
      if (i === j) return 1
      const den = Math.sqrt(Math.max(P[i]![i]! * P[j]![j]!, 1e-12))
      return -P[i]![j]! / den
    }),
  )
}

export function runNetwork(rows: Record<string, unknown>[], options: AnalysisOptions, bayesian = false): AnalysisResult {
  const variables = Array.isArray(options.variables) ? options.variables.map(String) : []
  if (variables.length < 2) return empty('network.psych', 'Network Analysis', 'Select at least two numeric variables.')
  const X = completeMatrix(rows, variables)
  if (X.length < variables.length + 3) return empty('network.psych', 'Network Analysis', 'Need more complete cases than nodes.')
  const mus = variables.map((_, j) => mean(X.map((r) => r[j] ?? 0)))
  const sds = variables.map((_, j) => sampleSd(X.map((r) => r[j] ?? 0)) || 1)
  const Z = X.map((row) => row.map((v, j) => (v - mus[j]) / sds[j]))
  const S = covOrCor(Z)
  const rho = bayesian ? Math.max(1 / X.length, Number(options.rho ?? 0.05)) : Number(options.rho ?? 0.1)
  const P = ridgePrecision(S, rho)
  if (!P) return empty('network.psych', 'Network Analysis', 'Precision matrix is singular even after ridge.')
  const partial = partialFromPrecision(P)
  const edges: Array<[string, string, number]> = []
  for (let i = 0; i < variables.length; i++) {
    for (let j = i + 1; j < variables.length; j++) {
      edges.push([variables[i]!, variables[j]!, partial[i]![j]!])
    }
  }
  edges.sort((a, b) => Math.abs(b[2]) - Math.abs(a[2]))
  const strength = variables.map((_, i) =>
    variables.reduce((s, __, j) => (i === j ? s : s + Math.abs(partial[i]![j]!)), 0),
  )
  return {
    analysisId: 'network.psych',
    title: 'Network Analysis',
    interpretation: `${bayesian ? 'Bayesian ridge-Wishart ' : 'Frequentist glasso-style '}Gaussian graphical model on ${variables.length} nodes (ridge ρ = ${round(rho)}). Strongest edge |p| = ${round(Math.abs(edges[0]?.[2] ?? 0))}.`,
    assumptions: ['Multivariate normal nodes. Partial correlations come from a ridge precision (S + ρI)⁻¹, not graphical lasso coordinate descent.'],
    footnotes: [
      bayesian
        ? 'Bayesian mode uses a Wishart-like ridge ρ ≈ 1/n (or your ρ), which is the posterior mean of a conjugate precision with scale S + ρI.'
        : 'This is a ridge GGM, not the JASP mgm/qgraph bootstrap suite.',
    ],
    tables: [
      { id: 'edges', title: 'Partial correlations', columns: ['From', 'To', 'Partial r'], rows: edges.map((e) => [e[0], e[1], round(e[2])]) },
      { id: 'cent', title: 'Strength centrality', columns: ['Node', 'Strength'], rows: variables.map((name, i) => [name, round(strength[i] ?? 0)]) },
    ],
    plots: [{
      id: 'heat',
      title: 'Partial correlation matrix',
      data: [{ type: 'heatmap', z: partial, x: variables, y: variables, colorscale: 'RdBu', zmid: 0 }],
      layout: { margin: { t: 40, r: 16, b: 80, l: 80 } },
    }],
  }
}
