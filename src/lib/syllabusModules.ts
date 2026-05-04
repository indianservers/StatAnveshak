export type SyllabusModuleKey = 'sample_spaces' | 'conditional_bayes' | 'counting'

export type SyllabusModule = {
  key: SyllabusModuleKey
  title: string
  group: 'Probability Foundations'
  syllabusTags: string[]
  purpose: string
}

export const SYLLABUS_MODULES: SyllabusModule[] = [
  {
    key: 'sample_spaces',
    title: 'Sample Spaces & Events',
    group: 'Probability Foundations',
    syllabusTags: ['UG probability', 'events', 'set operations'],
    purpose: 'Build sample spaces and compute event complements, unions, intersections, and probabilities.',
  },
  {
    key: 'conditional_bayes',
    title: 'Conditional Probability & Bayes Theorem',
    group: 'Probability Foundations',
    syllabusTags: ['UG probability', 'conditional probability', 'Bayes theorem'],
    purpose: 'Compute P(A|B), P(B|A), total probability, and Bayes posterior from entered probabilities.',
  },
  {
    key: 'counting',
    title: 'Counting Techniques',
    group: 'Probability Foundations',
    syllabusTags: ['permutations', 'combinations', 'multinomial'],
    purpose: 'Teach permutations, combinations, arrangements with repetition, and multinomial counts.',
  },
]

export const SYLLABUS_MODULE_BY_KEY = Object.fromEntries(SYLLABUS_MODULES.map((module) => [module.key, module])) as Record<SyllabusModuleKey, SyllabusModule>
