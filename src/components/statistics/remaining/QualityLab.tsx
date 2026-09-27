import { useState } from 'react'
import type { StudioLab } from '../../../lib/statisticsStudios'
import { normalCdf, normalPdf, normalPoints, seededRandom } from '../../../lib/remainingLabMath'
import { BarChart, Card, LineChart, Metric, Slider, Theory } from './shared'
import { fmt, fmtP } from './format'

const theory: Record<string, { intuition: string; formula: string; assumptions: string; caution: string }> = {
  'quality-control-charts': { intuition: 'Control limits describe expected process variation and flag unusually large deviations.', formula: 'individuals chart: center ± 3σ (illustrative known-σ limits)', assumptions: 'A stable process measured in time order; limits should be estimated from an in-control baseline.', caution: 'A control limit is not a customer specification limit. A point inside limits does not guarantee acceptable quality.' },
  'process-capability': { intuition: 'Capability compares tolerance width to the process’s natural spread.', formula: 'Cp = (USL−LSL)/(6σ); Cpk = min(USL−μ, μ−LSL)/(3σ)', assumptions: 'Approximately stable, normally distributed process measurements for this simple model.', caution: 'Capability numbers are misleading before checking control stability or when the distribution is strongly nonnormal.' },
  'decision-thresholds': { intuition: 'A higher cutoff usually reduces false alarms and also misses more real cases.', formula: 'TPR = P(score≥cutoff | positive); FPR = P(score≥cutoff | negative)', assumptions: 'Score distributions shown here are illustrative normal models; costs and prevalence come from the use case.', caution: 'A single accuracy number conceals the threshold trade-off and class prevalence.' },
  'ab-testing': { intuition: 'Random assignment lets observed conversion gaps estimate a treatment effect.', formula: 'risk difference = p̂B−p̂A; SE ≈ √[p̂A(1−p̂A)/nA+p̂B(1−p̂B)/nB]', assumptions: 'Random assignment, independent users, and a prespecified outcome and analysis window.', caution: 'Repeated peeking and stopping when p first falls below 0.05 inflates false positives.' },
  'diagnostic-testing': { intuition: 'Even an accurate test can have many false positives when the condition is rare.', formula: 'PPV = Se×Prev / [Se×Prev + (1−Sp)(1−Prev)]', assumptions: 'Sensitivity and specificity apply to the population being screened; prevalence is appropriate for that population.', caution: 'Sensitivity is not P(condition | positive). Bayes’ rule combines test performance with the base rate.' },
}

export function QualityLab({ lab }: { lab: StudioLab }) {
  const [mean, setMean] = useState(50)
  const [sd, setSd] = useState(4)
  const [tolerance, setTolerance] = useState(12)
  const [threshold, setThreshold] = useState(1)
  const [separation, setSeparation] = useState(2)
  const [prevalence, setPrevalence] = useState(0.1)
  const [sensitivity, setSensitivity] = useState(0.9)
  const [specificity, setSpecificity] = useState(0.9)
  const [n, setN] = useState(400)
  const [seed, setSeed] = useState(12)
  const slug = lab.slug
  const random = seededRandom(seed)
  const process = Array.from({ length: 30 }, (_, index) => {
    const u1 = Math.max(random(), 1e-9)
    const u2 = random()
    return { x: index + 1, y: mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) + (index === 24 ? separation * sd : 0) }
  })
  const lsl = 50 - tolerance
  const usl = 50 + tolerance
  const cp = (usl - lsl) / (6 * sd)
  const cpk = Math.min(usl - mean, mean - lsl) / (3 * sd)
  const fpr = 1 - normalCdf(threshold)
  const tpr = 1 - normalCdf(threshold - separation)
  const ppv = sensitivity * prevalence / (sensitivity * prevalence + (1 - specificity) * (1 - prevalence))
  const npv = specificity * (1 - prevalence) / (specificity * (1 - prevalence) + (1 - sensitivity) * prevalence)
  const aRate = prevalence
  const bRate = Math.min(0.95, prevalence + separation / 100)
  const abSe = Math.sqrt((aRate * (1 - aRate) + bRate * (1 - bRate)) / n)
  const pooledRate = (aRate + bRate) / 2
  const nullSe = Math.sqrt(2 * pooledRate * (1 - pooledRate) / n)
  const abZ = (bRate - aRate) / nullSe
  const abP = 2 * (1 - normalCdf(Math.abs(abZ)))
  let chart = <LineChart series={[{ name: 'Process values', points: process }, { name: 'Center', points: [{ x: 1, y: mean }, { x: 30, y: mean }], color: '#16a34a' }, { name: 'Upper / lower control limits', points: [{ x: 1, y: mean + 3 * sd }, { x: 30, y: mean + 3 * sd }], color: '#e11d48', dashed: true }, { name: 'Lower limit', points: [{ x: 1, y: mean - 3 * sd }, { x: 30, y: mean - 3 * sd }], color: '#e11d48', dashed: true }]} xLabel="Observation order" yLabel="Process measurement" summary={`30 process observations with center ${mean} and three-sigma limits`} />
  if (slug === 'process-capability') chart = <LineChart series={[{ name: 'Process density', points: Array.from({ length: 101 }, (_, index) => { const x = 20 + index * 0.6; return { x, y: normalPdf((x - mean) / sd) / sd } }) }]} markers={[{ x: lsl, label: 'LSL' }, { x: usl, label: 'USL' }]} xLabel="Measurement" yLabel="Density" summary={`Process mean ${mean}, standard deviation ${sd}, limits ${lsl} and ${usl}`} />
  if (slug === 'decision-thresholds') chart = <LineChart series={[{ name: 'Negative scores', points: normalPoints(-4, 5) }, { name: 'Positive scores', points: normalPoints(-4, 5).map((point) => ({ x: point.x, y: normalPdf(point.x - separation) })), color: '#e11d48' }]} markers={[{ x: threshold, label: 'decision cutoff' }]} xLabel="Score" yLabel="Density" summary={`Threshold ${threshold}: true positive rate ${fmt(tpr, 2)}, false positive rate ${fmt(fpr, 2)}`} />
  if (slug === 'ab-testing') chart = <BarChart values={[aRate * 100, bRate * 100]} labels={['A', 'B']} summary={`A conversion rate ${fmt(aRate * 100, 1)} percent and B conversion rate ${fmt(bRate * 100, 1)} percent`} max={100} />
  if (slug === 'diagnostic-testing') chart = <BarChart values={[sensitivity * prevalence * 1000, (1 - specificity) * (1 - prevalence) * 1000, specificity * (1 - prevalence) * 1000, (1 - sensitivity) * prevalence * 1000]} labels={['True +', 'False +', 'True −', 'False −']} summary={`Expected diagnostic outcomes per 1000: true positive ${fmt(sensitivity * prevalence * 1000, 0)}, false positive ${fmt((1 - specificity) * (1 - prevalence) * 1000, 0)}`} />
  return <div className="space-y-4"><div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_300px]"><Card title={slug === 'quality-control-charts' ? 'Process over time' : slug === 'process-capability' ? 'Process versus specification' : slug === 'decision-thresholds' ? 'Two score distributions' : slug === 'ab-testing' ? 'Conversion comparison' : 'Expected results per 1,000 screened'}><p className="mb-2 text-sm text-slate-500">{lab.summary}</p>{chart}</Card><Card title="Decision controls"><div className="space-y-4">{['quality-control-charts', 'process-capability'].includes(slug) && <><Slider label="Process mean" value={mean} min={40} max={60} onChange={setMean} /><Slider label="Process SD" value={sd} min={1} max={8} onChange={setSd} /></>}{slug === 'process-capability' && <Slider label="Tolerance half-width" value={tolerance} min={5} max={20} onChange={setTolerance} />}{slug === 'quality-control-charts' && <Slider label="Special-cause shift at point 25 (SD)" value={separation} min={0} max={5} step={0.1} onChange={setSeparation} />}{slug === 'decision-thresholds' && <Slider label="Decision cutoff" value={threshold} min={-1} max={4} step={0.1} onChange={setThreshold} />}{['decision-thresholds', 'ab-testing'].includes(slug) && <Slider label={slug === 'ab-testing' ? 'Treatment lift (percentage points)' : 'Positive score separation'} value={separation} min={0} max={slug === 'ab-testing' ? 20 : 4} step={0.1} onChange={setSeparation} />}{['ab-testing', 'diagnostic-testing'].includes(slug) && <Slider label={slug === 'ab-testing' ? 'A conversion rate' : 'Condition prevalence'} value={prevalence} min={0.01} max={0.8} step={0.01} onChange={setPrevalence} />}{slug === 'diagnostic-testing' && <><Slider label="Sensitivity" value={sensitivity} min={0.5} max={0.99} step={0.01} onChange={setSensitivity} /><Slider label="Specificity" value={specificity} min={0.5} max={0.99} step={0.01} onChange={setSpecificity} /></>}{slug === 'ab-testing' && <Slider label="Users per arm" value={n} min={50} max={2000} step={50} onChange={setN} />}{slug === 'quality-control-charts' && <Slider label="Random seed" value={seed} min={1} max={100} onChange={setSeed} />}</div></Card></div>
    {slug === 'quality-control-charts' && <div className="grid gap-4 sm:grid-cols-3"><Metric label="Center" value={fmt(mean, 1)} /><Metric label="Control limits" value={`${fmt(mean - 3 * sd, 1)} to ${fmt(mean + 3 * sd, 1)}`} /><Metric label="Beyond limits" value={String(process.filter((point) => Math.abs(point.y - mean) > 3 * sd).length)} /></div>}
    {slug === 'process-capability' && <div className="grid gap-4 sm:grid-cols-3"><Metric label="Cp" value={fmt(cp, 2)} note="Potential capability if centered" /><Metric label="Cpk" value={fmt(cpk, 2)} note="Accounts for off-center mean" /><Metric label="Specification interval" value={`${lsl} to ${usl}`} /></div>}
    {slug === 'decision-thresholds' && <div className="grid gap-4 sm:grid-cols-3"><Metric label="True positive rate" value={fmt(tpr, 3)} /><Metric label="False positive rate" value={fmt(fpr, 3)} /><Metric label="True negative rate" value={fmt(1 - fpr, 3)} /></div>}
    {slug === 'ab-testing' && <div className="grid gap-4 sm:grid-cols-3"><Metric label="B − A conversion" value={`${fmt((bRate - aRate) * 100, 1)} points`} /><Metric label="Approximate p" value={fmtP(abP)} /><Metric label="95% interval" value={`${fmt((bRate - aRate - 1.96 * abSe) * 100, 1)} to ${fmt((bRate - aRate + 1.96 * abSe) * 100, 1)} points`} /></div>}
    {slug === 'diagnostic-testing' && <div className="grid gap-4 sm:grid-cols-3"><Metric label="Positive predictive value" value={`${fmt(ppv * 100, 1)}%`} note="P(condition | positive)" /><Metric label="Negative predictive value" value={`${fmt(npv * 100, 1)}%`} /><Metric label="False positives per 1,000" value={fmt((1 - specificity) * (1 - prevalence) * 1000, 0)} /></div>}
    <Theory {...theory[slug]} />
  </div>
}
