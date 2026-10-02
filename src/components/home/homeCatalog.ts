import { MODULE_ORDER, analysesForModule } from '../../analysis/catalog'
import type { AnalysisDef, AnalysisModuleId } from '../../analysis/types'
import type { GlyphKind, GlyphTone } from './HomeGlyphs'

export const MODULE_GLYPHS: Record<AnalysisModuleId, { kind: GlyphKind; tone: GlyphTone }> = {
  descriptives: { kind: 'bars', tone: 'indigo' },
  tTests: { kind: 'whisker', tone: 'sky' },
  anova: { kind: 'boxes', tone: 'orange' },
  mixedModels: { kind: 'cluster', tone: 'violet' },
  regression: { kind: 'line', tone: 'indigo' },
  frequencies: { kind: 'pie', tone: 'emerald' },
  factor: { kind: 'factor', tone: 'sky' },
  acceptanceSampling: { kind: 'grid', tone: 'teal' },
  audit: { kind: 'steps', tone: 'amber' },
  bain: { kind: 'bell', tone: 'fuchsia' },
  bayesFactorFunctions: { kind: 'bell', tone: 'violet' },
  bfpack: { kind: 'bars', tone: 'fuchsia' },
  bsts: { kind: 'wave', tone: 'teal' },
  circular: { kind: 'circle', tone: 'sky' },
  cochrane: { kind: 'whisker', tone: 'emerald' },
  distributions: { kind: 'bell', tone: 'indigo' },
  equivalence: { kind: 'whisker', tone: 'amber' },
  jags: { kind: 'network', tone: 'rose' },
  learnBayes: { kind: 'bell', tone: 'rose' },
  learnStats: { kind: 'bars', tone: 'emerald' },
  machineLearning: { kind: 'cluster', tone: 'fuchsia' },
  metaAnalysis: { kind: 'whisker', tone: 'violet' },
  network: { kind: 'network', tone: 'indigo' },
  power: { kind: 'gauge', tone: 'orange' },
  predictiveAnalytics: { kind: 'wave', tone: 'indigo' },
  process: { kind: 'network', tone: 'teal' },
  prophet: { kind: 'wave', tone: 'orange' },
  qualityControl: { kind: 'steps', tone: 'rose' },
  reliability: { kind: 'gauge', tone: 'emerald' },
  robustTTests: { kind: 'whisker', tone: 'rose' },
  sem: { kind: 'factor', tone: 'violet' },
  survival: { kind: 'survival', tone: 'violet' },
  timeSeries: { kind: 'wave', tone: 'amber' },
  summaryStatistics: { kind: 'grid', tone: 'indigo' },
  visualModeling: { kind: 'scatter', tone: 'emerald' },
}

export type ModuleGroup = {
  module: AnalysisModuleId
  label: string
  items: AnalysisDef[]
}

export const MODULE_GROUPS: ModuleGroup[] = MODULE_ORDER.map((module) => {
  const items = analysesForModule(module).filter((item) => item.implemented)
  return { module, label: items[0]?.moduleLabel ?? module, items }
}).filter((group) => group.items.length > 0)

export const ANALYSIS_COUNT = MODULE_GROUPS.reduce((count, group) => count + group.items.length, 0)

export function searchModuleGroups(query: string): ModuleGroup[] {
  const search = query.trim().toLowerCase()
  if (!search) return MODULE_GROUPS
  return MODULE_GROUPS.map((group) => {
    if (group.label.toLowerCase().includes(search)) return group
    return {
      ...group,
      items: group.items.filter((item) => `${item.title} ${item.description} ${item.id}`.toLowerCase().includes(search)),
    }
  }).filter((group) => group.items.length > 0)
}
