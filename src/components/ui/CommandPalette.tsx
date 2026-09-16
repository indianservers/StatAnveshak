import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import {
  labPath,
  searchLearning,
  STATISTICS_STUDIOS,
  STUDIOS_ROOT,
  studioPath,
} from '../../lib/statisticsStudios'

type Command = { label: string; path: string; category: string }

const BASE_COMMANDS: Command[] = [
  { label: 'Home', path: '/', category: 'Workspace' },
  { label: 'Upload Data', path: '/data/upload', category: 'Data' },
  { label: 'Preview Data', path: '/data/preview', category: 'Data' },
  { label: 'Data Grid', path: '/data/grid', category: 'Data' },
  { label: 'Clean and Transform', path: '/data/clean', category: 'Data' },
  { label: 'Statistics Workbench', path: '/data/workbench', category: 'Data' },
  { label: 'Analysis Wizard', path: '/data/workbench', category: 'Statistics' },
  { label: 'Variable View', path: '/data/workbench', category: 'Statistics' },
  { label: 'Data Dictionary', path: '/data/workbench', category: 'Statistics' },
  { label: 'Data Quality Diagnosis', path: '/data/workbench', category: 'Statistics' },
  { label: 'Descriptive Statistics', path: '/analysis/descriptives.statistics', category: 'Analysis' },
  { label: 'Raincloud Plots', path: '/analysis/descriptives.raincloud', category: 'Analysis' },
  { label: 'Time Series Descriptives', path: '/analysis/descriptives.timeSeries', category: 'Analysis' },
  { label: 'Flexplot', path: '/analysis/descriptives.flexplot', category: 'Analysis' },
  { label: 'Summary Statistics', path: '/analysis/descriptives.statistics', category: 'Explore' },
  { label: 'Charts', path: '/explore/charts', category: 'Explore' },
  { label: 'Correlation', path: '/analysis/regression.correlation', category: 'Explore' },
  { label: 'Frequency', path: '/analysis/frequencies.contingency', category: 'Explore' },
  { label: 'Distributions Studio', path: '/distributions', category: 'Studios' },
  { label: 'Independent Samples T-Test', path: '/analysis/t.independent', category: 'Analysis' },
  { label: 'Paired Samples T-Test', path: '/analysis/t.paired', category: 'Analysis' },
  { label: 'One Sample T-Test', path: '/analysis/t.oneSample', category: 'Analysis' },
  { label: 'ANOVA', path: '/analysis/anova.between', category: 'Analysis' },
  { label: 'Power Analysis', path: '/analysis/power.analysis', category: 'Analysis' },
  { label: 'Inference Tests', path: '/analysis/t.oneSample', category: 'Analysis' },
  { label: 'Regression', path: '/analysis/regression.linear', category: 'Analysis' },
  { label: 'Bayes Factor Functions', path: '/analysis/bff.general', category: 'Analysis' },
  { label: 'Learn Bayes', path: '/analysis/learnBayes.labs', category: 'Analysis' },
  { label: 'Learn Stats', path: '/analysis/learnStats.labs', category: 'Analysis' },
  { label: 'Published Summary Statistics', path: '/analysis/summaryStats.fromPublished', category: 'Analysis' },
  { label: 'ARIMA', path: '/analysis/timeSeries.arima', category: 'Analysis' },
  { label: 'Kaplan–Meier', path: '/analysis/survival.nonparametric', category: 'Analysis' },
  { label: 'Linear Mixed Models', path: '/analysis/mixed.lmm', category: 'Analysis' },
  { label: 'PROCESS', path: '/analysis/process.model', category: 'Analysis' },
  { label: 'Prophet', path: '/analysis/prophet.forecast', category: 'Analysis' },
  { label: 'Confirmatory Factor Analysis', path: '/analysis/factor.cfa', category: 'Analysis' },
  { label: 'Structural Equation Modeling', path: '/analysis/sem.sem', category: 'Analysis' },
  { label: 'Meta-Analysis', path: '/analysis/meta.analysis', category: 'Analysis' },
  { label: 'Network Analysis', path: '/analysis/network.psych', category: 'Analysis' },
  { label: 'JAGS', path: '/analysis/jags.model', category: 'Analysis' },
  { label: 'Bain', path: '/analysis/bain.tests', category: 'Analysis' },
  { label: 'ML Regression', path: '/analysis/ml.regression', category: 'Analysis' },
  { label: 'ML Clustering', path: '/analysis/ml.clustering', category: 'Analysis' },
  { label: 'Control Charts', path: '/analysis/qc.charts', category: 'Analysis' },
  { label: 'Process Capability', path: '/analysis/qc.capability', category: 'Analysis' },
  { label: 'Data Auditing', path: '/analysis/audit.data', category: 'Analysis' },
  { label: 'Distribution Families', path: '/analysis/distributions.explorer', category: 'Analysis' },
  { label: 'Advanced Analysis', path: '/advanced', category: 'Analysis' },
  { label: 'Stat Modules', path: '/stat-modules', category: 'Analysis' },
  { label: 'Syllabus Modules', path: '/syllabus', category: 'Syllabus' },
  { label: 'Sample Spaces and Events', path: '/syllabus/sample_spaces', category: 'Syllabus' },
  { label: 'Conditional Probability and Bayes', path: '/syllabus/conditional_bayes', category: 'Syllabus' },
  { label: 'Counting Techniques', path: '/syllabus/counting', category: 'Syllabus' },
  { label: 'Cryptography Module', path: '/modules/cryptography', category: 'CS Modules' },
  { label: 'Sorting Module', path: '/modules/sorting', category: 'CS Modules' },
  { label: 'Searching Module', path: '/modules/searching', category: 'CS Modules' },
  { label: 'Computer Science Modules', path: '/modules', category: 'CS Modules' },
  { label: 'Dashboard', path: '/dashboard', category: 'Output' },
  { label: 'Reports', path: '/reports', category: 'Output' },
  { label: 'Lesson wall', path: '/dashboard', category: 'Learn' },
  { label: 'Classroom', path: '/classroom', category: 'Learn' },
  { label: 'Core Statistics', path: '/learn', category: 'Learn' },
  { label: 'Professional Learning', path: '/professional-learning', category: 'Learn' },
  { label: 'Practice Engine', path: '/professional-learning', category: 'Learn' },
  { label: 'Decision Wizard', path: '/professional-learning', category: 'Learn' },
  { label: 'Analysis Notebook', path: '/professional-learning', category: 'Learn' },
  { label: 'Project Bundle Export Import', path: '/professional-learning', category: 'Output' },
  { label: 'Classroom Submission', path: '/professional-learning', category: 'Output' },
  { label: 'Shareable Report Package', path: '/professional-learning', category: 'Output' },
  { label: 'Probability Theorem Modifications', path: '/learn', category: 'Learn' },
  { label: 'Teaching Mode', path: '/learn', category: 'Learn' },
  { label: 'Solver', path: '/solver', category: 'Learn' },
  { label: 'Karl Pearson Correlation Solver', path: '/solver', category: 'Learn' },
  { label: 'Documentation', path: '/documentation', category: 'Reference' },
  { label: 'All Links and Details', path: '/documentation', category: 'Reference' },
  { label: 'Statistics Glossary', path: '/glossary', category: 'Reference' },
  { label: 'Glossary of Statistics Terms', path: '/glossary', category: 'Reference' },
  { label: 'Sitemap', path: '/sitemap', category: 'Reference' },
  { label: 'Search Engine Sitemap', path: '/sitemap', category: 'Reference' },
  { label: 'Settings', path: '/settings', category: 'Learn' },
]

/** Studios and their labs, derived from the learning config so the two never drift apart. */
const STUDIO_COMMANDS: Command[] = [
  { label: 'Probability & Statistics Studios', path: STUDIOS_ROOT, category: 'Studios' },
  ...STATISTICS_STUDIOS.map((studio) => ({
    label: `${studio.title} Studio`,
    path: studioPath(studio),
    category: 'Studios',
  })),
  ...STATISTICS_STUDIOS.flatMap((studio) =>
    studio.labs.map((lab) => ({
      label: `${lab.title} — ${studio.title}`,
      path: labPath(studio.slug, lab.slug),
      category: 'Labs',
    })),
  ),
]

const COMMANDS: Command[] = [...BASE_COMMANDS, ...STUDIO_COMMANDS]

function highlight(text: string, query: string) {
  const q = query.trim()
  if (!q) return text
  const index = text.toLowerCase().indexOf(q.toLowerCase())
  if (index < 0) return text
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-amber-100 px-0.5 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">{text.slice(index, index + q.length)}</mark>
      {text.slice(index + q.length)}
    </>
  )
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COMMANDS
    const matches = COMMANDS.filter(
      (item) => item.label.toLowerCase().includes(q) || item.path.includes(q) || item.category.toLowerCase().includes(q),
    )
    const concepts: Command[] = searchLearning(q, 12)
      .filter((hit) => hit.kind === 'concept')
      .map((hit) => ({ label: `${hit.label} — ${hit.context}`, path: hit.path, category: 'Concepts' }))
    return [...matches, ...concepts]
  }, [query])
  const grouped = useMemo(() => results.reduce((acc, item) => {
    acc[item.category] = [...(acc[item.category] ?? []), item]
    return acc
  }, {} as Record<string, Command[]>), [results])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 p-4 pt-24" onMouseDown={() => setOpen(false)}>
      <div
        className="mx-auto max-w-xl overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <Search size={18} className="text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search commands and pages..."
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          <span className="whitespace-nowrap text-xs text-slate-400">
            {results.length > 0 ? `1 of ${results.length} results` : '0 results'}
          </span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-400 dark:bg-slate-700">Esc</span>
        </div>
        <div className="max-h-80 overflow-auto p-2">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-2">
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{category}</p>
              {items.map((item) => (
                <button
                  key={`${item.category}-${item.path}-${item.label}`}
                  onClick={() => {
                    navigate(item.path)
                    setOpen(false)
                    setQuery('')
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-200"
                >
                  <span>{highlight(item.label, query)}</span>
                  <span className="text-xs text-slate-400">{highlight(item.path, query)}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
