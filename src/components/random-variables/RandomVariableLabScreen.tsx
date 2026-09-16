import type { Studio, StudioLab } from '../../lib/statisticsStudios'
import { RandomVariableLabShell } from './shell'
import { CdfQuantilesLab } from './labs/CdfQuantilesLab'
import { ContinuousRvLab } from './labs/ContinuousRvLab'
import { CovarianceCorrelationLab } from './labs/CovarianceCorrelationLab'
import { DiscreteRvLab } from './labs/DiscreteRvLab'
import { ExpectationMomentsLab } from './labs/ExpectationMomentsLab'
import { JointMarginalLab } from './labs/JointMarginalLab'
import { SkewnessKurtosisLab } from './labs/SkewnessKurtosisLab'
import { TransformationsLab } from './labs/TransformationsLab'
import { VarianceSdLab } from './labs/VarianceSdLab'

export function RandomVariableLabScreen({ studio, lab }: { studio: Studio; lab: StudioLab }) {
  const index = studio.labs.findIndex((item) => item.slug === lab.slug)
  return (
    <RandomVariableLabShell lab={lab} index={Math.max(0, index)}>
      {(tab) => {
        switch (lab.slug) {
          case 'discrete-random-variables':
            return <DiscreteRvLab tab={tab} />
          case 'continuous-random-variables':
            return <ContinuousRvLab tab={tab} />
          case 'cdf-quantiles':
            return <CdfQuantilesLab tab={tab} />
          case 'expectation-moments':
            return <ExpectationMomentsLab tab={tab} />
          case 'variance-standard-deviation':
            return <VarianceSdLab tab={tab} />
          case 'skewness-kurtosis':
            return <SkewnessKurtosisLab tab={tab} />
          case 'transformations':
            return <TransformationsLab tab={tab} />
          case 'joint-marginal-conditional':
            return <JointMarginalLab tab={tab} />
          case 'covariance-correlation':
            return <CovarianceCorrelationLab tab={tab} />
          default:
            return <p className="text-sm text-slate-500">This lab is not available yet.</p>
        }
      }}
    </RandomVariableLabShell>
  )
}
