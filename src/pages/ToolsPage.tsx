import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Sparkles } from 'lucide-react'
import { useStore } from '../store/useStore'
import { readLocalJson, writeLocalJson } from '../lib/safeStorage'
import { datasetFingerprint } from '../lib/toolkit'
import { ANALYSIS_BY_ID } from '../analysis/catalog'
import type { AnalysisOptions, AnalysisResult } from '../analysis/types'
import { TOOL_FEATURES, TOOL_GROUPS } from '../components/tools/toolCatalog'
import type { PanelProps, ToolPreset, ToolRun } from '../components/tools/toolTypes'
import { reportText, runsFromStorage } from '../components/tools/toolIO'
import { AnalysisTool } from '../components/tools/AnalysisTool'
import { WorkspaceTools } from '../components/tools/WorkspaceTools'
import { PreparationTools } from '../components/tools/PreparationTools'
import { StatisticalTools } from '../components/tools/StatisticalTools'
import { ModelTools } from '../components/tools/ModelTools'
import { ChartTools } from '../components/tools/ChartTools'
import { ReportTools } from '../components/tools/ReportTools'
import { TeachingTools } from '../components/tools/TeachingTools'
import { SpecificGuide } from '../components/learning/SpecificGuide'
import { toolGuide } from '../lib/guides/toolGuides'

const ENGINE_FEATURES: Record<string, string> = { power: 'power.analysis', diagnostics: 'regression.linear', correlation: 'regression.correlation', contingency: 'frequencies.contingency', clustering: 'ml.clustering', pca: 'factor.pca' }
const STYLE = `.tools-hub :is(input:not([type=checkbox]),select,textarea){display:block;width:100%;border:1px solid #94a3b8;border-radius:10px;padding:10px 12px;min-height:44px;background:#fff;color:#0f172a;font-size:.875rem}.dark .tools-hub :is(input:not([type=checkbox]),select,textarea){background:#020617;color:#f1f5f9}.tools-hub label{font-size:.875rem;font-weight:600}.tools-hub .tool-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:16px}.tools-hub button,.tools-hub .tool-button{min-height:44px;border:1px solid #cbd5e1;border-radius:10px;padding:8px 12px;font-weight:600;font-size:.875rem;cursor:pointer}.tools-hub button:disabled{opacity:.5;cursor:not-allowed}.tools-hub .tool-primary{background:#4f46e5;color:white;border-color:#4f46e5}.tools-hub :is(button,select,input,textarea,summary,a):focus-visible{outline:3px solid #818cf8;outline-offset:3px}.tools-hub summary{min-height:44px;padding:10px}.tools-hub select[multiple]{min-height:100px}.tools-hub input[type=checkbox]{width:18px;height:18px}.tools-hub pre{max-width:100%}.tools-hub .js-plotly-plot{max-width:100%}`

export function ToolsPage() {
  const [params, setParams] = useSearchParams()
  const feature = TOOL_FEATURES.find(f => f.id === params.get('feature')) ?? TOOL_FEATURES[0]
  const dataset = useStore(s => s.activeDataset), datasets = useStore(s => s.datasets), setDataset = useStore(s => s.setActiveDataset), addLog = useStore(s => s.addAnalysisLog)
  const [query, setQuery] = useState(''), [category, setCategory] = useState('All'), [message, setMessage] = useState(''), [runs, setRuns] = useState(runsFromStorage), [resume, setResume] = useState<ToolRun | ToolPreset | null>(null), [paired, setPaired] = useState(false)
  const [browserInitiallyOpen] = useState(() => window.innerWidth >= 1024)
  const [presets, setPresets] = useState<ToolPreset[]>(() => { const raw = readLocalJson<unknown>('tools-presets', []); return Array.isArray(raw) ? raw.filter((v): v is ToolPreset => Boolean(v && typeof v.id === 'string' && typeof v.name === 'string' && ANALYSIS_BY_ID[v.analysis] && v.options && typeof v.options === 'object')).slice(0, 40) : [] })
  const heading = useRef<HTMLHeadingElement>(null), browser = useRef<HTMLDetailsElement>(null)
  const filtered = TOOL_FEATURES.filter(f => (category === 'All' || f.group === category) && `${f.title} ${f.description}`.toLowerCase().includes(query.trim().toLowerCase()))
  const go = (id: string) => { setParams({ feature: id }); setResume(null); setMessage(''); if (browser.current && window.innerWidth < 1024) browser.current.open = false; requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: 'start' }) }) }
  const record = (analysis: string, options: AnalysisOptions, result: AnalysisResult) => {
    const run: ToolRun = { id: crypto.randomUUID(), at: new Date().getTime(), dataset: dataset?.name ?? 'No dataset required', datasetId: dataset?.id ?? '', fingerprint: datasetFingerprint(dataset?.data ?? []), rows: dataset?.data.length ?? 0, analysis, options, result }
    const next = [run, ...runs].slice(0, 20); setRuns(next)
    const saved = writeLocalJson('tools-runs', next)
    addLog({ id: run.id, createdAt: run.at, title: result.title, datasetName: run.dataset, workflow: 'Tools Hub', variables: Object.values(options).flatMap(v => typeof v === 'string' ? [v] : Array.isArray(v) ? v : []), method: analysis, resultSummary: result.interpretation, assumptions: result.assumptions, interpretation: result.interpretation, reportText: reportText([run], '') })
    setMessage(saved ? 'Run saved to Tools history and available for reports.' : 'Results are available in this session. Browser storage is full or unavailable; this run was not persisted.')
  }
  const savePreset = (preset: ToolPreset) => { const next = [preset, ...presets].slice(0, 40); setPresets(next); setMessage(writeLocalJson('tools-presets', next) ? 'Configuration saved.' : 'Configuration is available in this session; browser storage could not save it.') }
  const resumeRun = (r: ToolRun | ToolPreset) => { const target = r.analysis.startsWith('tools.') ? r.analysis.slice(6) : 'presets'; setParams({ feature: TOOL_FEATURES.some(f => f.id === target) ? target : 'history' }); setResume(r); setMessage('fingerprint' in r && r.fingerprint !== datasetFingerprint(dataset?.data ?? []) ? 'The active dataset differs from the saved run. Review variables before rerunning.' : 'Saved settings loaded. Review and run when ready.') }
  const props: PanelProps = { feature: feature.id, dataset, record, message: setMessage, initialOptions: resume?.options }
  let panel
  if (resume && !resume.analysis.startsWith('tools.')) panel = <AnalysisTool {...props} analysisId={resume.analysis} initialOptions={resume.options} savePreset={savePreset}/>
  else if (feature.group === 'Workspace' || ['test-select'].includes(feature.id)) panel = <WorkspaceTools {...props} runs={runs} presets={presets} savePreset={savePreset} resume={resumeRun} removePreset={id => { const next = presets.filter(p => p.id !== id); setPresets(next); writeLocalJson('tools-presets', next) }} removeRun={id => { const next = runs.filter(r => r.id !== id); setRuns(next); writeLocalJson('tools-runs', next) }}/>
  else if (feature.group === 'Preparation') panel = <PreparationTools {...props}/>
  else if (ENGINE_FEATURES[feature.id]) panel = <AnalysisTool {...props} analysisId={ENGINE_FEATURES[feature.id]} savePreset={savePreset}/>
  else if (feature.id === 'nonparametric') panel = <div className="space-y-4"><label className="block max-w-md">Nonparametric study design<select value={paired ? 'paired' : 'independent'} onChange={e => setPaired(e.target.value === 'paired')}><option value="independent">Independent groups: permutation mean test</option><option value="paired">Paired measurements: Wilcoxon signed-rank</option></select></label>{paired ? <AnalysisTool key="paired" {...props} analysisId="t.paired" savePreset={savePreset}/> : <StatisticalTools key="independent" {...props} feature="permutation"/>}</div>
  else if (feature.group === 'Statistics') panel = <StatisticalTools {...props}/>
  else if (feature.group === 'Models') panel = <ModelTools {...props}/>
  else if (feature.group === 'Charts') panel = <ChartTools {...props}/>
  else if (feature.group === 'Reports') panel = <ReportTools {...props} runs={runs}/>
  else panel = <TeachingTools {...props}/>
  return <div className="tools-hub mx-auto max-w-[1600px] p-3 text-slate-900 sm:p-6 dark:text-slate-100"><style>{STYLE}</style><header className="mb-5 flex flex-wrap items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-300"><Sparkles size={18}/>Tools Hub · 50 features</p><h1 className="mt-1 text-3xl font-black">From data to a reproducible report</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Prepare, analyze, compare, visualize, and explain your data in this browser.</p></div><Link className="tool-button" to="/analysis">Full analysis workspace</Link></header><div className="mb-5 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"><label className="block max-w-lg">Tools dataset<select value={dataset?.id ?? ''} onChange={e => { setDataset(datasets.find(d => d.id === e.target.value) ?? null); setResume(null) }}><option value="">No active dataset</option>{datasets.map(d => <option key={d.id} value={d.id}>{d.name} · {d.rows} rows</option>)}</select></label>{!dataset && <Link to="/data/upload" className="mt-2 inline-block text-sm text-indigo-600 dark:text-indigo-300">Load data or choose a sample →</Link>}</div><div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]"><details ref={browser} open={browserInitiallyOpen} className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"><summary className="flex cursor-pointer items-center gap-2 font-bold"><Search size={17}/>Browse all 50 features</summary><label className="mt-2 block">Search tool features<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Bootstrap, missing, report…"/></label><label className="mt-3 block">Feature category<select value={category} onChange={e => setCategory(e.target.value)}><option>All</option>{TOOL_GROUPS.map(g => <option key={g}>{g}</option>)}</select></label><p role="status" className="my-3 text-xs">{filtered.length} of 50 features</p><nav aria-label="Tool features" className="grid max-h-[55vh] gap-1 overflow-auto">{filtered.map(f => <button key={f.id} aria-current={feature.id === f.id ? 'page' : undefined} className={`text-left ${feature.id === f.id ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200' : ''}`} onClick={() => go(f.id)}><span className="mr-2 text-xs opacity-70">{String(f.number).padStart(2, '0')}</span>{f.title}</button>)}</nav>{!filtered.length && <p className="p-3 text-sm">No matching features. Try a shorter search.</p>}</details><section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">{feature.group} · Feature {feature.number} / 50</p><h2 ref={heading} tabIndex={-1} className="mb-2 mt-1 scroll-mt-4 text-2xl font-black">{feature.title}</h2><p className="mb-5 text-sm text-slate-600 dark:text-slate-300">{feature.description}</p><SpecificGuide guide={toolGuide(feature.id)!} />{message && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">{message}</p>}<div key={`${feature.id}:${dataset?.id ?? 'empty'}:${resume?.id ?? ''}`}>{panel}</div></section></div></div>
}

