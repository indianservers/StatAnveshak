import { useMemo, useState } from 'react'
import {
  formatNum,
  formatP,
  generateRepeated,
  oneWayAnova,
  repeatedMeasuresAnova,
  subjectCentered,
  type RmPresetId,
} from '../../../lib/anovaStudio'
import { AnovaCard, AnovaSelect, AnovaSlider, AnovaToggle, Insight, SigBadge } from '../shared'
import { TrajectoryPlot } from '../plots'

export function RepeatedMeasuresAnovaLab() {
  const [preset, setPreset] = useState<RmPresetId>('rm-improvement')
  const [subjects, setSubjects] = useState(12)
  const [conditions, setConditions] = useState(4)
  const [seed, setSeed] = useState(11)
  const [centered, setCentered] = useState(false)
  const rows = useMemo(
    () => generateRepeated({ preset, seed, subjects, conditions }),
    [preset, seed, subjects, conditions],
  )
  const view = centered ? subjectCentered(rows) : rows
  const result = useMemo(() => repeatedMeasuresAnova(rows), [rows])
  const naive = useMemo(() => oneWayAnova(rows), [rows])
  const series = result.subjects.map((subject) => ({
    id: subject.id,
    values: centered ? subject.values.map((value) => value - subject.mean) : subject.values,
  }))

  return (
    <div className="space-y-4">
      <section className="anova-hero grid items-center gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.9fr)]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-500">Same subjects, multiple measurements</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Understand how means change over time or conditions.</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
            Use repeated-measures ANOVA to test whether there are significant differences in a continuous outcome measured multiple times on the same subjects.
          </p>
        </div>
        <AnovaCard title="Mean response over time">
          <TrajectoryPlot series={[]} conditions={result.conditions} means={result.condMeans} height={160} />
        </AnovaCard>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(240px,0.75fr)_minmax(0,1fr)_minmax(250px,0.85fr)]">
        <AnovaCard title="Set up your analysis">
          <div className="space-y-3">
            <AnovaSelect
              label="Preset"
              value={preset}
              onChange={(value) => setPreset(value as RmPresetId)}
              options={[
                { value: 'rm-improvement', label: 'Treatment improvement over time' },
                { value: 'rm-crossover', label: 'Crossover / alternating conditions' },
                { value: 'rm-baseline', label: 'Baseline differences, little change' },
              ]}
            />
            <AnovaSlider label="Number of conditions" value={conditions} min={2} max={6} step={1} onChange={setConditions} />
            <AnovaSlider label="Number of subjects" value={subjects} min={6} max={24} step={1} onChange={setSubjects} />
            <AnovaToggle label="Subject-centered scores" checked={centered} onChange={setCentered} />
            <button type="button" className="anova-btn anova-btn-ghost w-full" onClick={() => setSeed((value) => value + 1)}>
              Resample
            </button>
          </div>
        </AnovaCard>

        <AnovaCard title="View the data">
          <p className="mb-2 text-xs text-slate-400">
            {result.completeCases
              ? `Complete cases: ${result.nSubjects} subjects × ${result.k} conditions.`
              : `${result.dropped} incomplete subject${result.dropped === 1 ? '' : 's'} dropped. Analysis uses complete cases only.`}
          </p>
          <div className="overflow-x-auto">
            <table className="anova-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  {result.conditions.map((cond) => (
                    <th key={cond}>{cond}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.subjects.slice(0, 6).map((subject) => (
                  <tr key={subject.id}>
                    <td>{subject.id}</td>
                    {subject.values.map((value, i) => (
                      <td key={i}>{formatNum(centered ? value - subject.mean : value, 1)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnovaCard>

        <AnovaCard title="Results">
          <p className="text-sm text-slate-500">Within-subjects effect of condition. The error term is SS_error after removing subjects — not the independent one-way MSW.</p>
          <p className="mt-2 text-3xl font-black tabular-nums text-slate-950 dark:text-white">
            F({result.dfCond}, {result.dfErr}) = {formatNum(result.f, 2)}
          </p>
          <p className="text-lg font-bold text-slate-500">p = {formatP(result.p)}</p>
          <div className="mt-2">
            <SigBadge significant={Number.isFinite(result.p) && result.p < 0.05} />
          </div>
          <table className="anova-table mt-3">
            <tbody>
              <tr>
                <td>SS conditions</td>
                <td>{formatNum(result.ssCond, 1)}</td>
              </tr>
              <tr>
                <td>SS subjects</td>
                <td>{formatNum(result.ssSubj, 1)}</td>
              </tr>
              <tr>
                <td>SS error</td>
                <td>{formatNum(result.ssErr, 1)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-400">
            Naive independent one-way would use F({naive.dfB}, {naive.dfW}) = {formatNum(naive.f, 2)}. That ignores the pairing and is the wrong error term.
          </p>
        </AnovaCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
        <AnovaCard title={centered ? 'Subject-centered trajectories' : 'Subject-wise repeated measures'}>
          <p className="mb-2 text-sm text-slate-500">
            Each line is one subject. {centered ? 'Centering removes baseline height so only change remains.' : 'Raw scores keep each person’s baseline in the picture.'}
          </p>
          <TrajectoryPlot series={series} conditions={result.conditions} means={centered ? result.condMeans.map((m) => m - result.grandMean) : result.condMeans} />
        </AnovaCard>
        <AnovaCard title="Sphericity & within-subject design">
          <Insight title={result.sphericity.automatic ? 'Sphericity holds automatically' : 'Mauchly’s test of sphericity'} tone={result.sphericity.automatic || (result.sphericity.p ?? 1) >= 0.05 ? 'ok' : 'warn'}>
            {result.sphericity.note}
          </Insight>
          {!result.sphericity.automatic && result.sphericity.w !== undefined && (
            <p className="mt-2 text-sm tabular-nums text-slate-600">
              W = {formatNum(result.sphericity.w, 2)}, p = {formatP(result.sphericity.p ?? Number.NaN)}. GG ε = {formatNum(result.sphericity.epsGG ?? Number.NaN, 2)}, HF ε = {formatNum(result.sphericity.epsHF ?? Number.NaN, 2)}.
            </p>
          )}
          <p className="mt-3 text-sm leading-6 text-slate-500">
            If sphericity is doubtful, Greenhouse–Geisser or Huynh–Feldt multiply both numerator and denominator df. This lab does not invent a “passed” result when the test is not computed.
          </p>
        </AnovaCard>
      </div>
    </div>
  )
}
