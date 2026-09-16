import { useMemo, useState } from 'react'
import {
  formatNum,
  generatePreset,
  olsFit,
  partialCorrelation,
  pearsonR,
  residualsOn,
  summarizePair,
  type CaTab,
  type PresetId,
} from '../../../lib/correlationAssociation'
import { CaCard, CaSelect, ConceptRow, FormulaBlock, Insight, LabExploreGrid, Metric, QuizBlock, ResetButton } from '../shared'
import { Dag, MiniCloud, ScatterPlot } from '../plots'

export function PartialCorrelationLab({ tab }: { tab: CaTab }) {
  const [preset, setPreset] = useState<PresetId>('confounded')
  const [animate, setAnimate] = useState(1)
  const [seed, setSeed] = useState(14)

  const points = useMemo(() => generatePreset(preset, 48, seed), [preset, seed])
  const x = points.map((p) => p.x)
  const y = points.map((p) => p.y)
  const z = points.map((p) => p.z ?? 0)
  const raw = summarizePair(points)
  const rxz = pearsonR(x, z)
  const ryz = pearsonR(y, z)
  const partial = partialCorrelation(x, y, z)
  const residX = residualsOn(z, x)
  const residY = residualsOn(z, y)
  const residualPoints = points.map((point, i) => ({
    ...point,
    x: point.x * (1 - animate) + residX[i] * animate,
    y: point.y * (1 - animate) + residY[i] * animate,
  }))
  const xzPoints = points.map((point) => ({ id: point.id, x: point.x, y: point.z ?? 0 }))
  const yzPoints = points.map((point) => ({ id: point.id, x: point.y, y: point.z ?? 0 }))

  const reset = () => {
    setPreset('confounded')
    setAnimate(1)
    setSeed(14)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CaCard title="Partial correlation">
          <p className="text-sm leading-6 text-slate-600">
            r<sub>XY·Z</sub> is the Pearson correlation of X and Y after each has been residualized on Z. The algebraic
            form matches the residual form when the three pairwise r values are defined.
          </p>
          <FormulaBlock
            tex={'r_{XY\\cdot Z}=\\dfrac{r_{XY}-r_{XZ}r_{YZ}}{\\sqrt{(1-r_{XZ}^2)(1-r_{YZ}^2)}}'}
            label="Partial correlation of X and Y given Z"
          />
        </CaCard>
        <CaCard title="Control is not causation">
          <Insight title="What holding Z fixed does">
            Residualizing removes the linear part of Z from X and from Y. That can reveal confounding or suppression. It
            does not identify a causal effect.
          </Insight>
        </CaCard>
      </div>
    )
  }

  if (tab === 'practice') {
    return (
      <CaCard title="Worked example">
        <p className="text-sm leading-6 text-slate-600">
          On the confounded preset, study-like X and test-like Y often share a common Z. Raw r = {formatNum(raw.pearson, 3)}
          while r<sub>XY·Z</sub> = {formatNum(partial, 3)}. The leftover association is what the residuals still share.
        </p>
      </CaCard>
    )
  }

  if (tab === 'quiz') {
    return (
      <CaCard title="Try it yourself">
        <QuizBlock
          items={[
            {
              prompt: 'If the partial correlation of X and Y given Z is close to zero, what does that suggest?',
              options: [
                'There is a strong unique relationship between X and Y.',
                'The raw XY association is largely accounted for by Z, linearly.',
                'Z causes X and Y.',
                'X and Y are independent in every sense.',
              ],
              answer: 1,
              explanation: 'A near-zero partial says little linear XY association remains after linearly removing Z.',
            },
            {
              prompt: 'Controlling for Z in a partial correlation…',
              options: [
                'proves Z is a confounder',
                'is a residualization, not a causal identification strategy by itself',
                'makes Pearson r undefined',
                'is the same as a randomized experiment',
              ],
              answer: 1,
              explanation: 'Partial correlation is an association measure after linear adjustment.',
            },
          ]}
        />
      </CaCard>
    )
  }

  return (
    <LabExploreGrid
      controls={
        <CaCard title="Explore partial correlation" action={<ResetButton onClick={reset} />}>
          <div className="space-y-3">
            <CaSelect
              label="Dataset"
              value={preset}
              onChange={(value) => setPreset(value as PresetId)}
              options={[
                { value: 'confounded', label: 'Confounded (Z drives X and Y)' },
                { value: 'suppression', label: 'Suppression' },
                { value: 'simpson', label: 'Simpson-style groups' },
                { value: 'ice-cream', label: 'Ice cream / drownings / temperature' },
              ]}
            />
            <label className="block text-sm font-semibold text-slate-600">
              Residualization
              <input
                type="range"
                className="mt-1 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600"
                min={0}
                max={1}
                step={0.02}
                value={animate}
                onChange={(event) => setAnimate(Number(event.target.value))}
              />
              <span className="mt-1 block text-xs text-slate-400">{animate < 0.5 ? 'Raw XY' : 'Residuals of X|Z and Y|Z'}</span>
            </label>
            <button type="button" className="corr-btn corr-btn-ghost w-full" onClick={() => setSeed((value) => value + 1)}>
              Resample
            </button>
          </div>
        </CaCard>
      }
      plot={
        <CaCard title="Variables in the model">
          <Dag
            nodes={[
              { id: 'x', label: 'X', x: 50, y: 100 },
              { id: 'z', label: 'Z', x: 160, y: 36, tone: 'cause' },
              { id: 'y', label: 'Y', x: 270, y: 100 },
            ]}
            edges={[
              { from: 'z', to: 'x' },
              { from: 'z', to: 'y' },
              { from: 'x', to: 'y', dashed: true },
            ]}
            reveal
          />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-xs font-bold text-slate-400">Raw X vs Y · r = {formatNum(raw.pearson, 3)}</p>
              <ScatterPlot points={points} xLabel="X" yLabel="Y" height={180} showTrend />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold text-slate-400">
                Residual XY · r<sub>XY·Z</sub> = {formatNum(partial, 3)}
              </p>
              <ScatterPlot points={residualPoints} xLabel="X residual" yLabel="Y residual" height={180} showTrend />
            </div>
          </div>
        </CaCard>
      }
      aside={
        <CaCard title="Why control for a third variable?">
          <div className="space-y-4">
            <ConceptRow icon="control" title="Confounding variable">
              Z related to both X and Y can create a misleading raw r.
            </ConceptRow>
            <ConceptRow icon="plus" title="What the partial tells you">
              Association leftover after linearly removing Z — not a causal effect.
            </ConceptRow>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-slate-500">Suppression can make |partial| larger than |raw r|.</p>
              <MiniCloud kind="weak" />
            </div>
          </div>
        </CaCard>
      }
      bottom={
        <div className="grid gap-4 lg:grid-cols-3">
          <CaCard title="X vs Z">
            <ScatterPlot points={xzPoints} xLabel="X" yLabel="Z" height={160} showTrend />
            <Metric label="r(X,Z)" value={formatNum(rxz, 3)} />
          </CaCard>
          <CaCard title="Y vs Z">
            <ScatterPlot points={yzPoints} xLabel="Y" yLabel="Z" height={160} showTrend />
            <Metric label="r(Y,Z)" value={formatNum(ryz, 3)} />
          </CaCard>
          <CaCard title="Key concepts">
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Partial r — association after linear control.</li>
              <li>Residuals — X − X̂(Z) and Y − Ŷ(Z).</li>
              <li>OLS slope of X on Z is {formatNum(olsFit(z, x).slope, 3)}.</li>
              <li>Control ≠ causation.</li>
            </ul>
          </CaCard>
        </div>
      }
    />
  )
}
