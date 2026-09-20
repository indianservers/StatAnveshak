import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CURRICULUM_AREAS, curriculumPath, type CurriculumArea } from '../../lib/curriculum'
import { readCurriculumCompleted } from '../../lib/learningProgress'

function AreaProgress({ area, completed }: { area: CurriculumArea; completed: string[] }) {
  const done = area.topics.filter((topic) => completed.includes(topic.id)).length
  const percent = area.topics.length === 0 ? 0 : Math.round((done / area.topics.length) * 100)
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-400">
        <span>
          {done}/{area.topics.length} topics
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export function CurriculumMapView({ compact = false }: { compact?: boolean }) {
  const completed = readCurriculumCompleted()

  return (
    <div className="grid gap-4">
      {CURRICULUM_AREAS.map((area, index) => (
        <section
          key={area.id}
          className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-500">Level 1 · Area {index + 1}</p>
              <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{area.title}</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{area.summary}</p>
            </div>
            <Link
              to={curriculumPath(area.id)}
              className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:border-indigo-200 dark:border-slate-700 dark:text-slate-200"
            >
              Open area <ArrowRight size={14} />
            </Link>
          </div>
          <AreaProgress area={area} completed={completed} />
          <ol className={`mt-4 grid gap-2 ${compact ? 'md:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
            {area.topics.map((topic, topicIndex) => {
              const done = completed.includes(topic.id)
              return (
                <li key={topic.id}>
                  <Link
                    to={curriculumPath(area.id, topic.id)}
                    className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-indigo-800"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Level 2 · {topicIndex + 1}
                    </span>
                    <span className="mt-1 font-semibold text-slate-800 dark:text-white">{topic.title}</span>
                    <span className="mt-1 line-clamp-2 text-xs text-slate-500">{topic.summary}</span>
                    <span className="mt-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-300">
                      {done ? 'Completed · Open' : 'Open topic'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}
