import type { Distribution } from './distributions'
import { requirePositiveInteger, requirePositiveNumber, requireProbability } from './statEngine'

export type DistributionParamErrors = Record<string, string>

export function validateDistributionParams(dist: Distribution, params: Record<string, number>): {
  ok: boolean
  errors: DistributionParamErrors
} {
  const errors: DistributionParamErrors = {}
  const value = (key: string) => params[key]

  const put = (key: string, message: string | null) => {
    if (message) errors[key] = message
  }

  for (const param of dist.params) {
    const raw = value(param.key)
    if (!Number.isFinite(raw)) {
      errors[param.key] = `${param.label} must be a finite number.`
    }
  }

  switch (dist.id) {
    case 'normal':
    case 'lognormal':
    case 'skew_normal':
      put('sigma', requirePositiveNumber(value('sigma'), 'Standard deviation (σ)'))
      break
    case 'binomial':
    case 'negative_binomial':
      put('n', requirePositiveInteger(value('n'), 'Number of trials (n)'))
      put('p', requireProbability(value('p'), 'Success probability (p)'))
      break
    case 'bernoulli':
    case 'geometric':
      put('p', requireProbability(value('p'), 'Success probability (p)'))
      break
    case 'poisson':
      put('lambda', requirePositiveNumber(value('lambda'), 'Rate (λ)'))
      break
    case 'continuous_uniform':
    case 'discrete_uniform':
      if (Number.isFinite(value('a')) && Number.isFinite(value('b')) && !(value('a')! < value('b')!)) {
        errors.b = 'The upper bound b must be greater than the lower bound a.'
      }
      break
    case 'exponential':
      put('lambda', requirePositiveNumber(value('lambda'), 'Rate (λ)'))
      break
    case 'gamma':
    case 'weibull':
    case 'inverse_gaussian':
      put('shape', requirePositiveNumber(value('shape'), 'Shape'))
      put('scale', requirePositiveNumber(value('scale'), 'Scale'))
      break
    case 'beta':
    case 'stretched_beta':
      put('alpha', requirePositiveNumber(value('alpha'), 'α'))
      put('beta', requirePositiveNumber(value('beta'), 'β'))
      break
    case 'student_t':
    case 'chi_square':
      put('df', requirePositiveNumber(value('df'), 'Degrees of freedom'))
      break
    case 'f':
      put('df1', requirePositiveNumber(value('df1'), 'Numerator degrees of freedom'))
      put('df2', requirePositiveNumber(value('df2'), 'Denominator degrees of freedom'))
      break
    default:
      for (const param of dist.params) {
        if (param.min > 0 && Number.isFinite(value(param.key)) && value(param.key)! <= 0) {
          put(param.key, `${param.label} must be greater than 0.`)
        }
      }
  }

  return { ok: Object.keys(errors).length === 0, errors }
}
