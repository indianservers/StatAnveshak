import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useStore } from '../../store/useStore'
import { ToastProvider } from '../ui/Toast'
import { CommandPalette } from '../ui/CommandPalette'
import { UiPolishLayer } from '../ui/UiPolishLayer'

export function AppShell() {
  const { theme, highContrast, largeText, zoomLevel, density } = useStore()

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
        <div className={`flex h-screen overflow-hidden ${density === 'compact' ? 'ui-compact' : ''} ${highContrast ? 'bg-black' : 'bg-slate-50 dark:bg-slate-900'}`}>
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-auto page-fade">
              <Outlet />
            </main>
          </div>
        </div>
        <CommandPalette />
        <UiPolishLayer />
      </ToastProvider>
    </div>
  )
}
