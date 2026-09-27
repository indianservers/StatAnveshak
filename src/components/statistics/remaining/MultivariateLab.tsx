import { useState } from 'react'
import type { StudioLab } from '../../../lib/statisticsStudios'
import { average, chiInv } from '../../../lib/remainingLabMath'
import { BarChart, Card, Metric, ScatterChart, Slider, Theory } from './shared'
import { fmt } from './format'

const theory: Record<string, { intuition: string; formula: string; assumptions: string; caution: string }> = {
  'mean-vector-covariance-matrix': { intuition: 'A vector locates the cloud center; covariance records how each pair moves together.', formula: 'μ̂ = (x̄, ȳ); Sⱼₖ = Σ(xᵢⱼ−x̄ⱼ)(xᵢₖ−x̄ₖ)/(n−1)', assumptions: 'Numeric paired observations from independent units.', caution: 'Covariance depends on measurement units; a large number is not automatically a strong association.' },
  'correlation-matrix': { intuition: 'Dividing covariance by both standard deviations puts pairwise association on −1 to 1.', formula: 'rⱼₖ = Sⱼₖ/(sⱼsₖ)', assumptions: 'Paired numeric observations; inspect scatterplots for nonlinear patterns and outliers.', caution: 'A correlation matrix summarizes linear association, not causation.' },
  'bivariate-normal': { intuition: 'Correlation rotates elliptical density contours while marginal spreads set their width.', formula: 'f(x) ∝ exp[−½(x−μ)ᵀΣ⁻¹(x−μ)]', assumptions: 'A joint normal model is a plausible approximation to the paired data.', caution: 'An ellipse does not prove bivariate normality; inspect tails and unusual points.' },
  'mahalanobis-distance': { intuition: 'A point far along a naturally wide direction is less surprising than the same Euclidean distance across a narrow direction.', formula: 'D² = (x−μ)ᵀΣ⁻¹(x−μ)', assumptions: 'Invertible covariance estimate and a useful elliptical reference model.', caution: 'Estimated distances can be distorted by outliers; robust covariance may be needed.' },
  'confidence-ellipse': { intuition: 'An ellipse summarizes joint uncertainty in a two-dimensional mean estimate.', formula: '(μ−x̄)ᵀ(S/n)⁻¹(μ−x̄) ≤ χ²₂,confidence', assumptions: 'Independent observations and a multivariate normal or large-sample approximation.', caution: 'A confidence ellipse for the mean is much smaller than a data cloud ellipse; it describes a different target.' },
  'multivariate-outliers': { intuition: 'A point can be unremarkable on each axis but unusual relative to the tilted cloud.', formula: 'flag if D² > χ²₂,cutoff', assumptions: 'A reasonable covariance reference and a prechosen flagging threshold.', caution: 'A flag is a review prompt, not proof of bad data. Multiple screening also raises false-alarm risk.' },
  'principal-component-analysis': { intuition: 'Principal components rotate the axes to directions of greatest and least variance.', formula: 'S vⱼ = λⱼvⱼ; explained share = λⱼ/Σλ', assumptions: 'Numeric variables on a sensible scale; standardize first when units differ greatly.', caution: 'Components maximize variance, not prediction or causal meaning.' },
  'eigenvalues-eigenvectors': { intuition: 'Eigenvectors give the cloud’s principal directions; eigenvalues give variance along them.', formula: 'S v = λv', assumptions: 'A symmetric covariance matrix has orthogonal eigenvectors and nonnegative eigenvalues.', caution: 'Direction signs are arbitrary: v and −v describe the same axis.' },
}

const xBase = [-2.3, -1.9, -1.4, -1.1, -0.8, -0.5, -0.2, 0.1, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1]
const noise = [0.7, -0.5, 0.4, -0.7, 0.5, -0.2, 0.8, -0.4, 0.2, -0.6, 0.5, -0.4, 0.6, -0.3, 0.1]

export function MultivariateLab({ lab }: { lab: StudioLab }) {
  const [rho, setRho] = useState(0.65)
  const [spread, setSpread] = useState(1)
  const [outlier, setOutlier] = useState(false)
  const [confidence, setConfidence] = useState(95)
  const [selected, setSelected] = useState(7)
  const points = xBase.map((value, index) => ({ x: value * spread, y: rho * value * spread + Math.sqrt(1 - rho * rho) * noise[index] * spread + (outlier && index === 14 ? 2 : 0), label: `Observation ${index + 1}` }))
  const mx = average(points.map((point) => point.x))
  const my = average(points.map((point) => point.y))
  const covXX = points.reduce((sum, point) => sum + (point.x - mx) ** 2, 0) / (points.length - 1)
  const covYY = points.reduce((sum, point) => sum + (point.y - my) ** 2, 0) / (points.length - 1)
  const covXY = points.reduce((sum, point) => sum + (point.x - mx) * (point.y - my), 0) / (points.length - 1)
  const corr = covXY / Math.sqrt(covXX * covYY)
  const trace = covXX + covYY
  const gap = Math.sqrt((covXX - covYY) ** 2 + 4 * covXY ** 2)
  const eigen1 = (trace + gap) / 2
  const eigen2 = (trace - gap) / 2
  const angle = 0.5 * Math.atan2(2 * covXY, covXX - covYY)
  const determinant = covXX * covYY - covXY ** 2
  const point = points[selected]
  const dx = point.x - mx
  const dy = point.y - my
  const d2 = determinant > 1e-9 ? (covYY * dx * dx - 2 * covXY * dx * dy + covXX * dy * dy) / determinant : 0
  const cutoff = chiInv(confidence / 100, 2)
  const isMeanEllipse = lab.slug === 'confidence-ellipse'
  const radiusScale = Math.sqrt(cutoff / (isMeanEllipse ? points.length : 1))
  const ellipse = { cx: mx, cy: my, rx: radiusScale * Math.sqrt(eigen1), ry: radiusScale * Math.sqrt(eigen2), angle: angle * 180 / Math.PI }
  const axes = ['principal-component-analysis', 'eigenvalues-eigenvectors'].includes(lab.slug) ? [{ x2: 2 * Math.cos(angle), y2: 2 * Math.sin(angle), color: '#e11d48', label: 'PC1' }, { x2: -1.3 * Math.sin(angle), y2: 1.3 * Math.cos(angle), color: '#16a34a', label: 'PC2' }] : []
  return <div className="space-y-4"><div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_300px]"><Card title={lab.slug === 'confidence-ellipse' ? 'Joint mean confidence region' : 'Two-variable cloud'}><p className="mb-2 text-sm text-slate-500">Click a point to inspect it. Move correlation to rotate the cloud, or add an unusual observation.</p><ScatterChart points={points} ellipse={ellipse} axes={axes} selected={selected} onSelect={setSelected} summary={`${points.length} paired observations, sample correlation ${fmt(corr)}, selected Mahalanobis squared distance ${fmt(d2)}`} /><p className="text-xs text-slate-500">Purple ellipse: {isMeanEllipse ? 'joint confidence region for the mean' : 'covariance-scaled data contour'} at {confidence}% reference level.</p></Card><Card title="Experiment controls"><div className="space-y-4"><Slider label="Correlation pattern" value={rho} min={-0.9} max={0.9} step={0.05} onChange={setRho} /><Slider label="Scale of both variables" value={spread} min={0.5} max={1.5} step={0.1} onChange={setSpread} /><Slider label="Ellipse / flag level" value={confidence} min={80} max={99} onChange={setConfidence} suffix="%" /><label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" checked={outlier} onChange={(event) => { setOutlier(event.target.checked); setSelected(event.target.checked ? 14 : 7) }} className="accent-indigo-600" /> Add unusual final point</label></div></Card></div>
    <div className="grid gap-4 sm:grid-cols-3"><Metric label="Sample correlation" value={fmt(corr, 3)} /><Metric label={['principal-component-analysis', 'eigenvalues-eigenvectors'].includes(lab.slug) ? 'PC1 explained share' : 'Covariance xy'} value={['principal-component-analysis', 'eigenvalues-eigenvectors'].includes(lab.slug) ? `${fmt(100 * eigen1 / trace, 1)}%` : fmt(covXY, 3)} /><Metric label="Selected point D²" value={fmt(d2, 2)} note={`Cutoff ${fmt(cutoff, 2)} · ${d2 > cutoff ? 'flag for review' : 'inside contour'}`} /></div>
    {lab.slug === 'correlation-matrix' || lab.slug === 'mean-vector-covariance-matrix' ? <Card title={lab.slug === 'correlation-matrix' ? 'Correlation matrix' : 'Mean vector and covariance matrix'}><div className="grid max-w-md grid-cols-3 gap-2 text-center text-sm"><span /><strong>X</strong><strong>Y</strong><strong>X</strong><span className="rounded bg-indigo-50 p-2 dark:bg-indigo-950">{fmt(lab.slug === 'correlation-matrix' ? 1 : covXX, 2)}</span><span className="rounded bg-violet-100 p-2 dark:bg-violet-950">{fmt(lab.slug === 'correlation-matrix' ? corr : covXY, 2)}</span><strong>Y</strong><span className="rounded bg-violet-100 p-2 dark:bg-violet-950">{fmt(lab.slug === 'correlation-matrix' ? corr : covXY, 2)}</span><span className="rounded bg-indigo-50 p-2 dark:bg-indigo-950">{fmt(lab.slug === 'correlation-matrix' ? 1 : covYY, 2)}</span></div><p className="mt-3 text-sm text-slate-500">Mean vector = ({fmt(mx, 2)}, {fmt(my, 2)}). Symmetry means XY and YX match.</p></Card> : null}
    {['principal-component-analysis', 'eigenvalues-eigenvectors'].includes(lab.slug) && <Card title="Variance along rotated axes"><BarChart values={[eigen1, eigen2]} labels={['PC1', 'PC2']} summary={`First eigenvalue ${fmt(eigen1)}, second ${fmt(eigen2)}`} /><p className="text-sm text-slate-500">PC1 angle {fmt(angle * 180 / Math.PI, 1)}°. Orthogonal PC2 carries the remaining variance.</p></Card>}
    <Theory {...theory[lab.slug]} />
  </div>
}
