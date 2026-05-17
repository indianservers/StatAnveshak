import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useStore } from '../../store/useStore'
import { ToastProvider } from '../ui/Toast'
import { CommandPalette } from '../ui/CommandPalette'
import { UiPolishLayer } from '../ui/UiPolishLayer'
import { OnboardingTour } from '../ui/OnboardingTour'
import { TestRecommenderDrawer } from '../ui/TestRecommenderDrawer'
import { SeoMetadata } from '../ui/SeoMetadata'

export function AppShell() {
  const { theme, highContrast, largeText, zoomLevel, density, hydrateStorage } = useStore()

  useEffect(() => {
    hydrateStorage().catch((error) => {
      console.error('Failed to hydrate browser storage:', error)
    })
  }, [hydrateStorage])

  useEffect(() => {
    const base = largeText ? 17 : 16
    document.documentElement.style.fontSize = `${base * zoomLevel}px`
    return () => {
      document.documentElement.style.fontSize = ''
    }
  }, [largeText, zoomLevel])

  return (
    <div className={theme === 'dark' || highContrast ? 'dark' : ''}>
      <ToastProvider>
        <SeoMetadata />
        <div className={`flex h-screen overflow-hidden ${density === 'compact' ? 'ui-compact' : ''} ${highContrast ? 'bg-black' : 'bg-slate-50 dark:bg-slate-900'}`}>
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <TopBar />
            <main className="min-h-0 flex-1 overflow-auto page-fade">
              <div className="flex h-full flex-col">
                <div className="min-h-0 flex-1">
                  <Outlet />
                </div>
                <AimerFooter />
              </div>
            </main>
          </div>
        </div>
        <CommandPalette />
        <UiPolishLayer />
        <OnboardingTour />
        <TestRecommenderDrawer />
      </ToastProvider>
    </div>
  )
}

function AimerFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/95 px-4 py-5 text-slate-600 shadow-[0_-10px_30px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-300">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <a
            href="https://www.AimerSociety.com"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-bold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
          >
            www.AimerSociety.com
          </a>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">AI Learning Tools</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Artificial Intelligence Medical & Engineering Researchers Society</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
