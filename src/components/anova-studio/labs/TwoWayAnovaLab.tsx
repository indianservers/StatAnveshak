import { useMemo, useState } from 'react'
import {
  formatNum,
  formatP,
  generateTwoWay,
  simpleEffectsA,
  twoWayAnova,
  type TwoWayPresetId,
} from '../../../lib/anovaStudio'
import { AnovaCard, AnovaSelect, AnovaToggle, Insight, SigBadge } from '../shared'
import { InteractionPlot } from '../plots'

export function TwoWayAnovaLab() {
  const [preset, setPreset] = useState<TwoWayPresetId>('interaction')
  const [unbalanced, setUnbalanced] = useState(false)
  const [showLines, setShowLines] = useState(true)
  const [showPoints, setShowPoints] = useState(true)
  const [seed, setSeed] = useState(21)
  const rows = useMemo(() => generateTwoWay({ preset, seed, nPerCell: 4, unbalanced }), [preset, seed, unbalanced])
  const result = useMemo(() => twoWayAnova(rows), [rows])
  const simple = useMemo(() => (result.interactionDominates ? simpleEffectsA(rows) : []), [result.interactionDominates, rows])
  const term = (name: string) => result.terms.find((item) => item.name === name)

  return (
    <div className="space-y-4">
      <section className="anova-hero">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-500">More than main effects</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Do factors work together?</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
          Use two-way ANOVA to test the effects of two categorical factors and whether their interaction significantly influences a response variable.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Insight title="Two main effects">Test the effect of each factor independently, averaging over the other.</Insight>
          <Insight title="Interaction effect">See if the effect of one factor depends on the level of the other.</Insight>
          <Insight title="Real-world insight" tone="ok">Discover more nuanced patterns than a one-way split can show.</Insight>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(230px,0.7fr)_minmax(0,1.1fr)_minmax(260px,0.85fr)]">
        <AnovaCard title="Data & plot controls">
          <div className="space-y-3">
            <AnovaSelect
              label="Dataset"
              value={preset}
              onChange={(value) => setPreset(value as TwoWayPresetId)}
              options={[
                { value: 'plant-growth', label: 'Plant growth (example)' },
                { value: 'interaction', label: 'Crossing interaction' },
                { value: 'no-interaction', label: 'Parallel / no interaction' },
              ]}
            />
            <AnovaToggle label="Show interaction lines" checked={showLines} onChange={setShowLines} />
            <AnovaToggle label="Show cell-mean markers" checked={showPoints} onChange={setShowPoints} />
            <AnovaToggle label="Unbalanced cells (Type I SS)" checked={unbalanced} onChange={setUnbalanced} />
            <button type="button" className="anova-btn anova-btn-ghost w-full" onClick={() => setSeed((value) => value + 1)}>
              Resample
            </button>
            <p className="text-xs leading-5 text-slate-400">{result.ssNote}</p>
          </div>
        </AnovaCard>

        <AnovaCard title="Interaction plot">
          <p className="mb-2 text-sm text-slate-500">
            Parallel lines suggest no interaction. Crossing or fanning lines suggest the effect of Factor B changes with Factor A. Markers: circle / square / triangle for A levels.
          </p>
          <InteractionPlot cells={result.cells} aLevels={result.aLevels} bLevels={result.bLevels} showLines={showLines} showPoints={showPoints} />
        </AnovaCard>

        <AnovaCard title="ANOVA results">
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
              {result.terms.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{item.df}</td>
                  <td>{formatNum(item.ss, 1)}</td>
                  <td>{formatNum(item.ms, 1)}</td>
                  <td>{formatNum(item.f, 2)}</td>
                  <td>{formatP(item.p)}</td>
                </tr>
              ))}
              <tr>
                <td>Error (within)</td>
                <td>{result.error.df}</td>
                <td>{formatNum(result.error.ss, 1)}</td>
                <td>{formatNum(result.error.ms, 1)}</td>
                <td>—</td>
                <td>—</td>
              </tr>
              <tr>
                <td>Total</td>
                <td>{result.n - 1}</td>
                <td>{formatNum(result.sst, 1)}</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-400">
            SS type: {result.ssType === 'balanced' ? 'balanced (I = II = III)' : 'Type I sequential'}. Partial η² for A × B uses SS_AB / (SS_AB + SS_E) = {formatNum(term('A × B')?.partialEta2 ?? Number.NaN, 3)}.
          </p>
        </AnovaCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <AnovaCard title="Hypotheses">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            <span className="font-bold">Factor A.</span> H₀: the mean response is the same across all levels of A.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <span className="font-bold">Factor B.</span> H₀: the mean response is the same across all levels of B.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <span className="font-bold">Interaction A × B.</span> H₀: the effect of A does not depend on B.
          </p>
        </AnovaCard>
        <AnovaCard title="Cell means and marginals">
          <table className="anova-table">
            <thead>
              <tr>
                <th>A \ B</th>
                {result.bLevels.map((b) => (
                  <th key={b}>{b}</th>
                ))}
                <th>A mean</th>
              </tr>
            </thead>
            <tbody>
              {result.aLevels.map((a) => (
                <tr key={a}>
                  <td>{a}</td>
                  {result.bLevels.map((b) => (
                    <td key={b}>{formatNum(result.cells.find((cell) => cell.a === a && cell.b === b)?.mean ?? Number.NaN, 1)}</td>
                  ))}
                  <td>{formatNum(result.marginalA.find((g) => g.name === a)?.mean ?? Number.NaN, 1)}</td>
                </tr>
              ))}
              <tr>
                <td>B mean</td>
                {result.bLevels.map((b) => (
                  <td key={b}>{formatNum(result.marginalB.find((g) => g.name === b)?.mean ?? Number.NaN, 1)}</td>
                ))}
                <td>{formatNum(result.grandMean, 1)}</td>
              </tr>
            </tbody>
          </table>
        </AnovaCard>
        <AnovaCard title="Key takeaways">
          <ol className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <li>Main effects test each factor after averaging over the other.</li>
            <li>An interaction means the effect of one factor depends on the level of the other.</li>
            <li>A significant interaction is a reason to interpret main effects with caution.</li>
            <li>Interaction plots make parallel versus crossing visible.</li>
          </ol>
        </AnovaCard>
      </div>

      {result.interactionDominates && (
        <AnovaCard title="Simple effects (interaction dominates)">
          <p className="mb-2 text-sm text-slate-500">
            The A × B F is larger than either main-effect F and is significant. Compare Factor A inside each level of B rather than averaging over B.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {simple.map((item) => (
              <div key={item.b} className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-800/70">
                <p className="text-sm font-bold">B = {item.b}</p>
                <p className="text-sm tabular-nums">
                  F({item.result.dfB}, {item.result.dfW}) = {formatNum(item.result.f, 2)}, p = {formatP(item.result.p)}
                </p>
                <SigBadge significant={item.result.significant} />
              </div>
            ))}
          </div>
        </AnovaCard>
      )}
    </div>
  )
}
