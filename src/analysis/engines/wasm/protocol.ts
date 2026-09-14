export const ANALYSIS_WORKER_TIMEOUT_MS = 60_000

export type WasmEngineId = 'mixed' | 'sem' | 'mcmc' | 'ml' | 'prophet' | 'bsts' | 'network' | 'meta'

export type WasmRequest = {
  id: string
  type: 'run-wasm'
  engine: WasmEngineId
  payload: Record<string, unknown>
}
