import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { readLocalJson, writeLocalJson } from '../../lib/safeStorage'
import { emptyLabLearning, filterLearningLabs, initialStudioLearning, parseStudioLearning, quizChoices, type LearningLab, type StudioLearning } from '../../lib/studioLearning'

const button = 'min-h-11 rounded-xl border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-indigo-800 dark:text-indigo-300'
const field = 'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'
export function StudioLearningPanel({ studio, title, labs, activeLab }: { studio: string; title: string; labs: LearningLab[]; activeLab?: string }) {
  const storageKey = `studio-learning-v1-${studio}`
  const [progress, setProgress] = useState<StudioLearning>(() => {
    let saved: StudioLearning
    try { saved = parseStudioLearning(readLocalJson(storageKey, null), studio, labs.map(l => l.id)) } catch { saved = initialStudioLearning(studio, labs.map(l => l.id)) }
    return activeLab && labs.some(l => l.id === activeLab) ? { ...saved, lastLab: activeLab } : saved
  })
  useEffect(() => { if (activeLab) writeLocalJson(storageKey, progress) }, [activeLab, progress, storageKey])
  const [selected, setSelected] = useState(activeLab ?? progress.lastLab)
  const [search, setSearch] = useState(''), [level, setLevel] = useState('all'), [favorites, setFavorites] = useState(false)
  const [answer, setAnswer] = useState(''), [feedback, setFeedback] = useState(''), [card, setCard] = useState(0), [revealed, setRevealed] = useState(false), [status, setStatus] = useState('')
  const lab = labs.find(l => l.id === selected) ?? labs[0]
  const item = progress.labs[lab.id] ?? emptyLabLearning()
  const completed = labs.filter(l => progress.labs[l.id]?.completed).length
  const visible = filterLearningLabs(labs, progress, search, level, favorites)
  const resume = labs.find(l => l.id === progress.lastLab && !progress.labs[l.id]?.completed) ?? labs.find(l => !progress.labs[l.id]?.completed) ?? labs[0]
  const commit = (next: StudioLearning) => {
    setProgress(next)
    if (!writeLocalJson(storageKey, next)) setStatus('Progress is available in this session. Browser storage could not save it; export a copy.')
  }
  const update = (changes: Partial<typeof item>) => commit({ ...progress, lastLab: lab.id, labs: { ...progress.labs, [lab.id]: { ...item, ...changes } } })
  const choose = (id: string) => { setSelected(id); setAnswer(''); setFeedback(''); setCard(0); setRevealed(false); commit({ ...progress, lastLab: id }) }
  const cards = [
    { question: `What inputs does ${lab.title} require?`, answer: lab.guide.inputs },
    { question: `How does ${lab.title} calculate its result?`, answer: lab.guide.algorithm.join(' ') },
    { question: `What limits apply to ${lab.title}?`, answer: lab.guide.caution },
  ]
  const exportProgress = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = `${studio}-learning.json`; link.click(); URL.revokeObjectURL(url)
    setStatus('Learning progress exported, including notes and completed activities.')
  }
  const importProgress = async (file?: File) => {
    if (!file) return
    try {
      if (file.size > 1024 * 1024) throw new Error('Choose a progress file smaller than 1 MB.')
      const next = parseStudioLearning(JSON.parse(await file.text()), studio, labs.map(l => l.id))
      commit(next); setSelected(activeLab ?? next.lastLab); setFeedback(''); setAnswer(''); setRevealed(false)
      setStatus('Imported progress replaces this studio’s saved learning progress.')
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to read learning progress.') }
  }
  return <section aria-label={`${title} learning workspace`} className="my-4 min-w-0 rounded-2xl border border-indigo-200 bg-white p-4 text-slate-900 dark:border-indigo-900 dark:bg-slate-900 dark:text-slate-100 sm:p-5">
    <h2 className="text-xl font-bold">Your {title} learning workspace</h2>
    <p className="mt-2 text-sm" role="status">{completed} of {labs.length} completed · {Math.round(completed / labs.length * 100)}%</p>
    <progress aria-label={`${title} completion`} max={labs.length} value={completed} className="mt-2 h-3 w-full accent-indigo-600" />
    <div className="mt-3 flex flex-wrap gap-2"><Link className={button} to={resume.href} onClick={() => choose(resume.id)}>Continue learning: {resume.title}</Link><button className={button} onClick={exportProgress}>Export learning progress</button><label className={`${button} cursor-pointer`}>Import learning progress<input aria-label="Import learning progress" type="file" accept=".json,application/json" className="mt-1 block max-w-full text-xs" onChange={e => { void importProgress(e.target.files?.[0]); e.target.value = '' }} /></label></div>
    <p className="mt-2 text-xs">Import replaces this studio’s saved learning progress. Export first to keep a copy.</p>
    {status && <p role="status" className="mt-3 text-sm">{status}</p>}
    <details className="mt-4" open={!activeLab}>
      <summary className="min-h-11 cursor-pointer py-2 font-bold">Find and organize {title} labs</summary>
      <div className="mt-2 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Search this studio<input className={field} value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${title} methods or concepts`} /></label><label className="text-sm font-semibold">Difficulty<select className={field} value={level} onChange={e => setLevel(e.target.value)}><option value="all">All levels</option><option value="intro">Introductory</option><option value="core">Core</option><option value="advanced">Advanced</option></select></label></div>
      <label className="my-3 flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={favorites} onChange={e => setFavorites(e.target.checked)} />Favorites only</label>
      <p className="text-sm" role="status">{visible.length} matching labs</p>
      <ul className="mt-2 grid min-w-0 gap-3 sm:grid-cols-2">{visible.map(l => <li key={l.id} className="min-w-0 rounded-xl border border-slate-200 p-3 dark:border-slate-700"><Link className="font-bold text-indigo-600 dark:text-indigo-300" to={l.href} onClick={() => choose(l.id)}>{l.title}</Link><p className="mt-1 text-xs">{l.level} · {progress.labs[l.id]?.completed ? 'Completed' : 'Not completed'}</p><div className="mt-2 flex flex-wrap gap-2"><button className={button} aria-pressed={Boolean(progress.labs[l.id]?.favorite)} aria-label={`Favorite ${l.title}`} onClick={() => commit({ ...progress, labs: { ...progress.labs, [l.id]: { ...(progress.labs[l.id] ?? emptyLabLearning()), favorite: !progress.labs[l.id]?.favorite } } })}>{progress.labs[l.id]?.favorite ? '★ Favorite' : '☆ Favorite'}</button><button className={button} onClick={() => choose(l.id)}>Practice {l.title}</button></div></li>)}</ul>
      {!visible.length && <p className="py-3 text-sm">No labs match these filters. Change the search, level, or favorites filter.</p>}
    </details>
    <details className="mt-4" open={Boolean(activeLab)}>
      <summary className="min-h-11 cursor-pointer py-2 font-bold">Practice and notes · {lab.title}</summary>
      <div className="mt-3 grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="min-w-0 space-y-3"><h3 className="font-bold">Readiness checklist · {lab.title}</h3>{[lab.guide.inputs, lab.guide.interpretation, lab.guide.caution].map((text, i) => <label key={i} className="flex items-start gap-2 text-sm leading-6"><input className="mt-1.5 shrink-0" type="checkbox" aria-label={['Reviewed required inputs', 'Reviewed output interpretation', 'Reviewed method limits'][i]} checked={item.checks[i]} onChange={e => update({ checks: item.checks.map((v, j) => j === i ? e.target.checked : v) })} /><span><strong>{['Inputs', 'Interpretation', 'Method limits'][i]}:</strong> {text}</span></label>)}<button className={button} aria-pressed={item.completed} onClick={() => update({ completed: !item.completed })}>{item.completed ? 'Mark as not completed' : 'Mark lab completed'}</button><label className="block text-sm font-semibold">Notes for {lab.title}<textarea aria-label={`Notes for ${lab.title}`} className={`${field} mt-1 min-h-32`} maxLength={3000} value={item.notes} onChange={e => update({ notes: e.target.value })} placeholder={`Explain ${lab.title} in your own words…`} /></label><p className="text-xs">{item.notes.length}/3000 characters · saved in this browser</p></div>
        <div className="min-w-0 space-y-4"><fieldset className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"><legend className="px-1 font-bold">Method check · {lab.title}</legend><p className="mb-2 text-sm">Which statement correctly interprets {lab.title}?</p>{quizChoices(labs, lab).map(c => <label key={c.id} className="my-2 flex items-start gap-2 text-sm leading-6"><input type="radio" name={`${studio}-${lab.id}-quiz`} checked={answer === c.id} onChange={() => { setAnswer(c.id); setFeedback('') }} className="mt-1.5 shrink-0" /><span>{c.text}</span></label>)}<button className={button} disabled={!answer} onClick={() => { const correct = answer === lab.id; setFeedback(correct ? `Correct. ${lab.guide.interpretation}` : `Review ${lab.title}: ${lab.guide.interpretation}`); if (correct) update({ quizPassed: true }) }}>Check answer</button>{feedback && <p role="status" className="mt-2 text-sm">{feedback}</p>}{item.quizPassed && <p className="mt-2 text-xs">Method check passed</p>}</fieldset>
          <section aria-label={`${lab.title} flashcards`} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"><h3 className="font-bold">Flashcard {card + 1} of {cards.length}</h3><p className="mt-2 text-sm">{cards[card].question}</p><button className={`${button} mt-2`} aria-expanded={revealed} onClick={() => setRevealed(v => !v)}>{revealed ? 'Hide answer' : 'Reveal answer'}</button>{revealed && <p className="mt-2 text-sm leading-6">{cards[card].answer}</p>}<button className={`${button} ml-2 mt-2`} onClick={() => { setCard(v => (v + 1) % cards.length); setRevealed(false) }}>Next flashcard</button></section>
        </div>
      </div>
    </details>
  </section>
}
