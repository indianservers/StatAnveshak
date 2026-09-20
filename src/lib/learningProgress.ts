import { ANOVA_PROGRESS_KEY, ANOVA_STUDIO } from './anovaStudio'
import { BAYES_PROGRESS_KEY, BAYES_STUDIO } from './bayesianStatistics'
import { CA_PROGRESS_KEY, CA_STUDIO } from './correlationAssociation'
import { CURRICULUM_AREAS, CURRICULUM_TOPIC_COUNT, curriculumTopicById } from './curriculum'
import { DS_PROGRESS_KEY, DS_STUDIO } from './descriptiveStatistics'
import { LEARNING_PATH_FLOW } from './learningPaths'
import { PF_STORAGE_KEY, PF_STUDIO } from './probabilityFoundations'
import { RV_STORAGE_KEY, RV_STUDIO } from './randomVariables'
import { REG_PROGRESS_KEY, REG_STUDIO } from './regressionStudio'
import { CLT_PROGRESS_KEY, CLT_STUDIO } from './samplingDistributionsClt'
import { SM_PROGRESS_KEY, SM_STUDIO } from './samplingMethods'
import { readLocalJson, readStringArray, writeLocalJson } from './safeStorage'
import { TS_PROGRESS_KEY, TS_STUDIO } from './timeSeriesBasics'

const CURRICULUM_PROGRESS_KEY = 'anveshak-curriculum-progress'
const RECENT_KEY = 'anveshak-learning-recent'
const THEOREM_PROGRESS_KEY = 'learn-progress'

export type RecentVisit = {
  path: string
  title: string
  at: number
}

export type ContinueTarget = {
  title: string
  context: string
  path: string
  completed: number
  total: number
  percent: number
}

type StudioProgressSource = {
  slug: string
  title: string
  path: string
  key: string
  labCount: number
}

const STUDIO_SOURCES: StudioProgressSource[] = [
  { slug: PF_STUDIO.slug, title: PF_STUDIO.title, path: `/statistics/${PF_STUDIO.slug}`, key: PF_STORAGE_KEY, labCount: PF_STUDIO.labs.length },
  { slug: RV_STUDIO.slug, title: RV_STUDIO.title, path: `/statistics/${RV_STUDIO.slug}`, key: RV_STORAGE_KEY, labCount: RV_STUDIO.labs.length },
  { slug: DS_STUDIO.slug, title: DS_STUDIO.title, path: `/statistics/${DS_STUDIO.slug}`, key: DS_PROGRESS_KEY, labCount: DS_STUDIO.labs.length },
  { slug: SM_STUDIO.slug, title: SM_STUDIO.title, path: `/statistics/${SM_STUDIO.slug}`, key: SM_PROGRESS_KEY, labCount: SM_STUDIO.labs.length },
  { slug: CLT_STUDIO.slug, title: CLT_STUDIO.title, path: `/statistics/${CLT_STUDIO.slug}`, key: CLT_PROGRESS_KEY, labCount: CLT_STUDIO.labs.length },
  { slug: BAYES_STUDIO.slug, title: BAYES_STUDIO.title, path: `/statistics/${BAYES_STUDIO.slug}`, key: BAYES_PROGRESS_KEY, labCount: BAYES_STUDIO.labs.length },
  { slug: CA_STUDIO.slug, title: CA_STUDIO.title, path: `/statistics/${CA_STUDIO.slug}`, key: CA_PROGRESS_KEY, labCount: CA_STUDIO.labs.length },
  { slug: REG_STUDIO.slug, title: REG_STUDIO.title, path: `/statistics/${REG_STUDIO.slug}`, key: REG_PROGRESS_KEY, labCount: REG_STUDIO.labs.length },
  { slug: TS_STUDIO.slug, title: TS_STUDIO.title, path: `/statistics/${TS_STUDIO.slug}`, key: TS_PROGRESS_KEY, labCount: TS_STUDIO.labs.length },
  { slug: ANOVA_STUDIO.slug, title: ANOVA_STUDIO.title, path: `/statistics/${ANOVA_STUDIO.slug}`, key: ANOVA_PROGRESS_KEY, labCount: ANOVA_STUDIO.labs.length },
]

function completedFromKey(key: string): string[] {
  const parsed = readLocalJson<{ completed?: unknown }>(key, {})
  return Array.isArray(parsed.completed) ? parsed.completed.filter((item): item is string => typeof item === 'string') : []
}

export function readCurriculumCompleted(): string[] {
  return readStringArray(CURRICULUM_PROGRESS_KEY)
}

export function toggleCurriculumComplete(topicId: string): string[] {
  const current = readCurriculumCompleted()
  const next = current.includes(topicId) ? current.filter((id) => id !== topicId) : [...current, topicId]
  writeLocalJson(CURRICULUM_PROGRESS_KEY, next)
  return next
}

export function recordLearningVisit(path: string, title: string): RecentVisit[] {
  const now: RecentVisit = { path, title, at: Date.now() }
  const previous = readLearningRecent().filter((item) => item.path !== path)
  const next = [now, ...previous].slice(0, 8)
  writeLocalJson(RECENT_KEY, next)
  return next
}

export function readLearningRecent(): RecentVisit[] {
  const raw = readLocalJson<unknown>(RECENT_KEY, [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is RecentVisit => {
      return Boolean(
        item &&
          typeof item === 'object' &&
          typeof (item as RecentVisit).path === 'string' &&
          typeof (item as RecentVisit).title === 'string' &&
          typeof (item as RecentVisit).at === 'number',
      )
    })
    .slice(0, 8)
}

export function studioProgressSummary(): ContinueTarget[] {
  return STUDIO_SOURCES.map((source) => {
    const done = completedFromKey(source.key)
    const completed = done.filter(Boolean).length
    return {
      title: source.title,
      context: 'Studio',
      path: source.path,
      completed,
      total: source.labCount,
      percent: source.labCount === 0 ? 0 : Math.round((completed / source.labCount) * 100),
    }
  })
}

export function continueLearningTarget(): ContinueTarget | null {
  const inProgress = studioProgressSummary().filter((item) => item.completed > 0 && item.completed < item.total)
  if (inProgress.length > 0) {
    return inProgress.sort((a, b) => b.percent - a.percent)[0] ?? null
  }
  const recent = readLearningRecent()[0]
  if (recent) {
    return { title: recent.title, context: 'Recent', path: recent.path, completed: 0, total: 1, percent: 0 }
  }
  const theorems = readStringArray(THEOREM_PROGRESS_KEY)
  if (theorems.length > 0) {
    return { title: 'Core theorems', context: 'Learning', path: '/learn', completed: theorems.length, total: 8, percent: Math.round((theorems.length / 8) * 100) }
  }
  return {
    title: 'Descriptive Statistics',
    context: 'Suggested start',
    path: '/statistics/descriptive-statistics',
    completed: 0,
    total: DS_STUDIO.labs.length,
    percent: 0,
  }
}

export function curriculumProgressPercent(completedIds: string[] = readCurriculumCompleted()): number {
  if (CURRICULUM_TOPIC_COUNT === 0) return 0
  const known = completedIds.filter((id) => curriculumTopicById(id))
  return Math.round((known.length / CURRICULUM_TOPIC_COUNT) * 100)
}

export function pathNodeState(
  pathId: string,
  nodeId: string,
  completedTopicIds: string[] = readCurriculumCompleted(),
): 'completed' | 'in-progress' | 'available' {
  const path = LEARNING_PATH_FLOW.find((item) => item.id === pathId)
  const node = path?.nodes.find((item) => item.id === nodeId)
  if (!node) return 'available'
  const studio = STUDIO_SOURCES.find((source) => node.href === source.path || node.href.startsWith(`${source.path}/`))
  if (studio) {
    const done = completedFromKey(studio.key).length
    if (done >= studio.labCount && studio.labCount > 0) return 'completed'
    if (done > 0) return 'in-progress'
  }
  if (completedTopicIds.some((id) => node.href.includes(id) || id.includes(node.id))) return 'completed'
  return 'available'
}

export function nextRecommendedLesson(): ContinueTarget {
  const current = continueLearningTarget()
  return current ?? {
    title: 'Probability Foundations',
    context: 'Next',
    path: '/statistics/probability-foundations',
    completed: 0,
    total: PF_STUDIO.labs.length,
    percent: 0,
  }
}
