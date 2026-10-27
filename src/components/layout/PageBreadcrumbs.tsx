import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { getLab, getStudio } from '../../lib/statisticsStudios'
import { NAV_MENU } from './navMenu'
import { PAGE_NAMES } from './pageNames'

const SECTION_ROOTS: Record<string, string> = { data: '/data/upload', explore: '/explore/summary' }

export function PageBreadcrumbs() {
  const { pathname } = useLocation()
  if (pathname === '/') return null
  const parts = pathname.split('/').filter(Boolean)
  const links = NAV_MENU.flatMap(category => category.groups?.flatMap(group => group.items) ?? [])
  const crumbs = parts.map((part, index) => {
    const path = `/${parts.slice(0, index + 1).join('/')}`
    const studio = parts[0] === 'statistics' ? getStudio(parts[1]) : undefined
    const lab = parts[0] === 'statistics' ? getLab(parts[1], parts[2])?.lab : undefined
    const label = (index === 1 ? studio?.title : index === 2 ? lab?.title : undefined)
      ?? PAGE_NAMES[path] ?? links.find(item => item.to === path)?.label
      ?? part.replace(/[.-]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
    return { label, to: SECTION_ROOTS[part] && index === 0 ? SECTION_ROOTS[part] : path }
  })

  return (
    <nav aria-label="Page breadcrumb" className="shrink-0 border-b border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-900 sm:px-5">
      <ol className="flex min-h-10 flex-wrap items-center gap-x-1 text-xs text-slate-600 dark:text-slate-300">
        <li><Link to="/" className="inline-flex min-h-10 items-center gap-1 rounded px-1 font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-indigo-500"><Home size={13} aria-hidden />Home</Link></li>
        {crumbs.map((crumb, index) => <li key={index} className="inline-flex items-center gap-1">
          <ChevronRight size={13} aria-hidden className="shrink-0 text-slate-400" />
          {index === crumbs.length - 1
            ? <span aria-current="page" className="py-2 font-bold text-slate-900 dark:text-white">{crumb.label}</span>
            : <Link to={crumb.to} className="inline-flex min-h-10 items-center rounded px-1 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-500">{crumb.label}</Link>}
        </li>)}
      </ol>
    </nav>
  )
}
