import { useState } from 'react'
import { Link } from 'react-router-dom'
import { assignmentPath, type PracticeItem } from '../../lib/classroom'

export function PracticeGate({
  item,
  revealed,
  onReveal,
}: {
  item: PracticeItem
  revealed: boolean
  onReveal: () => void
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const answered = picked !== null
  const correct = picked === item.correctIndex

  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
      <p className="text-[0.68rem] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Practice — picture hidden</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-900 dark:text-slate-100">{item.prompt}</p>
      <div className="mt-3 grid gap-2">
        {item.choices.map((choice, index) => (
          <button
            key={choice}
            type="button"
            onClick={() => setPicked(index)}
            className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm ${
              picked === index
                ? answered && correct
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40'
                  : answered && !correct && picked === index
                    ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800'
                    : 'border-indigo-300 bg-white dark:bg-slate-900'
                : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            {choice}
          </button>
        ))}
      </div>
      {answered && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {correct ? 'Yes. Now open the matching picture.' : `Not that one. ${item.picture}`}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onReveal}
          className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white"
        >
          {revealed ? 'Picture is on stage' : 'Reveal the picture'}
        </button>
        <Link
          to={assignmentPath(item.chapterId, item.params, { practiceId: item.id })}
          className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200"
        >
          Open as assignment
        </Link>
      </div>
      {revealed && <p className="mt-2 text-sm text-slate-500">{item.picture}</p>}
    </section>
  )
}
