import jStatRaw from 'jstat'

const jStat = jStatRaw as unknown as {
  normal: { cdf: (x: number, mu: number, sigma: number) => number; inv: (p: number, mu: number, sigma: number) => number; pdf: (x: number, mu: number, sigma: number) => number }
  studentt: { cdf: (x: number, df: number) => number; inv: (p: number, df: number) => number; pdf: (x: number, df: number) => number }
  chisquare: { cdf: (x: number, df: number) => number; inv: (p: number, df: number) => number }
  centralF: { cdf: (x: number, df1: number, df2: number) => number }
}

export const normalCdf = (x: number) => jStat.normal.cdf(x, 0, 1)
export const normalInv = (p: number) => jStat.normal.inv(p, 0, 1)
export const normalPdf = (x: number) => jStat.normal.pdf(x, 0, 1)
export const tCdf = (x: number, df: number) => jStat.studentt.cdf(x, df)
export const tInv = (p: number, df: number) => jStat.studentt.inv(p, df)
export const tPdf = (x: number, df: number) => jStat.studentt.pdf(x, df)
export const chiInv = (p: number, df: number) => jStat.chisquare.inv(p, df)
export const chiCdf = (x: number, df: number) => jStat.chisquare.cdf(x, df)
export const fCdf = (x: number, df1: number, df2: number) => jStat.centralF.cdf(x, df1, df2)
export const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
export function sampleSd(values: number[]) {
  const center = average(values)
  return Math.sqrt(values.reduce((sum, value) => sum + (value - center) ** 2, 0) / (values.length - 1))
}
export function quantile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b)
  const pos = p * (sorted.length - 1)
  const lower = Math.floor(pos)
  return sorted[lower] + (sorted[Math.ceil(pos)] - sorted[lower]) * (pos - lower)
}
export function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (1664525 * state + 1013904223) >>> 0
    return state / 4294967296
  }
}
export function normalPoints(min = -4, max = 4, steps = 100) {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const x = min + index / steps * (max - min)
    return { x, y: normalPdf(x) }
  })
}
