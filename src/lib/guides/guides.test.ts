import { describe, expect, it } from 'vitest'
import { TOOL_FEATURES } from '../../components/tools/toolCatalog'
import { STATISTICS_STUDIOS } from '../statisticsStudios'
import { DISTRIBUTIONS } from '../distributions'
import { COMPUTING_MODULES } from '../computingModules'
import { ANALYSIS_CATALOG } from '../../analysis/catalog'
import { STAT_MODULES } from '../statModules'
import { statModuleGuide } from './statModuleGuides'
import { toolGuide } from './toolGuides'
import { studioLabGuide } from './studioGuides'
import { analysisGuide } from './analysisGuides'
import { computingGuide, distributionGuide, hashingGuide, preparationGuide } from './variantGuides'
import type { SpecificGuide } from './guideTypes'

function complete(guide: SpecificGuide | undefined) {
  expect(guide).toBeDefined()
  expect(guide!.title.length).toBeGreaterThan(2)
  for (const key of ['purpose', 'inputs', 'interpretation', 'caution', 'example'] as const) expect(guide![key].length, key).toBeGreaterThan(10)
  expect(guide!.algorithm.length).toBeGreaterThan(0)
  expect(guide!.algorithm.every(step => step.length > 0)).toBe(true)
}
describe('specific guide coverage', () => {
  for (const feature of TOOL_FEATURES) it(`tool ${feature.id}`, () => complete(toolGuide(feature.id)))
  for (const studio of STATISTICS_STUDIOS) for (const lab of studio.labs) it(`studio ${studio.slug}/${lab.slug}`, () => complete(studioLabGuide(studio.slug, lab.slug)))
  for (const analysis of ANALYSIS_CATALOG) it(`analysis ${analysis.id}`, () => complete(analysisGuide(analysis.id)))
  for (const dist of DISTRIBUTIONS) it(`distribution ${dist.id}`, () => complete(distributionGuide(dist)))
  for (const module of COMPUTING_MODULES) it(`computing ${module.key}`, () => complete(computingGuide(module.key)))
  for (const module of STAT_MODULES) it(`stat module ${module.key}`, () => complete(statModuleGuide(module.key)))
  it('changes calculations with algorithm and preparation selections', () => {
    expect(analysisGuide('ml.clustering', { algorithm: 'dbscan' })!.algorithm.join()).toContain('dense neighborhoods')
    expect(analysisGuide('ml.clustering', { algorithm: 'kmeans' })!.algorithm.join()).toContain('centroid')
    expect(analysisGuide('t.independent', { equalVariance: false })!.algorithm.join()).toContain('Satterthwaite')
    expect(analysisGuide('t.independent', { equalVariance: true })!.algorithm.join()).toContain('Pool')
    expect(preparationGuide('impute', 'median')!.algorithm.join()).toContain('middle')
    expect(preparationGuide('impute', 'mean')!.algorithm.join()).toContain('Average')
    expect(analysisGuide('anova.between', { inference: 'bayesian' })!.caution).toContain('only the first factor')
    expect(analysisGuide('regression.correlation', { inference: 'bayesian', method: 'spearman' })!.algorithm.join()).toContain('Pearson')
    expect(analysisGuide('regression.glm', { family: 'gamma' })!.algorithm.join()).toContain('μ²')
    expect(analysisGuide('regression.logistic', { model: 'ordinal' })!.algorithm.join()).toContain('cumulative-logit')
  })
  it('does not generate generic fallback content for unknown routes', () => {
    expect(toolGuide('unknown')).toBeUndefined()
    expect(studioLabGuide('anova', 'unknown')).toBeUndefined()
    expect(analysisGuide('unknown')).toBeUndefined()
    expect(computingGuide('unknown')).toBeUndefined()
    expect(hashingGuide('unknown', 'unknown')).toBeUndefined()
  })
})
