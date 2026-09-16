import { useMemo, useState } from 'react'
import { combination, markPfLabComplete, permutation } from '../../../lib/probabilityFoundations'
import { FormulaBlock, Insight, PfCard, PfStepper, QuizBlock, ResultBanner } from '../shared'

type Mode = 'perm' | 'comb'

const TOPICS = [
  { id: 'mult', title: 'Multiplication rule', detail: 'Count outcomes in stages' },
  { id: 'perm', title: 'Permutations', detail: 'Arrangement matters' },
  { id: 'comb', title: 'Combinations', detail: 'Order does not matter' },
  { id: 'fact', title: 'Factorial', detail: 'Building block for counting' },
]

export function CountingTechniquesLab({ tab }: { tab: string }) {
  const [mode, setMode] = useState<Mode>('perm')
  const [n, setN] = useState(7)
  const [r, setR] = useState(3)

  const safeR = Math.min(r, n)
  const value = mode === 'perm' ? permutation(n, safeR) : combination(n, safeR)
  const objects = useMemo(() => ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, Math.min(n, 8)), [n])
  const preview = objects.slice(0, Math.min(safeR, objects.length))

  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <PfCard title="In this lab">
          <ol className="space-y-2 text-sm">
            {TOPICS.map((topic, index) => (
              <li key={topic.id} className="flex gap-2">
                <span className="font-black text-slate-400">{index + 1}</span>
                <span>
                  <span className="font-bold">{topic.title}</span>
                  <span className="block text-xs text-slate-400">{topic.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </PfCard>
        <PfCard>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Permutations count ordered arrangements. Combinations count unordered groups. That is why AB and BA are
            different permutations but the same combination.
          </p>
          <FormulaBlock tex="nP_r=\\dfrac{n!}{(n-r)!}\\qquad nC_r=\\dfrac{n!}{r!(n-r)!}" />
        </PfCard>
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <PfCard title="Try it yourself">
        <QuizBlock
          prompt="In how many ways can a committee of 3 people be chosen from 10 students?"
          options={['30', '60', '90', '120']}
          answer={3}
          explanation="Order does not matter, so C(10,3) = 120."
          onCorrect={() => markPfLabComplete('counting-techniques')}
        />
      </PfCard>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1.1fr)_300px]">
      <PfCard title="In this lab">
        <ol className="space-y-3 text-sm">
          {TOPICS.map((topic, index) => (
            <li key={topic.id}>
              <span className="font-black text-slate-400">{index + 1}. </span>
              <span className="font-bold">{topic.title}</span>
              <span className="block text-xs text-slate-400">{topic.detail}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-500 dark:bg-slate-800">
          Learning goals: understand the multiplication rule, apply factorial notation, and solve real counting problems.
        </div>
      </PfCard>

      <PfCard title="Counting Calculator">
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`rounded-2xl px-3 py-2 text-sm font-bold ${mode === 'perm' ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800'}`}
            onClick={() => setMode('perm')}
          >
            Permutations P(n, r)
          </button>
          <button
            type="button"
            className={`rounded-2xl px-3 py-2 text-sm font-bold ${mode === 'comb' ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800'}`}
            onClick={() => setMode('comb')}
          >
            Combinations C(n, r)
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <PfStepper label="n · number of items" value={n} min={1} max={20} onChange={setN} />
          <PfStepper
            label="r · number to choose / arrange"
            value={safeR}
            min={0}
            max={n}
            onChange={(value) => {
              setR(value)
              markPfLabComplete('counting-techniques')
            }}
          />
        </div>
        <div className="mt-4">
          <FormulaBlock
            tex={
              mode === 'perm'
                ? `{}_{n}P_{r}=\\dfrac{n!}{(n-r)!}`
                : `{}_{n}C_{r}=\\dfrac{n!}{r!(n-r)!}`
            }
          />
        </div>
        <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-4 text-center dark:bg-emerald-950/30">
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            {mode === 'perm' ? `${n}P${safeR}` : `${n}C${safeR}`} = {n}! / {mode === 'perm' ? `${n - safeR}!` : `${safeR}! (${n - safeR})!`} ={' '}
            <span className="text-3xl font-black">{Number.isFinite(value) ? value.toLocaleString() : '—'}</span>
          </p>
        </div>
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Visual objects</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {objects.map((item) => (
              <span
                key={item}
                className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-black ${
                  preview.includes(item) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                }`}
              >
                {item}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {mode === 'perm'
              ? `Order matters: ${preview.join(' → ') || '—'} is a different arrangement from ${[...preview].reverse().join(' → ') || '—'}.`
              : `Order does not matter: {${preview.join(', ')}} is the same group in any order.`}
          </p>
        </div>
      </PfCard>

      <div className="grid gap-4">
        <PfCard title="Worked example">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            How many different 4-digit codes can be made using the digits 0, 1, 2, 3, 4, 5 if no digit is repeated?
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
            <li>Identify: order matters, so use a permutation.</li>
            <li>n = 6 digits, r = 4 digits.</li>
            <li>
              Apply {`P(6,4) = 6! / 2! = 720 / 2 = ${permutation(6, 4)}`}.
            </li>
          </ol>
          <ResultBanner title={`${permutation(6, 4)} different 4-digit codes can be made.`} />
        </PfCard>
        <Insight title="Why this formula?">
          The first position has n choices, the next has n − 1, and so on for r stages. That product is n! / (n − r)!.
        </Insight>
      </div>
    </div>
  )
}
