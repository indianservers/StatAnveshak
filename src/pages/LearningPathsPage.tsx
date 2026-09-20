import { Link, Navigate, useParams } from 'react-router-dom'
import { PageBack } from '../components/ui/PageBack'
import { LearningBreadcrumb } from '../components/learning/LearningBreadcrumb'
import { LearningPathFlow, LearningPathPicker } from '../components/learning/LearningPathFlow'
import { RelatedLearning } from '../components/learning/RelatedLearning'
import { useLearningVisit } from '../components/learning/useLearningVisit'
import { EmptyState } from '../components/ui/AppStates'
import { LEARNING_PATH_BY_ID, LEARNING_PATH_FLOW } from '../lib/learningPaths'

export function LearningPathsPage() {
  const { pathId } = useParams()
  if (!pathId) return <Navigate to="/learn/paths/beginner" replace />
  const path = LEARNING_PATH_BY_ID[pathId]
  if (!path) {
    return (
      <EmptyState
        title="That learning path is not available."
        description="Choose one of the paths built from existing StatAnveshak studios and tools."
        primary={{ label: 'Beginner path', to: '/learn/paths/beginner' }}
        secondary={{ label: 'Curriculum map', to: '/learn/curriculum' }}
      />
    )
  }
  return <PathView pathId={path.id} />
}

function PathView({ pathId }: { pathId: string }) {
  const path = LEARNING_PATH_BY_ID[pathId]
  useLearningVisit(`/learn/paths/${path.id}`, path.title)

  return (
    <main className="min-w-0 bg-[#f7f8fb] px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <PageBack fallback="/learn" label="Back to Learning" />
        <LearningBreadcrumb trail={[{ label: 'Learning Paths', to: '/learn/paths/beginner' }, { label: path.title }]} />
        <header>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500">{path.audience}</p>
          <h1 className="mt-1 text-3xl font-black">{path.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{path.outcome}</p>
        </header>
        <LearningPathPicker activeId={path.id} />
        <LearningPathFlow path={path} />
        <RelatedLearning
          items={[
            { kind: 'related', label: 'Curriculum Map', to: '/learn/curriculum', detail: 'Browse by area instead of a single sequence' },
            { kind: 'studio', label: 'All studios', to: '/statistics', detail: 'Jump into any workspace' },
            { kind: 'next', label: 'Start first node', to: path.nodes[0]?.href ?? '/statistics', detail: path.nodes[0]?.title },
          ]}
        />
        <p className="text-xs text-slate-400">
          {LEARNING_PATH_FLOW.length} paths. Prefer a practice bank?{' '}
          <Link to="/professional-learning" className="font-semibold text-indigo-600">
            Professional learning
          </Link>
        </p>
      </div>
    </main>
  )
}
