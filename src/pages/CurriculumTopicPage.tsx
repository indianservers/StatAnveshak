import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { PageBack } from '../components/ui/PageBack'
import { LearningBreadcrumb } from '../components/learning/LearningBreadcrumb'
import { RelatedLearning } from '../components/learning/RelatedLearning'
import { useLearningVisit } from '../components/learning/useLearningVisit'
import { EmptyState } from '../components/ui/AppStates'
import {
  CURRICULUM_AREA_BY_ID,
  curriculumPath,
  topicLabs,
  topicPrereqs,
  type CurriculumArea,
  type CurriculumTopic,
} from '../lib/curriculum'
import { labPath } from '../lib/statisticsStudios'
import { readCurriculumCompleted, toggleCurriculumComplete } from '../lib/learningProgress'
import { useStore } from '../store/useStore'

export function CurriculumTopicPage() {
  const { areaId, topicId } = useParams()
  const area = areaId ? CURRICULUM_AREA_BY_ID[areaId] : undefined
  if (!area) {
    return (
      <EmptyState
        title="That curriculum area is not in this map."
        description="The URL does not match a statistics area in StatAnveshak."
        primary={{ label: 'Open curriculum map', to: '/learn/curriculum' }}
      />
    )
  }
  if (topicId) {
    const topic = area.topics.find((item) => item.id === topicId)
    if (!topic) return <Navigate to={curriculumPath(area.id)} replace />
    return <TopicDetail area={area} topic={topic} />
  }
  return <AreaDetail area={area} />
}

function AreaDetail({ area }: { area: CurriculumArea }) {
  useLearningVisit(curriculumPath(area.id), area.title)
  const completed = readCurriculumCompleted()

  return (
    <main className="min-w-0 bg-[#f7f8fb] px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <PageBack fallback="/learn/curriculum" label="Back to Curriculum" />
        <LearningBreadcrumb trail={[{ label: 'Curriculum Map', to: '/learn/curriculum' }, { label: area.title }]} />
        <header>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500">Curriculum area</p>
          <h1 className="mt-1 text-3xl font-black">{area.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{area.summary}</p>
        </header>
        <ol className="grid gap-3">
          {area.topics.map((topic) => (
            <li key={topic.id}>
              <Link
                to={curriculumPath(area.id, topic.id)}
                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-900"
              >
                <span>
                  <span className="block font-bold text-slate-900 dark:text-white">{topic.title}</span>
                  <span className="mt-1 block text-sm text-slate-500">{topic.summary}</span>
                </span>
                {completed.includes(topic.id) && <CheckCircle size={18} className="text-emerald-500" aria-label="Completed" />}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </main>
  )
}

function TopicDetail({ area, topic }: { area: CurriculumArea; topic: CurriculumTopic }) {
  const hasDataset = Boolean(useStore((state) => state.activeDataset))
  const [completed, setCompleted] = useState(() => readCurriculumCompleted())
  const labs = topicLabs(topic)
  const prereqs = topicPrereqs(topic)
  const topicIndex = area.topics.findIndex((item) => item.id === topic.id)
  const nextTopic = topicIndex >= 0 ? area.topics[topicIndex + 1] : undefined
  useLearningVisit(curriculumPath(area.id, topic.id), topic.title)

  const related = useMemo(() => {
    const items = []
    if (nextTopic) items.push({ kind: 'next' as const, label: nextTopic.title, to: curriculumPath(area.id, nextTopic.id), detail: 'Next in this area' })
    items.push({ kind: 'studio' as const, label: topic.title, to: topic.href, detail: 'Open the interactive studio or lab' })
    if (topic.toolHref) items.push({ kind: 'related' as const, label: topic.toolLabel ?? 'Related tool', to: topic.toolHref })
    if (topic.dataHref && hasDataset) items.push({ kind: 'data' as const, label: topic.dataLabel ?? 'Try with your data', to: topic.dataHref })
    if (topic.glossarySlug) items.push({ kind: 'related' as const, label: 'Glossary', to: `/glossary#${topic.glossarySlug}` })
    return items
  }, [area.id, hasDataset, nextTopic, topic])

  const done = completed.includes(topic.id)

  return (
    <main className="min-w-0 bg-[#f7f8fb] px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <PageBack fallback={curriculumPath(area.id)} label={`Back to ${area.title}`} />
        <LearningBreadcrumb
          trail={[
            { label: 'Curriculum Map', to: '/learn/curriculum' },
            { label: area.title, to: curriculumPath(area.id) },
            { label: topic.title },
          ]}
        />
        <header className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500">{area.title}</p>
          <h1 className="mt-1 text-3xl font-black">{topic.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{topic.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to={topic.href}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700"
            >
              {done ? 'Continue' : 'Start'} <ArrowRight size={15} />
            </Link>
            <button
              type="button"
              onClick={() => setCompleted(toggleCurriculumComplete(topic.id))}
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-bold dark:border-slate-700"
            >
              {done ? 'Completed' : 'Mark complete'}
            </button>
          </div>
        </header>

        {prereqs.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-bold text-slate-800 dark:text-white">Prerequisites</h2>
            <p className="mt-1 text-xs text-slate-400">Suggested earlier topics. They do not lock this page.</p>
            <ul className="mt-2 space-y-1">
              {prereqs.map((item) => (
                <li key={item.id}>
                  <Link to={item.href} className="font-semibold text-indigo-600 dark:text-indigo-300">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {labs.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Labs / activities</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {labs.map((lab) => (
                <li key={lab.slug}>
                  <Link
                    to={topic.studioSlug ? labPath(topic.studioSlug, lab.slug) : topic.href}
                    className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <span className="font-semibold text-slate-800 dark:text-white">{lab.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{lab.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <RelatedLearning items={related} />
      </div>
    </main>
  )
}
