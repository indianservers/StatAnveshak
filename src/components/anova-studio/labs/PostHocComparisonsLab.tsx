import { useMemo, useState } from 'react'
import {
  formatNum,
  formatP,
  generateOneWay,
  oneWayAnova,
  postHocComparisons,
  type PostHocMethod,
} from '../../../lib/anovaStudio'
import { AnovaCard, Insight, QuizBlock, SigBadge } from '../shared'
import { ForestPlot } from '../plots'

export function PostHocComparisonsLab() {
  const [method, setMethod] = useState<PostHocMethod>('tukey')
  const [highlight, setHighlight] = useState<string>()
  const [preset, setPreset] = useState<'strong-diffs' | 'unequal-n'>('strong-diffs')
  const rows = useMemo(
    () => generateOneWay({ preset, k: 4, n: 12, seed: 19, separation: 0.85, withinSd: 6, labels: ['A', 'B', 'C', 'D'] }),
    [preset],
  )
  const anova = useMemo(() => oneWayAnova(rows), [rows])
  const post = useMemo(() => postHocComparisons(anova, method), [anova, method])
  const selected = post.pairs.find((pair) => `${pair.a} vs ${pair.b}` === highlight) ?? post.pairs[0]
  const largest = [...post.pairs].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))[0]

  return (
    <div className="space-y-4">
      <section className="anova-hero">
        <p className="text-sm leading-7 text-slate-600">
          A significant ANOVA tells you that at least one group mean is different. Post-hoc comparisons help you find out which specific groups differ, while controlling for multiple comparisons.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <AnovaCard title="Pairwise group comparisons">
          <p className="mb-2 text-sm text-slate-500">
            {post.methodTitle} intervals for mean differences. Intervals that do not cross 0 indicate a significant difference. Each pair also has a shape so color is not the only cue.
          </p>
          <ForestPlot pairs={post.pairs} highlight={highlight} onSelect={setHighlight} />
        </AnovaCard>
        <AnovaCard title="Choose a post-hoc method">
          <fieldset className="space-y-2">
            <legend className="sr-only">Post-hoc method</legend>
            {(
              [
                { id: 'tukey', title: post.method === 'tukey-kramer' ? 'Tukey–Kramer' : 'Tukey HSD', note: 'Best default for all pairwise comparisons when the studentized range is available.' },
                { id: 'holm', title: 'Pairwise t + Holm', note: 'Raw two-sided t p-values, then Holm. Not Tukey and not Bonferroni.' },
              ] as const
            ).map((item) => (
              <label key={item.id} className={`flex cursor-pointer gap-3 rounded-2xl border px-3 py-2 ${method === item.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200'}`}>
                <input type="radio" name="ph" checked={method === item.id} onChange={() => setMethod(item.id)} />
                <span>
                  <span className="block text-sm font-bold">{item.title}</span>
                  <span className="block text-xs text-slate-500">{item.note}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <p className="mt-3 text-xs text-slate-400">
            {preset === 'unequal-n' ? 'Unequal n: Tukey is labeled Tukey–Kramer.' : 'Equal n: Tukey HSD.'} Bonferroni is more conservative and is not used as a stand-in for Tukey.
          </p>
          <button type="button" className="anova-btn anova-btn-ghost mt-3 w-full" onClick={() => setPreset((value) => (value === 'strong-diffs' ? 'unequal-n' : 'strong-diffs'))}>
            Toggle {preset === 'strong-diffs' ? 'unequal n' : 'equal n'}
          </button>
        </AnovaCard>
      </div>

      <AnovaCard
        title="Pairwise comparison results"
        action={<span className="text-xs font-bold text-slate-400">Method: {post.methodTitle}</span>}
      >
        <div className="overflow-x-auto">
          <table className="anova-table">
            <thead>
              <tr>
                <th>Comparison</th>
                <th>Mean difference</th>
                <th>CI (lower, upper)</th>
                <th>Raw p</th>
                <th>Adjusted p</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {post.pairs.map((pair) => {
                const key = `${pair.a} vs ${pair.b}`
                return (
                  <tr key={key} className={highlight === key ? 'is-on' : ''}>
                    <td>
                      <button type="button" onClick={() => setHighlight(key)}>
                        {pair.a} − {pair.b}
                      </button>
                    </td>
                    <td>{formatNum(pair.diff, 2)}</td>
                    <td>
                      ({formatNum(pair.ciLo, 2)}, {formatNum(pair.ciHi, 2)})
                    </td>
                    <td>{formatP(pair.pRaw)}</td>
                    <td>{formatP(pair.pAdj)}</td>
                    <td>
                      <SigBadge significant={pair.significant} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {selected && (
          <p className="mt-3 text-sm text-slate-500">
            Highlighted {selected.a} − {selected.b}: difference {formatNum(selected.diff, 2)}, adjusted p = {formatP(selected.pAdj)}.
            Raw p = {formatP(selected.pRaw)}. Multiple comparisons can move a raw “significant” pair above α.
          </p>
        )}
      </AnovaCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <AnovaCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Omnibus F({anova.dfB}, {anova.dfW}) = {formatNum(anova.f, 2)}, p = {formatP(anova.p)}. That is the permission slip to look at pairs — not a list of which pairs differ.
          </p>
          <Insight title="Read the family" tone="ok">
            {largest
              ? `${largest.a} and ${largest.b} have the largest mean difference (${formatNum(largest.diff, 2)}). Adjusted p = ${formatP(largest.pAdj)}.`
              : 'No pairs computed.'}
          </Insight>
        </AnovaCard>
        <AnovaCard title="Interpretation guide">
          <ul className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <li>A significant adjusted p-value (typically &lt; 0.05) indicates a difference between those two groups.</li>
            <li>Confidence intervals that do not include 0 indicate a significant difference.</li>
            <li>Post-hoc tests control the family-wise error rate when you look at many pairs.</li>
            <li>Use Tukey for all pairwise comparisons. Holm is a labeled fallback. Do not call Bonferroni “Tukey.”</li>
          </ul>
        </AnovaCard>
      </div>

      <AnovaCard title="Check your understanding">
        <QuizBlock
          items={[
            {
              prompt: 'A significant omnibus ANOVA means:',
              options: [
                'At least one mean differs; pairs still need a protected comparison.',
                'Every pair of groups differs.',
                'The largest mean is the cause of the others.',
                'The means are identical.',
              ],
              answer: 0,
              explanation: 'The omnibus test is one question about the whole set of means. Pairwise location is a second, multiple-comparison problem.',
            },
            {
              prompt: 'Why can a raw p-value look significant when the adjusted p-value does not?',
              options: [
                'The family of tests inflates the chance of at least one false positive.',
                'Adjusted p-values are always twice the raw p-value.',
                'Tukey ignores the residual MSW.',
                'Holm and Tukey are the same procedure.',
              ],
              answer: 0,
              explanation: 'Looking at many pairs without adjustment spends the Type I error budget more than once.',
            },
          ]}
        />
      </AnovaCard>
    </div>
  )
}
