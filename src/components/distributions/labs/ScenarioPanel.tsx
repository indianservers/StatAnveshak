import type { DistributionExperience } from '../../../lib/distributionExperiences'

export function ScenarioPanel({ experience }: { experience: DistributionExperience }) {
  return (
    <section className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 sm:p-5 dark:border-indigo-900 dark:from-slate-900 dark:to-indigo-950">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-500">Real-world scenario</p>
      <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{experience.scenarioTitle}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{experience.scenarioDescription}</p>
      <p className="mt-3 text-xs font-semibold text-indigo-700 dark:text-indigo-300">Goal: {experience.learningGoal}</p>
      <p className="mt-1 text-[11px] text-slate-400">{experience.datasetLabel} — {experience.datasetHint}</p>
    </section>
  )
}
