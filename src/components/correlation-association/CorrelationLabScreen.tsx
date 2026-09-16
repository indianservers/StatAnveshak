import type { Studio, StudioLab } from '../../lib/statisticsStudios'
import { CorrelationLabShell } from './shell'
import { ScatterPlotExplorerLab } from './labs/ScatterPlotExplorerLab'
import { CovarianceLab } from './labs/CovarianceLab'
import { PearsonCorrelationLab } from './labs/PearsonCorrelationLab'
import { SpearmanRankLab } from './labs/SpearmanRankLab'
import { KendallTauLab } from './labs/KendallTauLab'
import { CorrelationMatrixLab } from './labs/CorrelationMatrixLab'
import { PartialCorrelationLab } from './labs/PartialCorrelationLab'
import { CorrelationVsCausationLab } from './labs/CorrelationVsCausationLab'

export function CorrelationLabScreen({ studio, lab }: { studio: Studio; lab: StudioLab }) {
  const index = studio.labs.findIndex((item) => item.slug === lab.slug)
  return (
    <CorrelationLabShell lab={lab} index={Math.max(0, index)}>
      {(tab) => {
        switch (lab.slug) {
          case 'scatter-plot-explorer':
            return <ScatterPlotExplorerLab tab={tab} />
          case 'covariance':
            return <CovarianceLab tab={tab} />
          case 'pearson-correlation':
            return <PearsonCorrelationLab tab={tab} />
          case 'spearman-rank-correlation':
            return <SpearmanRankLab tab={tab} />
          case 'kendall-tau':
            return <KendallTauLab tab={tab} />
          case 'correlation-matrix':
            return <CorrelationMatrixLab tab={tab} />
          case 'partial-correlation':
            return <PartialCorrelationLab tab={tab} />
          case 'correlation-vs-causation':
            return <CorrelationVsCausationLab tab={tab} />
          default:
            return <p className="text-sm text-slate-500">This lab is not available yet.</p>
        }
      }}
    </CorrelationLabShell>
  )
}
