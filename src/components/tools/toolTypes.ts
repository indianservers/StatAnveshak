import type { AnalysisOptions, AnalysisResult } from '../../analysis/types'
import type { Dataset } from '../../types'
export type ToolRun = { id: string; at: number; dataset: string; datasetId: string; fingerprint: string; rows: number; analysis: string; options: AnalysisOptions; result: AnalysisResult }
export type ToolPreset = { id: string; name: string; analysis: string; options: AnalysisOptions }
export type PanelProps = { feature: string; dataset: Dataset | null; record: (analysis: string, options: AnalysisOptions, result: AnalysisResult) => void; message: (value: string) => void; initialOptions?: AnalysisOptions }
