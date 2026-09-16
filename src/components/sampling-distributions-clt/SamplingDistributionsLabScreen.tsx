import type { Studio, StudioLab } from '../../lib/statisticsStudios'
import { SamplingDistributionsLabShell } from './shell'
import { BootstrapLab } from './labs/BootstrapLab'
import { CltLab } from './labs/CltLab'
import { ComparisonLab } from './labs/ComparisonLab'
import { LlnLab } from './labs/LlnLab'
import { MeanLab } from './labs/MeanLab'
import { ProportionLab } from './labs/ProportionLab'
import { StandardErrorLab } from './labs/StandardErrorLab'

export function SamplingDistributionsLabScreen({ studio, lab }: { studio: Studio; lab: StudioLab }) {
  const index = studio.labs.findIndex((item) => item.slug === lab.slug)
  return (
    <SamplingDistributionsLabShell lab={lab} index={Math.max(0, index)}>
      {(tab) => {
        switch (lab.slug) {
          case 'sampling-distribution-of-the-mean':
            return <MeanLab tab={tab} />
          case 'sampling-distribution-of-a-proportion':
            return <ProportionLab tab={tab} />
          case 'standard-error':
            return <StandardErrorLab tab={tab} />
          case 'central-limit-theorem':
            return <CltLab tab={tab} />
          case 'law-of-large-numbers':
            return <LlnLab tab={tab} />
          case 'sampling-distribution-comparison':
            return <ComparisonLab tab={tab} />
          case 'bootstrap-intuition':
            return <BootstrapLab tab={tab} />
          default:
            return <p className="text-sm text-slate-500">This lab is not available yet.</p>
        }
      }}
    </SamplingDistributionsLabShell>
  )
}
