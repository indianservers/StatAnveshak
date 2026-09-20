import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Database, FileText, GraduationCap, Link2, Search, ShieldCheck, Sigma } from 'lucide-react'
import { CORE_SITE_LINKS, MODULE_SITE_LINKS, SITE_CATALOG, type SiteCatalogEntry } from '../lib/siteCatalog'
import { ANALYSIS_CATALOG, JASP_MODULE_ORDER, analysesForModule } from '../analysis/catalog'
import { useSeoMetadata } from '../lib/seo'
import { PageBack } from '../components/ui/PageBack'

const WORKFLOWS = [
  ['Import data', 'Upload CSV, Excel, JSON, TSV, or load a sample dataset, then preview schema and missingness.', '/data/upload'],
  ['Explore variables', 'Use descriptive statistics, raincloud plots, charts, correlation, and frequency pages to understand distributions and relationships.', '/analysis/descriptives.statistics'],
  ['Run analysis', 'Move from inference tests to regression, advanced analysis, distribution fitting, and statistical modules.', '/stat-modules'],
  ['Teach and learn', 'Use core statistics, syllabus modules, professional learning, solver examples, and CS modules.', '/learn'],
  ['Report results', 'Review dashboard outputs and export report-ready tables, charts, and summaries.', '/reports'],
]

const groupedModules = MODULE_SITE_LINKS.reduce((acc, item) => {
  acc[item.section] = [...(acc[item.section] ?? []), item]
  return acc
}, {} as Record<string, typeof MODULE_SITE_LINKS>)

const DOC_NAV = [
  ['getting-started', 'Getting Started'],
  ['data-analysis', 'Data Analysis'],
  ['statistics-tools', 'Statistics Tools'],
  ['learning', 'Learning'],
  ['studios', 'Studios'],
  ['faq', 'FAQ / Troubleshooting'],
] as const

export function DocumentationPage() {
  useSeoMetadata({
    title: 'Documentation',
    description: 'Complete Anveshak documentation with every page, module link, workflow, and search-engine-readable detail.',
    path: '/documentation',
    keywords: ['Anveshak documentation', 'statistics workbench guide', 'all module links', 'data analytics documentation'],
  })
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const filterLinks = (links: SiteCatalogEntry[]) =>
    needle ? links.filter((item) => `${item.title} ${item.description} ${item.path}`.toLowerCase().includes(needle)) : links
  const coreGroups = useMemo(() => {
    const grouped = CORE_SITE_LINKS.reduce((acc, item) => {
      acc[item.section] = [...(acc[item.section] ?? []), item]
      return acc
    }, {} as Record<string, typeof CORE_SITE_LINKS>)
    return Object.entries(grouped).map(([section, links]) => [section, filterLinks(links)] as const).filter(([, links]) => links.length > 0)
  }, [needle])

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <PageBack fallback="/" label="Back" />
          <div className="mb-3 mt-2 flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
            <BookOpen size={16} />
            Reference
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Documentation</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Anveshak is a browser-only statistics and data analytics workbench. Jump to a section, search pages, or open the matching tool.
          </p>
          <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
            <Search size={16} className="text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search documentation…"
              className="w-full bg-transparent text-sm outline-none dark:text-slate-100"
            />
          </label>
          <nav className="mt-3 flex flex-wrap gap-2" aria-label="Documentation sections">
            {DOC_NAV.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {label}
              </a>
            ))}
          </nav>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <Metric icon={Link2} label="Indexed links" value={SITE_CATALOG.length} />
          <Metric icon={Sigma} label="Stat modules" value={MODULE_SITE_LINKS.filter((item) => item.path.startsWith('/stat-modules/')).length} />
          <Metric icon={GraduationCap} label="Syllabus modules" value={MODULE_SITE_LINKS.filter((item) => item.path.startsWith('/syllabus/')).length} />
          <Metric icon={Database} label="Distribution pages" value={MODULE_SITE_LINKS.filter((item) => item.path.startsWith('/distributions/')).length} />
        </section>

        <section id="getting-started" className="mb-6 scroll-mt-24 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Getting Started</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            {WORKFLOWS.map(([title, detail, path]) => (
              <Link key={title} to={path} className="rounded-lg border border-slate-100 p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-700 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
              </Link>
            ))}
          </div>
        </section>

        <section id="statistics-tools" className="mb-6 scroll-mt-24 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-2">
            <Sigma size={16} className="text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Statistics Tools</h2>
          </div>
          <p className="mb-4 max-w-3xl text-sm text-slate-500">
            Each JASP module maps to one or more analysis IDs in the workspace. Frequentist and Bayesian share the same ID.
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {JASP_MODULE_ORDER.map((module) => {
              const items = analysesForModule(module)
              const first = items[0]
              return (
                <Link
                  key={module}
                  to={`/analysis/${first?.id ?? 'descriptives.statistics'}`}
                  className="rounded-lg border border-slate-100 p-3 hover:border-indigo-200 dark:border-slate-700"
                >
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{first?.moduleLabel ?? module}</p>
                  <p className="mt-1 text-xs text-slate-500">{items.map((item) => item.id).join(', ')}</p>
                </Link>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-slate-400">{ANALYSIS_CATALOG.length} analyses · {JASP_MODULE_ORDER.length} modules · all implemented</p>
        </section>

        <section id="data-analysis" className="mb-6 scroll-mt-24 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-2">
            <FileText size={16} className="text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Core Pages</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {coreGroups.map(([section, links]) => (
              <LinkGroup key={section} title={section} links={links} />
            ))}
          </div>
          {coreGroups.length === 0 && (
            <p className="text-sm text-slate-500">No results for “{query}”.</p>
          )}
        </section>

        <section id="learning" className="mb-6 scroll-mt-24 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Learning</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Curriculum Map', '/learn/curriculum'],
              ['Learning Paths', '/learn/paths/beginner'],
              ['Studios', '/statistics'],
              ['Classroom', '/classroom'],
            ].map(([title, href]) => (
              <Link key={title} to={href} className="rounded-lg border border-slate-100 p-3 text-sm font-semibold hover:border-indigo-200 dark:border-slate-700">
                {title}
              </Link>
            ))}
          </div>
        </section>

        <section id="faq" className="mb-6 scroll-mt-24 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">FAQ / Troubleshooting</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>Data stays in this browser unless you export a project bundle.</li>
            <li>If a page is blank after refresh, reopen the hash URL (for example <code>/#/learn/curriculum</code>).</li>
            <li>Missing dataset messages are expected on analysis pages until you upload or load a sample.</li>
          </ul>
        </section>

        <section id="studios" className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Module Directory</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/glossary" className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                Open glossary
              </Link>
              <Link to="/sitemap" className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                Open sitemap
              </Link>
            </div>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            {Object.entries(groupedModules).map(([section, links]) => (
              <LinkGroup key={section} title={section} links={links} compact />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Icon size={14} />
        {label}
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
    </div>
  )
}

function LinkGroup({ title, links, compact = false }: { title: string; links: SiteCatalogEntry[]; compact?: boolean }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</h3>
      <div className={compact ? 'max-h-96 space-y-2 overflow-auto pr-1' : 'space-y-2'}>
        {links.map((item) => (
          <Link key={item.path} to={item.path} className="block rounded-lg border border-slate-100 p-3 hover:border-indigo-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-indigo-800 dark:hover:bg-slate-900/50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.title}</span>
              <span className="text-xs text-indigo-600 dark:text-indigo-300">{item.path}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
