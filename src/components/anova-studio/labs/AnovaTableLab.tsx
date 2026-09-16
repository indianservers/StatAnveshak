import { useMemo, useState } from 'react'
import { WORKED_ONE_WAY, formatNum, formatP, generateOneWay, oneWayAnova } from '../../../lib/anovaStudio'
import { AnovaCard, AnovaSelect, FormulaBlock, Insight, QuizBlock } from '../shared'
import { FDistPlot } from '../plots'

type CellId = 'ssb' | 'ssw' | 'sst' | 'dfb' | 'dfw' | 'dft' | 'msb' | 'msw' | 'f' | 'p' | null

const EXPLAINS: Record<Exclude<CellId, null>, string> = {
  ssb: 'SSB = Σ nⱼ(ȳⱼ − ȳ)². Between-group variation from how far group means sit from the grand mean.',
  ssw: 'SSW = ΣΣ (yᵢⱼ − ȳⱼ)². Within-group variation: scatter around each group mean.',
  sst: 'SST = Σ (yᵢ − ȳ)². Total variation. In one-way ANOVA, SST = SSB + SSW.',
  dfb: 'df_between = k − 1. One degree of freedom is spent on the grand mean among the k group means.',
  dfw: 'df_within = N − k. Each observation, after the k group means, leaves N − k leftover df.',
  dft: 'df_total = N − 1. SST always has N − 1 degrees of freedom.',
  msb: 'MSB = SSB / df_between. Average between-group variation per degree of freedom.',
  msw: 'MSW = SSW / df_within. The pooled within-group variance — the error term for F.',
  f: 'F = MSB / MSW. How many times larger the between-group mean square is than the leftover noise.',
  p: 'p = P(F_{df1, df2} ≥ F_obs). The upper-tail probability under the null of equal means.',
}

export function AnovaTableLab() {
  const [source, setSource] = useState<'worked' | 'live'>('worked')
  const [alpha, setAlpha] = useState(0.05)
  const [clicked, setClicked] = useState<CellId>('f')
  const live = useMemo(() => generateOneWay({ preset: 'moderate-diffs', k: 3, n: 10, seed: 4, withinSd: 5.1 }), [])
  const rows = source === 'worked' ? WORKED_ONE_WAY : live
  const result = useMemo(() => oneWayAnova(rows, alpha), [rows, alpha])
  const explain = clicked ? EXPLAINS[clicked] : 'Click any SS, df, MS, F, or p cell to see how that number is built.'

  const cell = (id: CellId, text: string) => (
    <td>
      <button type="button" onClick={() => setClicked(id)} aria-pressed={clicked === id}>
        {text}
      </button>
    </td>
  )

  return (
    <div className="space-y-4">
      <section className="anova-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-500">The ANOVA framework</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Partition variation. Test for meaningful group differences.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
          ANOVA breaks total variation into between-group and within-group pieces, then uses the F statistic to ask whether at least one group mean differs.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <AnovaCard title="ANOVA table">
          <table className="anova-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>df</th>
                <th>SS</th>
                <th>MS</th>
                <th>F</th>
                <th>p</th>
              </tr>
            </thead>
            <tbody>
              <tr className={clicked === 'ssb' || clicked === 'msb' || clicked === 'f' ? 'is-on' : ''}>
                <td>Between groups</td>
                {cell('dfb', String(result.dfB))}
                {cell('ssb', formatNum(result.ssb, 1))}
                {cell('msb', formatNum(result.msb, 1))}
                {cell('f', formatNum(result.f, 2))}
                {cell('p', formatP(result.p))}
              </tr>
              <tr>
                <td>Within groups (error)</td>
                {cell('dfw', String(result.dfW))}
                {cell('ssw', formatNum(result.ssw, 1))}
                {cell('msw', formatNum(result.msw, 1))}
                <td>—</td>
                <td>—</td>
              </tr>
              <tr>
                <td>Total</td>
                {cell('dft', String(result.dfT))}
                {cell('sst', formatNum(result.sst, 1))}
                <td>—</td>
                <td>—</td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
          <Insight title="Interpretation" tone={result.significant ? 'ok' : 'info'}>
            F({result.dfB}, {result.dfW}) = {formatNum(result.f, 2)} with p = {formatP(result.p)}
            {result.significant
              ? ` is smaller than α = ${alpha}, so at least one mean differs.`
              : ` is not smaller than α = ${alpha}. The data are compatible with equal means.`}
          </Insight>
        </AnovaCard>

        <AnovaCard title="Formulas & explanation">
          <FormulaBlock tex={'F = \\dfrac{MS_B}{MS_W} = \\dfrac{SS_B / df_B}{SS_W / df_W}'} label="F is MSB over MSW" />
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{explain}</p>
          <p className="mt-3 text-xs text-slate-400">η² = SSB / SST = {formatNum(result.eta2, 3)}. That is the share of total variation sitting between groups. Partial η² uses a different denominator and is not shown here.</p>
        </AnovaCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <AnovaCard title="F distribution" action={<AnovaSelect label="Alpha" value={String(alpha)} onChange={(value) => setAlpha(Number(value))} options={[{ value: '0.01', label: 'α = 0.01' }, { value: '0.05', label: 'α = 0.05' }, { value: '0.1', label: 'α = 0.10' }]} />}>
          <FDistPlot df1={result.dfB} df2={result.dfW} fObs={result.f} fCrit={result.fCrit} alpha={alpha} />
          <p className="mt-2 text-sm text-slate-500">
            The curve is F({result.dfB}, {result.dfW}). The shaded tail is the rejection region beyond the critical value {formatNum(result.fCrit, 2)}.
          </p>
        </AnovaCard>
        <AnovaCard title="Visualizing the decomposition">
          <div className="flex h-8 overflow-hidden rounded-full">
            <div className="grid place-items-center bg-blue-600 text-[11px] font-bold text-white" style={{ width: `${Math.max(8, result.eta2 * 100)}%` }}>
              {formatNum(result.eta2 * 100, 0)}%
            </div>
            <div className="grid flex-1 place-items-center bg-violet-200 text-[11px] font-bold text-violet-900">
              {formatNum((1 - result.eta2) * 100, 0)}%
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Between groups (SSB) vs within groups (SSW). SST = SSB + SSW = {formatNum(result.sst, 1)}.</p>
          <AnovaSelect
            label="Dataset"
            value={source}
            onChange={(value) => setSource(value as 'worked' | 'live')}
            options={[
              { value: 'worked', label: 'Plant / teaching worked example (n = 10 per group)' },
              { value: 'live', label: 'Live generated sample' },
            ]}
          />
        </AnovaCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AnovaCard title="Worked example">
          <ol className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <li>Compute the group means and the grand mean ȳ = {formatNum(result.grandMean, 2)}.</li>
            <li>SSB = {formatNum(result.ssb, 1)}, SSW = {formatNum(result.ssw, 1)}, SST = {formatNum(result.sst, 1)}.</li>
            <li>MSB = {formatNum(result.msb, 1)}, MSW = {formatNum(result.msw, 1)}.</li>
            <li>F = {formatNum(result.f, 2)}, p = {formatP(result.p)}.</li>
          </ol>
        </AnovaCard>
        <AnovaCard title="Try it yourself">
          <QuizBlock
            items={[
              {
                prompt: `Based on this ANOVA table, what is the conclusion at α = ${alpha}?`,
                options: [
                  'Reject H₀: at least one mean is different.',
                  'Fail to reject H₀: no evidence of a mean difference.',
                  'Every pair of groups differs.',
                  'The p-value cannot be determined from this table.',
                ],
                answer: result.significant ? 0 : 1,
                explanation: result.significant
                  ? `p = ${formatP(result.p)} is below α, so the omnibus test is significant. That still does not name which pairs differ.`
                  : `p = ${formatP(result.p)} is not below α. Fail to reject H₀ — do not claim the means are proven identical.`,
              },
              {
                prompt: 'What is MSW?',
                options: ['SSW / df_within', 'SSB / df_between', 'SST / N', 'F × MSB'],
                answer: 0,
                explanation: 'Every mean square is a sum of squares divided by its own degrees of freedom.',
              },
            ]}
          />
        </AnovaCard>
      </div>
    </div>
  )
}
