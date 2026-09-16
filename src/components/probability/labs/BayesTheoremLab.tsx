import { useMemo, useState } from 'react'
import { bayesPositivePredictive, formatPct, formatProb, markPfLabComplete } from '../../../lib/probabilityFoundations'
import { FormulaBlock, Insight, PfCard, PfSlider, QuizBlock, ResultBanner } from '../shared'

export function BayesTheoremLab({ tab }: { tab: string }) {
  const [prior, setPrior] = useState(0.01)
  const [sensitivity, setSensitivity] = useState(0.95)
  const [fpr, setFpr] = useState(0.05)

  const posterior = useMemo(
    () => bayesPositivePredictive(prior, sensitivity, fpr),
    [prior, sensitivity, fpr],
  )
  const evidence = sensitivity * prior + fpr * (1 - prior)
  const pop = 10000
  const diseased = Math.round(prior * pop)
  const truePos = Math.round(diseased * sensitivity)
  const falsePos = Math.round((pop - diseased) * fpr)

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <PfCard title="Bayes’ Theorem">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            A prior belief is reweighted by how well the evidence matches the hypothesis. The result is the posterior.
          </p>
          <FormulaBlock tex="P(A\\mid B)=\\dfrac{P(B\\mid A)P(A)}{P(B)}" />
        </PfCard>
        <KeyConcepts />
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <PfCard title="Practice">
        <QuizBlock
          prompt="If a disease is rare, why can a very accurate test still have a modest posterior after a positive result?"
          options={[
            'Because false positives from the large healthy group dominate',
            'Because sensitivity must be 100%',
            'Because Bayes cannot use percentages',
            'Because priors never matter',
          ]}
          answer={0}
          explanation="Most people are healthy. Even a small false-positive rate applied to that large group can outnumber the true positives."
          onCorrect={() => markPfLabComplete('bayes-theorem')}
        />
      </PfCard>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_300px]">
      <PfCard title="Diagnostic Testing Example">
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          A medical test is not perfect. Use Bayes’ theorem to find the probability that a person actually has the
          disease given a positive test result.
        </p>
        <div className="mt-4 space-y-4">
          <PfSlider
            label="Disease prevalence (prior) P(D)"
            value={prior}
            min={0.001}
            max={0.1}
            step={0.001}
            onChange={(value) => {
              setPrior(value)
              markPfLabComplete('bayes-theorem')
            }}
            display={formatPct(prior)}
          />
          <PfSlider
            label="Test sensitivity P(+ | D)"
            value={sensitivity}
            min={0.5}
            max={0.99}
            step={0.01}
            onChange={setSensitivity}
            display={formatPct(sensitivity, 0)}
          />
          <PfSlider
            label="False positive rate P(+ | ¬D)"
            value={fpr}
            min={0.001}
            max={0.2}
            step={0.001}
            onChange={setFpr}
            display={formatPct(fpr)}
          />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <FormulaBlock tex="P(D\\mid +)=\\dfrac{P(+\\mid D)P(D)}{P(+\\mid D)P(D)+P(+\\mid D^{c})P(D^{c})}" />
            <p className="mt-2 text-xs leading-5 text-slate-400">
              P(D) prior · P(+|D) sensitivity · P(+|¬D) false-positive rate · P(D|+) posterior
            </p>
          </div>
          <div className="space-y-3">
            <ResultBanner title={`Posterior probability ${formatPct(posterior)}`}>
              P(D | +) = ({formatProb(sensitivity)} × {formatProb(prior)}) / {formatProb(evidence)} = {formatProb(posterior)}
            </ResultBanner>
            <Insight title="Interpretation">
              Even with a {formatPct(sensitivity, 0)} sensitive test, a positive result means there is a {formatPct(posterior)} chance
              of actually having the disease, given a {formatPct(prior)} prevalence and {formatPct(fpr)} false-positive rate.
            </Insight>
          </div>
        </div>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800/80">
          <p className="font-bold text-slate-700 dark:text-slate-200">Natural frequencies out of {pop.toLocaleString()}</p>
          <p className="mt-1 text-slate-500">
            {diseased.toLocaleString()} have the disease · {truePos.toLocaleString()} true positives · {falsePos.toLocaleString()} false
            positives · posterior ≈ {truePos} / {truePos + falsePos}
          </p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full bg-violet-500" style={{ width: `${Math.min(100, posterior * 100)}%` }} />
          </div>
        </div>
      </PfCard>
      <KeyConcepts />
    </div>
  )
}

function KeyConcepts() {
  return (
    <PfCard title="Key Concepts">
      <ul className="space-y-3 text-sm leading-6">
        <li>
          <span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full bg-rose-100 text-xs font-black text-rose-600">P</span>
          <strong>Prior</strong> — your initial belief before seeing new evidence.
        </li>
        <li>
          <span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full bg-blue-100 text-xs font-black text-blue-600">L</span>
          <strong>Likelihood</strong> — probability of the evidence if the hypothesis is true.
        </li>
        <li>
          <span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full bg-amber-100 text-xs font-black text-amber-600">E</span>
          <strong>Evidence</strong> — probability of the same evidence if the hypothesis is false.
        </li>
        <li>
          <span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-600">P</span>
          <strong>Posterior</strong> — updated probability after combining prior, likelihood, and evidence.
        </li>
      </ul>
      <p className="mt-4 rounded-2xl bg-violet-50 px-3 py-2 text-sm italic text-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
        Bayes’ theorem turns new data into better beliefs — a foundation for reasoning under uncertainty.
      </p>
    </PfCard>
  )
}
