import type { ColumnSchema } from '../types'

export function detectSchemaInWorker(rows: Record<string, unknown>[]) {
  return new Promise<ColumnSchema[]>((resolve, reject) => {
    const worker = new Worker(new URL('../workers/analysis.worker.ts', import.meta.url), { type: 'module' })
    const id = `schema_${Date.now()}`
    const timer = window.setTimeout(() => {
      worker.terminate()
      reject(new Error('Schema worker timed out.'))
    }, 15_000)

    worker.onmessage = (event: MessageEvent<{ id: string; schema: ColumnSchema[] }>) => {
      if (event.data.id !== id) return
      window.clearTimeout(timer)
      worker.terminate()
      resolve(event.data.schema)
    }

    worker.onerror = (event) => {
      window.clearTimeout(timer)
      worker.terminate()
      reject(new Error(event.message))
    }

    worker.postMessage({ id, type: 'detect-schema', rows })
  })
}
