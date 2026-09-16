import { useMemo, useState } from 'react'
import { formatProb, markPfLabComplete, renormalizePartition, totalProbability } from '../../../lib/probabilityFoundations'
import { FormulaBlock, Insight, PfCard, PfSlider, QuizBlock, ResultBanner } from '../shared'

const HOSPITALS = [
  { id: 'b1', name: 'Hospital B₁', place: 'General hospital' },
  { id: 'b2', name: 'Hospital B₂', place: 'City medical center' },
  { id: 'b3', name: 'Hospital B₃', place: 'Specialty clinic' },
]

export function TotalProbabilityLab({ tab }: { tab: string }) {
  const [weights, setWeights] = useState([0.5, 0.3, 0.2])
  const [conds, setConds] = useState([0.1, 0.2, 0.4])

  const pA = useMemo(
    () => totalProbability(weights.map((weight, index) => ({ weight, conditional: conds[index] ?? 0 }))),
    [weights, conds],
  )
  const parts = weights.map((weight, index) => weight * (conds[index] ?? 0))
  const valid = Math.abs(weights.reduce((sum, value) => sum + value, 0) - 1) < 0.001

  const setWeight = (index: number, value: number) => {
    setWeights(renormalizePartition(weights, index, value))
    markPfLabComplete('law-of-total-probability')
  }

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <PfCard title="Law of Total Probability">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            If B₁, B₂, …, Bₙ partition the sample space, any event A can be rebuilt by weighting each conditional
            probability by the size of its piece.
          </p>
          <FormulaBlock tex="P(A)=\\sum_{i=1}^{n} P(A\\mid B_i)P(B_i)" />
        </PfCard>
        <KeyConcepts pA={pA} />
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <PfCard title="Practice">
        <QuizBlock
          prompt="If P(B₁)=0.5, P(A|B₁)=0.1, P(B₂)=0.3, P(A|B₂)=0.2, P(B₃)=0.2, P(A|B₃)=0.4, what is P(A)?"
          options={['0.15', '0.19', '0.23', '0.40']}
          answer={1}
          explanation="0.10×0.50 + 0.20×0.30 + 0.40×0.20 = 0.05 + 0.06 + 0.08 = 0.19."
          onCorrect={() => markPfLabComplete('law-of-total-probability')}
        />
      </PfCard>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_300px]">
      <div className="grid gap-4">
        <PfCard title="Interactive example: disease testing across hospitals">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            A patient is tested at one of three hospitals. Each hospital has a different share of patients and a
            different positive-test rate. Use the sliders to see the law of total probability work.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {HOSPITALS.map((hospital, index) => (
              <div key={hospital.id} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/80">
                <p className="text-sm font-bold">{hospital.name}</p>
                <p className="text-[11px] text-slate-400">{hospital.place}</p>
                <div className="mt-3 space-y-3">
                  <PfSlider
                    label={`P(${hospital.id.toUpperCase()})`}
                    value={weights[index] ?? 0}
                    min={0.02}
                    max={0.9}
                    step={0.01}
                    onChange={(value) => setWeight(index, value)}
                    display={formatProb(weights[index] ?? 0)}
                  />
                  <PfSlider
                    label={`P(A | ${hospital.id.toUpperCase()})`}
                    value={conds[index] ?? 0}
                    min={0.01}
                    max={0.8}
                    step={0.01}
                    onChange={(value) => {
                      const next = [...conds]
                      next[index] = value
                      setConds(next)
                    }}
                    display={formatProb(conds[index] ?? 0)}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            {valid ? (
              <ResultBanner title="Valid partition!">
                P(B₁) + P(B₂) + P(B₃) = {formatProb(weights.reduce((sum, value) => sum + value, 0))} (must sum to 1)
              </ResultBanner>
            ) : (
              <ResultBanner tone="warn" title="Partition must sum to 1" />
            )}
          </div>
        </PfCard>

        <div className="grid gap-4 md:grid-cols-2">
          <PfCard title="Law of Total Probability">
            <FormulaBlock tex="P(A)=\\sum_{i=1}^{n} P(A\\mid B_i)P(B_i)" />
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              P(A) = {parts.map((part, index) => `(${formatProb(conds[index] ?? 0)})(${formatProb(weights[index] ?? 0)})`).join(' + ')}
              <br />
              = {parts.map((part) => formatProb(part)).join(' + ')} = {formatProb(pA)}
            </p>
          </PfCard>
          <PfCard title="Result">
            <p className="text-4xl font-black text-slate-950 dark:text-white">P(A) = {formatProb(pA, 3)}</p>
            <Insight title="What does this mean?">
              We are averaging the conditional probabilities across hospitals, weighted by how likely each hospital is.
            </Insight>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full">
              {parts.map((part, index) => (
                <span
                  key={HOSPITALS[index].id}
                  className={index === 0 ? 'bg-blue-400' : index === 1 ? 'bg-violet-400' : 'bg-fuchsia-400'}
                  style={{ width: `${Math.max(2, (part / Math.max(pA, 0.001)) * 100)}%` }}
                />
              ))}
            </div>
          </PfCard>
        </div>
      </div>
      <KeyConcepts pA={pA} />
    </div>
  )
}

function KeyConcepts({ pA }: { pA: number }) {
  return (
    <PfCard title="Key Concepts">
      <ol className="space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
        <li>
          <strong>1. Partition of events</strong>
          <br />
          B₁, B₂, B₃ form a partition if they are mutually exclusive and exhaustive.
        </li>
        <li>
          <strong>2. Total probability rule</strong>
          <br />
          P(A) = {formatProb(pA)} is the overall probability of A after accounting for every piece of the partition.
        </li>
        <li>
          <strong>3. Connection to Bayes</strong>
          <br />
          Bayes uses this expansion in the denominator: P(Bₖ | A) = P(A | Bₖ)P(Bₖ) / P(A).
        </li>
      </ol>
    </PfCard>
  )
}
