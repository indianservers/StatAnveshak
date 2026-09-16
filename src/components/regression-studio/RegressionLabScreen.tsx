import type { Studio, StudioLab } from '../../lib/statisticsStudios'
import { RegressionLabShell } from './shell'
import { SimpleLinearRegressionLab } from './labs/SimpleLinearRegressionLab'
import { LeastSquaresLab } from './labs/LeastSquaresLab'
import { PredictionLab } from './labs/PredictionLab'
import { ResidualAnalysisLab } from './labs/ResidualAnalysisLab'
import { GoodnessOfFitLab } from './labs/GoodnessOfFitLab'
import { ConfidencePredictionIntervalsLab } from './labs/ConfidencePredictionIntervalsLab'
import { MultipleRegressionLab } from './labs/MultipleRegressionLab'
import { PolynomialRegressionLab } from './labs/PolynomialRegressionLab'
import { CategoricalPredictorsLab } from './labs/CategoricalPredictorsLab'
import { InteractionEffectsLab } from './labs/InteractionEffectsLab'
import { LogisticRegressionBasicsLab } from './labs/LogisticRegressionBasicsLab'

export function RegressionLabScreen({ studio, lab }: { studio: Studio; lab: StudioLab }) {
  const index = studio.labs.findIndex((item) => item.slug === lab.slug)
  return (
    <RegressionLabShell lab={lab} index={Math.max(0, index)}>
      {lab.slug === 'simple-linear-regression' && <SimpleLinearRegressionLab />}
      {lab.slug === 'least-squares' && <LeastSquaresLab />}
      {lab.slug === 'prediction' && <PredictionLab />}
      {lab.slug === 'residual-analysis' && <ResidualAnalysisLab />}
      {lab.slug === 'goodness-of-fit' && <GoodnessOfFitLab />}
      {lab.slug === 'confidence-prediction-intervals' && <ConfidencePredictionIntervalsLab />}
      {lab.slug === 'multiple-regression' && <MultipleRegressionLab />}
      {lab.slug === 'polynomial-regression' && <PolynomialRegressionLab />}
      {lab.slug === 'categorical-predictors' && <CategoricalPredictorsLab />}
      {lab.slug === 'interaction-effects' && <InteractionEffectsLab />}
      {lab.slug === 'logistic-regression-basics' && <LogisticRegressionBasicsLab />}
    </RegressionLabShell>
  )
}
