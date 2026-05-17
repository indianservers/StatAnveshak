import { Link } from 'react-router-dom'
import { Map, Search } from 'lucide-react'
import { SITE_CATALOG } from '../lib/siteCatalog'
import { useSeoMetadata } from '../lib/seo'

const grouped = SITE_CATALOG.reduce((acc, item) => {
  acc[item.section] = [...(acc[item.section] ?? []), item]
  return acc
}, {} as Record<string, typeof SITE_CATALOG>)

export function SitemapPage() {
  useSeoMetadata({
    title: 'Sitemap',
    description: 'Search-engine-friendly HTML sitemap for Anveshak pages, analysis tools, distributions, statistical modules, syllabus modules, and computing modules.',
    path: '/sitemap',
    keywords: ['Anveshak sitemap', 'statistics sitemap', 'module index', 'search engine sitemap'],
  })

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
            <Map size={16} />
            Search index
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Sitemap</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            HTML sitemap of all crawlable Anveshak routes and module detail pages. Each link includes a concise
            description and keyword-rich route text for search discovery.
          </p>
        </header>

        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <Search size={16} className="text-indigo-500" />
            <span>{SITE_CATALOG.length} total sitemap links</span>
            <Link to="/documentation" className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">
              Documentation page
            </Link>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {Object.entries(grouped).map(([section, links]) => (
            <section key={section} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{section}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">{links.length}</span>
              </div>
              <ul className="space-y-2">
                {links.map((item) => (
                  <li key={item.path} className="rounded-lg border border-slate-100 p-3 dark:border-slate-700">
                    <Link to={item.path} className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">
                      {item.title}
                    </Link>
                    <p className="mt-1 break-all text-xs text-slate-400">{item.path}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
