import type { Studio, StudioLab } from '../../lib/statisticsStudios'
import { BayesianLabShell } from './shell'
import { BayesVsFrequentistLab } from './labs/BayesVsFrequentistLab'
import { BetaBinomialLab } from './labs/BetaBinomialLab'
import { ConjugatePriorsLab } from './labs/ConjugatePriorsLab'
import { CredibleIntervalsLab } from './labs/CredibleIntervalsLab'
import { FoundationsLab } from './labs/FoundationsLab'
import { GammaPoissonLab } from './labs/GammaPoissonLab'
import { MapVsMleLab } from './labs/MapVsMleLab'
import { McmcLab } from './labs/McmcLab'
import { NormalNormalLab } from './labs/NormalNormalLab'
import { PredictionLab } from './labs/PredictionLab'

export function BayesianLabScreen({ studio, lab }: { studio: Studio; lab: StudioLab }) {
  const index = studio.labs.findIndex((item) => item.slug === lab.slug)
  return (
    <BayesianLabShell lab={lab} index={Math.max(0, index)}>
      {(tab) => {
        switch (lab.slug) {
          case 'bayesian-foundations':
            return <FoundationsLab tab={tab} />
          case 'beta-binomial':
            return <BetaBinomialLab tab={tab} />
          case 'gamma-poisson':
            return <GammaPoissonLab tab={tab} />
          case 'normal-normal':
            return <NormalNormalLab tab={tab} />
          case 'conjugate-priors':
            return <ConjugatePriorsLab tab={tab} />
          case 'map-vs-mle':
            return <MapVsMleLab tab={tab} />
          case 'credible-intervals':
            return <CredibleIntervalsLab tab={tab} />
          case 'bayesian-prediction':
            return <PredictionLab tab={tab} />
          case 'bayesian-vs-frequentist':
            return <BayesVsFrequentistLab tab={tab} />
          case 'mcmc-intuition':
            return <McmcLab tab={tab} />
          default:
            return <p className="text-sm text-slate-500">This lab is not available yet.</p>
        }
      }}
    </BayesianLabShell>
  )
}
