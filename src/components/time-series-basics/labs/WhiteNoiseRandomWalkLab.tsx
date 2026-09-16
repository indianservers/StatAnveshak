import { useMemo, useState } from 'react'
import { formatNum, randomWalk, sampleAcf, variance, whiteNoise } from '../../../lib/timeSeriesBasics'
import { ConceptList, FormulaBlock, HandNote, Insight, ResetButton, TsCard, TsSlider, TsToggle } from '../shared'
import { TimeChart } from '../plots'

export function WhiteNoiseRandomWalkLab() {
  const [n, setN] = useState(200)
  const [seed, setSeed] = useState(42)
  const [drift, setDrift] = useState(0)
  const [paths, setPaths] = useState(3)
  const [showDrift, setShowDrift] = useState(false)
  const innovations = useMemo(() => whiteNoise(n, seed), [n, seed])
  const wn = innovations
  const rw = useMemo(() => randomWalk(innovations, showDrift ? drift : 0), [drift, innovations, showDrift])
  const extra = useMemo(
    () => Array.from({ length: Math.max(0, paths - 1) }, (_, i) => randomWalk(whiteNoise(n, seed + 17 * (i + 1)), showDrift ? drift : 0)),
    [drift, n, paths, seed, showDrift],
  )
  const wnAcf = sampleAcf(wn, 8)
  const rwAcf = sampleAcf(rw, 8)

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <HandNote>Different processes. Different futures.</HandNote>
        <div className="grid gap-4 lg:grid-cols-2">
          <TsCard title="White noise">
            <TimeChart series={[{ id: 'wn', label: 'White noise (solid)', values: wn }]} height={260} xLabel="Time" yLabel="Value" />
            <p className="mt-2 text-sm text-slate-500">Unpredictable at every step. Same shocks as the walk on the right.</p>
          </TsCard>
          <TsCard title="Random walk">
            <TimeChart
              series={[
                { id: 'rw', label: 'Random walk (solid)', values: rw, color: '#7c3aed' },
                ...extra.map((path, i) => ({
                  id: `rw-${i}`,
                  label: `Other path ${i + 2} (${['dashed', 'dotted'][i % 2]})`,
                  values: path,
                  color: '#94a3b8',
                  dashed: i % 2 === 0,
                  dotted: i % 2 === 1,
                })),
              ]}
              height={260}
              xLabel="Time"
              yLabel="Value"
            />
            <p className="mt-2 text-sm text-slate-500">Cumulative sum of those shocks. Variance grows over time. No-drift paths still wander.</p>
          </TsCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <TsCard title="White-noise properties" className="ts-wash-violet">
            <ConceptList
              items={[
                'The next value is independent of the past.',
                `Variance stays put: ${formatNum(variance(wn), 2)}.`,
                `Lag-1 ACF ≈ ${formatNum(wnAcf.values[1] ?? Number.NaN, 2)} (near 0 in large samples).`,
                'No trend and no structure.',
              ]}
            />
          </TsCard>
          <TsCard title="Random-walk properties">
            <ConceptList
              items={[
                'The next change is the shock. The level remembers everything.',
                'Variance grows with time.',
                `Lag-1 ACF ≈ ${formatNum(rwAcf.values[1] ?? Number.NaN, 2)} (typically near 1).`,
                'Non-stationary. Shocks have permanent effects.',
              ]}
            />
          </TsCard>
          <TsCard title="Worked example">
            <FormulaBlock tex={'Y_t = Y_{t-1} + \\varepsilon_t,\\quad \\varepsilon_t\\sim\\mathcal{N}(0,\\sigma^2)'} label="Random walk" />
            <p className="mt-2 text-sm text-slate-600">White noise is just the shocks: Y_t = ε_t. Same ε sequence, two different series.</p>
          </TsCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TsCard title="Comparison summary">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2">Feature</th>
                    <th>White noise</th>
                    <th>Random walk</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  <tr><td className="py-1.5 font-semibold">Predictability</td><td>None</td><td>None for the change; the level persists</td></tr>
                  <tr><td className="py-1.5 font-semibold">Variance</td><td>Constant</td><td>Increases with t</td></tr>
                  <tr><td className="py-1.5 font-semibold">Autocorrelation</td><td>Near 0</td><td>High and positive</td></tr>
                  <tr><td className="py-1.5 font-semibold">Stationarity</td><td>Yes</td><td>No</td></tr>
                  <tr><td className="py-1.5 font-semibold">Shock effect</td><td>Temporary</td><td>Permanent</td></tr>
                </tbody>
              </table>
            </div>
          </TsCard>
          <TsCard title="Key takeaways" className="ts-wash-amber">
            <ConceptList
              items={[
                'White noise is pure randomness with no memory.',
                'A random walk is unpredictable in its increments, yet the path remembers every shock.',
                'White noise has constant variance; a random walk does not.',
                'These two processes are the baseline for later ARIMA models.',
              ]}
            />
          </TsCard>
        </div>
      </div>

      <aside className="space-y-4">
        <TsCard title="Simulation controls">
          <div className="space-y-3">
            <TsSlider label="Simulation length (T)" value={n} min={50} max={400} step={10} onChange={setN} />
            <TsSlider label="Random seed" value={seed} min={1} max={200} step={1} onChange={setSeed} />
            <TsSlider label="Extra random-walk paths" value={paths} min={1} max={5} step={1} onChange={setPaths} />
            <TsToggle label="Add drift" checked={showDrift} onChange={setShowDrift} />
            {showDrift && <TsSlider label="Drift c" value={drift} min={-0.3} max={0.3} step={0.05} onChange={setDrift} display={formatNum(drift, 2)} />}
            <Insight title="Same shocks">Keep the seed fixed. White noise is ε_t; the walk is the running sum of those ε_t.</Insight>
            <button type="button" className="ts-btn w-full" onClick={() => setSeed((value) => value + 1)}>
              Regenerate
            </button>
            <ResetButton
              onClick={() => {
                setN(200)
                setSeed(42)
                setPaths(3)
                setShowDrift(false)
                setDrift(0)
              }}
              label="Reset to defaults"
            />
          </div>
        </TsCard>
      </aside>
    </div>
  )
}
