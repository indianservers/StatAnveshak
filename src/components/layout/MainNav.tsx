import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { isCategoryActive, NAV_MENU, type NavCategory, type NavItem } from './navMenu'

const PANEL_COLUMNS: Record<number, string> = {
  1: 'max-w-xs grid-cols-1',
  2: 'max-w-xl grid-cols-2',
  3: 'max-w-4xl grid-cols-3',
  4: 'max-w-6xl grid-cols-4',
  5: 'grid-cols-5',
}

export function MainNav() {
  const [open, setOpen] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSection, setMobileSection] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const setWorkspaceMode = useStore((state) => state.setWorkspaceMode)
  const [menuPath, setMenuPath] = useState(pathname)

  if (menuPath !== pathname) {
    setMenuPath(pathname)
    setOpen(null)
    setMobileOpen(false)
  }

  const anyOpen = open !== null || mobileOpen
  useEffect(() => {
    if (!anyOpen) return
    const onPointer = (event: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpen(null)
        setMobileOpen(false)
      }
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const trigger = open ? navRef.current?.querySelector<HTMLElement>(`[data-nav-trigger="${open}"]`) : null
      setOpen(null)
      setMobileOpen(false)
      trigger?.focus()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [anyOpen, open])

  const choose = (category: NavCategory) => {
    if (category.mode) setWorkspaceMode(category.mode)
    setOpen(null)
    setMobileOpen(false)
  }

  const onTriggerKey = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    if (event.key !== 'ArrowDown') return
    event.preventDefault()
    setOpen(id)
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('a')?.focus())
  }

  const current = NAV_MENU.find((category) => isCategoryActive(category, pathname))
  const openCategory = NAV_MENU.find((category) => category.id === open)

  return (
    <nav ref={navRef} aria-label="Main" className="relative z-30 shrink-0 border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <ul className="hidden items-center gap-0.5 px-2 sm:px-3 md:px-4 lg:flex">
        {NAV_MENU.map((category) => {
          const Icon = category.icon
          const active = isCategoryActive(category, pathname)
          const expanded = open === category.id
          const base = `inline-flex h-10 items-center gap-1.5 border-b-2 px-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
            active || expanded
              ? 'border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
          }`
          return (
            <li key={category.id}>
              {category.to ? (
                <Link to={category.to} onClick={() => choose(category)} aria-current={active ? 'page' : undefined} className={base}>
                  <Icon size={16} aria-hidden />
                  {category.label}
                </Link>
              ) : (
                <button
                  type="button"
                  data-nav-trigger={category.id}
                  aria-expanded={expanded}
                  aria-controls={`nav-panel-${category.id}`}
                  onClick={() => setOpen(expanded ? null : category.id)}
                  onMouseEnter={() => open && setOpen(category.id)}
                  onKeyDown={(event) => onTriggerKey(event, category.id)}
                  className={base}
                >
                  <Icon size={16} aria-hidden />
                  {category.label}
                  <ChevronDown size={14} className={`transition ${expanded ? 'rotate-180' : ''}`} aria-hidden />
                </button>
              )}
            </li>
          )
        })}
      </ul>

      {openCategory?.groups && (
        <div
          ref={panelRef}
          id={`nav-panel-${openCategory.id}`}
          className="absolute inset-x-0 top-full hidden max-h-[calc(100vh-7rem)] overflow-y-auto border-b border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-800 lg:block"
        >
          <div className="px-4 py-5 md:px-6">
            <div className={`grid gap-x-6 gap-y-5 ${PANEL_COLUMNS[Math.min(openCategory.groups.length, 5)]}`}>
              {openCategory.groups.map((group) => {
                const GroupIcon = group.icon
                return (
                  <section key={group.title} aria-labelledby={`nav-group-${openCategory.id}-${group.title}`} className="min-w-0">
                    <h3
                      id={`nav-group-${openCategory.id}-${group.title}`}
                      className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
                        <GroupIcon size={13} aria-hidden />
                      </span>
                      {group.title}
                    </h3>
                    <ul className="space-y-0.5">
                      {group.items.map((item) => (
                        <li key={item.to + item.label}>
                          <NavItemLink item={item} active={pathname === item.to} onSelect={() => choose(openCategory)} />
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              })}
            </div>
            {openCategory.footer && (
              <Link
                to={openCategory.footer.to}
                onClick={() => choose(openCategory)}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-950"
              >
                <openCategory.footer.icon size={15} aria-hidden />
                {openCategory.footer.label}
                <ArrowRight size={14} aria-hidden />
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="flex h-10 items-center gap-2 px-2 sm:px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          aria-expanded={mobileOpen}
          aria-controls="nav-mobile-panel"
          className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 px-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {mobileOpen ? <X size={16} aria-hidden /> : <Menu size={16} aria-hidden />}
          Menu
        </button>
        {current && (
          <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            <current.icon size={15} aria-hidden />
            {current.label}
          </span>
        )}
      </div>

      {mobileOpen && (
        <div
          id="nav-mobile-panel"
          className="absolute inset-x-0 top-full max-h-[calc(100vh-7rem)] overflow-y-auto border-b border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-800 lg:hidden"
        >
          <ul className="space-y-1">
            {NAV_MENU.map((category) => {
              const Icon = category.icon
              const active = isCategoryActive(category, pathname)
              const expanded = mobileSection === category.id
              const rowClass = `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold ${
                active ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700'
              }`
              return (
                <li key={category.id}>
                  {category.to ? (
                    <Link to={category.to} onClick={() => choose(category)} className={rowClass}>
                      <Icon size={17} aria-hidden />
                      {category.label}
                    </Link>
                  ) : (
                    <>
                      <button type="button" aria-expanded={expanded} onClick={() => setMobileSection(expanded ? null : category.id)} className={rowClass}>
                        <Icon size={17} aria-hidden />
                        <span className="flex-1">{category.label}</span>
                        <ChevronDown size={15} className={`transition ${expanded ? 'rotate-180' : ''}`} aria-hidden />
                      </button>
                      {expanded && (
                        <div className="space-y-3 px-2 pb-2 pt-1">
                          {category.groups?.map((group) => (
                            <section key={group.title}>
                              <h3 className="mb-1 flex items-center gap-1.5 px-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                                <group.icon size={12} aria-hidden />
                                {group.title}
                              </h3>
                              <ul className="grid gap-0.5 sm:grid-cols-2">
                                {group.items.map((item) => (
                                  <li key={item.to + item.label}>
                                    <NavItemLink item={item} active={pathname === item.to} onSelect={() => choose(category)} />
                                  </li>
                                ))}
                              </ul>
                            </section>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </nav>
  )
}

function NavItemLink({ item, active, onSelect }: { item: NavItem; active: boolean; onSelect: () => void }) {
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      onClick={onSelect}
      aria-current={active ? 'page' : undefined}
      className={`group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        active ? 'bg-indigo-50 dark:bg-indigo-950/50' : 'hover:bg-slate-50 dark:hover:bg-slate-700/60'
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition ${
          active
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white dark:bg-slate-700 dark:text-slate-300'
        }`}
      >
        <Icon size={14} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className={`block truncate text-sm font-semibold ${active ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>
          {item.label}
        </span>
        {item.description && <span className="block truncate text-[11px] text-slate-400">{item.description}</span>}
      </span>
    </Link>
  )
}
