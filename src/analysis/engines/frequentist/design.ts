import { cbind, lm, ones, sumDummies, treatmentDummies, wls } from './linalg'
import { asFiniteNumber } from './numeric'

export function emptyResult(analysisId: string, title: string, message: string) {
  return { analysisId, title, interpretation: message, assumptions: [] as string[], footnotes: [] as string[], tables: [], plots: [] }
}

export function completeRows(rows: Record<string, unknown>[], columns: string[]): Record<string, unknown>[] {
  return rows.filter((row) => columns.every((col) => {
    const value = row[col]
    if (value === null || value === undefined || value === '') return false
    return true
  }))
}

export function numericBlock(rows: Record<string, unknown>[], columns: string[]): number[][] {
  return rows.map((row) => columns.map((col) => {
    const n = asFiniteNumber(row[col])
    return n === null ? Number.NaN : n
  }))
}

export function buildDesign(
  rows: Record<string, unknown>[],
  numericCols: string[],
  factorCols: string[],
  interact: boolean,
): { X: number[][]; names: string[]; keep: Record<string, unknown>[] } {
  const cols = [...numericCols, ...factorCols]
  const keep = rows.filter((row) => cols.every((col) => {
    if (numericCols.includes(col)) return asFiniteNumber(row[col]) !== null
    const value = row[col]
    return value !== null && value !== undefined && value !== ''
  }))
  const intercept = ones(keep.length)
  const blocks: number[][][] = [intercept]
  const names = ['(Intercept)']
  if (numericCols.length) {
    blocks.push(numericBlock(keep, numericCols))
    names.push(...numericCols)
  }
  for (const factor of factorCols) {
    const dummy = treatmentDummies(keep.map((row) => String(row[factor])))
    if (dummy.X[0]?.length) {
      blocks.push(dummy.X)
      names.push(...dummy.levels.slice(1).map((level) => `${factor}[${level}]`))
    }
  }
  if (interact && numericCols.length >= 2) {
    const a = numericBlock(keep, [numericCols[0]])
    const b = numericBlock(keep, [numericCols[1]])
    blocks.push(a.map((row, i) => [row[0] * b[i][0]]))
    names.push(`${numericCols[0]} × ${numericCols[1]}`)
  }
  if (interact && factorCols.length >= 2) {
    const A = sumDummies(keep.map((row) => String(row[factorCols[0]])))
    const B = sumDummies(keep.map((row) => String(row[factorCols[1]])))
    const AB = A.X.map((row, i) => {
      const out: number[] = []
      for (const x of row) for (const y of B.X[i]) out.push(x * y)
      return out
    })
    if (AB[0]?.length) {
      blocks.push(AB)
      names.push(`${factorCols[0]} × ${factorCols[1]}`)
    }
  }
  return { X: cbind(...blocks), names, keep }
}

export { lm, wls }
