import type { AnalysisOptions, AnalysisResult } from './types'
import { ANALYSIS_BY_ID } from './catalog'
import { runDescriptiveStatistics } from './engines/frequentist/descriptives'
import { runFlexplot } from './engines/frequentist/flexplot'
import { runRaincloud } from './engines/frequentist/raincloud'
import { runTimeSeriesDescriptives } from './engines/frequentist/timeSeriesDescriptives'
import { runAncova, runBetweenAnova } from './engines/frequentist/anova'
import { runEquivalenceT } from './engines/frequentist/equivalence'
import { runManova } from './engines/frequentist/manova'
import { runPowerAnalysis } from './engines/frequentist/power'
import { runRepeatedAnova } from './engines/frequentist/rmAnova'
import { runIndependentT, runOneSampleT, runPairedT } from './engines/frequentist/ttests'
import { runCorrelation } from './engines/frequentist/correlation'
import { runEfa, runPca } from './engines/frequentist/factor'
import { runBinomial, runContingency, runLogLinear, runMultinomial } from './engines/frequentist/frequencies'
import { runLinearRegression } from './engines/frequentist/linear'
import { runGlm, runLogistic } from './engines/frequentist/logistic'
import { runAgreement, runBlandAltman, runIcc, runUnidimensional } from './engines/frequentist/reliability'
import { runArima, runSpectral, runStationarity } from './engines/frequentist/timeSeries'
import { runCircularDescriptives, runCircularTests } from './engines/frequentist/circular'
import { runCox, runNonparametricSurvival, runParametricSurvival } from './engines/frequentist/survival'
import { runGlmm, runLmm } from './engines/frequentist/mixed'
import { runPredictive } from './engines/frequentist/predictive'
import { runProcess } from './engines/frequentist/process'
import { runCfa, runPls, runSem, runSemSpecial } from './engines/frequentist/sem'
import { runMeta } from './engines/frequentist/meta'
import { runNetwork } from './engines/frequentist/network'
import { runBfpack } from './engines/bayesian/bain'
import { runBayesian } from './engines/bayesian/runBayesian'
import { runMlClassification, runMlClustering, runMlPrediction, runMlRegression } from './engines/frequentist/ml'
import { runQcCapability, runQcCharts, runQcDoe, runQcMsa } from './engines/frequentist/qc'
import { runAcceptanceAttribute, runAcceptanceVariable, runAuditData, runAuditSampling } from './engines/frequentist/audit'
import { runDistributions } from './engines/frequentist/distExplorer'
import { runLearnStats } from './engines/frequentist/learnStats'

export function runAnalysis(analysisId: string, rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const def = ANALYSIS_BY_ID[analysisId]
  if (!def) throw new Error(`Unknown analysis: ${analysisId}`)
  if (!def.implemented) {
    return {
      analysisId,
      title: def.title,
      interpretation: `${def.title} is catalogued for Phase ${def.phase} and is not computed yet.`,
      assumptions: [],
      footnotes: [def.description],
      tables: [],
      plots: [],
    }
  }
  const wantBayes = options.inference === 'bayesian' || !def.frequentist
  if (def.bayesian && wantBayes) {
    return runBayesian(analysisId, rows, options)
  }
  switch (analysisId) {
    case 'descriptives.statistics':
      return runDescriptiveStatistics(rows, options)
    case 'descriptives.raincloud':
      return runRaincloud(rows, options)
    case 'descriptives.timeSeries':
      return runTimeSeriesDescriptives(rows, options)
    case 'descriptives.flexplot':
    case 'visualModeling.flexplot':
      return { ...runFlexplot(rows, options), analysisId }
    case 't.independent':
      return runIndependentT(rows, options)
    case 't.paired':
      return runPairedT(rows, options)
    case 't.oneSample':
      return runOneSampleT(rows, options)
    case 'anova.between':
      return runBetweenAnova(rows, options)
    case 'anova.repeated':
      return runRepeatedAnova(rows, options)
    case 'anova.ancova':
      return runAncova(rows, options)
    case 'anova.manova':
      return runManova(rows, options)
    case 'equivalence.t':
      return runEquivalenceT(rows, options)
    case 'power.analysis':
      return runPowerAnalysis(rows, options)
    case 'regression.correlation':
      return runCorrelation(rows, options)
    case 'regression.linear':
      return runLinearRegression(rows, options)
    case 'regression.logistic':
      return runLogistic(rows, options)
    case 'regression.glm':
      return runGlm(rows, options)
    case 'frequencies.binomial':
      return runBinomial(rows, options)
    case 'frequencies.multinomial':
      return runMultinomial(rows, options)
    case 'frequencies.contingency':
      return runContingency(rows, options)
    case 'frequencies.loglinear':
      return runLogLinear(rows, options)
    case 'factor.pca':
      return runPca(rows, options)
    case 'factor.efa':
      return runEfa(rows, options)
    case 'reliability.unidimensional':
      return runUnidimensional(rows, options)
    case 'reliability.icc':
      return runIcc(rows, options)
    case 'reliability.agreement':
      return runAgreement(rows, options)
    case 'reliability.blandAltman':
      return runBlandAltman(rows, options)
    case 'bff.general':
    case 'learnBayes.labs':
    case 'summaryStats.fromPublished':
    case 'robustT.modelAveraged':
      return runBayesian(analysisId, rows, options)
    case 'mixed.lmm':
      return runLmm(rows, options)
    case 'mixed.glmm':
      return runGlmm(rows, options)
    case 'timeSeries.stationarity':
      return runStationarity(rows, options)
    case 'timeSeries.arima':
      return runArima(rows, options)
    case 'timeSeries.spectral':
      return runSpectral(rows, options)
    case 'survival.nonparametric':
      return runNonparametricSurvival(rows, options)
    case 'survival.cox':
      return runCox(rows, options)
    case 'survival.parametric':
      return runParametricSurvival(rows, options)
    case 'circular.descriptives':
      return runCircularDescriptives(rows, options)
    case 'circular.tests':
      return runCircularTests(rows, options)
    case 'process.model':
      return runProcess(rows, options)
    case 'predictive.analytics':
      return runPredictive(rows, options)
    case 'bsts.model':
    case 'prophet.forecast':
    case 'bain.tests':
    case 'jags.model':
      return runBayesian(analysisId, rows, options)
    case 'factor.cfa':
      return runCfa(rows, options)
    case 'sem.sem':
      return runSem(rows, options)
    case 'sem.pls':
      return runPls(rows, options)
    case 'sem.mediation':
      return runSemSpecial(rows, options)
    case 'meta.analysis':
    case 'cochrane.ma':
      return runMeta(rows, options, analysisId)
    case 'network.psych':
      return runNetwork(rows, options, false)
    case 'bfpack.constrained':
      return runBfpack(rows, options)
    case 'ml.regression':
      return runMlRegression(rows, options)
    case 'ml.classification':
      return runMlClassification(rows, options)
    case 'ml.clustering':
      return runMlClustering(rows, options)
    case 'ml.prediction':
      return runMlPrediction(rows, options)
    case 'qc.msa':
      return runQcMsa(rows, options)
    case 'qc.charts':
      return runQcCharts(rows, options)
    case 'qc.capability':
      return runQcCapability(rows, options)
    case 'qc.doe':
      return runQcDoe(rows, options)
    case 'acceptance.attribute':
      return runAcceptanceAttribute(rows, options)
    case 'acceptance.variable':
      return runAcceptanceVariable(rows, options)
    case 'audit.sampling':
      return runAuditSampling(rows, options)
    case 'audit.data':
      return runAuditData(rows, options)
    case 'distributions.explorer':
      return runDistributions(rows, options)
    case 'learnStats.labs':
      return runLearnStats(rows, options)
    default:
      throw new Error(`No engine registered for ${analysisId}`)
  }
}
