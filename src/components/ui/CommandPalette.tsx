import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'

const COMMANDS = [
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
  { label: 'Summary Statistics', path: '/explore/summary', category: 'Explore' },
  { label: 'Charts', path: '/explore/charts', category: 'Explore' },
  { label: 'Correlation', path: '/explore/correlation', category: 'Explore' },
  { label: 'Frequency', path: '/explore/frequency', category: 'Explore' },
  { label: 'Distributions', path: '/distributions', category: 'Analysis' },
  { label: 'Inference Tests', path: '/inference', category: 'Analysis' },
  { label: 'Regression', path: '/regression', category: 'Analysis' },
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
  { label: 'Teaching Mode', path: '/learn', category: 'Learn' },
  { label: 'Settings', path: '/settings', category: 'Learn' },
]

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
    return COMMANDS.filter((item) => item.label.toLowerCase().includes(q) || item.path.includes(q) || item.category.toLowerCase().includes(q))
  }, [query])
  const grouped = useMemo(() => results.reduce((acc, item) => {
    acc[item.category] = [...(acc[item.category] ?? []), item]
    return acc
  }, {} as Record<string, typeof COMMANDS>), [results])

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
                  key={item.path}
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
