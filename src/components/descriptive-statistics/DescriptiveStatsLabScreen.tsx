import type { Studio, StudioLab } from '../../lib/statisticsStudios'
import { DescriptiveStatsLabShell } from './shell'
import { BoxPlotOutliersLab } from './labs/BoxPlotOutliersLab'
import { DataVisualizationLab } from './labs/DataVisualizationLab'
import { DistributionShapeLab } from './labs/DistributionShapeLab'
import { EcdfStemLeafLab } from './labs/EcdfStemLeafLab'
import { FiveNumberSummaryLab } from './labs/FiveNumberSummaryLab'
import { FrequencyTablesLab } from './labs/FrequencyTablesLab'
import { MeasuresOfCenterLab } from './labs/MeasuresOfCenterLab'
import { MeasuresOfSpreadLab } from './labs/MeasuresOfSpreadLab'
import { PositionMeasuresLab } from './labs/PositionMeasuresLab'

export function DescriptiveStatsLabScreen({ studio, lab }: { studio: Studio; lab: StudioLab }) {
  const index = studio.labs.findIndex((item) => item.slug === lab.slug)
  return (
    <DescriptiveStatsLabShell lab={lab} index={Math.max(0, index)}>
      {(tab) => {
        switch (lab.slug) {
          case 'measures-of-center':
            return <MeasuresOfCenterLab tab={tab} />
          case 'measures-of-spread':
            return <MeasuresOfSpreadLab tab={tab} />
          case 'position-measures':
            return <PositionMeasuresLab tab={tab} />
          case 'five-number-summary':
            return <FiveNumberSummaryLab tab={tab} />
          case 'data-visualization-basics':
            return <DataVisualizationLab tab={tab} />
          case 'distribution-shape':
            return <DistributionShapeLab tab={tab} />
          case 'box-plot-outliers':
            return <BoxPlotOutliersLab tab={tab} />
          case 'frequency-tables':
            return <FrequencyTablesLab tab={tab} />
          case 'ecdf-stem-and-leaf':
            return <EcdfStemLeafLab tab={tab} />
          default:
            return <p className="text-sm text-slate-500">This lab is not available yet.</p>
        }
      }}
    </DescriptiveStatsLabShell>
  )
}
