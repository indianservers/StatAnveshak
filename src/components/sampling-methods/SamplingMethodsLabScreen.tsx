import type { Studio, StudioLab } from '../../lib/statisticsStudios'
import { SamplingMethodsLabShell } from './shell'
import { ClusterSamplingLab } from './labs/ClusterSamplingLab'
import { PopulationVsSampleLab } from './labs/PopulationVsSampleLab'
import { SamplingBiasLab } from './labs/SamplingBiasLab'
import { SamplingErrorLab } from './labs/SamplingErrorLab'
import { SimpleRandomSamplingLab } from './labs/SimpleRandomSamplingLab'
import { StratifiedSamplingLab } from './labs/StratifiedSamplingLab'
import { SystematicSamplingLab } from './labs/SystematicSamplingLab'

export function SamplingMethodsLabScreen({ studio, lab }: { studio: Studio; lab: StudioLab }) {
  const index = studio.labs.findIndex((item) => item.slug === lab.slug)
  return (
    <SamplingMethodsLabShell lab={lab} index={Math.max(0, index)}>
      {(tab) => {
        switch (lab.slug) {
          case 'population-vs-sample':
            return <PopulationVsSampleLab tab={tab} />
          case 'simple-random-sampling':
            return <SimpleRandomSamplingLab tab={tab} />
          case 'stratified-sampling':
            return <StratifiedSamplingLab tab={tab} />
          case 'cluster-sampling':
            return <ClusterSamplingLab tab={tab} />
          case 'systematic-sampling':
            return <SystematicSamplingLab tab={tab} />
          case 'sampling-bias':
            return <SamplingBiasLab tab={tab} />
          case 'sampling-vs-nonsampling-error':
            return <SamplingErrorLab tab={tab} />
          default:
            return <p className="text-sm text-slate-500">This lab is not available yet.</p>
        }
      }}
    </SamplingMethodsLabShell>
  )
}
