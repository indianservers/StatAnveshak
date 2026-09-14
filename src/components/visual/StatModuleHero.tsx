import { Link } from 'react-router-dom'
import { getLearnChapter } from '../../lib/learnChapters'
import { STAT_MODULE_HERO, STAT_MODULE_PRESET_HREF } from '../../lib/statModulePresets'
import { BetaPosteriorLab } from './BetaPosteriorLab'
import { CoverageLab } from './CoverageLab'
import { OlsSquaresLab } from './OlsSquaresLab'
import { SamplingMachine } from './SamplingMachine'
import { TeachingDatasetChip } from './TeachingDatasetChip'
import { useReducedMotion } from './useReducedMotion'

export function StatModuleHero({
  moduleKey,
  values,
  column,
}: {
  moduleKey: string
  values: number[]
  column: string
}) {
  const reducedMotion = useReducedMotion()
  const presetHref = STAT_MODULE_PRESET_HREF[moduleKey]
  const hero = STAT_MODULE_HERO[moduleKey]
  const chapter = getLearnChapter(hero === 'sampling' ? 'frequentist' : hero)

  if (presetHref) {
    return (
      <p className="mb-3 text-sm text-slate-500">
        This module is a preset of the shared chart stage.
        <Link to={presetHref} className="ml-2 font-semibold text-indigo-600 hover:underline">Open preset</Link>
      </p>
    )
  }

  if (hero === 'sampling' && values.length >= 8) {
    return (
      <div className="mb-4">
        <p className="mb-2 text-sm text-slate-500">Picture default: sampling distribution of the mean for the selected column.</p>
        <SamplingMachine values={values} column={column || 'sample'} reducedMotion={reducedMotion} />
      </div>
    )
  }

  if (!chapter) return null

  const lab = {
    frequentist: <CoverageLab chapter={chapter} reducedMotion={reducedMotion} />,
    bayesian: <BetaPosteriorLab chapter={chapter} reducedMotion={reducedMotion} />,
    regression: <OlsSquaresLab chapter={chapter} reducedMotion={reducedMotion} />,
  }[chapter.id]

  if (!lab) return null

  return (
    <div className="mb-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
        <span>Picture default: the matching Learn hero, wired as a module preset.</span>
        <span className="flex items-center gap-2">
          <TeachingDatasetChip compact />
          <Link to={chapter.href} className="font-semibold text-indigo-600 hover:underline">Open chapter</Link>
        </span>
      </div>
      {lab}
    </div>
  )
}
