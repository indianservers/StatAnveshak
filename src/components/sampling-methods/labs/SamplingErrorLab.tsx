import { useMemo, useState } from 'react'
import {
  biasedSample,
  createPopulation,
  formatNum,
  formatPct,
  mse,
  proportionMoe,
  repeatStatistic,
  sampleMean,
  sampleSrs,
  SeededRng,
  WORKED,
  type SmTab,
} from '../../../lib/samplingMethods'
import { ConceptList, FormulaBlock, Insight, LabSplit, MetricCard, QuizBlock, ResetButton, SmCard, SmSlider } from '../shared'
import { ErrorCurve } from '../plots'

const SOURCES = [
  { id: 'wording', label: 'Wording / question bias', hint: 'Leading or unclear questions can influence responses.', bias: 0.04 },
  { id: 'nonresponse', label: 'Nonresponse error', hint: 'Some selected individuals do not participate.', bias: 0.03 },
  { id: 'measurement', label: 'Measurement error', hint: 'Inaccurate or inconsistent measurements.', bias: 0.02 },
  { id: 'processing', label: 'Data processing', hint: 'Data entry, coding, or data-handling mistakes.', bias: 0.015 },
] as const

export function SamplingErrorLab({ tab }: { tab: SmTab }) {
  const [n, setN] = useState(400)
  const [on, setOn] = useState<Record<string, boolean>>({ wording: true, nonresponse: false, measurement: false, processing: false })
  const pop = useMemo(() => createPopulation({ N: 800, seed: 18, clusterCount: 10 }), [])
  const p = 0.62
  const bias = SOURCES.reduce((sum, source) => sum + (on[source.id] ? source.bias : 0), 0)
  const moe = proportionMoe(p, n)
  const compare = useMemo(() => {
    const small = repeatStatistic(80, 5, (rng) => sampleMean(pop, sampleSrs(pop, 40, rng)), pop.mu)
    const hugeBiased = repeatStatistic(80, 6, (rng) => sampleMean(pop, biasedSample(pop, 240, 'convenience', rng)), pop.mu)
    return { small, hugeBiased }
  }, [pop])

  const reset = () => {
    setN(400)
    setOn({ wording: true, nonresponse: false, measurement: false, processing: false })
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <SmCard title="Two different kinds of error">
          <p className="text-sm leading-6 text-slate-600">
            Sampling error is the natural gap that appears because we observe a sample instead of the whole population. It generally shrinks as n grows. Non-sampling error comes from bias, nonresponse, measurement, or processing — and a larger sample will not automatically remove it.
          </p>
          <FormulaBlock tex={'\\mathrm{MSE}=\\mathrm{Var}+\\mathrm{Bias}^{2}'} label="Mean squared error" />
        </SmCard>
        <SmCard title="Small and honest vs huge and tilted">
          <Insight title="Try this">
            Compare a small unbiased SRS with a large convenience sample. The huge sample can have a tiny variance and still lose on MSE because bias is squared.
          </Insight>
        </SmCard>
      </div>
    )
  }

  if (tab === 'quiz') {
    return (
      <SmCard title="Check your understanding">
        <QuizBlock
          items={[
            {
              prompt: 'Which of the following best describes a non-sampling error?',
              options: [
                'The natural variation that occurs because a sample is used instead of the population',
                'A lower response rate because some selected individuals do not participate',
                'The difference between a sample statistic and the true population value due to chance',
                'The usual shrinking of the margin of error as n grows',
              ],
              answer: 1,
              explanation: 'Nonresponse is a non-sampling error. Chance variation from using a sample is sampling error.',
            },
            {
              prompt: 'Increasing n generally…',
              options: [
                'removes wording bias',
                'reduces sampling variability',
                'sets bias to 0',
                'makes MSE ignore Bias²',
              ],
              answer: 1,
              explanation: 'Larger n typically shrinks sampling variance. Systematic bias stays unless you change the process.',
            },
            {
              prompt: 'MSE equals…',
              options: ['Var − Bias²', 'Var + Bias²', 'Bias only', 'n/N'],
              answer: 1,
              explanation: 'Mean squared error adds variance and squared bias, so a precise but biased estimator can still be poor.',
            },
          ]}
        />
      </SmCard>
    )
  }

  return (
    <LabSplit
      demo={
        <SmCard title="Explore the two types of error" action={<ResetButton onClick={reset} />}>
          <p className="text-sm leading-6 text-slate-500">
            Adjust the sample size and explore different non-sampling-error sources to see how they affect accuracy. Sampling error decreases with larger samples. Non-sampling error can persist regardless of sample size.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold text-slate-700">Sampling error</p>
              <p className="text-xs text-slate-400">Natural variation because we use a sample instead of the entire population.</p>
              <div className="mt-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Sampling error decreases with larger samples</p>
                <ErrorCurve n={n} p={p} bias={bias} />
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  n = {n.toLocaleString()} · margin of error ≈ {formatPct(moe)}
                </p>
              </div>
              <SmSlider label="Sample size (n)" value={n} min={50} max={5000} step={50} onChange={setN} display={n.toLocaleString()} />
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Larger samples reduce sampling error, but they cannot eliminate non-sampling error.
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Non-sampling error</p>
              <p className="text-xs text-slate-400">Errors for reasons other than using a sample — bias, nonresponse, measurement, or processing mistakes.</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">Explore non-sampling error sources</p>
              <div className="mt-2 space-y-2">
                {SOURCES.map((source) => (
                  <label key={source.id} className="flex items-start gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      className="mt-1 accent-blue-600"
                      checked={Boolean(on[source.id])}
                      onChange={(event) => setOn((prev) => ({ ...prev, [source.id]: event.target.checked }))}
                    />
                    <span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{source.label}</span>
                      <span className="block text-xs text-slate-400">{source.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-600">
                Estimated impact on results: {formatPct(bias)} potential systematic error
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Non-sampling errors introduce systematic error (bias) and may not decrease with larger n.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <MetricCard label="MoE (sampling)" value={formatPct(moe)} />
            <MetricCard label="Bias" value={formatPct(bias)} accent="#d97706" />
            <MetricCard label="MSE (prop.)" value={formatNum(mse((moe / 1.96) ** 2, bias), 4)} hint="Var + Bias²" />
            <MetricCard label="n" value={n.toLocaleString()} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Insight title="Small unbiased SRS (n = 40)">
              Empirical SE {formatNum(compare.small.se)}, bias {formatNum(compare.small.bias)}, MSE {formatNum(compare.small.mse)}.
            </Insight>
            <Insight title="Large convenience sample (n = 240)">
              Empirical SE {formatNum(compare.hugeBiased.se)}, bias {formatNum(compare.hugeBiased.bias)}, MSE {formatNum(compare.hugeBiased.mse)}.
              A bigger n can be worse if the mechanism is biased.
            </Insight>
          </div>
        </SmCard>
      }
      concepts={
        <SmCard title="Key concepts">
          <ConceptList
            items={[
              { title: 'Sampling error', body: 'Natural variation we observe because a sample is used instead of the entire population. It generally decreases with larger samples.', icon: <span className="text-blue-600">◎</span> },
              { title: 'Non-sampling error', body: 'Errors from sources other than sampling: bias, nonresponse, measurement mistakes, or processing mistakes.', icon: <span className="text-amber-600">!</span> },
              { title: 'Precision', body: 'How close repeated samples usually come to each other. Greater precision means lower sampling variability, not automatically lower bias.', icon: <span className="text-blue-600">◎</span> },
              { title: 'Quality control', body: 'Careful survey design, training, pretesting, and data validation reduce non-sampling error.', icon: <span className="text-emerald-600">✓</span> },
            ]}
          />
        </SmCard>
      }
      worked={
        <SmCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">
            A city conducts a survey with a sample of {WORKED.error.n} residents to estimate the proportion who support a new park. The sample proportion is {WORKED.error.phat}.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Sampling error: with n = {WORKED.error.n}, the 95% margin of error is about {formatPct(proportionMoe(WORKED.error.phat, WORKED.error.n))} (1.96 × √(p̂(1−p̂)/n)).</li>
            <li>Non-sampling error: if a question is leading, the estimate may be biased regardless of the sample size.</li>
            <li>Conclusion: a larger sample reduces sampling error, but careful design and quality control are needed to address non-sampling error.</li>
          </ul>
        </SmCard>
      }
      practice={
        <SmCard title="Try it yourself">
          <QuizBlock
            items={[
              {
                prompt: 'Which option describes sampling error rather than non-sampling error?',
                options: [
                  'The natural variation that occurs because a sample is used instead of the population',
                  'A lower response rate because some selected individuals do not participate',
                  'A coding mistake when entering the data',
                  'A leading question that pushes people toward one answer',
                ],
                answer: 0,
                explanation: 'Chance variation from sampling is sampling error. The others are non-sampling errors.',
              },
              {
                prompt: 'A huge convenience sample can lose to a small SRS on MSE because…',
                options: ['variance grows with n', 'MSE = Var + Bias²', 'μ changes', 'k is undefined'],
                answer: 1,
                explanation: 'Squared bias can dominate even when the variance is tiny.',
              },
              {
                prompt: 'Quality control, training, and pretesting mainly reduce…',
                options: ['πᵢ', 'sampling variability only', 'non-sampling error', 'N'],
                answer: 2,
                explanation: 'Those steps target measurement, processing, and design problems — not the chance variation from sampling.',
              },
            ]}
          />
        </SmCard>
      }
    />
  )
}
