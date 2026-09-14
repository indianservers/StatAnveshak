import type { LearnChapterId } from './learnChapters'
import type { SyllabusModuleKey } from './syllabusModules'

export const SYLLABUS_HERO_CHAPTER: Partial<Record<SyllabusModuleKey, LearnChapterId>> = {
  conditional_bayes: 'compound',
  law_large_numbers: 'chance',
  central_limit_theorem: 'distributions',
  bayesian_inference: 'bayesian',
  bootstrap_lab: 'frequentist',
  permutation_tests: 'frequentist',
  resampling_comparison: 'frequentist',
}

export const SYLLABUS_STUDIO_HREF: Partial<Record<SyllabusModuleKey, string>> = {
  distribution_explorer: '/distributions',
  random_variable_simulator: '/distributions',
}
