import { useMemo, useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import {
  DEFAULT_BOOTSTRAP_SAMPLE,
  SamplingDistributionEngine,
  bootstrapResample,
  createRng,
  formatNum,
  percentileInterval,
  sampleStatistic,
  type CltTab,
  type StatisticKind,
} from '../../../lib/samplingDistributionsClt'
import { CltCard, CltSelect, CltSlider, ConceptRow, Insight, LabExploreGrid, Metric, QuizBlock } from '../shared'
import { HistogramChart, NumberGrid } from '../plots'

const PRESETS: Record<string, number[]> = {
  waits: DEFAULT_BOOTSTRAP_SAMPLE,
  scores: [72, 68, 81, 75, 64, 90, 77, 70, 83, 69],
  tiny: [4, 7, 9, 10, 12, 15, 18, 21],
}

export function BootstrapLab({ tab }: { tab: CltTab }) {
  const [preset, setPreset] = useState('waits')
  const [sample, setSample] = useState(PRESETS.waits)
  const [B, setB] = useState(1000)
  const [kind, setKind] = useState<StatisticKind>('mean')
  const [showOriginal, setShowOriginal] = useState(true)
  const [seed, setSeed] = useState(71)
  const engine = useMemo(() => new SamplingDistributionEngine({ seed }), [seed])
  const observed = sampleStatistic(sample, kind)
  const result = useMemo(() => engine.bootstrap(sample, B, kind, seed), [engine, sample, B, kind, seed])
  const rng = useMemo(() => createRng(seed + 5), [seed])
  const resamples = useMemo(
    () => [bootstrapResample(sample, rng), bootstrapResample(sample, rng), bootstrapResample(sample, rng)],
    [sample, rng],
  )
  const [lo, hi] = percentileInterval(result.statistics, 0.95)
  const repeats = resamples.some((row) => new Set(row).size < row.length)

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CltCard title="Bootstrap is not ordinary sampling">
          <p className="text-sm leading-6 text-slate-600">
            Ordinary sampling draws from a population. The bootstrap has only one observed sample, so it draws from that
            sample with replacement. The bootstrap distribution is an empirical stand-in for the sampling distribution,
            not a new census of the population.
          </p>
        </CltCard>
        <CltCard title="What this lab is — and is not">
          <p className="text-sm leading-6 text-slate-600">
            Use the bootstrap to see SE and percentile intuition. It is not a full inference course: no studentized
            intervals, no BCa, no claim that 1,000 resamples make a small n large.
          </p>
        </CltCard>
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <CltCard title={tab === 'quiz' ? 'Check your mastery' : 'Your turn'}>
        <QuizBlock
          prompt="You take a sample of n = 8 test scores and use 1,000 bootstrap resamples to generate a bootstrap distribution of the sample mean. Which statement is true?"
          options={[
            'Each resample is the same size as the original sample (n = 8)',
            'Resampling is done without replacement',
            'The bootstrap distribution will be exactly normal',
            'The standard error from the bootstrap is smaller than the sample standard deviation',
          ]}
          answer={0}
          explanation="A bootstrap resample has the same size as the original sample and is drawn with replacement. Its shape is empirical, not guaranteed normal."
        />
      </CltCard>
    )
  }

  return (
    <LabExploreGrid
      simulation={
        <CltCard
          title="Interactive simulation"
          action={
            <button type="button" className="clt-btn clt-btn-ghost" onClick={() => setSeed((value) => value + 1)}>
              <RotateCcw size={14} aria-hidden /> Reset
            </button>
          }
        >
          <p className="mb-4 text-sm text-slate-500">
            Start with a single sample, repeatedly resample with replacement, and see the bootstrap distribution of a
            chosen statistic. Each resample is the same size as the original sample.
          </p>
          <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1.1fr)]">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Original sample (n = {sample.length})</p>
              <NumberGrid values={sample} />
              <CltSelect
                label="Use a new sample"
                value={preset}
                onChange={(value) => {
                  setPreset(value)
                  setSample(PRESETS[value] ?? DEFAULT_BOOTSTRAP_SAMPLE)
                }}
                options={[
                  { value: 'waits', label: 'Wait times' },
                  { value: 'scores', label: 'Test scores' },
                  { value: 'tiny', label: 'Small custom set' },
                ]}
              />
              <p className="mt-2 text-xs leading-5 text-slate-400">
                This sample will be resampled with replacement to create bootstrap samples.
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Resamples (with replacement)</p>
              <div className="space-y-2 text-xs font-semibold text-slate-600">
                {resamples.map((row, index) => (
                  <p key={index} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                    Resample {index + 1} · {row.map((value) => formatNum(value, 0)).join(', ')}
                    {new Set(row).size < row.length ? ' · repeats' : ''}
                  </p>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Each resample randomly selects {sample.length} values from the original sample, with replacement, so
                values can repeat. {repeats ? 'At least one of these resamples repeats a value.' : ''}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                Bootstrap distribution of the {kind} from {B} resamples
              </p>
              <div className="mb-2 flex flex-wrap gap-2">
                <Metric label="Mean" value={formatNum(result.empiricalMean)} />
                <Metric label="Bootstrap SE" value={formatNum(result.empiricalSd, 3)} />
              </div>
              <HistogramChart
                bins={result.histogram}
                mean={showOriginal ? observed : undefined}
                xLabel={`Bootstrap sample ${kind}`}
                ariaLabel="Bootstrap distribution"
              />
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <CltSlider label="Number of resamples" value={B} min={100} max={5000} step={50} onChange={setB} ticks={[100, 500, 1000, 5000]} />
            <CltSelect
              label="Statistic"
              value={kind}
              onChange={(value) => setKind(value as StatisticKind)}
              options={[
                { value: 'mean', label: 'Mean (x̄)' },
                { value: 'median', label: 'Median' },
              ]}
            />
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" checked={showOriginal} onChange={(event) => setShowOriginal(event.target.checked)} />
              Show observed {kind} of original sample ({formatNum(observed)})
            </label>
          </div>
          <button type="button" className="clt-btn mt-3" onClick={() => setSeed((value) => value + 1)}>
            <Play size={14} aria-hidden /> Resample
          </button>
        </CltCard>
      }
      concepts={
        <CltCard title="Key concepts">
          <div className="space-y-4">
            <ConceptRow icon="resample" title="Resampling">
              Draw many samples from your original data, each the same size, to mimic the sampling process.
            </ConceptRow>
            <ConceptRow icon="dice" title="Sampling with replacement">
              Each resample randomly selects observations with replacement, so values can appear more than once.
            </ConceptRow>
            <ConceptRow icon="bars" title="Bootstrap distribution">
              The distribution of a statistic (for example the mean) computed from many resamples.
            </ConceptRow>
            <ConceptRow icon="interval" title="Confidence-interval intuition">
              Use percentiles — the 2.5% and 97.5% points — to form an interval from the bootstrap distribution, without
              leaning on a theoretical sampling model.
            </ConceptRow>
            <Insight title="Not the same as sampling the population">
              Ordinary sampling asks the population. The bootstrap asks the sample, with replacement, because the
              population is gone.
            </Insight>
          </div>
        </CltCard>
      }
      example={
        <CltCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600">
            A researcher collected a sample of n = 7 wait times (minutes) at a coffee shop and wants an interval for the
            mean.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
            <li>Original sample: 12, 15, 11, 17, 13, 16, 12</li>
            <li>Number of resamples: 1,000</li>
            <li>
              In this run the bootstrap mean is {formatNum(result.empiricalMean)} with SE {formatNum(result.empiricalSd, 3)}
            </li>
            <li>
              A 95% percentile interval is about {formatNum(lo)} to {formatNum(hi)}
            </li>
          </ul>
          <p className="mt-2 text-sm text-slate-500">
            Even with a small sample, bootstrap resampling provides a reasonable empirical picture of uncertainty for
            the mean. It does not enlarge n.
          </p>
        </CltCard>
      }
      practice={
        <CltCard title="Try it yourself" action={<span className="text-[11px] font-semibold text-slate-400">Question 1 of 3</span>}>
          <QuizBlock
            prompt="You take a sample of n = 8 scores and 1,000 bootstrap resamples of the mean. Which is true?"
            options={[
              'Each resample is the same size as the original sample (n = 8)',
              'Resampling is done without replacement',
              'The bootstrap distribution will be exactly normal',
              'The bootstrap SE is smaller than the sample standard deviation by design',
            ]}
            answer={0}
            explanation="Same n, with replacement. The SE is an empirical SD of the statistic, not a promise it is smaller than s."
          />
        </CltCard>
      }
    />
  )
}
