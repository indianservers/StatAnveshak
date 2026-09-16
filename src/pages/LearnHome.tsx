import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Play } from 'lucide-react'
import { LEARN_CHAPTERS, GUIDED_QUESTIONS } from '../lib/learnChapters'
import { InteractiveBookStack, InteractiveChapterIcon, InteractiveHeroArt } from '../components/visual/InteractiveLearnIcons'
import { TeachingDatasetChip } from '../components/visual/TeachingDatasetChip'
import { HomeWelcome } from '../components/home/HomeWelcome'
import { useStore } from '../store/useStore'
import { useState } from 'react'

const CHAPTER_TONE: Record<string, string> = {
  chance: 'from-orange-50 via-amber-50 to-white',
  compound: 'from-indigo-50 via-sky-50 to-white',
  distributions: 'from-violet-50 via-fuchsia-50 to-white',
  frequentist: 'from-emerald-50 via-teal-50 to-white',
  bayesian: 'from-violet-50 via-purple-50 to-white',
  regression: 'from-amber-50 via-orange-50 to-white',
}

export function LearnHome() {
  const defaultChapter = useStore((state) => state.defaultChapter)
  const setWorkspaceMode = useStore((state) => state.setWorkspaceMode)
  const navigate = useNavigate()
  const [hoverId, setHoverId] = useState<string | null>(null)

  return (
    <main className="min-w-0 bg-[#f7f8fb] px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <HomeWelcome />

        <section className="grid items-center gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-500">Learn statistics</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Six pictures.
              <span className="mt-1 block text-indigo-600 dark:text-indigo-400">Then the workbench.</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-300">
              Start a chapter. Play moves objects on the stage. Open analysis when you want your own data.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                to="/distributions"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
              >
                <Play size={14} fill="currentColor" /> Play CLT
              </Link>
              <Link to="/analysis/learnStats.labs" className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Learn Stats</Link>
              <Link to="/classroom" className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Classroom</Link>
              <Link to="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Lesson wall</Link>
              <button
                type="button"
                onClick={() => {
                  setWorkspaceMode('analyze')
                  navigate('/analysis/descriptives.statistics')
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Open analysis
              </button>
            </div>
            <div className="mt-3">
              <TeachingDatasetChip />
            </div>
          </div>
          <InteractiveHeroArt />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {LEARN_CHAPTERS.map((chapter) => {
            const active = hoverId === chapter.id || defaultChapter === chapter.id
            return (
              <Link
                key={chapter.id}
                to={chapter.href}
                onMouseEnter={() => setHoverId(chapter.id)}
                onMouseLeave={() => setHoverId(null)}
                onFocus={() => setHoverId(chapter.id)}
                onBlur={() => setHoverId(null)}
                className={`group overflow-hidden rounded-3xl border bg-gradient-to-br shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${CHAPTER_TONE[chapter.id]} ${
                  chapter.id === defaultChapter ? 'border-indigo-300 ring-2 ring-indigo-100 dark:ring-indigo-900' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="relative h-40">
                  <InteractiveChapterIcon chapterId={chapter.id} active={active} />
                  <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm group-hover:bg-indigo-600 group-hover:text-white">
                    <ArrowRight size={14} />
                  </span>
                </div>
                <div className="bg-white p-4 dark:bg-slate-900">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-500">
                    {String(chapter.number).padStart(2, '0')}
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{chapter.title}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{chapter.hero}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-indigo-600 dark:text-indigo-300">
                    Play this lab <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            )
          })}
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-indigo-50 p-5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">What do you want to know?</h2>
              <p className="mt-1 text-sm text-slate-500">Quick questions. Big ideas. Jump to a lab.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {GUIDED_QUESTIONS.map((item) => (
                  <Link
                    key={item.question}
                    to={`/learn/${item.chapterId}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-800"
                  >
                    <p className="font-black text-slate-950 dark:text-white">{item.question}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.visual}</p>
                    <span className="mt-3 inline-flex text-indigo-500"><ArrowRight size={16} /></span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center justify-end">
              <p className="mb-2 rotate-[-8deg] text-xs font-semibold italic text-slate-400">Same data. New perspectives.</p>
              <InteractiveBookStack />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
