import { Link } from 'react-router-dom'
import { Compass, Home, Upload } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <Compass className="mx-auto mb-4 text-indigo-500" size={44} />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Page not found</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          That workspace route does not exist. Head home or load a dataset to keep working.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
            <Home size={15} />
            Home
          </Link>
          <Link to="/data/upload" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            <Upload size={15} />
            Upload
          </Link>
        </div>
      </div>
    </div>
  )
}
