import { Link } from 'react-router-dom'
import { SYLLABUS_HERO_CHAPTER, SYLLABUS_STUDIO_HREF } from '../../lib/learnLinks'
import { getLearnChapter } from '../../lib/learnChapters'
import type { SyllabusModuleKey } from '../../lib/syllabusModules'
import { BayesTreeLab } from './BayesTreeLab'
import { BetaPosteriorLab } from './BetaPosteriorLab'
import { ChanceCoinsLab } from './ChanceCoinsLab'
import { CltMeansLab } from './CltMeansLab'
import { CoverageLab } from './CoverageLab'
import { useReducedMotion } from './useReducedMotion'

export function SyllabusHero({ moduleKey }: { moduleKey: SyllabusModuleKey }) {
  const chapterId = SYLLABUS_HERO_CHAPTER[moduleKey]
  const studioHref = SYLLABUS_STUDIO_HREF[moduleKey]
  const chapter = getLearnChapter(chapterId)
  const reducedMotion = useReducedMotion()

  if (studioHref) {
    return (
      <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
        This syllabus topic is the Distributions studio. Parameter sliders morph the curve; Draw drops samples.
        <Link to={studioHref} className="ml-2 font-bold underline">Open studio</Link>
      </div>
    )
  }

  if (!chapter) return null

  const lab = {
    chance: <ChanceCoinsLab chapter={chapter} reducedMotion={reducedMotion} />,
    compound: <BayesTreeLab chapter={chapter} reducedMotion={reducedMotion} />,
    distributions: <CltMeansLab chapter={chapter} reducedMotion={reducedMotion} />,
    frequentist: <CoverageLab chapter={chapter} reducedMotion={reducedMotion} />,
    bayesian: <BetaPosteriorLab chapter={chapter} reducedMotion={reducedMotion} />,
  }[chapter.id]

  return (
    <div className="mb-6">
      <p className="mb-3 text-sm text-slate-500">
        Same hero as Learn / {chapter.title}. Extra kit numbers stay below.
        <Link to={chapter.href} className="ml-2 font-semibold text-indigo-600 hover:underline">Open chapter</Link>
      </p>
      {lab}
    </div>
  )
}
