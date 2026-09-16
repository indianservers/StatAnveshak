import { useMemo, useState } from 'react'
import { difference, generatePreset, linearTrend, rollingStats, valuesOf } from '../../../lib/timeSeriesBasics'
import { ConceptList, FormulaBlock, HandNote, Insight, ResetButton, TsCard, TsToggle } from '../shared'
import { TimeChart } from '../plots'

export function StationarityLab() {
  const [trendOn, setTrendOn] = useState(true)
  const [seasonOn, setSeasonOn] = useState(true)
  const [diffOn, setDiffOn] = useState(true)
  const [detrendOn, setDetrendOn] = useState(false)
  const raw = useMemo(() => {
    if (trendOn && seasonOn) return generatePreset('trend-season', 84, 17, { amplitude: 8 })
    if (trendOn) return generatePreset('linear-up', 84, 17)
    if (seasonOn) return generatePreset('seasonal-monthly', 84, 17, { amplitude: 8 })
    return generatePreset('noise', 84, 17, { sd: 4 })
  }, [seasonOn, trendOn])
  const y = valuesOf(raw)
  const fit = linearTrend(y)
  const working = detrendOn ? y.map((value, i) => value - fit.fitted[i]!) : y
  const diffed = difference(working, diffOn ? 1 : 0)
  const rollRaw = rollingStats(y, 12)
  const rollDiff = rollingStats(diffed.values, 12)

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <HandNote>Stable patterns today. Better forecasts tomorrow.</HandNote>
        <div className="grid gap-4 lg:grid-cols-2">
          <TsCard title="Non-stationary series">
            <TimeChart
              series={[
                { id: 'y', label: 'Original (solid)', values: y },
                { id: 'rm', label: 'Rolling mean (dashed)', values: rollRaw.mean, dashed: true, color: '#f43f5e' },
              ]}
              labels={raw.map((row) => row.label ?? '')}
              height={220}
              yLabel="Value"
            />
            <p className="mt-2 text-sm text-slate-500">Mean and/or variance can wander because of trend or seasonality. A flat-looking graph is not a stationarity proof.</p>
          </TsCard>
          <TsCard title="Series after the chosen transform">
            <TimeChart
              series={[
                { id: 'd', label: diffOn ? 'First difference (solid)' : 'Transformed series (solid)', values: diffed.values, color: '#2563eb' },
                { id: 'rmd', label: 'Rolling mean (dashed)', values: rollDiff.mean, dashed: true, color: '#64748b' },
              ]}
              height={220}
              yLabel="Value"
            />
            {diffed.warning && <Insight title="Unnecessary differencing" tone="warn">{diffed.warning}</Insight>}
          </TsCard>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <TsCard title="What is stationarity?">
            <ConceptList items={['Constant mean — the level stays put over time.', 'Constant variance — the spread stays put.', 'A stationary series fluctuates around a fixed level without a systematic trend or changing season.']} />
          </TsCard>
          <TsCard title="Why stationarity matters">
            <ConceptList items={['Many models assume it.', 'Estimates can be biased when it fails.', 'Forecasts can be unreliable.', 'Spurious relationships can appear.']} />
            <p className="mt-2 text-sm font-semibold text-slate-600">The goal is a transformation — differencing or detrending — so the working series behaves as if stationary.</p>
          </TsCard>
          <TsCard title="Worked example">
            <p className="text-sm leading-6 text-slate-600">Original: trend and/or seasonal wave plus noise.</p>
            <FormulaBlock tex={'\\Delta y_t = y_t - y_{t-1}'} label="First difference" />
            <p className="mt-2 text-sm text-slate-600">The differenced series fluctuates around zero with a more stable level.</p>
          </TsCard>
        </div>

        <TsCard title="Key takeaways" className="ts-wash-blue">
          <div className="grid gap-3 md:grid-cols-3">
            <Insight title="Definition">Stationarity is constant mean and variance — no systematic change over time.</Insight>
            <Insight title="Transforms">Use differencing, detrending, or variance-stabilizing transforms when needed.</Insight>
            <Insight title="Before modeling">Check visually with rolling mean and variance. Do not treat a flat plot as a formal test.</Insight>
          </div>
        </TsCard>
      </div>

      <aside className="space-y-4">
        <TsCard title="Series controls">
          <div className="space-y-3">
            <TsToggle label="Trend — add an upward trend" checked={trendOn} onChange={setTrendOn} />
            <TsToggle label="Seasonality — add a period-12 pattern" checked={seasonOn} onChange={setSeasonOn} />
            <TsToggle label="Apply differencing (y_t − y_{t−1})" checked={diffOn} onChange={setDiffOn} />
            <TsToggle label="Detrend linear" checked={detrendOn} onChange={setDetrendOn} />
            <ResetButton
              onClick={() => {
                setTrendOn(true)
                setSeasonOn(true)
                setDiffOn(true)
                setDetrendOn(false)
              }}
            />
          </div>
        </TsCard>
      </aside>
    </div>
  )
}
