export const VIZ = {
  population: '#94a3b8',
  sample: '#818cf8',
  sampling: '#a78bfa',
  success: '#34d399',
  warn: '#f59e0b',
  misuse: '#fb7185',
  ink: '#e2e8f0',
  muted: '#64748b',
  stage: '#020617',
} as const

export function gaussian() {
  const u = Math.max(1e-12, 1 - Math.random())
  const v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export function sampleNormal(mu: number, sigma: number) {
  return mu + sigma * gaussian()
}

export function meanOf(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function sdOf(values: number[]) {
  if (values.length < 2) return 0
  const mu = meanOf(values)
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mu) ** 2, 0) / (values.length - 1))
}

export function iqrOf(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  return quantile(sorted, 0.75) - quantile(sorted, 0.25)
}

export function scottBinCount(values: number[]) {
  if (values.length < 2) return 12
  const min = Math.min(...values)
  const max = Math.max(...values)
  const width = 3.5 * sdOf(values) / Math.cbrt(values.length)
  if (!(width > 0) || !(max > min)) return 12
  return Math.max(5, Math.min(40, Math.round((max - min) / width)))
}

export function fdBinCount(values: number[]) {
  if (values.length < 2) return 12
  const sorted = [...values].sort((a, b) => a - b)
  const min = sorted[0] ?? 0
  const max = sorted[sorted.length - 1] ?? min
  const width = (2 * iqrOf(values)) / Math.cbrt(values.length)
  if (!(width > 0) || !(max > min)) return 12
  return Math.max(5, Math.min(40, Math.round((max - min) / width)))
}

export function quantile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0
  const index = (sorted.length - 1) * p
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower
  const low = sorted[lower] ?? 0
  const high = sorted[upper] ?? low
  return low * (1 - weight) + high * weight
}

const LANCZOS = [
  0.99999999999980993,
  676.5203681218851,
  -1259.1392167224028,
  771.32342877765313,
  -176.61502916214059,
  12.507343278686905,
  -0.13857109526572012,
  9.9843695780195716e-6,
  1.5056327351493116e-7,
]

export function logGamma(z: number): number {
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z)
  }
  const y = z - 1
  let x = LANCZOS[0] ?? 1
  for (let i = 1; i < LANCZOS.length; i += 1) {
    const term = LANCZOS[i]
    if (term === undefined) continue
    x += term / (y + i)
  }
  const t = y + LANCZOS.length - 1.5
  return 0.5 * Math.log(2 * Math.PI) + (y + 0.5) * Math.log(t) - t + Math.log(x)
}

export function betaPdf(x: number, alpha: number, beta: number) {
  if (x <= 0 || x >= 1) return 0
  const logB = logGamma(alpha) + logGamma(beta) - logGamma(alpha + beta)
  return Math.exp((alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - logB)
}
