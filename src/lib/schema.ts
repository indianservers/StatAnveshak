import type { ColumnSchema, ColumnType } from '../types'
import * as ss from 'simple-statistics'

function looksLikePaddedIdentifier(values: unknown[]): boolean {
  const strings = values.map((value) => String(value).trim())
  if (strings.length === 0) return false
  return strings.every((value) => /^\d+$/.test(value)) && strings.some((value) => /^0\d+$/.test(value))
}

function detectType(values: unknown[]): ColumnType {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '')
  if (nonNull.length === 0) return 'text'

  if (looksLikePaddedIdentifier(nonNull)) return 'id'

  // Boolean check (true/false/yes/no only — bare 0/1 stays numeric)
  const boolSet = new Set(['true', 'false', 'yes', 'no'])
  if (nonNull.every((v) => boolSet.has(String(v).toLowerCase()))) return 'boolean'

  // Numeric check: blanks already removed, so a few missing cells do not force text
  const numericCount = nonNull.filter((v) => {
    const text = String(v).trim()
    if (text === '') return false
    return Number.isFinite(Number(text))
  }).length
  if (numericCount / nonNull.length > 0.85) return 'numeric'

  // Date check
  const dateCount = nonNull.filter((v) => !isNaN(Date.parse(String(v)))).length
  if (dateCount / nonNull.length > 0.85) return 'date'

  // ID check (high cardinality, looks like a key)
  const unique = new Set(nonNull.map(String)).size
  if (unique === nonNull.length && nonNull.length > 10) {
    const looksNumeric = nonNull.every((v) => /^\d+$/.test(String(v)))
    if (looksNumeric) return 'id'
  }

  // Low cardinality → categorical
  if (unique / nonNull.length < 0.2 || unique <= 20) return 'categorical'

  return 'text'
}

export function detectSchema(data: Record<string, unknown>[]): ColumnSchema[] {
  if (!data.length) return []
  const cols = Object.keys(data[0])

  return cols.map((name) => {
    const rawValues = data.map((r) => r[name])
    const type = detectType(rawValues)
    const missing = rawValues.filter((v) => v === null || v === undefined || v === '').length
    const nonNull = rawValues.filter((v) => v !== null && v !== undefined && v !== '')
    const unique = new Set(nonNull.map(String)).size

    let min: number | string | undefined
    let max: number | string | undefined
    let mean: number | undefined
    let std: number | undefined

    if (type === 'numeric') {
      const nums = nonNull.map(Number).filter((n) => !isNaN(n))
      if (nums.length) {
        min = Math.min(...nums)
        max = Math.max(...nums)
        mean = ss.mean(nums)
        std = nums.length > 1 ? ss.standardDeviation(nums) : 0
      }
    } else {
      const strs = nonNull.map(String)
      if (strs.length) {
        const sorted = [...strs].sort()
        min = sorted[0]
        max = sorted[sorted.length - 1]
      }
    }

    return {
      name,
      type,
      nullable: missing > 0,
      unique,
      missing,
      missingPct: rawValues.length > 0 ? (missing / rawValues.length) * 100 : 0,
      min,
      max,
      mean,
      std,
      sample: rawValues.slice(0, 5),
    }
  })
}
