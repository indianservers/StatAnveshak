import { useMemo, useState } from 'react'
import {
  formatNum,
  generateLinear,
  generatePreset,
  pearsonR,
  sampleCovariance,
  summarizePair,
  transformPoints,
  WORKED,
  type CaTab,
} from '../../../lib/correlationAssociation'
import { CaCard, CaSelect, CaSlider, ConceptRow, FormulaBlock, Insight, LabExploreGrid, Metric, QuizBlock, ResetButton } from '../shared'
import { MiniCloud, ScatterPlot } from '../plots'

export function CovarianceLab({ tab }: { tab: CaTab }) {
  const [source, setSource] = useState<'study-exam' | 'spread' | 'outliers'>('study-exam')
  const [n, setN] = useState(40)
  const [scaleX, setScaleX] = useState(1)
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [seed, setSeed] = useState(6)

  const base = useMemo(() => {
    if (source === 'outliers') return generatePreset('outlier', n, seed)
    if (source === 'spread') return generateLinear({ n, r: 0.55, noise: 0.7, seed, xMean: 8, xSd: 6, yMean: 70, ySd: 18 })
    return generateLinear({ n, r: 0.72, seed, xMean: 8.5, xSd: 4.2, yMean: 72, ySd: 14 })
  }, [source, n, seed])
  const points = useMemo(() => transformPoints(base, { scaleX }), [base, scaleX])
  const stats = useMemo(() => summarizePair(points), [points])
  const selected = points.find((point) => point.id === selectedId)
  const dx = selected ? selected.x - stats.meanX : Number.NaN
  const dy = selected ? selected.y - stats.meanY : Number.NaN
  const contrib = Number.isFinite(dx) && Number.isFinite(dy) ? dx * dy : Number.NaN
  const table = points
    .map((point) => {
      const dxi = point.x - stats.meanX
      const dyi = point.y - stats.meanY
      return { ...point, dxi, dyi, prod: dxi * dyi }
    })
    .sort((a, b) => Math.abs(b.prod) - Math.abs(a.prod))
    .slice(0, 6)

  const reset = () => {
    setSource('study-exam')
    setN(40)
    setScaleX(1)
    setSelectedId(undefined)
    setSeed(6)
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CaCard title="The covariance formula">
          <p className="text-sm leading-6 text-slate-600">
            Sample covariance averages the products of centered deviations and divides by n − 1. The sign tracks joint
            direction. The units are the product of the two variables’ units.
          </p>
          <FormulaBlock
            tex={'\\mathrm{cov}(X,Y)=\\frac{1}{n-1}\\sum_{i=1}^{n}(x_i-\\bar x)(y_i-\\bar y)'}
            label="Sample covariance"
          />
        </CaCard>
        <CaCard title="Quadrants at the means">
          <p className="text-sm leading-6 text-slate-600">
            Points in the upper-right and lower-left pull covariance up. Points in the other two quadrants pull it down.
            Scaling X to 100X multiplies every dx, so covariance changes and Pearson r does not.
          </p>
        </CaCard>
      </div>
    )
  }

  if (tab === 'practice') {
    const x = WORKED.covariance.map((row) => row.x)
    const y = WORKED.covariance.map((row) => row.y)
    const cov = sampleCovariance(x, y)
    return (
      <CaCard title="Worked example">
        <p className="text-sm leading-6 text-slate-600">
          Study hours {x.join(', ')} with scores {y.join(', ')} give sample covariance {formatNum(cov, 2)}.
        </p>
        <table className="corr-table mt-3">
          <thead>
            <tr>
              <th>x</th>
              <th>y</th>
              <th>x − x̄</th>
              <th>y − ȳ</th>
              <th>(x − x̄)(y − ȳ)</th>
            </tr>
          </thead>
          <tbody>
            {WORKED.covariance.map((row) => {
              const mx = x.reduce((sum, v) => sum + v, 0) / x.length
              const my = y.reduce((sum, v) => sum + v, 0) / y.length
              return (
                <tr key={`${row.x}-${row.y}`}>
                  <td>{row.x}</td>
                  <td>{row.y}</td>
                  <td>{formatNum(row.x - mx, 2)}</td>
                  <td>{formatNum(row.y - my, 2)}</td>
                  <td>{formatNum((row.x - mx) * (row.y - my), 2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </CaCard>
    )
  }

  if (tab === 'quiz') {
    return (
      <CaCard title="Try it yourself">
        <QuizBlock
          items={[
            {
              prompt: 'Which statement describes a negative covariance?',
              options: [
                'Both variables tend to increase together.',
                'As one variable increases, the other tends to decrease.',
                'The variables have no units.',
                'Pearson r must be exactly −1.',
              ],
              answer: 1,
              explanation: 'Negative covariance means opposite-direction deviations dominate the product sum.',
            },
            {
              prompt: 'You replace X with 100X. What happens?',
              options: [
                'Covariance and r both stay the same.',
                'Covariance changes; Pearson r stays the same.',
                'r becomes 100 times larger.',
                'Covariance becomes undefined.',
              ],
              answer: 1,
              explanation: 'Covariance carries units. Pearson r divides by the two standard deviations, so a positive rescaling cancels.',
            },
          ]}
        />
      </CaCard>
    )
  }

  return (
    <LabExploreGrid
      controls={
        <CaCard title="Explore the data" action={<ResetButton onClick={reset} />}>
          <div className="space-y-3">
            <CaSelect
              label="Dataset"
              value={source}
              onChange={(value) => setSource(value as typeof source)}
              options={[
                { value: 'study-exam', label: 'Study hours vs exam scores' },
                { value: 'spread', label: 'More spread' },
                { value: 'outliers', label: 'With outliers' },
              ]}
            />
            <CaSlider label="Data size" value={n} min={12} max={80} step={1} onChange={setN} />
            <CaSlider label="Scale X" value={scaleX} min={1} max={100} step={1} display={`${scaleX}×`} onChange={setScaleX} />
            <p className="text-xs leading-5 text-slate-400">
              Drag the scale to 100×. Covariance jumps; r stays put because both the covariance and s<sub>X</sub> grow together.
            </p>
            <button type="button" className="corr-btn corr-btn-ghost w-full" onClick={() => setSeed((value) => value + 1)}>
              Resample
            </button>
          </div>
        </CaCard>
      }
      plot={
        <CaCard
          title="Scatter plot"
          action={
            <span className="text-xs font-bold text-slate-500">
              cov = {formatNum(stats.cov, 2)} · {stats.cov > 0 ? 'positive' : stats.cov < 0 ? 'negative' : 'near zero'}
            </span>
          }
        >
          <ScatterPlot
            points={points}
            xLabel={scaleX === 1 ? 'Study hours' : `Study hours × ${scaleX}`}
            yLabel="Exam score"
            showTrend
            showMeans
            showQuadrants
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="cov" value={formatNum(stats.cov, 2)} />
            <Metric label="r" value={formatNum(stats.pearson, 3)} />
            <Metric label="sₓ" value={formatNum(stats.sdX, 2)} />
            <Metric label="sᵧ" value={formatNum(stats.sdY, 2)} />
          </div>
          {selected && (
            <Insight title="Selected point">
              dx = {formatNum(dx, 2)}, dy = {formatNum(dy, 2)}, dx × dy = {formatNum(contrib, 2)}. A positive product
              supports positive covariance.
            </Insight>
          )}
        </CaCard>
      }
      aside={
        <CaCard title="Understanding covariance">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <ConceptRow icon="plus" title="Positive covariance">Variables tend to move together.</ConceptRow>
              <MiniCloud kind="pos" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <ConceptRow icon="minus" title="Negative covariance">Variables tend to move in opposite directions.</ConceptRow>
              <MiniCloud kind="neg" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <ConceptRow icon="none" title="Near-zero covariance">No consistent linear direction. Units still matter.</ConceptRow>
              <MiniCloud kind="none" />
            </div>
          </div>
        </CaCard>
      }
      bottom={
        <div className="grid gap-4 lg:grid-cols-2">
          <CaCard title="Largest contributions">
            <table className="corr-table">
              <thead>
                <tr>
                  <th>Point</th>
                  <th>dx</th>
                  <th>dy</th>
                  <th>dx × dy</th>
                </tr>
              </thead>
              <tbody>
                {table.map((row) => (
                  <tr key={row.id} className={row.id === selectedId ? 'is-on' : ''}>
                    <td>{row.id}</td>
                    <td>{formatNum(row.dxi, 2)}</td>
                    <td>{formatNum(row.dyi, 2)}</td>
                    <td>{formatNum(row.prod, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CaCard>
          <CaCard title="Key concepts">
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Sign — same direction or opposite.</li>
              <li>Units — product of the two measurement units.</li>
              <li>Not standardized — magnitude depends on scale.</li>
              <li>Check: Pearson r of the scaled cloud is {formatNum(pearsonR(points.map((p) => p.x), points.map((p) => p.y)), 3)}.</li>
            </ul>
          </CaCard>
        </div>
      }
    />
  )
}
