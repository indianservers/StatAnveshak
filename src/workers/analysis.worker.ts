import { detectSchema } from '../lib/schema'
import { runAnalysis } from '../analysis/runAnalysis'
import type { AnalysisOptions } from '../analysis/types'

type RequestMessage =
  | { id: string; type: 'detect-schema'; rows: Record<string, unknown>[] }
  | { id: string; type: 'run-analysis'; analysisId: string; rows: Record<string, unknown>[]; options: AnalysisOptions }

self.onmessage = (event: MessageEvent<RequestMessage>) => {
  const message = event.data
  if (message.type === 'detect-schema') {
    const schema = detectSchema(message.rows)
    self.postMessage({ id: message.id, type: 'schema', schema })
    return
  }
  if (message.type === 'run-analysis') {
    try {
      self.postMessage({ id: message.id, type: 'progress', percent: 15, message: 'Running analysis' })
      const result = runAnalysis(message.analysisId, message.rows, message.options)
      self.postMessage({ id: message.id, type: 'result', result })
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Analysis failed.'
      self.postMessage({ id: message.id, type: 'error', message: text })
    }
  }
}
