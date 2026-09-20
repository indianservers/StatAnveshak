import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, Database, Inbox, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Action = {
  label: string
  to?: string
  onClick?: () => void
}

type StateCardProps = {
  icon: LucideIcon
  title: string
  description: string
  tone?: 'neutral' | 'danger' | 'info'
  primary?: Action
  secondary?: Action
  children?: ReactNode
}

const TONE: Record<NonNullable<StateCardProps['tone']>, string> = {
  neutral: 'bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400',
  danger: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300',
  info: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300',
}

function ActionButton({ action, primary }: { action: Action; primary?: boolean }) {
  const className = primary
    ? 'inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700'
    : 'inline-flex items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
  if (action.to) {
    return <Link to={action.to} className={className}>{action.label}</Link>
  }
  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  )
}

export function StateCard({ icon: Icon, title, description, tone = 'neutral', primary, secondary, children }: StateCardProps) {
  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${TONE[tone]}`}>
          <Icon size={22} />
        </div>
        <h1 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
        {(primary || secondary) && (
          <div className="mt-5 flex flex-wrap gap-2">
            {primary && <ActionButton action={primary} primary />}
            {secondary && <ActionButton action={secondary} />}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  primary,
  secondary,
}: {
  title: string
  description: string
  primary?: Action
  secondary?: Action
}) {
  return <StateCard icon={Inbox} title={title} description={description} primary={primary} secondary={secondary} />
}

export function ErrorState({
  title = 'Something went wrong. Try again.',
  description = 'This page hit a problem. Your browser data is still local.',
  onRetry,
  backTo,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  backTo?: string
}) {
  return (
    <StateCard
      icon={AlertTriangle}
      tone="danger"
      title={title}
      description={description}
      primary={onRetry ? { label: 'Retry', onClick: onRetry } : { label: 'Back', to: backTo ?? '/' }}
      secondary={onRetry ? { label: 'Back', to: backTo ?? '/' } : undefined}
    />
  )
}

export function LoadingState({ label = 'Loading workspace...' }: { label?: string }) {
  return (
    <div className="flex h-full min-h-64 items-center justify-center gap-3 p-6 text-sm text-slate-400">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      <span>{label}</span>
    </div>
  )
}

export function NoDatasetState({
  description = 'Upload a dataset to continue.',
  preferredPath = '/data/upload',
}: {
  description?: string
  preferredPath?: string
}) {
  return (
    <StateCard
      icon={Database}
      tone="info"
      title="No dataset loaded"
      description={description}
      primary={{ label: 'Upload Dataset', to: '/data/upload' }}
      secondary={{ label: 'Go to datasets page', to: preferredPath === '/data/upload' ? '/data/preview' : preferredPath }}
    />
  )
}

export function NoNumericColumnsState({ analysis = 'this analysis' }: { analysis?: string }) {
  return (
    <EmptyState
      title="No suitable numeric columns are available"
      description={`No suitable numeric columns are available for ${analysis}. Choose a dataset with numeric variables, or pick a different analysis.`}
      primary={{ label: 'Upload Dataset', to: '/data/upload' }}
      secondary={{ label: 'Preview data', to: '/data/preview' }}
    />
  )
}

export function RetryIcon() {
  return <RotateCcw size={15} />
}
