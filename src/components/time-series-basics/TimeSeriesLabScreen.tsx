import type { Studio, StudioLab } from '../../lib/statisticsStudios'
import { TimeSeriesLabShell } from './shell'
import { TimePlotLab } from './labs/TimePlotLab'
import { TrendLab } from './labs/TrendLab'
import { SeasonalityLab } from './labs/SeasonalityLab'
import { MovingAverageLab } from './labs/MovingAverageLab'
import { AutocorrelationLab } from './labs/AutocorrelationLab'
import { AcfPacfLab } from './labs/AcfPacfLab'
import { StationarityLab } from './labs/StationarityLab'
import { WhiteNoiseRandomWalkLab } from './labs/WhiteNoiseRandomWalkLab'
import { ArMaArimaLab } from './labs/ArMaArimaLab'

export function TimeSeriesLabScreen({ studio, lab }: { studio: Studio; lab: StudioLab }) {
  const index = studio.labs.findIndex((item) => item.slug === lab.slug)
  return (
    <TimeSeriesLabShell lab={lab} index={Math.max(0, index)}>
      {lab.slug === 'time-plot' && <TimePlotLab />}
      {lab.slug === 'trend' && <TrendLab />}
      {lab.slug === 'seasonality' && <SeasonalityLab />}
      {lab.slug === 'moving-average' && <MovingAverageLab />}
      {lab.slug === 'autocorrelation' && <AutocorrelationLab />}
      {lab.slug === 'acf-pacf' && <AcfPacfLab />}
      {lab.slug === 'stationarity' && <StationarityLab />}
      {lab.slug === 'white-noise-random-walk' && <WhiteNoiseRandomWalkLab />}
      {lab.slug === 'ar-ma-arima-intuition' && <ArMaArimaLab />}
    </TimeSeriesLabShell>
  )
}
