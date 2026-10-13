import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { readLearningRecent, continueLearningTarget } from '../../lib/learningProgress'
import { STUDIO_CATEGORIES } from '../../lib/statisticsStudios'
import { useHomePreferences, type HomeLevel } from './homePreferencesContext'
import { HOME_ACTION_CLASS } from './HomeSection'
import { readLocal, writeLocal } from '../../lib/safeStorage'
import { HOME_SEARCH_ENTRIES } from './homeSearchCatalog'
import { readHomeVisits } from './homeVisits'

const TOUR = [
  ['Find a topic', 'Use the search above to find a studio, lab, analysis, or data tool. Press Ctrl/⌘ K to focus it.', 'home-search'],
  ['Learn by doing', 'Filter studios by topic and difficulty. Open a lab and try its controls.', 'home-studios-heading'],
  ['Bring your data', 'Drop a file into the dataset section or load a sample. Review the active dataset before choosing a method.', 'home-datasets-heading'],
  ['Choose an analysis', 'Use the test guide and dataset recommendations below. Check assumptions before interpreting results.', 'home-tools-heading'],
]

export function HomePersonal() {
  const { view, setView, topic, setTopic, level, setLevel } = useHomePreferences()
  const { activeDataset, analysisHistory, favoriteModules, toggleFavoriteModule, setWorkspaceMode, motion, setMotion } = useStore()
  const [tour, setTour] = useState(() => readLocal('home-tour-seen') ? -1 : 0)
  const [goal, setGoal] = useState('compare')
  const [design, setDesign] = useState('independent')
  const visits = readHomeVisits()
  const recent = visits.length ? visits : readLearningRecent()
  const target = recent[0] ?? continueLearningTarget()
  const favoriteEntries = HOME_SEARCH_ENTRIES.filter((entry) => favoriteModules.includes(entry.path))
  const numeric = activeDataset?.schema.filter((column) => column.type === 'numeric').length ?? 0
  const categorical = activeDataset?.schema.some((column) => column.type === 'categorical' || column.type === 'boolean')
  const recommendation = goal === 'predict' ? '/analysis/regression.linear' : goal === 'describe' ? '/analysis/descriptives.summary' : design === 'paired' ? '/analysis/t.paired' : '/statistics/anova/one-way-anova'
  const finishTour = () => { setTour(-1); writeLocal('home-tour-seen', 'true') }
  const goTour = (step: number) => { setTour(step); document.getElementById(TOUR[step][2])?.scrollIntoView({ block: 'center', behavior: motion === 'reduced' ? 'instant' : 'smooth' }) }

  return <section aria-label="Your home workspace" className="home-panel space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-black">Your workspace</h2><p className="text-sm text-slate-600 dark:text-slate-300">Learn a concept or start with your data.</p></div>
      <div className="flex flex-wrap gap-2">
        <label className="text-xs font-bold">Home view<select aria-label="Home view" value={view} onChange={(event) => setView(event.target.value as 'beginner' | 'advanced')} className="home-input ml-2"><option value="beginner">Beginner</option><option value="advanced">Advanced</option></select></label>
        <button className={HOME_ACTION_CLASS} onClick={() => setMotion(motion === 'full' ? 'reduced' : 'full')} aria-pressed={motion === 'reduced'}>{motion === 'full' ? 'Pause animations' : 'Resume animations'}</button>
        <button className={HOME_ACTION_CLASS} onClick={() => goTour(0)}>Take a tour</button>
      </div>
    </div>
    {tour >= 0 && <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950" aria-label="Home tour">
      <p className="font-bold">{tour + 1} / {TOUR.length} · {TOUR[tour][0]}</p><p className="mt-1 text-sm">{TOUR[tour][1]}</p>
      <div className="mt-3 flex gap-2">{tour > 0 && <button className={HOME_ACTION_CLASS} onClick={() => goTour(tour - 1)}>Previous</button>}<button className={HOME_ACTION_CLASS} onClick={() => tour === TOUR.length - 1 ? finishTour() : goTour(tour + 1)}>{tour === TOUR.length - 1 ? 'Finish tour' : 'Next'}</button><button className={HOME_ACTION_CLASS} onClick={finishTour}>Dismiss</button></div>
    </div>}
    <div className="grid gap-3 md:grid-cols-3">
      <div className="home-mini"><h3 className="font-bold">Continue where you left off</h3>{target && <Link className="home-link mt-2 block" to={target.path} onClick={() => { if (target.path.startsWith('/analysis') || target.path.startsWith('/data') || target.path.startsWith('/explore')) setWorkspaceMode('analyze') }}>{target.title} →</Link>}<ul className="mt-2 space-y-1">{recent.slice(1, 4).map((visit) => <li key={visit.path}><Link className="home-link" to={visit.path} onClick={() => { if (visit.path.startsWith('/analysis') || visit.path.startsWith('/data') || visit.path.startsWith('/explore')) setWorkspaceMode('analyze') }}>{visit.title}</Link></li>)}</ul></div>
      <div className="home-mini"><h3 className="font-bold">Recent analyses</h3>{visits.some((visit) => visit.path.startsWith('/analysis/')) && <ul className="mt-2 space-y-2">{visits.filter((visit) => visit.path.startsWith('/analysis/')).slice(0, 3).map((visit) => <li key={visit.path}><Link className="home-link" to={visit.path} onClick={() => setWorkspaceMode('analyze')}>{visit.title}</Link></li>)}</ul>}{analysisHistory.length ? <ul className="mt-2 space-y-2">{analysisHistory.slice(0, 3).map((entry) => <li key={entry.id}><Link className="home-link" to="/reports" onClick={() => setWorkspaceMode('analyze')}>{entry.title} report</Link><p className="text-xs text-slate-600 dark:text-slate-300">{entry.datasetName} · {entry.resultSummary}</p></li>)}</ul> : <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Run an analysis to see its report here.</p>}</div>
      <div className="home-mini"><h3 className="font-bold">Favorites</h3>{favoriteEntries.length ? <ul className="mt-2 space-y-2">{favoriteEntries.map((entry) => <li key={entry.path} className="flex justify-between gap-2"><Link className="home-link" to={entry.path} onClick={() => { if (entry.analyze) setWorkspaceMode('analyze') }}>{entry.title}</Link><button aria-label={`Remove ${entry.title} from favorites`} onClick={() => toggleFavoriteModule(entry.path)} className="min-h-11 min-w-11">×</button></li>)}</ul> : <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Use the star on a studio or search result to save it.</p>}</div>
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      <div className="home-mini"><h3 className="font-bold">Active dataset</h3>{activeDataset ? <><p className="mt-1 font-semibold">{activeDataset.name}</p><p className="text-sm">{activeDataset.rows.toLocaleString()} rows · {activeDataset.cols} columns · {numeric} numeric</p><p className="text-xs">{activeDataset.schema.filter((column) => column.missing > 0).length} columns have missing values.</p><Link className="home-link mt-2 inline-block" to="/data/preview" onClick={() => setWorkspaceMode('analyze')}>Review dataset →</Link><p className="mt-3 text-sm font-bold">Suggested methods</p><p className="text-xs">Based on column types; check the study design and assumptions.</p><div className="mt-2 flex flex-wrap gap-3"><Link className="home-link" to="/explore/summary" onClick={() => setWorkspaceMode('analyze')}>Summary statistics</Link>{numeric >= 2 && <Link className="home-link" to="/analysis/regression.correlation" onClick={() => setWorkspaceMode('analyze')}>Correlation</Link>}{numeric > 0 && categorical && <Link className="home-link" to="/analysis/anova.between" onClick={() => setWorkspaceMode('analyze')}>Compare group means</Link>}</div></> : <p className="mt-2 text-sm">Upload a file or choose a sample below to get recommendations.</p>}</div>
      <div className="home-mini"><h3 className="font-bold">Choose the right test</h3><div className="mt-2 flex flex-wrap gap-3"><label className="text-sm">Goal<select className="home-input block" value={goal} onChange={(event) => setGoal(event.target.value)}><option value="compare">Compare means</option><option value="predict">Predict a numeric outcome</option><option value="describe">Describe data</option></select></label>{goal === 'compare' && <label className="text-sm">Design<select className="home-input block" value={design} onChange={(event) => setDesign(event.target.value)}><option value="independent">Independent groups</option><option value="paired">Two paired measurements</option></select></label>}</div><Link className="home-link mt-3 inline-block" to={recommendation === '/analysis/descriptives.summary' ? '/explore/summary' : recommendation} onClick={() => { if (!recommendation.startsWith('/statistics')) setWorkspaceMode('analyze') }}>Open suggested method →</Link><p className="mt-2 text-xs">Numeric outcomes only. Independence, distribution, and variance assumptions still need checking.</p></div>
    </div>
    <div className="flex flex-wrap items-end gap-3"><label className="text-xs font-bold">Topic<select className="home-input block" value={topic} onChange={(event) => setTopic(event.target.value)}><option value="all">All topics</option>{STUDIO_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}</select></label><label className="text-xs font-bold">Difficulty<select className="home-input block" value={level} onChange={(event) => setLevel(event.target.value as HomeLevel)}><option value="all">All levels</option><option value="intro">Introductory</option><option value="core">Core</option><option value="advanced">Advanced</option></select></label><button className={HOME_ACTION_CLASS} onClick={() => { setTopic('all'); setLevel('all') }}>Reset filters</button><Link className={HOME_ACTION_CLASS} to="/learn/paths">Goal-based learning paths →</Link></div>
    <details className="text-sm"><summary className="min-h-11 cursor-pointer font-bold">Help, feedback &amp; data privacy</summary><p className="mt-2">Datasets and preferences are saved in this browser. Clearing site data removes them; export important results before clearing it.</p><p className="mt-2">Start with a sample, review its columns, then choose a studio or analysis. Record the page, steps, expected result, and actual result when reporting an issue.</p><Link className="home-link mt-2 inline-block" to="/reports" onClick={() => setWorkspaceMode('analyze')}>Open saved reports</Link><HomeFeedback /></details>
  </section>
}

function HomeFeedback() {
  const [text, setText] = useState(() => readLocal('home-feedback'))
  const [status, setStatus] = useState('')
  return <div className="mt-3"><label className="block font-bold">Feedback draft<textarea className="home-input mt-1 block w-full" value={text} onChange={(event) => setText(event.target.value)} placeholder="Page, steps, expected result, actual result…" /></label><button className={HOME_ACTION_CLASS} onClick={() => setStatus(writeLocal('home-feedback', text) ? 'Feedback draft saved locally.' : 'Browser storage unavailable; copy your draft before leaving.')}>Save draft</button><button className={`${HOME_ACTION_CLASS} ml-2`} onClick={async () => { try { await navigator.clipboard.writeText(text); setStatus('Copied feedback for sharing.') } catch { setStatus('Copy unavailable. Select and copy the draft above.') } }}>Copy feedback</button><p role="status" className="mt-1 text-xs">{status}</p></div>
}
