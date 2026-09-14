import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LEARN_CHAPTERS, type LearnChapterId } from '../lib/learnChapters'
import {
  assignmentHashUrl,
  assignmentPath,
  buildLabReplay,
  CHAPTER_PARAM_SPECS,
  DEFAULT_TEACHING_DATASET_ID,
  defaultLabParams,
  parseLabReplay,
  PRACTICE_ITEMS,
  replayToPrettyJson,
  type LabParams,
} from '../lib/classroom'
import { PracticeGate } from '../components/visual/PracticeGate'
import { useToast } from '../components/ui/toastContext'

export function ClassroomPage() {
  const { notify } = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'assign' | 'collect' | 'practice'>('assign')
  const [chapterId, setChapterId] = useState<LearnChapterId>('compound')
  const [params, setParams] = useState<LabParams>(() => defaultLabParams('compound'))
  const [paste, setPaste] = useState('')
  const [practiceId, setPracticeId] = useState(PRACTICE_ITEMS[1]?.id ?? PRACTICE_ITEMS[0].id)
  const [revealed, setRevealed] = useState(false)

  const specs = CHAPTER_PARAM_SPECS[chapterId]
  const practiceItem = useMemo(() => PRACTICE_ITEMS.find((item) => item.id === practiceId) ?? PRACTICE_ITEMS[0], [practiceId])

  const setChapter = (id: LearnChapterId) => {
    setChapterId(id)
    setParams(defaultLabParams(id))
  }

  const parsed = paste.trim() ? parseLabReplay(paste) : null

  return (
    <main className="min-w-0 bg-slate-50/70 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <header>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">Classroom</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Assign a chapter. Collect a replay. Hide the picture until they try.</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            The pack is JSON: chapter, dataset id, and the lab sliders. Students open the hash link; you paste their download back here.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {([
            ['assign', 'Assign'],
            ['collect', 'Collect replay'],
            ['practice', 'Practice'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`min-h-11 rounded-xl px-4 text-sm font-bold ${
                tab === id
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'assign' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <label className="block text-sm font-semibold">
              Chapter
              <select
                value={chapterId}
                onChange={(event) => setChapter(event.target.value as LearnChapterId)}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
              >
                {LEARN_CHAPTERS.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.number}. {chapter.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-4 grid gap-4">
              {specs.length === 0 && <p className="text-sm text-slate-500">This lab is drag-on-stage. The assignment is the chapter itself.</p>}
              {specs.map((spec) => (
                <label key={spec.key} className="block text-sm font-semibold">
                  {spec.label}
                  {spec.kind === 'number' ? (
                    <input
                      type="range"
                      min={spec.min}
                      max={spec.max}
                      step={spec.step}
                      value={Number(params[spec.key])}
                      onChange={(event) => setParams((current) => ({ ...current, [spec.key]: Number(event.target.value) }))}
                      className="mt-2 h-11 w-full accent-indigo-600"
                    />
                  ) : (
                    <select
                      value={String(params[spec.key])}
                      onChange={(event) => setParams((current) => ({ ...current, [spec.key]: event.target.value }))}
                      className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950"
                    >
                      {spec.options.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {spec.kind === 'number' && (
                    <span className="mt-1 block font-mono text-xs text-indigo-700">{params[spec.key]}</span>
                  )}
                </label>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(assignmentHashUrl(chapterId, params, { datasetId: DEFAULT_TEACHING_DATASET_ID }))
                  notify('Assignment link copied', 'success')
                }}
                className="min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white"
              >
                Copy assignment link
              </button>
              <button
                type="button"
                onClick={() => {
                  const replay = buildLabReplay({ chapterId, params, datasetId: DEFAULT_TEACHING_DATASET_ID })
                  void navigator.clipboard.writeText(replayToPrettyJson(replay))
                  notify('Replay JSON copied', 'success')
                }}
                className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold dark:border-slate-700"
              >
                Copy replay JSON
              </button>
              <Link
                to={assignmentPath(chapterId, params)}
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-bold dark:border-slate-700"
              >
                Open this lab
              </Link>
            </div>
          </section>
        )}

        {tab === 'collect' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-600 dark:text-slate-300">Paste a student replay JSON (from Copy replay JSON or the download on the lab).</p>
            <textarea
              value={paste}
              onChange={(event) => setPaste(event.target.value)}
              rows={12}
              className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
              placeholder='{"version":1,"kind":"statanveshak.lab-replay",...}'
            />
            {parsed?.ok === false && <p className="mt-2 text-sm text-amber-700">{parsed.error}</p>}
            {parsed?.ok && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/40">
                <p className="font-bold">{parsed.replay.chapterId} · dataset {parsed.replay.datasetId}</p>
                <p className="mt-1 font-mono text-xs">{JSON.stringify(parsed.replay.params)}</p>
                <button
                  type="button"
                  onClick={() => navigate(assignmentPath(parsed.replay.chapterId, parsed.replay.params, { datasetId: parsed.replay.datasetId }))}
                  className="mt-3 min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white"
                >
                  Open this replay
                </button>
              </div>
            )}
          </section>
        )}

        {tab === 'practice' && (
          <section className="grid gap-4">
            <label className="text-sm font-semibold">
              Item
              <select
                value={practiceId}
                onChange={(event) => {
                  setPracticeId(event.target.value)
                  setRevealed(false)
                }}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950"
              >
                {PRACTICE_ITEMS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.chapterId} — {item.prompt.slice(0, 64)}…
                  </option>
                ))}
              </select>
            </label>
            <PracticeGate item={practiceItem} revealed={revealed} onReveal={() => setRevealed(true)} />
          </section>
        )}
      </div>
    </main>
  )
}
