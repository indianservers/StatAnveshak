import type { Dataset } from '../types'
import { DATASET_FILE_LIMIT_BYTES, uniqueColumnNames } from './validation'
import { detectSchema } from './schema'

/** Parse locally; nothing is sent to a server. Use the upload workspace for multi-file previews. */
export async function importDatasetFile(file: File): Promise<Dataset> {
  if (file.size > DATASET_FILE_LIMIT_BYTES) throw new Error('This file is too large. Use a smaller extract.')
  let data: Record<string, unknown>[]
  let sourceType: Dataset['sourceType']
  if (/\.(csv|tsv|txt)$/i.test(file.name)) {
    const { default: Papa } = await import('papaparse')
    const parsed = Papa.parse<Record<string, unknown>>(await file.text(), { header: true, dynamicTyping: true, skipEmptyLines: 'greedy', delimiter: /\.tsv$/i.test(file.name) ? '\t' : undefined })
    if (parsed.errors.length) throw new Error(`Could not read the delimited file: ${parsed.errors[0].message}`)
    data = parsed.data
    sourceType = 'csv'
  } else if (/\.xlsx?$/i.test(file.name)) {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    if (!workbook.SheetNames.length) throw new Error('The workbook has no sheets.')
    data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
    sourceType = 'excel'
  } else if (/\.json$/i.test(file.name)) {
    const parsed: unknown = JSON.parse(await file.text())
    if (!Array.isArray(parsed) || parsed.some((row) => !row || typeof row !== 'object' || Array.isArray(row))) throw new Error('JSON must contain an array of row objects.')
    data = parsed as Record<string, unknown>[]
    sourceType = 'json'
  } else throw new Error('Choose a CSV, TSV, TXT, Excel, or JSON file.')
  if (!data.length) throw new Error('This dataset has no data rows.')
  const columns = [...new Set(data.flatMap((row) => Object.keys(row)))]
  if (!columns.length) throw new Error('This dataset has no columns.')
  const names = uniqueColumnNames(columns)
  data = data.map((row) => Object.fromEntries(columns.map((column, index) => [names[index], row[column] ?? null])))
  return { id: crypto.randomUUID(), name: file.name.replace(/\.[^.]+$/, ''), rows: data.length, cols: names.length, createdAt: Date.now(), sourceType, fileSize: file.size, schema: detectSchema(data), data }
}
