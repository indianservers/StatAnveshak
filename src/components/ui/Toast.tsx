import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { ToastContext, type ToastTone } from './toastContext'

type Toast = {
  id: number
  message: string
  tone: ToastTone
}

const TONE_ICON: Record<ToastTone, typeof Info> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: AlertTriangle,
}

const TONE_CLASS: Record<ToastTone, string> = {
  success: 'text-green-500',
  info: 'text-indigo-500',
  warning: 'text-amber-500',
  error: 'text-rose-500',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((items) => items.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((items) => [...items, { id, message, tone }])
    window.setTimeout(() => dismiss(id), tone === 'error' || tone === 'warning' ? 6000 : 4000)
  }, [dismiss])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 space-y-2">
        {toasts.map((toast) => {
          const Icon = TONE_ICON[toast.tone] ?? Info
          return (
            <div
              key={toast.id}
              className="copy-pop flex max-w-sm items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Icon size={16} className={`mt-0.5 shrink-0 ${TONE_CLASS[toast.tone]}`} />
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
