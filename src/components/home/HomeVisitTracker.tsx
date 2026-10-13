import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { writeLocalJson } from '../../lib/safeStorage'
import { readHomeVisits } from './homeVisits'

export function HomeVisitTracker() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (pathname === '/') return
    let cancelled = false
    void import('./homeSearchCatalog').then(({ HOME_SEARCH_ENTRIES }) => {
      if (cancelled) return
      const entry = HOME_SEARCH_ENTRIES.find((item) => item.path === pathname)
      if (!entry) return
      writeLocalJson('home-recent-visits', [{ path: entry.path, title: entry.title, analyze: entry.analyze, at: Date.now() }, ...readHomeVisits().filter((item) => item.path !== pathname)].slice(0, 8))
    })
    return () => { cancelled = true }
  }, [pathname])
  return null
}
