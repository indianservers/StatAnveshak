import { useState } from 'react'
import type { StudioLab } from '../../lib/statisticsStudios'
import { ANOVA_HOME_COPY } from '../../lib/anovaStudio'
import { readLocal, writeLocal } from '../../lib/safeStorage'
import { AnovaCard, QuizBlock } from './shared'

const GLOSSARY = [
  ['F statistic', 'Between-group mean square divided by within-group mean square. Larger values indicate more separation relative to noise.'],
  ['p-value', 'Under the null model, the probability of a test statistic at least as extreme as observed. It is not the probability that the null is true.'],
  ['α', 'The significance threshold chosen before viewing results. Lower alpha reduces the tolerated false-positive rate.'],
  ['SS / MS / df', 'Sum of squares measures variation. Degrees of freedom count independent pieces of information. Mean square is SS divided by df.'],
  ['Effect size', 'η² describes explained variation in the sample. ω² adjusts for bias. Neither replaces interpretation in the study context.'],
  ['Interaction', 'The effect of one factor changes across levels of the other factor. Inspect interactions before interpreting main effects.'],
  ['Sphericity', 'Equal variances of pairwise differences between repeated-measure conditions. Corrections adjust degrees of freedom when it is violated.'],
]

export function AnovaLearningTools({ lab }: { lab: StudioLab }) {
  const [notes, setNotes] = useState(() => readLocal(`anova-notes-${lab.slug}`))
  const [saved, setSaved] = useState('')
  const [search, setSearch] = useState('')
  return <AnovaCard title="Experiment, reflect & learn">
    <p className="text-sm font-semibold">Try this: {ANOVA_HOME_COPY[lab.slug]?.tryThis ?? lab.summary}</p>
    <div className="mt-3 grid gap-4 lg:grid-cols-2"><div><label className="block text-sm font-bold">Lab notes<textarea className="anova-select mt-2 min-h-28" value={notes} onChange={(event) => { setNotes(event.target.value); setSaved('Unsaved changes') }} placeholder="Predict what will happen, change a control, then explain what you observed." /></label><button className="anova-btn anova-btn-ghost mt-2" onClick={() => setSaved(writeLocal(`anova-notes-${lab.slug}`, notes) ? 'Notes saved in this browser.' : 'Browser storage unavailable; copy your notes before leaving.')}>Save notes</button><p role="status" className="mt-2 text-xs">{saved}</p></div><details><summary className="cursor-pointer font-bold">Searchable ANOVA glossary</summary><label className="mt-2 block text-xs">Find a term<input type="search" className="anova-select mt-1" value={search} onChange={(event) => setSearch(event.target.value)} /></label><dl className="mt-3 space-y-3">{GLOSSARY.filter(([term, definition]) => `${term} ${definition}`.toLowerCase().includes(search.toLowerCase())).map(([term, definition]) => <div key={term}><dt className="text-sm font-bold">{term}</dt><dd className="text-xs leading-6">{definition}</dd></div>)}</dl></details></div>
    <details className="mt-4"><summary className="cursor-pointer font-bold">Quick interpretation check</summary><div className="mt-3"><QuizBlock items={[{ prompt: 'A significant omnibus ANOVA establishes that…', options: ['Every group differs from every other group.', 'At least one population mean differs under the model assumptions.', 'The effect is practically important.'], answer: 1, explanation: 'The omnibus test does not locate pairs or measure practical importance. Use adjusted comparisons and effect sizes.' }, { prompt: 'A nonsignificant p-value means…', options: ['All population means are proven equal.', 'The null hypothesis has probability 1 − p.', 'The evidence is insufficient to reject equal means at the chosen threshold.'], answer: 2, explanation: 'Failing to reject does not establish equality. Sample size, uncertainty, and study design still matter.' }]} /></div></details>
  </AnovaCard>
}
