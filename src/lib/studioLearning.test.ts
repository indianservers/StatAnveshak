import { expect, it } from 'vitest'
import { STATISTICS_STUDIOS, labPath } from './statisticsStudios'
import { studioLabGuide } from './guides/studioGuides'
import { emptyLabLearning, filterLearningLabs, initialStudioLearning, parseStudioLearning, quizChoices } from './studioLearning'
const studio = STATISTICS_STUDIOS[0]
const labs = studio.labs.map(l => ({ id: l.slug, title: l.title, level: l.level, concepts: l.concepts, href: labPath(studio.slug, l.slug), guide: studioLabGuide(studio.slug, l.slug)! }))
it('roundtrips notes, favorites, checks, and progress without sharing studios', () => {
  const progress = initialStudioLearning(studio.slug, labs.map(l => l.id))
  progress.labs[labs[0].id] = { ...emptyLabLearning(), notes: 'Independent events multiply probabilities.', favorite: true, checks: [true, false, true], completed: true, quizPassed: true }
  expect(parseStudioLearning(JSON.parse(JSON.stringify(progress)), studio.slug, labs.map(l => l.id))).toEqual(progress)
  expect(() => parseStudioLearning(progress, 'regression', ['x'])).toThrow('another studio')
})
it('rejects malformed notes and checks rather than overwriting valid progress', () => {
  const progress = initialStudioLearning(studio.slug, labs.map(l => l.id))
  progress.labs[labs[0].id] = { ...emptyLabLearning(), checks: [true] }
  expect(() => parseStudioLearning(progress, studio.slug, labs.map(l => l.id))).toThrow('Invalid progress')
  progress.labs[labs[0].id] = { ...emptyLabLearning(), notes: 'x'.repeat(3001) }
  expect(() => parseStudioLearning(progress, studio.slug, labs.map(l => l.id))).toThrow('Invalid progress')
})
it('searches concepts and intersects difficulty with favorites', () => {
  const progress = initialStudioLearning(studio.slug, labs.map(l => l.id))
  const lab = labs.find(l => l.id === 'bayes-theorem')!
  progress.labs[lab.id] = { ...emptyLabLearning(), favorite: true }
  expect(filterLearningLabs(labs, progress, 'Bayes', lab.level, true).map(l => l.id)).toEqual([lab.id])
  expect(filterLearningLabs(labs, progress, 'not a method', 'all', false)).toEqual([])
})
for (const other of STATISTICS_STUDIOS.filter(s => s.slug !== 'anova')) it(`${other.slug} quizzes use distinct method interpretations`, () => {
  const entries = other.labs.map(l => ({ id: l.slug, title: l.title, level: l.level, concepts: l.concepts, href: labPath(other.slug, l.slug), guide: studioLabGuide(other.slug, l.slug)! }))
  for (const lab of entries) {
    const choices = quizChoices(entries, lab)
    expect(choices.filter(c => c.id === lab.id)).toHaveLength(1)
    expect(choices.find(c => c.id === lab.id)!.text).toBe(lab.guide.interpretation)
    expect(choices.length).toBeGreaterThan(1)
  }
})
