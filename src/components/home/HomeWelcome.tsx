import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList, Code2, Upload } from 'lucide-react'
import { useStore } from '../../store/useStore'

const DATA_LINKS = [
  {
    to: '/data/workbench',
    title: 'Stats Workbench',
    description: 'Clean, recode, and prepare columns for analysis.',
    icon: ClipboardList,
  },
  {
    to: '/data/query',
    title: 'Query Workbench',
    description: 'Run SELECT previews on the loaded dataset.',
    icon: Code2,
  },
  {
    to: '/data/upload',
    title: 'Upload Data',
    description: 'Import CSV, Excel, JSON, or TXT. Stays on this device.',
    icon: Upload,
  },
] as const

export function HomeWelcome() {
  const setWorkspaceMode = useStore((state) => state.setWorkspaceMode)
  const navigate = useNavigate()

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">Welcome to Anveshak</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300 sm:text-base">
        A browser-only statistics & data analytics workbench. Your data never leaves your device.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {DATA_LINKS.map(({ to, title, description, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={(event) => {
              event.preventDefault()
              setWorkspaceMode('analyze')
              navigate(to)
            }}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/70 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-indigo-800"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Icon size={16} />
            </span>
            <p className="mt-3 font-black text-slate-950 dark:text-white">{title}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
