import type { ColumnSchema } from '../types'
import type { AnalysisOptions, AnalysisResult } from '../analysis/types'
import { ANALYSIS_WORKER_TIMEOUT_MS } from '../analysis/engines/wasm/protocol'

function createWorker() {
  return new Worker(new URL('../workers/analysis.worker.ts', import.meta.url), { type: 'module' })
}

export function detectSchemaInWorker(rows: Record<string, unknown>[]) {
  return new Promise<ColumnSchema[]>((resolve, reject) => {
    const worker = createWorker()
    const id = `schema_${Date.now()}`
    const timer = window.setTimeout(() => {
      worker.terminate()
      reject(new Error('Schema worker timed out.'))
    }, 15_000)

    worker.onmessage = (event: MessageEvent<{ id: string; type?: string; schema: ColumnSchema[] }>) => {
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

export function runAnalysisInWorker(analysisId: string, rows: Record<string, unknown>[], options: AnalysisOptions) {
  return new Promise<AnalysisResult>((resolve, reject) => {
    const worker = createWorker()
    const id = `analysis_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const timer = window.setTimeout(() => {
      worker.terminate()
      reject(new Error('Analysis worker timed out.'))
    }, ANALYSIS_WORKER_TIMEOUT_MS)

    worker.onmessage = (event: MessageEvent<{ id: string; type: string; result?: AnalysisResult; message?: string }>) => {
      if (event.data.id !== id) return
      if (event.data.type === 'progress') return
      window.clearTimeout(timer)
      worker.terminate()
      if (event.data.type === 'result' && event.data.result) resolve(event.data.result)
      else reject(new Error(event.data.message ?? 'Analysis failed.'))
    }

    worker.onerror = (event) => {
      window.clearTimeout(timer)
      worker.terminate()
      reject(new Error(event.message))
    }

    worker.postMessage({ id, type: 'run-analysis', analysisId, rows, options })
  })
}
