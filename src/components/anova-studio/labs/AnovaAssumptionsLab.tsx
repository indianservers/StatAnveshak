import { useMemo, useState } from 'react'
import {
  formatNum,
  formatP,
  generateOneWay,
  oneWayAnova,
  oneWayResiduals,
  varianceTest,
  type OneWayPresetId,
} from '../../../lib/anovaStudio'
import { AnovaCard, AnovaSelect, Insight, QuizBlock } from '../shared'
import { ResidualPlots, VarianceBars } from '../plots'

export function AnovaAssumptionsLab() {
  const [preset, setPreset] = useState<OneWayPresetId>('teaching-methods')
  const [method, setMethod] = useState<'brown-forsythe' | 'levene'>('brown-forsythe')
  const rows = useMemo(() => generateOneWay({ preset, k: 3, n: 18, seed: 14 }), [preset])
  const anova = useMemo(() => oneWayAnova(rows), [rows])
  const residuals = useMemo(() => oneWayResiduals(rows), [rows])
  const test = useMemo(() => varianceTest(rows, method), [rows, method])
  const varOk = test.p >= 0.05
  const skew =
    residuals.reduce((sum, point) => sum + point.residual ** 3, 0) /
    (residuals.length * Math.max(anova.msw, 1e-8) ** 1.5)

  return (
    <div className="space-y-4">
      <section className="anova-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-500">Valid results start with valid assumptions</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Check the assumptions. Trust your conclusions.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
          Use visual diagnostics and statistical tests to assess normality, homogeneity of variances, and independence in an ANOVA model.
        </p>
      </section>

      <AnovaSelect
        label="Dataset"
        value={preset}
        onChange={(value) => setPreset(value as OneWayPresetId)}
        options={[
          { value: 'teaching-methods', label: 'Teaching methods (reasonable assumptions)' },
          { value: 'unequal-var', label: 'Unequal variances' },
          { value: 'high-within', label: 'Heavy within-group scatter' },
          { value: 'strong-diffs', label: 'Strong mean differences' },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <AnovaCard title="Normal Q-Q plot of residuals" action={<span className="text-[11px] font-bold text-emerald-700">Look at the plot</span>}>
          <ResidualPlots residuals={residuals} mode="qq" />
          <p className="mt-2 text-sm text-slate-500">
            Points that hug the line support approximate normality. Sample skew ≈ {formatNum(skew, 2)}.
          </p>
        </AnovaCard>
        <AnovaCard title="Residual histogram" action={<span className="text-[11px] font-bold text-emerald-700">Look at the plot</span>}>
          <ResidualPlots residuals={residuals} mode="hist" />
          <p className="mt-2 text-sm text-slate-500">A roughly symmetric, bell-shaped residual histogram is the same idea in a different picture.</p>
        </AnovaCard>
        <AnovaCard title="Homogeneity of variances">
          <VarianceBars groups={anova.groups} />
          <AnovaSelect
            label="Variance test"
            value={method}
            onChange={(value) => setMethod(value as 'brown-forsythe' | 'levene')}
            options={[
              { value: 'brown-forsythe', label: 'Brown–Forsythe (medians)' },
              { value: 'levene', label: 'Levene (means)' },
            ]}
          />
          <table className="anova-table mt-2">
            <thead>
              <tr>
                <th>Source</th>
                <th>df</th>
                <th>F</th>
                <th>p</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{test.title}</td>
                <td>
                  {test.dfB}, {test.dfW}
                </td>
                <td>{formatNum(test.f, 2)}</td>
                <td>{formatP(test.p)}</td>
              </tr>
            </tbody>
          </table>
          <Insight title={varOk ? 'Variances look compatible' : 'Variances may differ'} tone={varOk ? 'ok' : 'warn'}>
            p = {formatP(test.p)} {varOk ? 'is not below 0.05. Fail to reject equal variances — that is not proof they are identical.' : 'is below 0.05. Consider Welch ANOVA rather than trusting the pooled MSW.'}
          </Insight>
        </AnovaCard>
        <AnovaCard title="Independence is a design claim">
          <Insight title="Not a histogram" tone="warn">
            Independence is about how the observations were collected. A residual plot cannot certify it. Clusters, repeated measures on the same person, or time order all break the one-way ANOVA error term.
          </Insight>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            This lab’s one-way data are generated as independent draws inside groups. If your real study remeasures the same subjects, use the Repeated Measures lab instead of an independent one-way F.
          </p>
        </AnovaCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <AnovaCard title="Assumptions checklist">
          <ul className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <li>Normality of residuals — residuals are approximately normally distributed.</li>
            <li>Homogeneity of variances — group variances are approximately equal.</li>
            <li>Independence of observations — observations are independent by design.</li>
          </ul>
        </AnovaCard>
        <AnovaCard title="Potential violations">
          <ul className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <li>Strong departures from normality (skewness, outliers).</li>
            <li>Unequal spread across groups (heteroscedasticity).</li>
            <li>Related or clustered observations (non-independence).</li>
            <li>{test.title} p &lt; 0.05, or a study design that already involves repeated measurements.</li>
          </ul>
        </AnovaCard>
        <AnovaCard title="Remedies & alternatives">
          <ul className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <li>
              <span className="font-bold">Welch ANOVA</span> when variances differ and you still want a mean comparison.
            </li>
            <li>
              <span className="font-bold">Kruskal–Wallis</span> when you want a rank-based omnibus that does not assume normality.
            </li>
            <li>
              <span className="font-bold">Mixed models</span> when the same subjects, clusters, or time points induce dependence.
            </li>
            <li>A transform (log, square root) can stabilize spread — it also changes the question you are asking.</li>
          </ul>
        </AnovaCard>
      </div>

      <AnovaCard title="Quick self-test">
        <QuizBlock
          items={[
            {
              prompt: 'Independence should be checked by:',
              options: [
                'Reading the study design — who was measured, how often, and whether units cluster.',
                'A histogram of residuals that looks bell-shaped.',
                'A small Levene p-value.',
                'A large η².',
              ],
              answer: 0,
              explanation: 'Independence is a sampling and design claim. Residual shape answers a different assumption.',
            },
            {
              prompt: 'Brown–Forsythe differs from classical Levene by using:',
              options: ['Group medians as the center', 'The studentized range', 'Bartlett’s χ² only', 'The grand mean instead of group centers'],
              answer: 0,
              explanation: 'Brown–Forsythe is ANOVA on |y − medianⱼ|. It is more robust to outliers than mean-centered Levene. This lab does not use Bartlett as the default.',
            },
          ]}
        />
      </AnovaCard>
    </div>
  )
}
