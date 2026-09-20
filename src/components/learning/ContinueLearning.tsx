import { Link } from 'react-router-dom'
import { ArrowRight, Clock3 } from 'lucide-react'
import { continueLearningTarget, nextRecommendedLesson, readLearningRecent } from '../../lib/learningProgress'

export function ContinueLearningCard() {
  const current = continueLearningTarget()
  const next = nextRecommendedLesson()
  const recent = readLearningRecent()

  if (!current) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-black text-slate-950 dark:text-white">Continue learning</h2>
        <p className="mt-1 text-sm text-slate-500">Start a learning path to see your progress here.</p>
        <Link to="/learn/paths/beginner" className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-bold text-indigo-600">
          Beginner path <ArrowRight size={14} />
        </Link>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-500">{current.context}</p>
      <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Continue learning</h2>
      <p className="mt-1 text-sm text-slate-500">{current.title}</p>
      {current.total > 1 && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] font-semibold text-slate-400">
            <span>
              {current.completed}/{current.total} labs
            </span>
            <span>{current.percent}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${current.percent}%` }} />
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to={current.path}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700"
        >
          Continue
        </Link>
        <Link
          to={next.path}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"
        >
          Next: {next.title}
        </Link>
      </div>
      {recent.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
          <p className="mb-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            <Clock3 size={12} /> Recently visited
          </p>
          <ul className="grid gap-1 sm:grid-cols-2">
            {recent.slice(0, 4).map((item) => (
              <li key={item.path}>
                <Link to={item.path} className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
