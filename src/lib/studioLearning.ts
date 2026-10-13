import type { SpecificGuide } from './guides/guideTypes'
export type LearningLab = { id: string; title: string; level: 'intro' | 'core' | 'advanced'; href: string; concepts: string[]; guide: SpecificGuide }
export type LabLearning = { favorite: boolean; completed: boolean; notes: string; checks: boolean[]; quizPassed: boolean }
export type StudioLearning = { version: 1; studio: string; lastLab: string; labs: Record<string, LabLearning> }
export const emptyLabLearning = (): LabLearning => ({ favorite: false, completed: false, notes: '', checks: [false, false, false], quizPassed: false })
export function parseStudioLearning(value: unknown, studio: string, ids: string[]): StudioLearning {
  if (!value || typeof value !== 'object') throw new Error('Choose a valid learning-progress JSON file.')
  const v = value as Partial<StudioLearning>
  if (v.version !== 1 || v.studio !== studio || !v.labs || typeof v.labs !== 'object' || Array.isArray(v.labs)) throw new Error('This progress file belongs to another studio or uses an unsupported format.')
  const labs: Record<string, LabLearning> = {}
  for (const id of ids) {
    const item = v.labs[id]
    if (!item) continue
    if (typeof item.notes !== 'string' || item.notes.length > 3000 || typeof item.favorite !== 'boolean' || typeof item.completed !== 'boolean' || typeof item.quizPassed !== 'boolean' || !Array.isArray(item.checks) || item.checks.length !== 3 || item.checks.some(x => typeof x !== 'boolean')) throw new Error(`Invalid progress for ${id}.`)
    labs[id] = { favorite: item.favorite, completed: item.completed, notes: item.notes, checks: [...item.checks], quizPassed: item.quizPassed }
  }
  return { version: 1, studio, lastLab: ids.includes(v.lastLab ?? '') ? v.lastLab! : ids[0], labs }
}
export function initialStudioLearning(studio: string, ids: string[]): StudioLearning { return { version: 1, studio, lastLab: ids[0], labs: {} } }
export function filterLearningLabs(labs: LearningLab[], progress: StudioLearning, search: string, level: string, favorites: boolean) {
  return labs.filter(l => (level === 'all' || l.level === level) && (!favorites || progress.labs[l.id]?.favorite) && `${l.title} ${l.concepts.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()))
}
export function quizChoices(labs: LearningLab[], selected: LearningLab) {
  // The answer and distractors are named, authored method descriptions from this studio.
  return [selected, ...labs.filter(l => l.id !== selected.id && l.guide.interpretation !== selected.guide.interpretation).slice(0, 2)].sort((a, b) => a.title.localeCompare(b.title)).map(l => ({ id: l.id, text: l.guide.interpretation }))
}
