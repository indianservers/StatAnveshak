import { Link } from 'react-router-dom'
import { LEARN_CHAPTERS } from '../../lib/learnChapters'
import { useStore } from '../../store/useStore'
import { ChapterPreview } from './ChapterPreview'

export function LessonWall() {
  const { savedStages, unpinStage } = useStore()

  return (
    <main className="min-w-0 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">Dashboard</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Lesson wall</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Pin a stage from any lab. Each tile is the PNG plus the three-line caption. Click to reopen the live picture.
          </p>
        </header>

        {savedStages.length > 0 && (
          <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {savedStages.map((stage) => (
              <article key={stage.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <Link to={stage.href} className="block">
                  <img src={stage.pngDataUrl} alt="" className="h-44 w-full object-cover object-top" />
                </Link>
                <div className="p-4">
                  <Link to={stage.href} className="text-lg font-black text-slate-950 hover:text-indigo-700 dark:text-white">
                    {stage.title}
                  </Link>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{stage.intuition}</p>
                  <p className="mt-2 font-mono text-xs text-slate-500">{stage.readout}</p>
                  <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">{stage.misuse}</p>
                  <button
                    type="button"
                    onClick={() => unpinStage(stage.id)}
                    className="mt-3 min-h-11 text-xs font-bold text-slate-500 hover:text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}

        <section>
          <h2 className="text-base font-black">Six live chapters</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {LEARN_CHAPTERS.map((chapter) => (
              <Link
                key={chapter.id}
                to={chapter.href}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950"
              >
                <div className="h-28">
                  <ChapterPreview preview={chapter.preview} />
                </div>
                <div className="bg-white p-3 dark:bg-slate-900">
                  <p className="text-sm font-black">{chapter.title}</p>
                  <p className="text-xs text-slate-500">{chapter.hero}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
