import { Link } from 'react-router-dom'
import { PageBack } from '../components/ui/PageBack'
import { LearningBreadcrumb } from '../components/learning/LearningBreadcrumb'
import { CurriculumMapView } from '../components/learning/CurriculumMapView'
import { useLearningVisit } from '../components/learning/useLearningVisit'
import { CURRICULUM_TOPIC_COUNT } from '../lib/curriculum'
import { curriculumProgressPercent } from '../lib/learningProgress'

export function CurriculumMapPage() {
  useLearningVisit('/learn/curriculum', 'Curriculum Map')
  const percent = curriculumProgressPercent()

  return (
    <main className="min-w-0 bg-[#f7f8fb] px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <PageBack fallback="/learn" label="Back to Learning" />
        <LearningBreadcrumb trail={[{ label: 'Curriculum Map' }]} />
        <header>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500">Statistics curriculum</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Complete Curriculum Map</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Five areas, then studios, then labs. Each card opens a real topic page — it does not only change color.
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-400">
            {CURRICULUM_TOPIC_COUNT} topics · {percent}% marked complete in this browser
          </p>
        </header>
        <CurriculumMapView />
        <p className="text-sm text-slate-500">
          Prefer a sequence?{' '}
          <Link to="/learn/paths/beginner" className="font-bold text-indigo-600 dark:text-indigo-300">
            Open learning paths
          </Link>
        </p>
      </div>
    </main>
  )
}
