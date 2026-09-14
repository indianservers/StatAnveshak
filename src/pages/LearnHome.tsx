import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { LEARN_CHAPTERS, GUIDED_QUESTIONS } from '../lib/learnChapters'
import { ChapterPreview } from '../components/visual/ChapterPreview'
import { TeachingDatasetChip } from '../components/visual/TeachingDatasetChip'
import { useStore } from '../store/useStore'

export function LearnHome() {
  const defaultChapter = useStore((state) => state.defaultChapter)
  const setWorkspaceMode = useStore((state) => state.setWorkspaceMode)

  return (
    <main className="min-w-0 bg-slate-50/70 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">Learn</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Six pictures. Then the workbench.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Start a chapter. Play moves objects on the stage. Open analysis when you want your own data.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TeachingDatasetChip />
            <Link
              to="/learn/distributions"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700"
            >
              Play CLT
            </Link>
            <Link
              to="/analysis/learnStats.labs"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-bold text-indigo-800 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
            >
              Learn Stats
            </Link>
            <Link
              to="/classroom"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Classroom
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Lesson wall
            </Link>
            <button
              type="button"
              onClick={() => setWorkspaceMode('analyze')}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Open analysis
            </button>
          </div>
        </header>

        <Link
          to="/learn/distributions"
          className="flex min-h-[88px] overflow-hidden rounded-2xl border-2 border-indigo-400 bg-slate-950 shadow-sm ring-2 ring-indigo-200 dark:ring-indigo-900"
        >
          <div className="hidden h-[88px] w-44 shrink-0 sm:block">
            <ChapterPreview preview="clt" />
          </div>
          <div className="flex flex-1 items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Start here</p>
              <p className="text-lg font-black text-white">Watch sample means pile into a bell</p>
              <p className="text-sm text-slate-400">Drag n. The cloud tightens. No Run button.</p>
            </div>
            <span className="hidden shrink-0 text-sm font-bold text-indigo-300 sm:inline">Play the CLT lab →</span>
          </div>
        </Link>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {LEARN_CHAPTERS.map((chapter) => (
            <Link
              key={chapter.id}
              to={chapter.href}
              className={`group overflow-hidden rounded-2xl border bg-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                chapter.id === defaultChapter ? 'border-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-900' : 'border-slate-800'
              }`}
            >
              <div className="h-36 bg-gradient-to-br from-slate-900 to-slate-800">
                <ChapterPreview preview={chapter.preview} />
              </div>
              <div className="bg-white p-4 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Chapter {chapter.number}</p>
                <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{chapter.title}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{chapter.hero}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-indigo-600 dark:text-indigo-300">
                  Play this lab <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-black text-slate-950 dark:text-white">What do you want to know?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {GUIDED_QUESTIONS.map((item) => (
              <Link
                key={item.question}
                to={`/learn/${item.chapterId}`}
                className="rounded-xl border border-slate-200 p-4 hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
              >
                <p className="font-black text-slate-950 dark:text-white">{item.question}</p>
                <p className="mt-1 text-sm text-slate-500">{item.visual}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
