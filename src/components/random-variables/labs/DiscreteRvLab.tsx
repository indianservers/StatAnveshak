import { useMemo, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import {
  binomialPmf,
  coinPmf,
  diePmf,
  discreteCdfAt,
  discreteMean,
  discretePmfAt,
  discreteVariance,
  empiricalFrequencies,
  formatFixed,
  formatNum,
  isValidPmf,
  markRvLabComplete,
  normalizePmf,
  pmfSum,
  randomPmf,
  sampleDiscrete,
  twoDiceSumPmf,
  type DiscreteMass,
} from '../../../lib/randomVariables'
import { MathText } from '../../ui/MathText'
import { PMFChart } from '../plots'
import { ChipToggle, ConceptList, Insight, LabSplit, QuizBlock, ResetButton, ResultBanner, RvCard, RvSelect } from '../shared'

type Preset = 'die' | 'coin' | 'heads' | 'dice-sum' | 'bernoulli' | 'custom'

const CONCEPTS = [
  { id: 'support', title: 'Support', detail: 'The set of possible values a discrete random variable can take, written {x₁, x₂, …}.' },
  { id: 'pmf', title: 'Probability mass function (PMF)', detail: 'p(x) = P(X = x) assigns a probability to each value, with 0 ≤ p(x) ≤ 1 and Σ p(x) = 1.' },
  { id: 'mean', title: 'Expected value', detail: 'The long-run average value, computed as E[X] = Σ x p(x).' },
]

function presetMass(preset: Preset, custom: DiscreteMass[]): DiscreteMass[] {
  if (preset === 'die') return diePmf()
  if (preset === 'coin' || preset === 'bernoulli') return coinPmf(0.5)
  if (preset === 'heads') return binomialPmf(3, 0.5)
  if (preset === 'dice-sum') return twoDiceSumPmf()
  return custom
}

export function DiscreteRvLab({ tab }: { tab: string }) {
  const [preset, setPreset] = useState<Preset>('die')
  const [custom, setCustom] = useState<DiscreteMass[]>([
    { x: 1, p: 0.2 },
    { x: 2, p: 0.2 },
    { x: 3, p: 0.2 },
    { x: 4, p: 0.2 },
    { x: 5, p: 0.2 },
  ])
  const [showLabels, setShowLabels] = useState(true)
  const [selected, setSelected] = useState<number | null>(1)
  const [draws, setDraws] = useState<number[]>([])
  const [concept, setConcept] = useState('support')

  const items = useMemo(() => presetMass(preset, custom), [custom, preset])
  const mean = discreteMean(items)
  const variance = discreteVariance(items)
  const valid = isValidPmf(items)
  const support = items.map((item) => item.x)
  const empirical = empiricalFrequencies(draws, support)
  const selectedP = selected === null ? 0 : discretePmfAt(items, selected)

  const reset = () => {
    setPreset('die')
    setCustom([
      { x: 1, p: 0.2 },
      { x: 2, p: 0.2 },
      { x: 3, p: 0.2 },
      { x: 4, p: 0.2 },
      { x: 5, p: 0.2 },
    ])
    setDraws([])
    setSelected(1)
  }

  const simulate = (n: number) => {
    setDraws((prev) => [...prev, ...sampleDiscrete(items, n)])
    markRvLabComplete('discrete-random-variables')
  }

  const practice = (
    <RvCard title="Try it yourself" icon={<GraduationCap size={16} />} action={<span className="text-[11px] font-bold text-slate-400">Practice question</span>}>
      <QuizBlock
        prompt="A fair coin is tossed 3 times. Let X be the number of heads. What is P(X = 2)?"
        options={['1/8', '3/8', '1/2', '3/4']}
        answer={1}
        explanation="There are C(3,2) = 3 sequences with exactly two heads, each with probability 1/8, so P(X = 2) = 3/8."
        onCorrect={() => markRvLabComplete('discrete-random-variables')}
      />
    </RvCard>
  )

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <RvCard title={tab === 'quiz' ? 'Quiz' : 'Practice'}>
        <QuizBlock
          prompt={tab === 'quiz' ? 'A fair six-sided die is rolled. What is E[X]?' : 'A fair coin is tossed 3 times. Let X be the number of heads. What is P(X = 2)?'}
          options={tab === 'quiz' ? ['3', '3.5', '4', '21/6'] : ['1/8', '3/8', '1/2', '3/4']}
          answer={1}
          explanation={tab === 'quiz' ? 'E[X] = (1+2+3+4+5+6)/6 = 3.5.' : 'C(3,2)/8 = 3/8.'}
          onCorrect={() => markRvLabComplete('discrete-random-variables')}
        />
      </RvCard>
    )
  }

  return (
    <LabSplit
      demo={
        <RvCard
          title="Interactive PMF demo"
          action={<ResetButton onClick={reset} />}
        >
          <p className="mb-3 text-xs text-slate-400">Explore the probability mass function of a discrete random variable.</p>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <RvSelect
              label="Random experiment"
              value={preset}
              onChange={(value) => {
                setPreset(value as Preset)
                setDraws([])
              }}
              options={[
                { value: 'die', label: 'Roll a fair die' },
                { value: 'coin', label: 'Coin toss' },
                { value: 'heads', label: 'Number of heads (3 tosses)' },
                { value: 'dice-sum', label: 'Sum of two dice' },
                { value: 'bernoulli', label: 'Bernoulli trial' },
                { value: 'custom', label: 'Custom discrete distribution' },
              ]}
            />
            <ChipToggle checked={showLabels} onChange={setShowLabels} label="Show probabilities" />
          </div>
          {preset === 'custom' && (
            <div className="mb-4 overflow-x-auto">
              <table className="rv-table">
                <thead>
                  <tr>
                    <th>x</th>
                    <th>P(X = x)</th>
                  </tr>
                </thead>
                <tbody>
                  {custom.map((row, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          className="rv-input"
                          type="number"
                          value={row.x}
                          onChange={(event) => {
                            const next = custom.map((item, i) => (i === index ? { ...item, x: Number(event.target.value) } : item))
                            setCustom(next)
                          }}
                        />
                      </td>
                      <td>
                        <input
                          className="rv-input"
                          type="number"
                          min={0}
                          step={0.01}
                          value={row.p}
                          onChange={(event) => {
                            const next = custom.map((item, i) => (i === index ? { ...item, p: Number(event.target.value) } : item))
                            setCustom(next)
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="rv-btn rv-btn-ghost" onClick={() => setCustom(normalizePmf(custom))}>
                  Normalize
                </button>
                <button type="button" className="rv-btn rv-btn-ghost" onClick={() => setCustom(randomPmf(custom.map((item) => item.x)))}>
                  Randomize
                </button>
              </div>
            </div>
          )}
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">Probability mass function (PMF)</p>
            <p className="text-xs font-semibold text-slate-400">
              P(X = {selected ?? 'x'}) = {selected === null ? '—' : formatNum(selectedP, 4)}
            </p>
          </div>
          <PMFChart items={items} empirical={draws.length ? empirical : undefined} selected={selected} showLabels={showLabels} mean={mean} onSelect={setSelected} />
          {selected !== null && (
            <p className="mt-2 text-xs text-slate-500">
              x = {selected}, P(X = x) = {formatNum(selectedP, 4)}, F(x) = P(X ≤ x) = {formatNum(discreteCdfAt(items, selected), 4)}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {[1, 10, 100, 1000, 10000].map((n) => (
              <button key={n} type="button" className="rv-btn rv-btn-ghost" onClick={() => simulate(n)}>
                {n.toLocaleString()} draw{n === 1 ? '' : 's'}
              </button>
            ))}
            <button type="button" className="rv-btn rv-btn-ghost" onClick={() => setDraws([])}>
              Clear simulation
            </button>
          </div>
          {draws.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              {draws.length.toLocaleString()} draws. Amber bars are experimental frequencies; blue bars are theoretical probabilities.
            </p>
          )}
          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <Insight title="Insight">
              {preset === 'die'
                ? 'A fair die has 6 equally likely outcomes, so each value from 1 to 6 has probability 1/6 ≈ 0.1667.'
                : 'Click a bar to read P(X = x). If you edit a custom PMF, normalize so the masses sum to 1.'}
            </Insight>
            <ResultBanner tone={valid ? 'ok' : 'warn'} title={`Σ P(X = x) = ${formatFixed(pmfSum(items), 2)}`}>
              E[X] = {formatFixed(mean, 2)} · Var(X) = {formatFixed(variance, 2)}
            </ResultBanner>
          </div>
        </RvCard>
      }
      concepts={
        <RvCard title="Key concepts">
          <ConceptList items={CONCEPTS} active={concept} onSelect={setConcept} />
          <div className="mt-4">
            <FormulaBlockFor concept={concept} />
          </div>
        </RvCard>
      }
      worked={
        <RvCard title="Worked example" action={<span className="text-[11px] font-bold text-slate-400">Example 1</span>}>
          <p className="text-sm leading-6 text-slate-600">
            A fair die is rolled. Let X be the number showing on the die. Find the probability mass function and the expected value.
          </p>
          <div className="mt-3 space-y-1 text-sm text-slate-600">
            <p>Support: S = {'{1, 2, 3, 4, 5, 6}'}</p>
            <p>PMF: P(X = x) = 1/6 for x = 1, …, 6</p>
            <p>Expected value: E[X] = Σ x · (1/6) = 3.5</p>
          </div>
        </RvCard>
      }
      practice={practice}
    />
  )
}

function FormulaBlockFor({ concept }: { concept: string }) {
  if (concept === 'pmf') return <MathText value={'0 \\le p(x) \\le 1,\\quad \\sum_x p(x) = 1'} block />
  if (concept === 'mean') return <MathText value={'E[X] = \\sum_x x\\,p(x)'} block />
  return <MathText value={'S = \\{x_1, x_2, \\ldots\\}'} block />
}

