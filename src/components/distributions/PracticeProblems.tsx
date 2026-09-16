import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { getDistributionPractice } from '../../lib/distributionPractice'
import type { DistributionId } from '../../lib/distributions'

export function PracticeProblems({ distId }: { distId: DistributionId }) {
  const problems = getDistributionPractice(distId)
  const [open, setOpen] = useState<Record<string, boolean>>({})

  if (problems.length === 0) return null

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-black text-slate-950 dark:text-white">Numerical practice</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Worked problems for this distribution. Solutions stay collapsed until you open them.
      </p>
      <ol className="mt-4 grid gap-3">
        {problems.map((problem, index) => {
          const expanded = Boolean(open[problem.id])
          return (
            <li
              key={problem.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-600 text-xs font-black text-white">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">{problem.prompt}</p>
              </div>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={`${problem.id}-solution`}
                onClick={() => setOpen((prev) => ({ ...prev, [problem.id]: !prev[problem.id] }))}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {expanded ? 'Hide solution' : 'Show solution'}
                <ChevronDown size={16} className={expanded ? 'rotate-180' : ''} aria-hidden />
              </button>
              {expanded ? (
                <div id={`${problem.id}-solution`} className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                  <ol className="grid gap-2">
                    {problem.steps.map((step, stepIndex) => (
                      <li key={step} className="flex gap-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-100 text-[11px] font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {stepIndex + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 rounded-xl border-2 border-indigo-400 bg-indigo-50 px-3 py-2 text-center text-sm font-black text-indigo-800 dark:border-indigo-500 dark:bg-indigo-950/70 dark:text-indigo-100">
                    Answer: {problem.answer}
                  </p>
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
