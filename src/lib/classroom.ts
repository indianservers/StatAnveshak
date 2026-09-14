import { getLearnChapter, LEARN_CHAPTERS, type LearnChapterId } from './learnChapters'

export const LAB_REPLAY_KIND = 'statanveshak.lab-replay'
export const DEFAULT_TEACHING_DATASET_ID = 'student-marks'

export type LabParamValue = string | number
export type LabParams = Record<string, LabParamValue>

export type LabParamSpec =
  | { key: string; label: string; kind: 'number'; min: number; max: number; step: number; fallback: number }
  | { key: string; label: string; kind: 'choice'; options: Array<{ id: string; label: string }>; fallback: string }

export type LabReplay = {
  version: 1
  kind: typeof LAB_REPLAY_KIND
  chapterId: LearnChapterId
  datasetId: string
  params: LabParams
  createdAt: string
  intuition: string
  formula: string
  misuse: string
}

export type PracticeItem = {
  id: string
  chapterId: LearnChapterId
  prompt: string
  choices: string[]
  correctIndex: number
  picture: string
  params: LabParams
}

export const CHAPTER_PARAM_SPECS: Record<LearnChapterId, LabParamSpec[]> = {
  chance: [{ key: 'p', label: 'P(heads)', kind: 'number', min: 0.05, max: 0.95, step: 0.01, fallback: 0.5 }],
  compound: [
    { key: 'prior', label: 'Base rate P(D)', kind: 'number', min: 0.01, max: 0.4, step: 0.01, fallback: 0.08 },
    { key: 'sens', label: 'Sensitivity P(+|D)', kind: 'number', min: 0.5, max: 0.99, step: 0.01, fallback: 0.9 },
    { key: 'fpr', label: 'False positive P(+|H)', kind: 'number', min: 0.01, max: 0.3, step: 0.01, fallback: 0.07 },
  ],
  distributions: [
    { key: 'n', label: 'Sample size n', kind: 'number', min: 2, max: 40, step: 1, fallback: 5 },
    {
      key: 'kind',
      label: 'Population',
      kind: 'choice',
      options: [
        { id: 'skew', label: 'Skewed' },
        { id: 'uniform', label: 'Flat' },
        { id: 'bimodal', label: 'Bimodal' },
      ],
      fallback: 'skew',
    },
  ],
  frequentist: [
    { key: 'n', label: 'Sample size n', kind: 'number', min: 8, max: 80, step: 1, fallback: 20 },
    {
      key: 'level',
      label: 'Confidence',
      kind: 'choice',
      options: [
        { id: '90', label: '90%' },
        { id: '95', label: '95%' },
        { id: '99', label: '99%' },
      ],
      fallback: '95',
    },
    {
      key: 'method',
      label: 'Interval',
      kind: 'choice',
      options: [
        { id: 'z', label: 'z / t' },
        { id: 'bootstrap', label: 'Bootstrap' },
      ],
      fallback: 'z',
    },
  ],
  bayesian: [
    { key: 'alpha', label: 'Prior α', kind: 'number', min: 1, max: 12, step: 1, fallback: 2 },
    { key: 'beta', label: 'Prior β', kind: 'number', min: 1, max: 12, step: 1, fallback: 6 },
  ],
  regression: [],
}

export const PRACTICE_ITEMS: PracticeItem[] = [
  {
    id: 'rate-not-promise',
    chapterId: 'chance',
    prompt: 'A coin is set to P(heads) = 0.80. After a long run of flips, which picture should students trust?',
    choices: [
      'The next flip is due tails because heads already “used up” luck.',
      'The running rate settles near 0.80. One more flip is still a coin toss.',
      'The running rate must finish at exactly 0.50 because of the law of large numbers.',
    ],
    correctIndex: 1,
    picture: 'The dashed true-p line stays at 0.80. The walking rate approaches it; it does not repay a streak.',
    params: { p: 0.8 },
  },
  {
    id: 'base-rate-trap',
    chapterId: 'compound',
    prompt: 'A rare condition (2% base rate) has a 95% sensitive test and a 5% false-positive rate. A positive result mostly means…',
    choices: [
      'The person almost certainly has the condition, because 95% is high.',
      'The healthy false-positive area can still outweigh the true-hit strip.',
      'Sensitivity and base rate are the same quantity, so the posterior is 95%.',
    ],
    correctIndex: 1,
    picture: 'Keep the disease column thin. The orange healthy-positive block is bigger than the green true-hit block.',
    params: { prior: 0.02, sens: 0.95, fpr: 0.05 },
  },
  {
    id: 'means-not-data',
    chapterId: 'distributions',
    prompt: 'The population is skewed. You draw samples of size n = 25 and pile the means. What should tighten?',
    choices: [
      'Each raw draw becomes more bell-shaped as n grows.',
      'The cloud of sample means gets tighter. The population row can stay skewed.',
      'Skewness of the data is deleted once you have 25 observations.',
    ],
    correctIndex: 1,
    picture: 'Top row = one sample. Bottom pile = means. Raise n and only the pile of means tightens.',
    params: { n: 25, kind: 'skew' },
  },
  {
    id: 'coverage-not-belief',
    chapterId: 'frequentist',
    prompt: 'You throw 40 intervals at a fixed dashed μ. About 95% of them catch it. After you see one interval, what is still true?',
    choices: [
      'There is now a 95% chance that μ sits inside this particular interval.',
      'The 95% describes the catching procedure across many samples, not a posterior on this one net.',
      'If this interval missed, μ must have moved.',
    ],
    correctIndex: 1,
    picture: 'Play many nets. The dashed truth does not move. Count how many bars cover it.',
    params: { n: 16, level: '95', method: 'z' },
  },
  {
    id: 'prior-still-there',
    chapterId: 'bayesian',
    prompt: 'Prior α = 10, β = 2 (already peaked high). You observe a few tails. Why might the posterior still sit high?',
    choices: [
      'Data always overwrites the prior after three observations.',
      'A strong prior is a tall starting curve. Sparse data only nudges it.',
      'α and β cancel, so the posterior mean is always 0.5.',
    ],
    correctIndex: 1,
    picture: 'Slate prior is already a spike near 1. Violet moves slowly until the coin stack grows.',
    params: { alpha: 10, beta: 2 },
  },
  {
    id: 'squares-not-cause',
    chapterId: 'regression',
    prompt: 'Dragging the line until residual squares shrink means…',
    choices: [
      'x caused y, because the fit is now the smallest SSE.',
      'You found the OLS picture for this cloud. Cause still lives off-stage.',
      'Correlation is zero whenever squares look small.',
    ],
    correctIndex: 1,
    picture: 'Play to spawn a new cloud, then drag until the squares match the faint OLS line. Small SSE ≠ a cause.',
    params: {},
  },
]

export function isLearnChapterId(value: string): value is LearnChapterId {
  return LEARN_CHAPTERS.some((chapter) => chapter.id === value)
}

export function defaultLabParams(chapterId: LearnChapterId): LabParams {
  const params: LabParams = {}
  for (const spec of CHAPTER_PARAM_SPECS[chapterId]) {
    params[spec.key] = spec.kind === 'number' ? spec.fallback : spec.fallback
  }
  return params
}

export function clampLabNumber(value: number, spec: Extract<LabParamSpec, { kind: 'number' }>) {
  if (!Number.isFinite(value)) return spec.fallback
  const stepped = spec.step >= 1 ? Math.round(value) : Math.round(value / spec.step) * spec.step
  return Math.min(spec.max, Math.max(spec.min, stepped))
}

export function sanitizeLabParams(chapterId: LearnChapterId, raw: LabParams): LabParams {
  const next = defaultLabParams(chapterId)
  for (const spec of CHAPTER_PARAM_SPECS[chapterId]) {
    const value = raw[spec.key]
    if (spec.kind === 'number') {
      next[spec.key] = clampLabNumber(typeof value === 'number' ? value : Number(value), spec)
    } else if (typeof value === 'string' && spec.options.some((option) => option.id === value)) {
      next[spec.key] = value
    }
  }
  return next
}

export function paramsFromSearch(chapterId: LearnChapterId, search: URLSearchParams): LabParams {
  const raw: LabParams = {}
  for (const spec of CHAPTER_PARAM_SPECS[chapterId]) {
    const value = search.get(spec.key)
    if (value === null) continue
    raw[spec.key] = spec.kind === 'number' ? Number(value) : value
  }
  return sanitizeLabParams(chapterId, raw)
}

export function searchFromParams(params: LabParams) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    search.set(key, String(value))
  })
  return search
}

export function assignmentPath(chapterId: LearnChapterId, params: LabParams, extra?: { datasetId?: string; practiceId?: string }) {
  const search = searchFromParams(sanitizeLabParams(chapterId, params))
  search.set('dataset', extra?.datasetId ?? DEFAULT_TEACHING_DATASET_ID)
  if (extra?.practiceId) search.set('practice', extra.practiceId)
  const query = search.toString()
  return query ? `/learn/${chapterId}?${query}` : `/learn/${chapterId}`
}

export function assignmentHashUrl(chapterId: LearnChapterId, params: LabParams, extra?: { datasetId?: string; practiceId?: string }) {
  const origin = typeof window === 'undefined' ? '' : window.location.origin + window.location.pathname
  return `${origin}#${assignmentPath(chapterId, params, extra)}`
}

export function buildLabReplay(input: {
  chapterId: LearnChapterId
  params: LabParams
  datasetId?: string
}): LabReplay {
  const chapter = getLearnChapter(input.chapterId)
  if (!chapter) {
    throw new Error(`Unknown chapter ${input.chapterId}`)
  }
  return {
    version: 1,
    kind: LAB_REPLAY_KIND,
    chapterId: input.chapterId,
    datasetId: input.datasetId || DEFAULT_TEACHING_DATASET_ID,
    params: sanitizeLabParams(input.chapterId, input.params),
    createdAt: new Date().toISOString(),
    intuition: chapter.intuition,
    formula: chapter.formula,
    misuse: chapter.misuse,
  }
}

export function parseLabReplay(raw: string): { ok: true; replay: LabReplay } | { ok: false; error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'Replay JSON is not valid JSON.' }
  }
  if (!parsed || typeof parsed !== 'object') return { ok: false, error: 'Replay must be an object.' }
  const record = parsed as Record<string, unknown>
  if (record.kind !== LAB_REPLAY_KIND) return { ok: false, error: 'Not a StatAnveshak lab replay.' }
  if (record.version !== 1) return { ok: false, error: 'Unsupported replay version.' }
  if (typeof record.chapterId !== 'string' || !isLearnChapterId(record.chapterId)) {
    return { ok: false, error: 'Replay chapter is missing or unknown.' }
  }
  const params = typeof record.params === 'object' && record.params !== null ? (record.params as LabParams) : {}
  return {
    ok: true,
    replay: buildLabReplay({
      chapterId: record.chapterId,
      params,
      datasetId: typeof record.datasetId === 'string' ? record.datasetId : DEFAULT_TEACHING_DATASET_ID,
    }),
  }
}

export function replayToPrettyJson(replay: LabReplay) {
  return `${JSON.stringify(replay, null, 2)}\n`
}

export function getPracticeItem(id: string | null | undefined) {
  return PRACTICE_ITEMS.find((item) => item.id === id)
}

export function labNumber(params: LabParams, key: string, fallback: number) {
  const value = params[key]
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

export function labChoice<T extends string>(params: LabParams, key: string, fallback: T, allowed: readonly T[]): T {
  const value = params[key]
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback
}
