import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react'

type Props = {
  children: ReactNode
  resetKey?: string
  variant?: 'page' | 'lab'
}

type State = {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && this.props.resetKey !== prevProps.resetKey) {
      this.setState({ error: null })
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Page crashed:', error, info)
  }

  private retry = () => {
    this.setState({ error: null })
  }

  private goBack = () => {
    this.setState({ error: null })
    if (window.history.length > 1) window.history.back()
    else window.location.hash = '#/'
  }

  render() {
    if (!this.state.error) return this.props.children

    const lab = this.props.variant === 'lab'
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div className="max-w-md rounded-lg border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-800 dark:bg-slate-800">
          <AlertTriangle className="mx-auto mb-3 text-rose-500" size={36} />
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">
            {lab ? 'This lab hit an error' : 'Something went wrong while loading this page.'}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {lab
              ? 'Reload this lab. The rest of the workspace and your dataset stay put.'
              : 'Your saved browser data is still local. Retry this page or go back to keep working.'}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={lab ? this.retry : this.retry}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
            >
              <RotateCcw size={15} />
              Retry
            </button>
            {!lab && (
              <button
                type="button"
                onClick={this.goBack}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ArrowLeft size={15} />
                Back
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
}
