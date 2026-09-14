import { describe, expect, it } from 'vitest'
import { captionLines, plainFormula } from './stageExport'

describe('stage export captions', () => {
  it('flattens KaTeX into a one-line formula', () => {
    expect(plainFormula('P(A\\mid B) = \\frac{P(B\\mid A)P(A)}{P(B)}')).toContain('P(A| B)')
    expect(plainFormula('\\bar{X}_n \\xrightarrow{d} N(\\mu,\\,\\sigma^2/n)')).toContain('X-bar')
  })

  it('keeps the three teaching lines', () => {
    const lines = captionLines({
      title: 'Chance',
      intuition: 'A rate, not a promise.',
      formula: 'E[X] = p',
      readout: '40 flips',
      misuse: 'Luck does not repay a streak.',
    })
    expect(lines.intuition).toBe('A rate, not a promise.')
    expect(lines.caveat).toContain('streak')
    expect(lines.readout).toBe('40 flips')
  })
})
