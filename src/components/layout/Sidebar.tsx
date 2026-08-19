import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Activity,
  BarChart2,
  BookOpen,
  Brain,
  Calculator,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Database,
  FileDown,
  FileText,
  FlaskConical,
  FolderOpen,
  GitFork,
  Home,
  Layers,
  Menu,
  Map,
  KeyRound,
  PieChart,
  Pin,
  ScanSearch,
  Search,
  Settings,
  Sigma,
  GraduationCap,
  Star,
  Table2,
  History,
  TrendingUp,
  Upload,
  Code2,
  X,
} from 'lucide-react'
import { useStore } from '../../store/useStore'

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { to: '/solver', icon: Calculator, label: 'Solver' },
      { to: '/', icon: Home, label: 'Home' },
      { to: '/projects', icon: FolderOpen, label: 'Projects' },
    ],
  },
  {
    label: 'Data',
    items: [
      { to: '/data/upload', icon: Upload, label: 'Upload' },
      { to: '/data/preview', icon: ScanSearch, label: 'Preview' },
      { to: '/data/grid', icon: Table2, label: 'Data Grid' },
      { to: '/data/clean', icon: Layers, label: 'Clean & Transform' },
      { to: '/data/workbench', icon: ClipboardList, label: 'Stats Workbench' },
      { to: '/data/query', icon: Code2, label: 'Query Workbench' },
    ],
  },
  {
    label: 'Explore',
    items: [
      { to: '/explore/summary', icon: Sigma, label: 'Summary Stats' },
      { to: '/explore/charts', icon: BarChart2, label: 'Charts' },
      { to: '/explore/correlation', icon: GitFork, label: 'Correlation' },
      { to: '/explore/frequency', icon: PieChart, label: 'Frequency' },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { to: '/distributions', icon: Activity, label: 'Distributions' },
      { to: '/inference', icon: Calculator, label: 'Inference Tests' },
      { to: '/regression', icon: TrendingUp, label: 'Regression' },
      { to: '/advanced', icon: Brain, label: 'Advanced Analysis' },
      { to: '/stat-modules', icon: FlaskConical, label: 'Stat Modules' },
      { to: '/syllabus', icon: GraduationCap, label: 'Syllabus Modules' },
      { to: '/modules', icon: KeyRound, label: 'CS Modules' },
    ],
  },
  {
    label: 'Output',
    items: [
      { to: '/dashboard', icon: Database, label: 'Dashboard' },
      { to: '/reports', icon: FileDown, label: 'Export & Reports' },
    ],
  },
  {
    label: 'Learn',
    items: [
      { to: '/learn', icon: BookOpen, label: 'Core Statistics' },
      { to: '/professional-learning', icon: GraduationCap, label: 'Professional Learning' },
      { to: '/documentation', icon: FileText, label: 'Documentation' },
      { to: '/sitemap', icon: Map, label: 'Sitemap' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, favoriteModules, toggleFavoriteModule, activeDataset, datasets, setActiveDataset } = useStore()
  const [query, setQuery] = useState('')
  const [atTop, setAtTop] = useState(true)
  const [atBottom, setAtBottom] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)')
    if (media.matches && sidebarOpen) {
      setSidebarOpen(false)
    }
  // Run only once so a user tap can reopen the drawer on mobile.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!sidebarOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen, setSidebarOpen])

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const groups = NAV_GROUPS.map((group) => ({
      ...group,
      items: q ? group.items.filter((item) => item.label.toLowerCase().includes(q)) : group.items,
    })).filter((group) => group.items.length > 0)
    if (!q || !activeDataset) return groups
    const columnItems = activeDataset.schema
      .filter((col) => col.name.toLowerCase().includes(q))
      .slice(0, 8)
      .map((col) => ({
        to: col.type === 'numeric' ? '/explore/summary' : '/explore/frequency',
        icon: col.type === 'numeric' ? Sigma : Table2,
        label: col.name,
      }))
    return columnItems.length > 0 ? [{ label: 'Columns', items: columnItems }, ...groups] : groups
  }, [query, activeDataset])

  const favoriteItems = useMemo(() => {
    const all = NAV_GROUPS.flatMap((group) => group.items)
    return favoriteModules.map((path) => all.find((item) => item.to === path)).filter(Boolean) as typeof all
  }, [favoriteModules])
  const recentDatasets = useMemo(() => [...datasets].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3), [datasets])

  const updateScrollIndicators = () => {
    const node = navRef.current
    if (!node) return
    setAtTop(node.scrollTop <= 2)
    setAtBottom(node.scrollTop + node.clientHeight >= node.scrollHeight - 2)
  }

  const moveSidebarFocus = (direction: 1 | -1) => {
    const links = Array.from(navRef.current?.querySelectorAll<HTMLElement>('[data-sidebar-nav]') ?? [])
    if (links.length === 0) return
    const currentIndex = Math.max(0, links.findIndex((link) => link === document.activeElement))
    const next = links[(currentIndex + direction + links.length) % links.length]
    next.focus()
  }

  const closeMobileDrawer = () => {
    if (window.matchMedia('(max-width: 768px)').matches) {
      setSidebarOpen(false)
    }
  }

  return (
    <Fragment>
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg shadow-slate-900/15 transition-colors hover:bg-slate-50 md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          aria-label="Open menu"
          title="Open menu"
        >
          <Menu size={20} />
        </button>
      )}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 block bg-slate-950/45 backdrop-blur-[1px] md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Dismiss navigation overlay"
        />
      )}
      <aside
      className={`app-sidebar relative flex flex-col bg-slate-900 text-slate-100 transition-all duration-200 ${
        sidebarOpen ? 'w-60' : 'w-14'
      } min-h-screen shrink-0`}
    >
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="absolute -right-3 top-5 z-30 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 shadow-lg shadow-slate-950/30 transition-colors hover:border-indigo-400 hover:bg-indigo-600 hover:text-white md:flex"
          title="Expand sidebar"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={15} />
        </button>
      )}

      <div className={`flex border-b border-slate-700 px-3 py-4 ${sidebarOpen ? 'items-center gap-2' : 'flex-col items-center gap-3'}`}>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-white ${sidebarOpen ? 'cursor-default' : 'transition-colors hover:bg-indigo-400'}`}
          title={sidebarOpen ? 'Anveshak' : 'Expand sidebar'}
          aria-label={sidebarOpen ? 'Anveshak navigation' : 'Expand sidebar'}
        >
          <FlaskConical size={16} className="text-white" />
        </button>
        {sidebarOpen && (
          <span className="font-bold text-lg tracking-tight text-white">Anveshak</span>
        )}
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className={`${sidebarOpen ? 'ml-auto flex' : 'hidden'} h-8 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white`}
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={16} className="hidden md:block" />
          <X size={18} className="md:hidden" />
          <span className="hidden lg:inline">Collapse</span>
        </button>
      </div>

      {sidebarOpen && (
        <div className="px-3 py-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search modules or columns"
              className="w-full rounded-md border border-slate-700 bg-slate-800 py-1.5 pl-8 pr-2 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      <div className="relative flex-1 min-h-0">
      {!atTop && <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-gradient-to-b from-slate-900 to-transparent" />}
      <nav
        ref={navRef}
        className="h-full overflow-y-auto py-2"
        onScroll={updateScrollIndicators}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            moveSidebarFocus(1)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            moveSidebarFocus(-1)
          }
        }}
      >
        {favoriteItems.length > 0 && sidebarOpen && (
          <div className="mb-1">
            <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Pinned</p>
            {favoriteItems.map((item) => (
              <SidebarLink
                key={item.to}
                item={item}
                sidebarOpen={sidebarOpen}
                pinned
                onPin={toggleFavoriteModule}
                onNavigate={closeMobileDrawer}
              />
            ))}
          </div>
        )}

        {recentDatasets.length > 0 && sidebarOpen && (
          <div className="mb-1">
            <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Recents</p>
            <div className="flex gap-2 px-3 pb-2">
              {recentDatasets.map((dataset) => (
                <button
                  key={dataset.id}
                  type="button"
                  onClick={() => {
                    setActiveDataset(dataset)
                    navigate('/data/preview')
                    closeMobileDrawer()
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-xs font-bold text-slate-300 hover:border-indigo-400 hover:text-white"
                  title={dataset.name}
                  data-sidebar-nav
                >
                  <History size={14} />
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredGroups.map((group) => (
          <div key={group.label} className="mb-1">
            {sidebarOpen && (
              <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                {group.label}
              </p>
            )}
            {group.items.map((item) => (
              <SidebarLink
                key={`${group.label}-${item.to}-${item.label}`}
                item={item}
                sidebarOpen={sidebarOpen}
                pinned={favoriteModules.includes(item.to)}
                onPin={toggleFavoriteModule}
                onNavigate={closeMobileDrawer}
              />
            ))}
          </div>
        ))}
      </nav>
      {!atBottom && <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t from-slate-900 to-transparent" />}
      </div>

      <div className="px-3 py-3 border-t border-slate-700 text-xs text-slate-500 text-center">
        {sidebarOpen ? 'v1.0.0 - Browser Only' : ''}
      </div>
    </aside>
    </Fragment>
  )
}

function SidebarLink({
  item,
  sidebarOpen,
  pinned,
  onPin,
  onNavigate,
}: {
  item: { to: string; icon: typeof Home; label: string }
  sidebarOpen: boolean
  pinned: boolean
  onPin: (path: string) => void
  onNavigate: () => void
}) {
  const Icon = item.icon

  return (
    <div className="group mx-1 flex items-center">
      <NavLink
        data-sidebar-nav
        to={item.to}
        end={item.to === '/'}
        onClick={onNavigate}
        title={!sidebarOpen ? item.label : undefined}
        className={({ isActive }) =>
          `flex min-w-0 flex-1 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
            isActive
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
          }`
        }
      >
        <Icon size={16} className="shrink-0" />
        {sidebarOpen && <span className="truncate">{item.label}</span>}
      </NavLink>
      {sidebarOpen && (
        <button
          onClick={() => onPin(item.to)}
          className="mr-1 hidden rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-amber-300 group-hover:block"
          title={pinned ? 'Unpin module' : 'Pin module'}
        >
          {pinned ? <Star size={13} className="fill-amber-300 text-amber-300" /> : <Pin size={13} />}
        </button>
      )}
    </div>
  )
}
