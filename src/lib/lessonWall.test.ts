import { beforeEach, describe, expect, it } from 'vitest'
import { addSavedStage, persistSavedStages, type SavedStage } from './lessonWall'

const memory: Record<string, string> = {}
beforeEach(() => {
  Object.keys(memory).forEach((key) => delete memory[key])
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => memory[key] ?? null,
      setItem: (key: string, value: string) => {
        memory[key] = value
      },
      removeItem: (key: string) => {
        delete memory[key]
      },
    },
  })
})

function fake(id: string): SavedStage {
  return {
    id,
    href: '/learn/distributions',
    title: 'CLT',
    intuition: 'Means pile up.',
    formula: 'CLT',
    misuse: 'Not the data.',
    readout: 'n=5',
    pngDataUrl: 'data:image/png;base64,xx',
    savedAt: '2026-09-15',
  }
}

describe('lesson wall', () => {
  it('pins newest first and caps at 8', () => {
    const stages = Array.from({ length: 9 }, (_, index) => fake(`s${index}`))
    const stored = persistSavedStages(stages)
    expect(stored).toHaveLength(8)
    const next = addSavedStage(fake('new'), stored)
    expect(next[0]?.id).toBe('new')
  })
})
