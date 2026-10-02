import { Link, useParams } from 'react-router-dom'
import { getStudio, STUDIOS_ROOT } from '../../lib/statisticsStudios'
import { StudioPage } from '../../components/statistics/StudioPage'
import { FOCUS_RING } from '../../components/statistics/studioTheme'

export function StudioLandingPage() {
  const { studioSlug } = useParams()
  const studio = getStudio(studioSlug)

  if (!studio) return <StudioNotFound slug={studioSlug} />
  return <StudioPage key={studio.slug} studio={studio} />
}

function StudioNotFound({ slug }: { slug?: string }) {
  return (
    <main className="min-w-0 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-black text-slate-950 dark:text-white">Studio not found</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {slug ? `There is no studio at "${slug}".` : 'That studio address is incomplete.'} Pick one from the studios home.
        </p>
        <Link
          to={STUDIOS_ROOT}
          className={`mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 ${FOCUS_RING}`}
        >
          Back to studios
        </Link>
      </div>
    </main>
  )
}
