import { describe, expect, it } from 'vitest'
import { ANALYSIS_CATALOG } from '../catalog'
import { circularStats } from '../engines/frequentist/circular'
import { exponentialMle, kaplanMeier } from '../engines/frequentist/survival'
import { adfTest } from '../engines/frequentist/timeSeries'
import { runAnalysis } from '../runAnalysis'
import { PHASE8_IMPLEMENTED } from './implemented'

describe('phase 5 survival', () => {
  it('matches KM and exponential MLE on 1,2,3 (all events)', () => {
    const sample = [1, 2, 3].map((time) => ({ time, event: 1, group: 'All', x: [] }))
    const km = kaplanMeier(sample)
    expect(km[0].survival).toBeCloseTo(2 / 3, 10)
    expect(km[1].survival).toBeCloseTo(1 / 3, 10)
    expect(km[2].survival).toBeCloseTo(0, 10)
    expect(exponentialMle(sample)).toBeCloseTo(0.5, 10)
    const rows = [1, 2, 3, 4].map((t) => ({ t, e: 1 }))
    const result = runAnalysis('survival.parametric', rows, { time: 't', event: 'e', survFamily: 'exponential' })
    expect(Number(result.tables[0].rows[0][1])).toBeCloseTo(0.4, 8)
  })
})

describe('phase 5 circular', () => {
  it('gives R = 1 when every angle is 0', () => {
    const s = circularStats([0, 0, 0, 0, 0])
    expect(s.R).toBeCloseTo(1, 10)
    expect(s.mu).toBeCloseTo(0, 10)
    const rows = [0, 0, 0, 0, 0, 0].map((a) => ({ a }))
    const result = runAnalysis('circular.descriptives', rows, { variable: 'a', angleUnit: 'radians' })
    expect(Number(result.tables[0].rows[0][2])).toBeCloseTo(1, 8)
  })
})

describe('phase 5 mixed / time / process', () => {
  it('reports a large ICC when two clusters sit far apart', () => {
    const rows = [
      ...[10, 10.1, 9.9, 10.2, 9.8].map((y) => ({ y, g: 'A' })),
      ...[20, 20.1, 19.9, 20.2, 19.8].map((y) => ({ y, g: 'B' })),
    ]
    const result = runAnalysis('mixed.lmm', rows, { dependent: 'y', cluster: 'g', covariates: [] })
    const icc = Number(result.tables.find((t) => t.id === 'vc')?.rows[1][2])
    expect(icc).toBeGreaterThan(0.8)
  })

  it('gives a less negative ADF on a random walk than on white noise', () => {
    const noise = [0.2, -0.1, 0.3, -0.2, 0.1, 0, -0.15, 0.25, -0.05, 0.1, -0.2, 0.15, 0, 0.05, -0.1, 0.2]
    let acc = 0
    const walk = noise.map((e) => { acc += e; return acc })
    expect(adfTest(walk, 0).stat).toBeGreaterThan(adfTest(noise, 0).stat)
  })

  it('recovers the a-path when M = X', () => {
    const rows = Array.from({ length: 20 }, (_, i) => {
      const x = i + 1
      const m = x + 0.15 * Math.sin(i)
      return { x, m, y: 2 * m }
    })
    const result = runAnalysis('process.model', rows, { processModel: '4', x: 'x', m: 'm', y: 'y' })
    const a = Number(result.tables.find((t) => t.id === 'a')?.rows[1][1])
    expect(a).toBeCloseTo(1, 1)
  })
})

describe('analysis catalog phase 5', () => {
  it('marks Phase 5 engines implemented without duplicating IDs', () => {
    const implemented = ANALYSIS_CATALOG.filter((item) => item.implemented).map((item) => item.id).sort()
    expect(implemented).toEqual(PHASE8_IMPLEMENTED)
    expect(new Set(ANALYSIS_CATALOG.map((item) => item.id)).size).toBe(ANALYSIS_CATALOG.length)
    expect(new Set(ANALYSIS_CATALOG.map((item) => item.module)).size).toBe(35)
  })
})
