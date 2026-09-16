import type { ComponentType } from 'react'
import type { ExperimentKind } from '../../../lib/distributionExperiences'
import type { LabProps } from './shared'
import {
  DiscretePmfLab,
  PoissonTimelineLab,
  TokenTrialLab,
  WaitingSequenceLab,
  WithoutReplacementLab,
  ZeroInflationLab,
} from './experiments/DiscreteExperiments'
import {
  BayesianBetaLab,
  BellRuleLab,
  ChiSquareSquaresLab,
  IntervalAreaLab,
  LogTransformLab,
  MemorylessLab,
  SumOfWaitsLab,
  TailCompareLab,
  VarianceRatioLab,
  ZScoreLab,
} from './experiments/ContinuousExperiments'
import {
  CauchyMeanLab,
  DirichletSimplexLab,
  EmpiricalFitLab,
  ExtremeValueLab,
  FirstPassageLab,
  LaplaceLossLab,
  LogisticThresholdLab,
  MixtureLab,
  MultinomialLab,
  ParetoShareLab,
  SkewSliderLab,
  StretchedBetaLab,
  WeibullLifetimeLab,
} from './experiments/AdvancedExperiments'

const EXPERIMENTS: Record<ExperimentKind, ComponentType<LabProps>> = {
  'token-trial': TokenTrialLab,
  'discrete-pmf': DiscretePmfLab,
  'waiting-sequence': WaitingSequenceLab,
  'without-replacement': WithoutReplacementLab,
  'poisson-timeline': PoissonTimelineLab,
  'zero-inflation': ZeroInflationLab,
  'interval-area': IntervalAreaLab,
  'bell-rule': BellRuleLab,
  'z-score': ZScoreLab,
  'log-transform': LogTransformLab,
  'memoryless': MemorylessLab,
  'sum-of-waits': SumOfWaitsLab,
  'bayesian-beta': BayesianBetaLab,
  'chi-square-squares': ChiSquareSquaresLab,
  'tail-compare': TailCompareLab,
  'variance-ratio': VarianceRatioLab,
  'weibull-lifetime': WeibullLifetimeLab,
  'pareto-share': ParetoShareLab,
  'cauchy-mean': CauchyMeanLab,
  'logistic-threshold': LogisticThresholdLab,
  'skew-slider': SkewSliderLab,
  'laplace-loss': LaplaceLossLab,
  'extreme-value': ExtremeValueLab,
  'first-passage': FirstPassageLab,
  'stretched-beta': StretchedBetaLab,
  mixture: MixtureLab,
  multinomial: MultinomialLab,
  'dirichlet-simplex': DirichletSimplexLab,
  'empirical-fit': EmpiricalFitLab,
}

export const EXPERIMENT_KINDS = Object.keys(EXPERIMENTS) as ExperimentKind[]

export function ExperimentHost(props: LabProps) {
  const Lab = EXPERIMENTS[props.experience.experiment]
  return <Lab {...props} />
}
