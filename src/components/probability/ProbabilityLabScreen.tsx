import type { Studio, StudioLab } from '../../lib/statisticsStudios'
import { ProbabilityLabShell } from './shell'
import { BayesTheoremLab } from './labs/BayesTheoremLab'
import { ConditionalProbabilityLab } from './labs/ConditionalProbabilityLab'
import { CountingTechniquesLab } from './labs/CountingTechniquesLab'
import { IndependenceLab } from './labs/IndependenceLab'
import { ProbabilityRulesLab } from './labs/ProbabilityRulesLab'
import { SampleSpaceEventsLab } from './labs/SampleSpaceEventsLab'
import { SetOperationsLab } from './labs/SetOperationsLab'
import { TotalProbabilityLab } from './labs/TotalProbabilityLab'
import { TreeVennLab } from './labs/TreeVennLab'

export function ProbabilityLabScreen({ studio, lab }: { studio: Studio; lab: StudioLab }) {
  const index = studio.labs.findIndex((item) => item.slug === lab.slug)
  return (
    <ProbabilityLabShell lab={lab} index={Math.max(0, index)}>
      {(tab) => {
        switch (lab.slug) {
          case 'sample-space-events':
            return <SampleSpaceEventsLab tab={tab} />
          case 'set-operations':
            return <SetOperationsLab tab={tab} />
          case 'probability-rules':
            return <ProbabilityRulesLab tab={tab} />
          case 'conditional-probability':
            return <ConditionalProbabilityLab tab={tab} />
          case 'independence':
            return <IndependenceLab tab={tab} />
          case 'bayes-theorem':
            return <BayesTheoremLab tab={tab} />
          case 'law-of-total-probability':
            return <TotalProbabilityLab tab={tab} />
          case 'counting-techniques':
            return <CountingTechniquesLab tab={tab} />
          case 'probability-tree-venn':
            return <TreeVennLab tab={tab} />
          default:
            return <p className="text-sm text-slate-500">This lab is not available yet.</p>
        }
      }}
    </ProbabilityLabShell>
  )
}
