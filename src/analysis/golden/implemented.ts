/** Catalog IDs with engines. Kept out of *.test.ts so importing does not re-run suites. */

export const PHASE3_IMPLEMENTED = [
  'anova.ancova', 'anova.between', 'anova.manova', 'anova.repeated',
  'descriptives.flexplot', 'descriptives.raincloud', 'descriptives.statistics', 'descriptives.timeSeries',
  'equivalence.t',
  'factor.efa', 'factor.pca',
  'frequencies.binomial', 'frequencies.contingency', 'frequencies.loglinear', 'frequencies.multinomial',
  'power.analysis',
  'regression.correlation', 'regression.glm', 'regression.linear', 'regression.logistic',
  'reliability.agreement', 'reliability.blandAltman', 'reliability.icc', 'reliability.unidimensional',
  't.independent', 't.oneSample', 't.paired',
  'visualModeling.flexplot',
].sort()

export const PHASE4_IMPLEMENTED = [
  ...PHASE3_IMPLEMENTED,
  'bff.general',
  'learnBayes.labs',
  'robustT.modelAveraged',
  'summaryStats.fromPublished',
].sort()

export const PHASE5_IMPLEMENTED = [
  ...PHASE4_IMPLEMENTED,
  'bsts.model',
  'circular.descriptives',
  'circular.tests',
  'mixed.glmm',
  'mixed.lmm',
  'predictive.analytics',
  'process.model',
  'prophet.forecast',
  'survival.cox',
  'survival.nonparametric',
  'survival.parametric',
  'timeSeries.arima',
  'timeSeries.spectral',
  'timeSeries.stationarity',
].sort()

export const PHASE6_IMPLEMENTED = [
  ...PHASE5_IMPLEMENTED,
  'bain.tests',
  'bfpack.constrained',
  'cochrane.ma',
  'factor.cfa',
  'jags.model',
  'meta.analysis',
  'network.psych',
  'sem.mediation',
  'sem.pls',
  'sem.sem',
].sort()

export const PHASE7_IMPLEMENTED = [
  ...PHASE6_IMPLEMENTED,
  'acceptance.attribute',
  'acceptance.variable',
  'audit.data',
  'audit.sampling',
  'distributions.explorer',
  'ml.classification',
  'ml.clustering',
  'ml.prediction',
  'ml.regression',
  'qc.capability',
  'qc.charts',
  'qc.doe',
  'qc.msa',
].sort()

export const PHASE8_IMPLEMENTED = [
  ...PHASE7_IMPLEMENTED,
  'learnStats.labs',
].sort()
