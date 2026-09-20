import { Link } from 'react-router-dom'
import { LEARNING_PATH_FLOW, type LearningPath, type LearningPathNode } from '../../lib/learningPaths'
import { pathNodeState } from '../../lib/learningProgress'

const STATE_LABEL = {
  completed: 'Completed',
  'in-progress': 'In progress',
  available: 'Available',
} as const

const STATE_CLASS = {
  completed: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
  'in-progress': 'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200',
  available: 'border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
} as const

function NodeCard({ pathId, node, index }: { pathId: string; node: LearningPathNode; index: number }) {
  const state = pathNodeState(pathId, node.id)
  const prereq = node.prereqIds.length > 0 ? `After: ${node.prereqIds.length} earlier step${node.prereqIds.length === 1 ? '' : 's'}` : 'Start here'

  return (
    <li className="relative flex min-w-0 flex-1 flex-col">
      <Link
        to={node.href}
        className={`flex h-full flex-col rounded-2xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 motion-reduce:hover:translate-y-0 ${STATE_CLASS[state]}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">Step {index + 1}</span>
          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide dark:bg-slate-950/40">
            {STATE_LABEL[state]}
          </span>
        </div>
        <span className="mt-1 text-sm font-black">{node.title}</span>
        <span className="mt-1 text-xs leading-5 opacity-80">{node.summary}</span>
        <span className="mt-2 text-[11px] font-semibold opacity-70">
          {node.difficulty} · {prereq}
        </span>
      </Link>
    </li>
  )
}

export function LearningPathFlow({ path }: { path: LearningPath }) {
  return (
    <div>
      <ol className="flex flex-col gap-3 md:hidden">
        {path.nodes.map((node, index) => (
          <NodeCard key={node.id} pathId={path.id} node={node} index={index} />
        ))}
      </ol>
      <ol className="hidden md:grid md:grid-cols-2 md:gap-3 xl:grid-cols-3">
        {path.nodes.map((node, index) => (
          <NodeCard key={node.id} pathId={path.id} node={node} index={index} />
        ))}
      </ol>
      <p className="mt-3 text-xs text-slate-400">
        Prerequisites are shown as guidance. Every node stays open so you can explore in any order.
      </p>
    </div>
  )
}

export function LearningPathPicker({ activeId }: { activeId: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Learning paths">
      {LEARNING_PATH_FLOW.map((path) => {
        const active = path.id === activeId
        return (
          <Link
            key={path.id}
            to={`/learn/paths/${path.id}`}
            role="tab"
            aria-selected={active}
            className={`min-h-10 rounded-full px-3 text-sm font-bold ${
              active
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            {path.title.replace(' Path', '')}
          </Link>
        )
      })}
    </div>
  )
}
