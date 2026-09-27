import type { Studio, StudioLab } from '../../../lib/statisticsStudios'
import { LabShell } from './shared'
import { EstimationLab } from './EstimationLab'
import { HypothesisLab } from './HypothesisLab'
import { SurvivalLab } from './SurvivalLab'
import { MultivariateLab } from './MultivariateLab'
import { SimulationLab } from './SimulationLab'
import { QualityLab } from './QualityLab'

export function RemainingLabScreen({ studio, lab }: { studio: Studio; lab: StudioLab }) {
  return <LabShell studio={studio} lab={lab}>
    {studio.slug === 'estimation' && <EstimationLab lab={lab} />}
    {studio.slug === 'hypothesis-testing' && <HypothesisLab lab={lab} />}
    {studio.slug === 'reliability-survival' && <SurvivalLab lab={lab} />}
    {studio.slug === 'multivariate-statistics' && <MultivariateLab lab={lab} />}
    {studio.slug === 'statistical-simulation' && <SimulationLab lab={lab} />}
    {studio.slug === 'quality-decision-making' && <QualityLab lab={lab} />}
  </LabShell>
}
