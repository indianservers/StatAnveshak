import { useState } from 'react'
import type { StudioLab } from '../../../lib/statisticsStudios'
import { Card, LineChart, Metric, Slider, Theory } from './shared'
import { fmt } from './format'

const theory: Record<string, { intuition: string; formula: string; assumptions: string; caution: string }> = {
  'survival-function': { intuition: 'Survival is the chance an event time exceeds t.', formula: 'S(t) = P(T > t) = 1 − F(t)', assumptions: 'Event times must be defined consistently; account for incomplete follow-up.', caution: 'A survival probability is conditional on the population and starting point used to estimate it.' },
  'hazard-function': { intuition: 'Hazard describes instantaneous event pressure among subjects still at risk.', formula: 'h(t) = f(t)/S(t) = −d log S(t)/dt', assumptions: 'A continuous time model for the smooth hazard curve shown here.', caution: 'Hazard is a rate, not the probability of an event at an exact instant.' },
  censoring: { intuition: 'A right-censored subject survived at least to their last observed time.', formula: 'contribution = f(t) if event; S(t) if censored', assumptions: 'Censoring should be independent of future event time, conditional on modeled information.', caution: 'Dropping censored subjects biases the curve; treating their censoring times as failures also biases it.' },
  'kaplan-meier': { intuition: 'At each event time, multiply survival by the fraction of the risk set that did not fail.', formula: 'Ŝ(t) = ∏(1 − dⱼ/nⱼ) over event times ≤ t', assumptions: 'Independent subjects and noninformative right censoring.', caution: 'The curve changes at failures, not censorings. The tail becomes unstable when few remain at risk.' },
  'median-survival': { intuition: 'The median time is where survival first reaches one half.', formula: 'median T = inf{t: S(t) ≤ 0.5}', assumptions: 'The survival curve must reach 0.5 within observed follow-up.', caution: 'If it never crosses 0.5, median survival is not observed and should not be invented.' },
  'reliability-function': { intuition: 'For components, reliability is the same survival probability: still operating at time t.', formula: 'R(t) = P(T > t); failure probability = 1 − R(t)', assumptions: 'A defined failure mode and operating environment.', caution: 'A component reliability curve does not automatically give system reliability when components depend on one another.' },
  'mean-time-to-failure': { intuition: 'Expected lifetime is the area under the reliability curve.', formula: 'MTTF = E[T] = ∫₀∞ S(t) dt', assumptions: 'Nonnegative lifetime with a finite mean; the display uses a Weibull model.', caution: 'An observed restricted mean up to a finite horizon is different from full MTTF.' },
  'hazard-comparison': { intuition: 'Compare the event pressure of two groups at the same time.', formula: 'HR(t) = h_B(t)/h_A(t)', assumptions: 'A constant hazard ratio is only appropriate when proportional hazards is plausible.', caution: 'A hazard ratio is not a ratio of survival probabilities; crossing hazards defeat a single constant summary.' },
  'weibull-reliability': { intuition: 'The Weibull shape controls whether failure risk falls, stays flat, or rises with age.', formula: 'S(t)=exp[−(t/η)^β]; h(t)=βt^(β−1)/η^β', assumptions: 'A Weibull model is a useful approximation to the lifetime mechanism.', caution: 'β < 1 means early-failure risk, β = 1 constant hazard, β > 1 wear-out; check fit before extrapolating.' },
}

type KmRow = { time: number; atRisk: number; event: boolean; survival: number }
function kmRows(censored: number): KmRow[] {
  const times = [2, 3, 5, 6, 8, 9, 11, 13, 14, 17]
  let survival = 1
  return times.map((time, index) => {
    const atRisk = times.length - index
    const event = index >= censored && index % 3 !== 1
    if (event) survival *= 1 - 1 / atRisk
    return { time, atRisk, event, survival }
  })
}

export function SurvivalLab({ lab }: { lab: StudioLab }) {
  const [scale, setScale] = useState(12)
  const [shape, setShape] = useState(1.5)
  const [time, setTime] = useState(10)
  const [censored, setCensored] = useState(1)
  const [ratio, setRatio] = useState(1.5)
  const slug = lab.slug
  const survival = (t: number, eta = scale) => Math.exp(-((t / eta) ** shape))
  const hazard = (t: number, eta = scale) => shape / eta * Math.max(t / eta, 0.001) ** (shape - 1)
  const times = Array.from({ length: 101 }, (_, i) => i * 0.25)
  const rows = kmRows(censored)
  const kmPoints = [{ x: 0, y: 1 }]
  rows.forEach((row, index) => {
    kmPoints.push({ x: row.time, y: index ? rows[index - 1].survival : 1 })
    kmPoints.push({ x: row.time, y: row.survival })
  })
  kmPoints.push({ x: 25, y: rows[rows.length - 1].survival })
  const kmMedian = rows.find((row) => row.survival <= 0.5)?.time
  const modelMedian = scale * Math.log(2) ** (1 / shape)
  const area = times.slice(1).reduce((sum, t, index) => sum + (survival(t) + survival(times[index])) * 0.25 / 2, 0)
  const isHazard = slug === 'hazard-function' || slug === 'hazard-comparison'
  const isKm = slug === 'kaplan-meier' || slug === 'censoring' || slug === 'median-survival'
  const showSecond = slug === 'hazard-comparison'
  const chartSeries = isKm ? [{ name: 'Kaplan–Meier estimate', points: kmPoints, color: '#e11d48' }, { name: 'Weibull model', points: times.map((t) => ({ x: t, y: survival(t) })), color: '#6366f1', dashed: true }] : isHazard ? [{ name: 'Group A hazard', points: times.slice(1).map((t) => ({ x: t, y: hazard(t) })), color: '#e11d48' }, ...(showSecond ? [{ name: 'Group B hazard', points: times.slice(1).map((t) => ({ x: t, y: hazard(t) * ratio })), color: '#6366f1' }] : [])] : [{ name: 'Survival / reliability', points: times.map((t) => ({ x: t, y: survival(t) })), color: '#e11d48' }, ...(slug === 'reliability-function' ? [{ name: 'Failure probability', points: times.map((t) => ({ x: t, y: 1 - survival(t) })), color: '#6366f1' }] : [])]
  const primary = isHazard ? hazard(time) : isKm ? rows.filter((row) => row.time <= time).at(-1)?.survival ?? 1 : survival(time)
  const median = isKm ? kmMedian : modelMedian
  return <div className="space-y-4"><div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_300px]"><Card title={isHazard ? 'Risk over time' : isKm ? 'Event and censoring timeline' : 'Lifetime curve'}><LineChart series={chartSeries} markers={[{ x: time, label: `time ${time}` }, ...(slug === 'median-survival' && median !== undefined ? [{ x: median, label: 'median', color: '#16a34a' }] : [])]} xLabel="Time" yLabel={isHazard ? 'Hazard rate' : 'Probability'} summary={`${lab.title}: value at time ${time} is ${fmt(primary, 3)}`} yMin={0} yMax={isHazard ? undefined : 1} />{isKm && <p className="mt-2 text-xs text-slate-500">The solid curve drops only at observed failures. The dotted curve is a Weibull model for comparison.</p>}</Card><Card title="Experiment controls"><div className="space-y-4"><Slider label="Weibull scale η" value={scale} min={4} max={22} onChange={setScale} /><Slider label="Weibull shape β" value={shape} min={0.5} max={3} step={0.1} onChange={setShape} /><Slider label="Read at time" value={time} min={1} max={24} onChange={setTime} />{isKm && <Slider label="Early censored subjects" value={censored} min={0} max={4} onChange={setCensored} />}{showSecond && <Slider label="Group B hazard ratio" value={ratio} min={0.5} max={3} step={0.1} onChange={setRatio} />}</div></Card></div>
    <div className="grid gap-4 sm:grid-cols-3"><Metric label={isHazard ? 'Hazard at selected time' : 'Survival at selected time'} value={fmt(primary, 3)} /><Metric label={slug === 'mean-time-to-failure' ? 'Area to time 25' : 'Median lifetime'} value={slug === 'mean-time-to-failure' ? fmt(area, 2) : median === undefined ? 'Not reached' : fmt(median, 1)} note={slug === 'mean-time-to-failure' ? 'Restricted mean; full MTTF includes the remaining tail' : isKm ? 'From the step curve' : 'From the Weibull model'} /><Metric label={showSecond ? 'Hazard ratio B/A' : isKm ? 'Censored records' : 'Failure probability at time'} value={showSecond ? fmt(ratio, 2) : isKm ? String(rows.filter((row) => !row.event).length) : fmt(1 - survival(time), 3)} /></div>
    {isKm && <Card title="Risk set worked example"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-2">Time</th><th>At risk</th><th>Status</th><th>Ŝ(t)</th></tr></thead><tbody>{rows.map((row) => <tr key={row.time} className="border-b border-slate-100"><td className="py-1">{row.time}</td><td>{row.atRisk}</td><td>{row.event ? 'Event' : 'Censored'}</td><td>{fmt(row.survival, 3)}</td></tr>)}</tbody></table></div></Card>}
    <Theory {...theory[slug]} />
  </div>
}
