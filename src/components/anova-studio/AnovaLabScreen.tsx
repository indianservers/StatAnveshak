import type { Studio, StudioLab } from '../../lib/statisticsStudios'
import { AnovaLabShell } from './shell'
import { OneWayAnovaLab } from './labs/OneWayAnovaLab'
import { AnovaTableLab } from './labs/AnovaTableLab'
import { PostHocComparisonsLab } from './labs/PostHocComparisonsLab'
import { TwoWayAnovaLab } from './labs/TwoWayAnovaLab'
import { RepeatedMeasuresAnovaLab } from './labs/RepeatedMeasuresAnovaLab'
import { AnovaAssumptionsLab } from './labs/AnovaAssumptionsLab'

export function AnovaLabScreen({ studio, lab }: { studio: Studio; lab: StudioLab }) {
  const index = studio.labs.findIndex((item) => item.slug === lab.slug)
  return (
    <AnovaLabShell lab={lab} index={Math.max(0, index)}>
      {lab.slug === 'one-way-anova' && <OneWayAnovaLab />}
      {lab.slug === 'anova-table' && <AnovaTableLab />}
      {lab.slug === 'post-hoc-comparisons' && <PostHocComparisonsLab />}
      {lab.slug === 'two-way-anova' && <TwoWayAnovaLab />}
      {lab.slug === 'repeated-measures-anova' && <RepeatedMeasuresAnovaLab />}
      {lab.slug === 'anova-assumptions' && <AnovaAssumptionsLab />}
    </AnovaLabShell>
  )
}
