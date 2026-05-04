import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, X } from 'lucide-react'
import { ToastContext, type ToastTone } from './toastContext'

type Toast = {
  id: number
  message: string
  tone: ToastTone
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((items) => items.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = Date.now()
    setToasts((items) => [...items, { id, message, tone }])
    window.setTimeout(() => dismiss(id), 3000)
  }, [dismiss])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 space-y-2">
        {toasts.map((toast) => {
          const Icon = toast.tone === 'success' ? CheckCircle2 : Info
          return (
            <div
              key={toast.id}
              className="copy-pop flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 shadow-lg"
            >
              <Icon size={16} className={toast.tone === 'success' ? 'text-green-500' : 'text-indigo-500'} />
              <span>{toast.message}</span>
              <button onClick={() => dismiss(toast.id)} className="ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
