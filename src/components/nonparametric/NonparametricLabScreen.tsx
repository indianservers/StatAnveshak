import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, RotateCcw, Shuffle } from 'lucide-react'
import type { Studio, StudioLab } from '../../lib/statisticsStudios'
import { labPath, studioPath } from '../../lib/statisticsStudios'
import { averageRanks, bootstrapDifference, exactPermutation, kruskalWallis, mannWhitney, mean, median, signTest, signedRankTest } from '../../lib/nonparametricLabs'

const format = (value: number, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : '—'
const formatP = (value: number) => value < 0.001 ? '< 0.001' : format(value, 3)

function Card({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
    <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-100">{title}</h2>{children}
  </section>
}

function Slider({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300">
    <span className="mb-1 flex justify-between"><span>{label}</span><output className="font-black tabular-nums text-lime-700 dark:text-lime-300">{value}</output></span>
    <input className="w-full accent-lime-600" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
  </label>
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-xl font-black tabular-nums text-slate-900 dark:text-white">{value}</p>
    {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
  </div>
}

function Decision({ p, alpha, context }: { p: number; alpha: number; context: string }) {
  const reject = p <= alpha
  return <div className={`rounded-xl border p-4 text-sm leading-6 ${reject ? 'border-lime-300 bg-lime-50 text-lime-950 dark:border-lime-900 dark:bg-lime-950/30 dark:text-lime-100' : 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100'}`}>
    <p className="font-black">{reject ? 'Evidence against H₀' : 'Insufficient evidence against H₀'}</p>
    <p>p {formatP(p).startsWith('<') ? formatP(p) : `= ${formatP(p)}`} {reject ? '≤' : '>'} α = {format(alpha, 2)}. {context}</p>
  </div>
}

function Theory({ hypothesis, formula, assumptions, caution }: { hypothesis: string; formula: string; assumptions: string; caution: string }) {
  return <Card title="Theory & interpretation">
    <dl className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
      <div><dt className="font-bold text-slate-900 dark:text-white">Null hypothesis</dt><dd>{hypothesis}</dd></div>
      <div><dt className="font-bold text-slate-900 dark:text-white">Test statistic</dt><dd className="font-mono text-xs sm:text-sm">{formula}</dd></div>
      <div><dt className="font-bold text-slate-900 dark:text-white">Conditions</dt><dd>{assumptions}</dd></div>
      <div><dt className="font-bold text-slate-900 dark:text-white">Interpret carefully</dt><dd>{caution}</dd></div>
    </dl>
  </Card>
}

function SelfCheck({ question, options, answer, explanation }: { question: string; options: string[]; answer: number; explanation: string }) {
  const [picked, setPicked] = useState<number | null>(null)
  return <Card title="Check your understanding">
    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{question}</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">{options.map((option, index) => <button key={option} type="button" onClick={() => setPicked(index)} className={`rounded-xl border px-3 py-2 text-left text-sm ${picked === index ? 'border-lime-500 bg-lime-50 text-slate-900 dark:bg-lime-950/40 dark:text-white' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}>{option}</button>)}</div>
    {picked !== null && <p role="status" className={`mt-3 text-sm ${picked === answer ? 'text-lime-700 dark:text-lime-300' : 'text-amber-700 dark:text-amber-300'}`}>{picked === answer ? 'Correct. ' : 'Try again. '}{explanation}</p>}
  </Card>
}

function DifferencePlot({ values, ranks }: { values: number[]; ranks?: number[] }) {
  const width = 620
  const left = 86
  const right = 590
  const lo = Math.min(-10, ...values) - 1
  const hi = Math.max(12, ...values) + 1
  const x = (value: number) => left + (value - lo) / (hi - lo) * (right - left)
  const height = 48 + values.length * 32
  return <svg role="img" aria-label={`Paired differences: ${values.join(', ')}. Zero is the no-change line.`} viewBox={`0 0 ${width} ${height}`} className="w-full">
    <line x1={x(0)} x2={x(0)} y1="24" y2={height - 24} stroke="#64748b" strokeDasharray="5 5" />
    <text x={x(0) + 4} y="18" fontSize="12" fill="#64748b">0 · no change</text>
    {values.map((value, index) => <g key={index}>
      <text x="8" y={44 + index * 32} fontSize="12" fill="#64748b">Pair {index + 1}</text>
      <line x1={x(0)} x2={x(value)} y1={40 + index * 32} y2={40 + index * 32} stroke={value > 0 ? '#65a30d' : value < 0 ? '#e87945' : '#94a3b8'} strokeWidth="3" />
      <circle cx={x(value)} cy={40 + index * 32} r="7" fill={value > 0 ? '#65a30d' : value < 0 ? '#e87945' : '#94a3b8'} />
      <text x={value < 0 ? x(value) - 11 : Math.min(right - 36, x(value) + 11)} y={44 + index * 32} textAnchor={value < 0 ? 'end' : 'start'} fontSize="12" fill="#475569">{value > 0 ? '+' : ''}{value}{ranks?.[index] ? ` · rank ${ranks[index]}` : ''}</text>
    </g>)}
  </svg>
}

function GroupPlot({ groups, rankMode = false }: { groups: { name: string; values: number[] }[]; rankMode?: boolean }) {
  const all = groups.flatMap((group) => group.values)
  const ranks = averageRanks(all)
  const lo = rankMode ? 1 : Math.min(...all) - 2
  const hi = rankMode ? all.length : Math.max(...all) + 2
  const x = (value: number) => 110 + (value - lo) / Math.max(1, hi - lo) * 480
  const series = groups.map((group, groupIndex) => {
    const offset = groups.slice(0, groupIndex).reduce((sum, previous) => sum + previous.values.length, 0)
    const points = group.values.map((value, index) => ({ value, plotted: rankMode ? ranks[offset + index].rank : value }))
    return { ...group, points }
  })
  const colors = ['#65a30d', '#6366f1', '#f97316', '#0ea5e9']
  return <svg role="img" aria-label={`${rankMode ? 'Pooled ranks' : 'Observed values'} by group: ${groups.map((group) => `${group.name} ${group.values.join(', ')}`).join('; ')}`} viewBox={`0 0 620 ${80 + groups.length * 75}`} className="w-full">
    {series.map((group, gi) => <g key={group.name}>
      <text x="10" y={48 + gi * 75} fontSize="13" fontWeight="bold" fill={colors[gi]}>{group.name}</text>
      <line x1="110" x2="590" y1={50 + gi * 75} y2={50 + gi * 75} stroke="#cbd5e1" />
      {group.points.map((point, i) => <g key={i}>
        <circle cx={x(point.plotted)} cy={50 + gi * 75 + (i % 2 ? -9 : 9)} r="7" fill={colors[gi]} opacity="0.85"><title>{group.name}: value {point.value}, plotted {format(point.plotted, 1)}</title></circle>
        {rankMode && <text x={x(point.plotted)} y={50 + gi * 75 + (i % 2 ? -19 : 26)} textAnchor="middle" fontSize="10" fill="#475569">{format(point.plotted, 1)}</text>}
      </g>)}
      <text x="110" y={78 + gi * 75} fontSize="11" fill="#64748b">median {format(median(group.values), 1)} · {rankMode ? 'mean rank' : 'mean'} {format(mean(group.points.map((point) => point.plotted)), 1)}</text>
    </g>)}
  </svg>
}

function Histogram({ values, observed, title }: { values: number[]; observed: number; title: string }) {
  if (!values.length) return <p className="text-sm text-slate-500">Run the resampling experiment to build the distribution.</p>
  const lo = Math.min(...values, observed)
  const hi = Math.max(...values, observed)
  const span = Math.max(1e-6, hi - lo)
  const counts = Array(24).fill(0) as number[]
  values.forEach((value) => counts[Math.min(23, Math.floor((value - lo) / span * 24))]++)
  const maxCount = Math.max(...counts)
  const lineX = 48 + (observed - lo) / span * 532
  return <svg role="img" aria-label={`${title}. ${values.length} resamples; observed difference ${format(observed)}.`} viewBox="0 0 620 250" className="w-full">
    <line x1="48" x2="580" y1="207" y2="207" stroke="#94a3b8" />
    {counts.map((count, index) => <rect key={index} x={49 + index * 22} y={207 - count / maxCount * 160} width="19" height={count / maxCount * 160} rx="2" fill="#a3e635" opacity="0.8"><title>{count} resamples in bin {index + 1}</title></rect>)}
    <line x1={lineX} x2={lineX} y1="18" y2="207" stroke="#e11d48" strokeWidth="3" />
    <text x={Math.min(510, lineX + 5)} y="28" fontSize="12" fill="#be123c">observed</text>
    <text x="48" y="228" fontSize="12" fill="#64748b">{format(lo, 1)}</text><text x="552" y="228" fontSize="12" fill="#64748b">{format(hi, 1)}</text>
  </svg>
}

const baseDifferences = [-4, -2, -1, 1, 2, 3, 4, 5, 6, 8]
function PairedLab({ mode }: { mode: 'sign' | 'wilcoxon' }) {
  const [shift, setShift] = useState(0)
  const [count, setCount] = useState(10)
  const [alpha, setAlpha] = useState(0.05)
  const [outlier, setOutlier] = useState(false)
  const values = baseDifferences.slice(0, count).map((value, index) => index === count - 1 && outlier ? value + shift + 25 : value + shift)
  const sign = signTest(values)
  const wilcoxon = signedRankTest(values)
  const rankedNonZero = averageRanks(values.filter((value) => value !== 0).map(Math.abs))
  const ranks = values.map((value, index) => value === 0 ? 0 : rankedNonZero[values.slice(0, index).filter((item) => item !== 0).length].rank)
  const p = mode === 'sign' ? sign.p : wilcoxon.p
  return <div className="space-y-4">
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_300px]">
      <Card title="Paired changes"><p className="mb-3 text-sm text-slate-500">Each dot is an after − before difference. Orange is a decrease; green is an increase. Move the controls to see what each test counts.</p><DifferencePlot values={values} ranks={mode === 'wilcoxon' ? ranks : undefined} /></Card>
      <Card title="Experiment controls"><div className="space-y-4">
        <Slider label="Shift all differences" value={shift} min={-4} max={5} onChange={setShift} />
        <Slider label="Number of pairs" value={count} min={6} max={10} onChange={setCount} />
        <Slider label="Decision threshold α" value={alpha} min={0.01} max={0.2} step={0.01} onChange={setAlpha} />
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" checked={outlier} onChange={(event) => setOutlier(event.target.checked)} className="accent-lime-600" /> Make last change an outlier</label>
        <button type="button" onClick={() => { setShift(0); setCount(10); setAlpha(0.05); setOutlier(false) }} className="inline-flex items-center gap-2 text-sm font-bold text-lime-700"><RotateCcw size={15} /> Reset example</button>
      </div></Card>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      <Metric label={mode === 'sign' ? 'Positive / negative' : 'W+ / W−'} value={mode === 'sign' ? `${sign.plus} / ${sign.minus}` : `${format(wilcoxon.plus, 1)} / ${format(wilcoxon.minus, 1)}`} note={`${sign.ties} zero differences excluded`} />
      <Metric label="Exact two-sided p" value={formatP(p)} note={mode === 'sign' ? `Binomial null: ${sign.n} fair signs` : `${2 ** wilcoxon.n} equally likely sign patterns`} />
      <Metric label={mode === 'sign' ? 'Sample median change' : 'Rank-biserial effect'} value={mode === 'sign' ? format(median(values), 1) : format(wilcoxon.rankBiserial, 2)} />
    </div>
    <Decision p={p} alpha={alpha} context={mode === 'sign' ? 'The sign test asks whether positive and negative changes are equally likely.' : 'The signed-rank test weighs each direction by the rank of its absolute difference.'} />
    {mode === 'sign' ? <Theory hypothesis="Among nonzero paired differences, positive and negative directions are equally likely (P[+] = 0.5)." formula="S = number of positive differences; S ∼ Binomial(n, 0.5) under H₀" assumptions="Pairs are independent of other pairs. Measurements are paired and at least ordinal. Zero differences are discarded and reported." caution="A sign test targets the probability of a positive change. Calling it a median test additionally needs a continuous distribution with an appropriate median interpretation." /> : <Theory hypothesis="The paired-difference distribution is symmetric about zero." formula="W+ = Σ ranks of |difference| for positive differences" assumptions="Pairs are independent; differences are measured on a scale where their absolute magnitudes can be ordered. Exact p values condition on observed magnitudes and use sign symmetry." caution="Signed-rank inference about a median difference requires symmetry. With skewed differences, use the sign test or another design-specific method." />}
    <SelfCheck question={mode === 'sign' ? 'What changes when one positive difference becomes much larger but keeps its sign?' : 'Why does a large positive difference carry more weight here?'} options={mode === 'sign' ? ['The sign statistic stays the same', 'The sign statistic grows', 'The sample size doubles', 'The null becomes normal'] : ['Its absolute difference receives a larger rank', 'Its raw magnitude is added to W+', 'It counts as two pairs', 'The test ignores magnitudes']} answer={0} explanation={mode === 'sign' ? 'The sign test only records direction; a larger value with the same sign leaves S unchanged.' : 'Signed-rank uses the order of absolute differences, then restores each sign.'} />
  </div>
}

const baseA = [42, 46, 47, 49, 51, 52]
const baseB = [44, 48, 50, 53, 54, 56]
function IndependentLab({ mode }: { mode: 'mann' | 'kruskal' | 'permutation' | 'bootstrap' }) {
  const [shift, setShift] = useState(0)
  const [count, setCount] = useState(6)
  const [alpha, setAlpha] = useState(0.05)
  const [outlier, setOutlier] = useState(false)
  const [seed, setSeed] = useState(17)
  const [draws, setDraws] = useState(200)
  const [seen, setSeen] = useState(0)
  const [showNull, setShowNull] = useState(false)
  const a = baseA.slice(0, count)
  const b = baseB.slice(0, count).map((value, index) => value + shift + (outlier && index === count - 1 ? 24 : 0))
  const c = [43, 47, 52, 55, 57, 60].slice(0, count).map((value) => value + shift / 2)
  const groups = mode === 'kruskal' ? [{ name: 'A', values: a }, { name: 'B', values: b }, { name: 'C', values: c }] : [{ name: 'A', values: a }, { name: 'B', values: b }]
  const mann = mode === 'mann' ? mannWhitney(a, b) : null
  const kw = mode === 'kruskal' ? kruskalWallis([a, b, c]) : null
  const permutation = mode === 'permutation' ? exactPermutation(a, b) : null
  const boot = mode === 'bootstrap' ? bootstrapDifference(a, b, draws, seed) : null
  const p = mann?.p ?? kw?.p ?? permutation?.p ?? boot?.p ?? 1
  const reset = () => { setShift(0); setCount(6); setAlpha(0.05); setOutlier(false); setSeed(17); setDraws(200); setSeen(0); setShowNull(false) }
  const changeData = (action: () => void) => { action(); setSeen(0) }
  return <div className="space-y-4">
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_300px]">
      <Card title={mode === 'kruskal' ? 'Three group distributions' : 'Two independent groups'}>
        <p className="mb-3 text-sm text-slate-500">Each dot is one independent observation. Compare overlap before reading the test result.</p>
        <GroupPlot groups={groups} rankMode={mode === 'mann' || mode === 'kruskal'} />
        {(mode === 'mann' || mode === 'kruskal') && <p className="mt-2 text-xs text-slate-500">Labels above dots are pooled average ranks; ties share the same rank.</p>}
      </Card>
      <Card title="Experiment controls"><div className="space-y-4">
        <Slider label="Shift group B" value={shift} min={-8} max={8} onChange={(value) => changeData(() => setShift(value))} />
        <Slider label="Observations per group" value={count} min={4} max={6} onChange={(value) => changeData(() => setCount(value))} />
        <Slider label="Decision threshold α" value={alpha} min={0.01} max={0.2} step={0.01} onChange={setAlpha} />
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" checked={outlier} onChange={(event) => changeData(() => setOutlier(event.target.checked))} className="accent-lime-600" /> Add outlier to B</label>
        {mode === 'bootstrap' && <><Slider label="Bootstrap resamples" value={draws} min={200} max={2000} step={100} onChange={setDraws} /><label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" checked={showNull} onChange={(event) => setShowNull(event.target.checked)} className="accent-lime-600" /> Show centered null distribution</label><button type="button" onClick={() => setSeed((value) => value + 1)} className="inline-flex items-center gap-2 text-sm font-bold text-lime-700"><Shuffle size={15} /> New resampling seed</button></>}
        {mode === 'permutation' && <div className="flex gap-2"><button type="button" onClick={() => setSeen((value) => Math.min(value + 1, permutation?.distribution.length ?? 0))} className="rounded-xl bg-lime-600 px-3 py-2 text-sm font-bold text-white">Shuffle once</button><button type="button" onClick={() => setSeen(permutation?.distribution.length ?? 0)} className="rounded-xl border border-lime-400 px-3 py-2 text-sm font-bold text-lime-700">Show all</button></div>}
        <button type="button" onClick={reset} className="inline-flex items-center gap-2 text-sm font-bold text-lime-700"><RotateCcw size={15} /> Reset example</button>
      </div></Card>
    </div>
    {(permutation || boot) && <Card title={permutation ? 'Exact permutation null distribution' : 'Bootstrap sampling distribution'}>
      <p className="mb-2 text-sm text-slate-500">{permutation ? `All ${permutation.distribution.length} ways to reassign ${count} of ${count * 2} observations to A. The red line is the observed mean difference.` : showNull ? `The groups are shifted to a common mean before resampling; this centered distribution supplies the p value. The red line is the observed difference.` : `Resample each group with replacement ${draws} times. This uncentered distribution supplies the percentile interval. The red line is the observed difference.`}</p>
      <Histogram values={permutation ? permutation.distribution.slice(0, seen) : showNull ? boot?.nullDistribution ?? [] : boot?.distribution ?? []} observed={permutation?.observed ?? boot?.observed ?? 0} title={permutation ? 'Permutation null distribution' : showNull ? 'Bootstrap null distribution' : 'Bootstrap sampling distribution'} />
      {permutation && <p className="text-xs text-slate-500">{seen} of {permutation.distribution.length} rearrangements displayed. Exact p uses all rearrangements, even before you reveal them.</p>}
    </Card>}
    <div className="grid gap-4 sm:grid-cols-3">
      <Metric label={mode === 'mann' ? 'U for A' : mode === 'kruskal' ? 'Tie-corrected H' : 'Observed mean A − B'} value={format(mann?.u ?? kw?.h ?? permutation?.observed ?? boot?.observed ?? 0, 2)} note={mode === 'mann' ? `Rank sum A = ${format(mann?.rankSum ?? 0, 1)}` : mode === 'kruskal' ? `df = ${kw?.df}` : `${count} observations per group`} />
      <Metric label={mode === 'kruskal' ? 'Approximate p' : mode === 'bootstrap' ? 'Null bootstrap p' : 'Exact two-sided p'} value={formatP(p)} note={mode === 'mann' ? `${mann?.permutations} label assignments` : mode === 'kruskal' ? 'Chi-square reference; small-sample caution' : mode === 'permutation' ? `${permutation?.extreme} extreme assignments` : 'Centered resampling under H₀'} />
      <Metric label={mode === 'mann' ? 'Cliff’s delta' : mode === 'kruskal' ? 'Mean rank A / B / C' : mode === 'bootstrap' ? '95% percentile interval' : 'Group medians A / B'} value={mode === 'mann' ? format(mann?.cliff ?? 0, 2) : mode === 'kruskal' ? kw?.meanRanks.map((value) => format(value, 1)).join(' / ') ?? '' : mode === 'bootstrap' ? `[${format(boot?.low ?? 0, 1)}, ${format(boot?.high ?? 0, 1)}]` : `${format(median(a), 1)} / ${format(median(b), 1)}`} />
    </div>
    <Decision p={p} alpha={alpha} context={mode === 'mann' ? 'U counts how often an A observation exceeds a B observation, giving half credit for ties.' : mode === 'kruskal' ? 'H tests for a difference among the group rank distributions; it does not locate which groups differ.' : mode === 'permutation' ? 'The exact p value is the fraction of label assignments at least as extreme as the observed mean difference.' : 'The p value comes from a separate, centered bootstrap distribution under the equal-means null.'} />
    {mode === 'mann' && <Theory hypothesis="The two groups have the same distribution, so labels are exchangeable." formula="U_A = R_A − n_A(n_A + 1)/2" assumptions="Observations are independent within and between groups. The exact conditional test treats group labels as exchangeable under H₀." caution="A small p value shows a distributional difference. Interpreting it specifically as a median shift needs similarly shaped group distributions. Cliff’s delta describes pairwise dominance." />}
    {mode === 'kruskal' && <Theory hypothesis="All groups have the same distribution of observations." formula="H = [12 / N(N+1)] Σ(R_j²/n_j) − 3(N+1), with tie correction" assumptions="Independent observations, ordinal or numeric outcomes, and groups with a common distribution under H₀. The displayed p uses a chi-square approximation." caution="With only four to six observations per group the chi-square p value is approximate. A significant H does not identify a pair; follow up with corrected pairwise comparisons." />}
    {mode === 'permutation' && <Theory hypothesis="Group labels are exchangeable under the no-effect null." formula="p = #{|Tπ| ≥ |Tobs|} / #{all label assignments}" assumptions="Random allocation or defensible exchangeability of labels; independent units. This example enumerates every assignment and uses a two-sided mean difference." caution="A permutation test is exact for the exchangeability null. It is not automatically a test of equal medians, and observational groups need stronger assumptions." />}
    {mode === 'bootstrap' && <Theory hypothesis="For the test: the population mean difference is zero." formula="T* = mean(A*) − mean(B*); resample separately, with replacement" assumptions="Independent representative observations in each group. The interval resamples original groups; the p value resamples groups shifted to a common pooled mean under H₀." caution="The percentile interval and the centered-null p answer related but different questions. Bootstrap accuracy can be weak with very small samples or extreme outliers." />}
    <SelfCheck question={mode === 'mann' ? 'What does U primarily count?' : mode === 'kruskal' ? 'What can a significant H establish by itself?' : mode === 'permutation' ? 'What is shuffled in this experiment?' : 'Why are groups centered for the bootstrap p value?'} options={mode === 'mann' ? ['Pairwise ordering between groups', 'Difference in raw means', 'Number of equal medians', 'Within-group variance'] : mode === 'kruskal' ? ['At least one rank distribution differs', 'Exactly which pair differs', 'All medians differ', 'Normality is proved'] : mode === 'permutation' ? ['Group labels', 'Observed values', 'Outcome scale', 'Sample size'] : ['To generate a null with equal means', 'To erase every outlier', 'To make samples larger', 'To force normality']} answer={0} explanation={mode === 'mann' ? 'U is built from pooled ranks and corresponds to pairwise dominance.' : mode === 'kruskal' ? 'An omnibus result requires follow-up comparisons to locate differences.' : mode === 'permutation' ? 'The outcomes stay fixed while their group assignment changes.' : 'A bootstrap p value needs resamples drawn under the null; the percentile interval uses uncentered groups.'} />
  </div>
}

function RankMethodsLab() {
  const [outlier, setOutlier] = useState(20)
  const [ties, setTies] = useState(false)
  const values = [4, 5, 6, ties ? 6 : 7, 8, 9, outlier]
  const ranked = averageRanks(values)
  return <div className="space-y-4">
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_300px]">
      <Card title="Raw values versus ranks"><p className="mb-3 text-sm text-slate-500">Move the extreme value. Its numerical distance changes sharply, while its rank often remains seven.</p><GroupPlot groups={[{ name: 'Raw', values }]} /><GroupPlot groups={[{ name: 'Ranks', values }]} rankMode /></Card>
      <Card title="Experiment controls"><div className="space-y-4"><Slider label="Extreme observation" value={outlier} min={10} max={100} onChange={setOutlier} /><label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" checked={ties} onChange={(event) => setTies(event.target.checked)} className="accent-lime-600" /> Tie the middle observations</label><button type="button" onClick={() => { setOutlier(20); setTies(false) }} className="inline-flex items-center gap-2 text-sm font-bold text-lime-700"><RotateCcw size={15} /> Reset example</button></div></Card>
    </div>
    <div className="grid gap-4 sm:grid-cols-3"><Metric label="Raw mean" value={format(mean(values), 2)} note="Moves with the extreme value" /><Metric label="Median" value={format(median(values), 2)} note="Middle of the ordered observations" /><Metric label="Extreme value rank" value={format(ranked[6].rank, 1)} note="Position, not distance" /></div>
    <Card title="Follow the ranking"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-2">Observation</th>{values.map((_, index) => <th key={index} className="px-2 py-2">{index + 1}</th>)}</tr></thead><tbody><tr><th className="py-2">Raw value</th>{values.map((value, index) => <td key={index} className="px-2 py-2 tabular-nums">{value}</td>)}</tr><tr className="border-t border-slate-100"><th className="py-2">Average rank</th>{ranked.map((item, index) => <td key={index} className="px-2 py-2 tabular-nums">{format(item.rank, 1)}</td>)}</tr></tbody></table></div></Card>
    <Theory hypothesis="Rank tests usually compare ordering patterns or distributional location under a design-specific null." formula="rank(xᵢ) = average occupied position for tied values" assumptions="Ranks require observations to be orderable. Ties receive midranks; the relevant test still needs its own independence or pairing assumptions." caution="Ranks reduce sensitivity to how far an extreme value lies from the rest, but discard distance information. They do not repair dependence, sampling bias, or every difference in distribution shape." />
    <SelfCheck question="If the largest value grows from 20 to 100, what happens to its rank?" options={['It stays 7', 'It becomes 100', 'It doubles', 'It becomes 1']} answer={0} explanation="Ranks encode order. The top value remains seventh of seven as long as the order does not change." />
  </div>
}

export function NonparametricLabScreen({ studio, lab }: { studio: Studio; lab: StudioLab }) {
  const index = studio.labs.findIndex((item) => item.slug === lab.slug)
  const previous = studio.labs[index - 1]
  const next = studio.labs[index + 1]
  return <main className="min-w-0 bg-[#f6f8f3] px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
    <div className="mx-auto flex max-w-[1200px] flex-col gap-5">
      <nav className="flex flex-wrap items-center justify-between gap-2 text-sm"><Link to={studioPath(studio)} className="font-bold text-lime-700 dark:text-lime-300">← Nonparametric Statistics</Link><span className="text-slate-500">Lab {index + 1} of {studio.labs.length}</span></nav>
      <header className="rounded-2xl border border-lime-100 bg-gradient-to-r from-lime-50 to-white p-5 dark:border-lime-950 dark:from-lime-950/30 dark:to-slate-900"><p className="text-xs font-black uppercase tracking-[0.2em] text-lime-700 dark:text-lime-300">Interactive lab</p><h1 className="mt-1 text-3xl font-black tracking-tight">{lab.title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{lab.summary}</p></header>
      {lab.slug === 'sign-test' && <PairedLab mode="sign" />}
      {lab.slug === 'wilcoxon-signed-rank' && <PairedLab mode="wilcoxon" />}
      {lab.slug === 'mann-whitney-u' && <IndependentLab mode="mann" />}
      {lab.slug === 'kruskal-wallis' && <IndependentLab mode="kruskal" />}
      {lab.slug === 'permutation-test' && <IndependentLab mode="permutation" />}
      {lab.slug === 'bootstrap-test' && <IndependentLab mode="bootstrap" />}
      {lab.slug === 'rank-based-methods' && <RankMethodsLab />}
      <nav aria-label="Lab navigation" className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800"><Link to={previous ? labPath(studio.slug, previous.slug) : studioPath(studio)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold dark:border-slate-700 dark:bg-slate-900"><ArrowLeft size={15} /> {previous?.title ?? 'Studio home'}</Link>{next && <Link to={labPath(studio.slug, next.slug)} className="inline-flex items-center gap-2 rounded-xl bg-lime-700 px-4 py-2 text-sm font-bold text-white">{next.title} <ArrowRight size={15} /></Link>}</nav>
    </div>
  </main>
}
