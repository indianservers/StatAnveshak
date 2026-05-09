import type { Dataset, Project } from '../types'

export const DATASET_FILE_LIMIT_BYTES = 50 * 1024 * 1024

export function uniqueColumnNames(names: string[]) {
  const seen = new Set<string>()
  return names.map((name, index) => {
    const base = sanitizeColumnName(name) || `column_${index + 1}`
    let next = base
    let suffix = 2
    while (seen.has(next.toLowerCase())) {
      next = `${base}_${suffix}`
      suffix += 1
    }
    seen.add(next.toLowerCase())
    return next
  })
}

export function sanitizeColumnName(name: string) {
  return name.trim().replace(/\s+/g, '_').replace(/[^\w.-]/g, '')
}

export function isProject(value: unknown): value is Project {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<Project>
  return typeof project.id === 'string'
    && typeof project.name === 'string'
    && typeof project.createdAt === 'number'
    && typeof project.updatedAt === 'number'
    && Array.isArray(project.datasetIds)
    && project.datasetIds.every((id) => typeof id === 'string')
    && typeof project.notes === 'string'
}

export function isDataset(value: unknown): value is Dataset {
  if (!value || typeof value !== 'object') return false
  const dataset = value as Partial<Dataset>
  return typeof dataset.id === 'string'
    && typeof dataset.name === 'string'
    && typeof dataset.rows === 'number'
    && typeof dataset.cols === 'number'
    && typeof dataset.createdAt === 'number'
    && Array.isArray(dataset.schema)
    && Array.isArray(dataset.data)
}

export function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
