import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { BayesTreeLab } from './BayesTreeLab'
import { BetaPosteriorLab } from './BetaPosteriorLab'
import { BootstrapLab } from './BootstrapLab'
import { CltMeansLab } from './CltMeansLab'
import { CoverageLab } from './CoverageLab'
import { LlnLab } from './LlnLab'
import { MleHillLab } from './MleHillLab'
import { AnovaLab } from './AnovaLab'
import { OlsSquaresLab } from './OlsSquaresLab'
import { PermutationLab } from './PermutationLab'
import { SamplingWindowLab } from './SamplingWindowLab'
import { TypeErrorsLab } from './TypeErrorsLab'
import { CORE_LABS, coreLabChapter, type CoreLabId } from '../../lib/coreLabs'
import type { LearnChapter } from '../../lib/learnChapters'
import { useReducedMotion } from './useReducedMotion'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { runAnalysis } from '../../analysis/runAnalysis'

const LAB_TO_STATS: Partial<Record<CoreLabId, string>> = {
  clt: 'clt',
  sampling: 'se',
  errors: 'pvalue',
  ci: 'ci',
  anova: 'effect',
}

const LAB = {
  bayes: BayesTreeLab,
  clt: CltMeansLab,
  lln: LlnLab,
  sampling: SamplingWindowLab,
  errors: TypeErrorsLab,
  ci: CoverageLab,
  bootstrap: BootstrapLab,
  permutation: PermutationLab,
  anova: AnovaLab,
  mle: MleHillLab,
  bayesian: BetaPosteriorLab,
  regression: OlsSquaresLab,
} as const

export function CoreLabStudio({ labId, onPick }: { labId: CoreLabId; onPick: (id: CoreLabId) => void }) {
  const reducedMotion = useReducedMotion()
  const [selected, setSelected] = useState<CoreLabId>(labId)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- parent labId is the source of truth on navigation
    setSelected(labId)
  }, [labId])
  const spec = CORE_LABS.find((lab) => lab.id === selected) ?? CORE_LABS[1]!
  const chapter: LearnChapter = coreLabChapter(spec)
  const Lab = LAB[spec.id]
  const engineLab = LAB_TO_STATS[spec.id]

  const pick = (id: CoreLabId) => {
    setSelected(id)
    onPick(id)
  }

  return (
    <div>
      <div className="mx-auto flex max-w-[1400px] flex-wrap gap-2 px-3 pt-2 sm:px-5">
        {CORE_LABS.map((lab) => (
          <button
            key={lab.id}
            type="button"
            onClick={() => pick(lab.id)}
            className={`min-h-11 rounded-xl border px-3 text-sm font-bold ${
              lab.id === spec.id
                ? 'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {lab.title}
          </button>
        ))}
      </div>
      <ErrorBoundary variant="lab" resetKey={spec.id}>
        <Lab key={spec.id} chapter={chapter} reducedMotion={reducedMotion} />
      </ErrorBoundary>
      {engineLab ? <RegistryFootnote lab={engineLab} /> : null}
    </div>
  )
}

function RegistryFootnote({ lab }: { lab: string }) {
  const result = useMemo(() => runAnalysis('learnStats.labs', [], { lab, n: 40, seed: 1, sigma: 1 }), [lab])
  return (
    <p className="mx-auto max-w-[1400px] px-3 pb-4 text-xs leading-5 text-slate-500 sm:px-5">
      Registry numbers: {result.interpretation}{' '}
      <Link to="/analysis/learnStats.labs" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
        Open Learn Stats
      </Link>
    </p>
  )
}
