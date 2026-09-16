import { useMemo, useState } from 'react'
import {
  ARIMA_PRESETS,
  arPhiStatus,
  arimaForecast,
  formatNum,
  sampleAcf,
  samplePacf,
  shockDecay,
  simulateArima,
  variance,
  type ArimaSpec,
} from '../../../lib/timeSeriesBasics'
import { ConceptList, FormulaBlock, HandNote, Insight, ResetButton, TsCard, TsSlider } from '../shared'
import { BarCorrChart, TimeChart } from '../plots'

type Mode = 'ar' | 'ma' | 'arima'

export function ArMaArimaLab() {
  const [mode, setMode] = useState<Mode>('arima')
  const [p, setP] = useState<0 | 1 | 2>(1)
  const [d, setD] = useState<0 | 1 | 2>(1)
  const [q, setQ] = useState<0 | 1 | 2>(1)
  const [phi, setPhi] = useState(0.6)
  const [theta, setTheta] = useState(0.5)
  const [shockAt, setShockAt] = useState(30)
  const [shock, setShock] = useState(3)
  const spec: ArimaSpec = mode === 'ar' ? { p: 1, d: 0, q: 0 } : mode === 'ma' ? { p: 0, d: 0, q: 1 } : { p, d, q }
  const sim = useMemo(
    () =>
      simulateArima(80, spec, 11, {
        phi: spec.p ? Array.from({ length: spec.p }, () => phi) : [],
        theta: spec.q ? Array.from({ length: spec.q }, () => theta) : [],
        shockAt,
        shock,
      }),
    [phi, shock, shockAt, spec, theta],
  )
  const acf = sampleAcf(sim.series, 16)
  const pacf = samplePacf(acf)
  const decay = shockDecay(phi, 8)
  const forecast = arimaForecast(sim.series, spec, 12, spec.p ? [phi] : [], spec.q ? [theta] : [], Math.sqrt(variance(sim.arma) || 1))
  const combined = [...sim.series, ...forecast.point]
  const lo = [...sim.series.map(() => undefined), ...forecast.lo]
  const hi = [...sim.series.map(() => undefined), ...forecast.hi]
  const status = arPhiStatus(phi)

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Insight title="Build intuition">See how AR, MA, and ARIMA work with interactive examples.</Insight>
          <Insight title="Explore patterns">Compare model behavior, forecasts, and diagnostics.</Insight>
          <Insight title="Learn by doing">Adjust parameters and inject a shock.</Insight>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <TsCard title="Autoregressive (AR)">
            <FormulaBlock tex={'y_t = c + \\phi_1 y_{t-1}+\\cdots+\\varepsilon_t'} label="AR process" />
            <TimeChart series={[{ id: 'ar', label: 'AR path (solid)', values: simulateArima(60, { p: 1, d: 0, q: 0 }, 3, { phi: [phi] }).series }]} height={140} />
            <BarCorrChart result={sampleAcf(simulateArima(80, { p: 1, d: 0, q: 0 }, 3, { phi: [phi] }).series, 10)} title="ACF typical for AR" showBand={false} />
          </TsCard>
          <TsCard title="Moving average (MA)">
            <FormulaBlock tex={'y_t = \\mu + \\varepsilon_t + \\theta_1\\varepsilon_{t-1}'} label="MA process — not a smoother" />
            <TimeChart series={[{ id: 'ma', label: 'MA path (solid)', values: simulateArima(60, { p: 0, d: 0, q: 1 }, 3, { theta: [theta] }).series }]} height={140} />
            <BarCorrChart result={sampleAcf(simulateArima(80, { p: 0, d: 0, q: 1 }, 3, { theta: [theta] }).series, 10)} title="ACF typical for MA" showBand={false} />
          </TsCard>
          <TsCard title="ARIMA(p, d, q)">
            <FormulaBlock tex={'(1-\\phi L)(1-L)^d y_t=(1+\\theta L)\\varepsilon_t'} label="ARIMA sketch" />
            <TimeChart
              series={[
                { id: 'obs', label: 'Observed (solid)', values: sim.series },
                { id: 'fc', label: 'Forecast (dashed)', values: combined.map((value, i) => (i >= sim.series.length ? value : undefined)), dashed: true, color: '#f59e0b' },
              ]}
              height={140}
            />
            <p className="text-xs text-slate-400">Shaded-style interval uses ±1.96 residual SE (grows after differencing).</p>
          </TsCard>
        </div>

        <TsCard title="Injected shock and memory">
          <TimeChart
            series={[
              { id: 'live', label: 'Current model (solid)', values: sim.series },
              { id: 'shock', label: 'Shock time (marker)', values: sim.series.map((value, i) => (i === shockAt ? value : undefined)), markers: true, color: '#f43f5e' },
            ]}
            annotations={[{ x: shockAt, y: sim.series[shockAt] ?? 0, text: 'Shock' }]}
            height={220}
          />
          <p className="mt-2 text-sm text-slate-500">
            AR(1) shock decay: {decay.map((value) => formatNum(value, 2)).join(', ')}. MA(1) memory lasts one lag. A differenced series (d = 1) keeps a permanent level shift.
            {spec.p > 0 ? ` φ is ${status}.` : ''}
          </p>
        </TsCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <TsCard title="Worked example">
            <TimeChart
              series={[
                { id: 'hist', label: 'Observed (solid)', values: sim.series },
                { id: 'f', label: 'ARIMA forecast (dashed)', values: combined.map((value, i) => (i < sim.series.length ? undefined : value)), dashed: true, color: '#2563eb' },
                { id: 'lo', label: 'Lower interval (dotted)', values: lo, dotted: true, color: '#93c5fd' },
                { id: 'hi', label: 'Upper interval (dotted)', values: hi, dotted: true, color: '#93c5fd' },
              ]}
              height={200}
            />
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
              <div><p className="text-[10px] uppercase text-slate-400">Residual SD</p><p className="font-black">{formatNum(Math.sqrt(variance(sim.arma) || 0), 2)}</p></div>
              <div><p className="text-[10px] uppercase text-slate-400">ACF(1)</p><p className="font-black">{formatNum(acf.values[1] ?? Number.NaN, 2)}</p></div>
              <div><p className="text-[10px] uppercase text-slate-400">PACF(1)</p><p className="font-black">{formatNum(pacf.values[1] ?? Number.NaN, 2)}</p></div>
            </div>
          </TsCard>
          <TsCard title="Key takeaways" className="ts-wash-emerald">
            <ConceptList
              items={[
                'AR models use past values and are good for persistent patterns.',
                'MA models use past forecast errors and capture short shocks. This is not a moving-average smoother.',
                'Differencing removes a stochastic trend so the working series can be closer to stationary.',
                'Use ACF and PACF as typical guides for p and q, then compare forecasts — not as rigid sample rules.',
              ]}
            />
          </TsCard>
        </div>
      </div>

      <aside className="space-y-4">
        <TsCard title="Model controls">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-1">
              {(['ar', 'ma', 'arima'] as const).map((item) => (
                <button key={item} type="button" className={`ts-btn ${mode === item ? '' : 'ts-btn-ghost'}`} onClick={() => setMode(item)}>
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
            {mode === 'arima' && (
              <>
                <TsSlider label="AR order (p)" value={p} min={0} max={2} step={1} onChange={(value) => setP(value as 0 | 1 | 2)} />
                <TsSlider label="Differencing (d)" value={d} min={0} max={2} step={1} onChange={(value) => setD(value as 0 | 1 | 2)} />
                <TsSlider label="MA order (q)" value={q} min={0} max={2} step={1} onChange={(value) => setQ(value as 0 | 1 | 2)} />
              </>
            )}
            {(mode === 'ar' || p > 0) && <TsSlider label="φ" value={phi} min={-1.2} max={1.2} step={0.05} onChange={setPhi} display={formatNum(phi, 2)} />}
            {(mode === 'ma' || q > 0) && <TsSlider label="θ" value={theta} min={-1} max={1} step={0.05} onChange={setTheta} display={formatNum(theta, 2)} />}
            <TsSlider label="Shock time" value={shockAt} min={5} max={70} step={1} onChange={setShockAt} />
            <TsSlider label="Shock size" value={shock} min={0} max={6} step={0.5} onChange={setShock} />
            <div className="flex flex-wrap gap-1">
              {ARIMA_PRESETS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="ts-btn ts-btn-ghost !min-h-8 !px-2 text-xs"
                  onClick={() => {
                    setMode('arima')
                    setP(item.spec.p)
                    setD(item.spec.d)
                    setQ(item.spec.q)
                    if (item.phi?.[0] !== undefined) setPhi(item.phi[0])
                    if (item.theta?.[0] !== undefined) setTheta(item.theta[0])
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <HandNote>Time series models turn history into possibility.</HandNote>
            <ResetButton
              onClick={() => {
                setMode('arima')
                setP(1)
                setD(1)
                setQ(1)
                setPhi(0.6)
                setTheta(0.5)
                setShockAt(30)
                setShock(3)
              }}
              label="Reset to default"
            />
          </div>
        </TsCard>
      </aside>
    </div>
  )
}
