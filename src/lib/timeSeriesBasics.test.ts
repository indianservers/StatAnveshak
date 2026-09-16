import { describe, expect, it } from 'vitest'
import {
  ARIMA_PRESETS,
  TS_NEXT_STUDIO_SLUG,
  TS_STUDIO,
  TS_STUDIO_SLUG,
  WORKED,
  ar1Series,
  arPhiStatus,
  chronological,
  difference,
  generatePreset,
  ma1Series,
  maxAcfLag,
  movingAverage,
  randomWalk,
  sampleAcf,
  samplePacf,
  seasonalFactors,
  shockDecay,
  shuffleValues,
  simulateArima,
  valuesOf,
  whiteNoise,
} from './timeSeriesBasics'

describe('time series basics catalog', () => {
  it('uses the canonical studio slug and nine labs', () => {
    expect(TS_STUDIO_SLUG).toBe('time-series-basics')
    expect(TS_STUDIO.slug).toBe('time-series-basics')
    expect(TS_STUDIO.labs.map((lab) => lab.slug)).toEqual([
      'time-plot',
      'trend',
      'seasonality',
      'moving-average',
      'autocorrelation',
      'acf-pacf',
      'stationarity',
      'white-noise-random-walk',
      'ar-ma-arima-intuition',
    ])
    expect(TS_NEXT_STUDIO_SLUG).toBe('nonparametric-statistics')
  })
})

describe('ordering and presets', () => {
  it('keeps chronological order by t and shuffles only values', () => {
    const series = generatePreset('linear-up', 12, 3)
    const mixed = [...series].reverse()
    const ordered = chronological(mixed)
    expect(ordered.map((row) => row.t)).toEqual(series.map((row) => row.t))
    const shuffled = shuffleValues(series, 11)
    expect(shuffled.map((row) => row.t)).toEqual(series.map((row) => row.t))
    expect(shuffled.map((row) => row.label)).toEqual(series.map((row) => row.label))
    expect(valuesOf(shuffled).slice().sort((a, b) => a - b)).toEqual(valuesOf(series).slice().sort((a, b) => a - b))
    expect(valuesOf(shuffled)).not.toEqual(valuesOf(series))
  })

  it('seeds presets so the same inputs repeat', () => {
    const a = valuesOf(generatePreset('ar1', 40, 19, { phi: 0.6 }))
    const b = valuesOf(generatePreset('ar1', 40, 19, { phi: 0.6 }))
    expect(a).toEqual(b)
  })
})

describe('sample ACF and PACF', () => {
  it('returns undefined ACF when variance is zero and does not pad extra lags', () => {
    const flat = sampleAcf([4, 4, 4, 4], 8)
    expect(flat.defined).toBe(false)
    expect(flat.lags).toEqual([0, 1, 2, 3])
    expect(flat.values.every((value) => value === undefined)).toBe(true)
    expect(maxAcfLag(5, 20)).toBe(4)
  })

  it('uses the sample ACF convention with lag-0 equal to 1', () => {
    const values = [1, 2, 3, 2, 1, 2, 3]
    const acf = sampleAcf(values, 3)
    expect(acf.values[0]).toBeCloseTo(1, 12)
    const mu = values.reduce((s, v) => s + v, 0) / values.length
    const denom = values.reduce((s, v) => s + (v - mu) ** 2, 0)
    let num = 0
    for (let i = 1; i < values.length; i++) num += (values[i]! - mu) * (values[i - 1]! - mu)
    expect(acf.values[1]).toBeCloseTo(num / denom, 12)
    expect(acf.band).toBeCloseTo(1.96 / Math.sqrt(values.length), 12)
  })

  it('computes PACF via Durbin–Levinson, not a copy of ACF', () => {
    const innovations = whiteNoise(200, 4)
    const ar = ar1Series(innovations, 0.7)
    const acf = sampleAcf(ar, 8)
    const pacf = samplePacf(acf)
    expect(pacf.values[1]).toBeCloseTo(acf.values[1]!, 8)
    expect(Math.abs((pacf.values[2] ?? 0))).toBeLessThan(0.2)
    expect(Math.abs((acf.values[2] ?? 0))).toBeGreaterThan(Math.abs((pacf.values[2] ?? 0)))
  })
})

describe('moving average smoother', () => {
  it('uses a trailing window and leaves the first k-1 edges undefined', () => {
    const result = movingAverage([10, 20, 30, 40], 3, 'trailing')
    expect(result.smoothed[0]).toBeUndefined()
    expect(result.smoothed[1]).toBeUndefined()
    expect(result.smoothed[2]).toBeCloseTo(20, 12)
    expect(result.smoothed[3]).toBeCloseTo(30, 12)
    expect(result.edgeIndexes).toEqual([0, 1])
  })

  it('uses a centered odd window and matches the worked May average', () => {
    expect(WORKED.maMay).toBeCloseTo(133.333, 3)
    const result = movingAverage([120, 150, 130], 3, 'centered')
    expect(result.smoothed[1]).toBeCloseTo(WORKED.maMay, 12)
    expect(result.smoothed[0]).toBeUndefined()
    expect(result.smoothed[2]).toBeUndefined()
  })
})

describe('seasonality and differencing', () => {
  it('deseasonalizes additively as Y − S and multiplicatively as Y / S', () => {
    const values = [10, 20, 10, 20]
    const add = seasonalFactors(values, 2, 'additive')
    expect(add.indexes[0]).toBeCloseTo(-5, 12)
    expect(add.deseasonalized[0]).toBeCloseTo(15, 12)
    const mult = seasonalFactors(values, 2, 'multiplicative')
    expect(mult.indexes[1]).toBeCloseTo(20 / 15, 12)
    expect(mult.deseasonalized[1]).toBeCloseTo(15, 12)
  })

  it('differences as ΔY_t = Y_t − Y_{t−1} and warns when d is unnecessary', () => {
    const first = difference([5, 8, 6, 11], 1)
    expect(first.values).toEqual([3, -2, 5])
    const second = difference([5, 8, 6, 11], 2)
    expect(second.values).toEqual([-5, 7])
    const noise = difference(valuesOf(generatePreset('noise', 80, 2)), 1)
    expect(noise.unnecessary).toBe(true)
    expect(noise.warning).toMatch(/unnecessary/i)
  })
})

describe('white noise, random walk, AR, MA', () => {
  it('builds a random walk from the same innovations as white noise', () => {
    const eps = [1, -1, 2, 0.5]
    expect(randomWalk(eps, 0, 0)).toEqual([1, 0, 2, 2.5])
    expect(randomWalk(eps, 0.5, 0)).toEqual([1.5, 1, 3.5, 4.5])
  })

  it('labels AR(1) stationarity by |φ| and decays a shock by φ^k', () => {
    expect(arPhiStatus(0.8)).toBe('stationary')
    expect(arPhiStatus(-0.4)).toBe('stationary')
    expect(arPhiStatus(1)).toBe('unit-root')
    expect(arPhiStatus(1.2)).toBe('explosive')
    expect(shockDecay(0.5, 3)).toEqual([1, 0.5, 0.25, 0.125])
  })

  it('gives MA(1) finite shock memory of one lag', () => {
    const eps = [0, 0, 4, 0, 0]
    const series = ma1Series(eps, 0.5, 0)
    expect(series).toEqual([0, 0, 4, 2, 0])
  })

  it('exposes the five ARIMA teaching presets', () => {
    expect(ARIMA_PRESETS.map((item) => `${item.spec.p},${item.spec.d},${item.spec.q}`)).toEqual([
      '1,0,0',
      '0,0,1',
      '0,1,0',
      '1,1,0',
      '0,1,1',
    ])
    const { series } = simulateArima(40, { p: 1, d: 0, q: 0 }, 8, { phi: [0.6] })
    expect(series).toHaveLength(40)
  })
})
