import type { Distribution } from '../../../lib/distributions'
import { validateDistributionParams } from '../../../lib/distributionValidation'

const LABELS: Record<string, string> = {
  p: 'Success probability (p)',
  n: 'Number of trials (n)',
  lambda: 'Event rate (λ)',
  N: 'Population size (N)',
  K: 'Number of defectives (K)',
  a: 'Lower bound a',
  b: 'Upper bound b',
  mu: 'Mean / location (μ)',
  sigma: 'Standard deviation (σ)',
  alpha: 'α',
  beta: 'β',
  df: 'Degrees of freedom (ν)',
  df1: 'Numerator df',
  df2: 'Denominator df',
  r: 'Target successes (r)',
  shape: 'Shape k',
  scale: 'Scale',
  pi: 'Structural-zero π',
  xm: 'Minimum xm',
  x0: 'Location x₀',
  gamma: 'Scale γ',
  s: 'Scale s',
  xi: 'Location ξ',
  omega: 'Scale ω',
  mu1: 'Mean 1',
  mu2: 'Mean 2',
  p1: 'p₁',
  p2: 'p₂',
  a1: 'α₁',
  a2: 'α₂',
  a3: 'α₃',
}

export function ParameterControls({
  dist,
  params,
  onParam,
}: {
  dist: Distribution
  params: Record<string, number>
  onParam: (key: string, value: number) => void
}) {
  if (!dist.params.length) {
    return <p className="text-xs text-slate-500">This family has no free parameters — the lab uses local controls instead.</p>
  }
  const errors = validateDistributionParams(dist, params).errors
  return (
    <div className="space-y-4">
      {dist.params.map((param) => {
        const value = params[param.key] ?? param.default
        const error = errors[param.key]
        return (
          <label key={param.key} className="block">
            <span className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
              {LABELS[param.key] ?? param.label}
              <input
                type="number"
                className={`w-20 rounded-lg border bg-white px-2 py-1 text-right text-sm font-bold dark:bg-slate-950 ${error ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-slate-700'}`}
                value={Number.isFinite(value) ? value : ''}
                min={param.min}
                max={param.max}
                step={param.step}
                onChange={(event) => onParam(param.key, Number(event.target.value))}
              />
            </span>
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step}
              value={Number.isFinite(value) ? Math.min(param.max, Math.max(param.min, value)) : param.default}
              onChange={(event) => onParam(param.key, Number(event.target.value))}
              className="w-full accent-indigo-600"
            />
            {error ? <span className="mt-1 block text-xs font-normal text-rose-600">{error}</span> : null}
          </label>
        )
      })}
    </div>
  )
}
