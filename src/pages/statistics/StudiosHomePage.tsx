import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Database, PlayCircle, Wrench } from 'lucide-react'
import { TOTAL_LAB_COUNT, TOTAL_STUDIO_COUNT } from '../../lib/statisticsStudios'
import { StudioIconStyles } from '../../components/visual/StudioIcons'
import { HeroPromiseCard, StudiosHeroArt } from '../../components/visual/StudiosHeroArt'
import { AllStudiosSection } from '../../components/statistics/AllStudiosSection'
import { FOCUS_RING } from '../../components/statistics/studioTheme'
import { TeachingDatasetChip } from '../../components/visual/TeachingDatasetChip'
import { useStore } from '../../store/useStore'

export function StudiosHomePage() {
  return (
    <main className="min-w-0 bg-[#f7f8fb] px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <StudioIconStyles />
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-7">
        <StudiosHero />
        <AllStudiosSection />
        <FooterNote />
      </div>
    </main>
  )
}

function StudiosHero() {
  const setWorkspaceMode = useStore((state) => state.setWorkspaceMode)
  const navigate = useNavigate()

  /** Existing analysis surfaces live in analyze mode, so switch the shell before navigating. */
  const openInAnalyze = (path: string) => {
    setWorkspaceMode('analyze')
    navigate(path)
  }

  const secondaryClass = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30 ${FOCUS_RING}`

  return (
    <section className="grid items-center gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-500">Learn statistics</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          Probability &amp; Statistics{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
            Studios
          </span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
          Learn through interactive studios, hands-on labs, simulations, and real-world examples.
        </p>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Build intuition. Explore concepts. Practice with data. Go from fundamentals to advanced topics.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openInAnalyze('/analysis/descriptives.statistics')}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 ${FOCUS_RING}`}
          >
            <PlayCircle size={16} aria-hidden /> Open analysis
          </button>
          <Link to="/learn" className={secondaryClass}>
            <BookOpen size={16} aria-hidden /> Continue learning
          </Link>
          <button type="button" onClick={() => openInAnalyze('/data/workbench')} className={secondaryClass}>
            <Wrench size={16} aria-hidden /> Go to workbench
          </button>
          <button type="button" onClick={() => openInAnalyze('/data/upload')} className={secondaryClass}>
            <Database size={16} aria-hidden /> Browse datasets
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <TeachingDatasetChip />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {TOTAL_STUDIO_COUNT} studios · {TOTAL_LAB_COUNT} labs
          </span>
        </div>
      </div>

      <div className="relative">
        <StudiosHeroArt />
        <div className="absolute right-0 top-0 hidden sm:block">
          <HeroPromiseCard />
        </div>
      </div>
    </section>
  )
}

function FooterNote() {
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 lg:flex-row lg:items-center lg:justify-between">
      <p>
        <span className="font-bold text-slate-700 dark:text-slate-200">Your workbench and datasets are unchanged.</span>{' '}
        This is a new learning homepage. All existing analysis, workbench, and dataset features work exactly as before.
      </p>
      <p className="shrink-0">Each studio contains multiple labs and concept walkthroughs.</p>
    </section>
  )
}
