import {
  FEATURED_STUDIO,
  STATISTICS_STUDIOS,
  getLab,
  getStudio,
  labPath,
  studioPath,
  type Studio,
  type StudioLab,
} from './statisticsStudios'

export type CurriculumDifficulty = 'intro' | 'core' | 'advanced'

export type CurriculumTopic = {
  id: string
  title: string
  summary: string
  difficulty: CurriculumDifficulty
  href: string
  studioSlug?: string
  labSlug?: string
  toolHref?: string
  toolLabel?: string
  dataHref?: string
  dataLabel?: string
  glossarySlug?: string
  prereqIds: string[]
}

export type CurriculumArea = {
  id: string
  title: string
  summary: string
  topics: CurriculumTopic[]
}

function fromStudio(
  studio: Studio,
  extras?: Partial<Pick<CurriculumTopic, 'toolHref' | 'toolLabel' | 'dataHref' | 'dataLabel' | 'glossarySlug' | 'prereqIds'>>,
): CurriculumTopic {
  return {
    id: studio.slug,
    title: studio.title,
    summary: studio.summary,
    difficulty: studio.labs.some((lab) => lab.level === 'advanced') ? 'advanced' : studio.labs[0]?.level ?? 'core',
    href: studioPath(studio),
    studioSlug: studio.slug,
    toolHref: extras?.toolHref,
    toolLabel: extras?.toolLabel,
    dataHref: extras?.dataHref,
    dataLabel: extras?.dataLabel,
    glossarySlug: extras?.glossarySlug,
    prereqIds: extras?.prereqIds ?? [],
  }
}

function fromLab(
  studioSlug: string,
  labSlug: string,
  extras?: Partial<Pick<CurriculumTopic, 'toolHref' | 'toolLabel' | 'dataHref' | 'dataLabel' | 'glossarySlug' | 'prereqIds' | 'summary'>>,
): CurriculumTopic | null {
  const found = getLab(studioSlug, labSlug)
  if (!found) return null
  return {
    id: `${studioSlug}--${labSlug}`,
    title: found.lab.title,
    summary: extras?.summary ?? found.lab.summary,
    difficulty: found.lab.level,
    href: labPath(studioSlug, labSlug),
    studioSlug,
    labSlug,
    toolHref: extras?.toolHref,
    toolLabel: extras?.toolLabel,
    dataHref: extras?.dataHref,
    dataLabel: extras?.dataLabel,
    glossarySlug: extras?.glossarySlug,
    prereqIds: extras?.prereqIds ?? [],
  }
}

function studio(slug: string): Studio {
  const found = getStudio(slug)
  if (!found) throw new Error(`Curriculum references missing studio: ${slug}`)
  return found
}

const lab = (studioSlug: string, labSlug: string, extras?: Parameters<typeof fromLab>[2]) => {
  const topic = fromLab(studioSlug, labSlug, extras)
  if (!topic) throw new Error(`Curriculum references missing lab: ${studioSlug}/${labSlug}`)
  return topic
}

export const CURRICULUM_AREAS: CurriculumArea[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    summary: 'Probability, random variables, describing data, and how samples are drawn.',
    topics: [
      fromStudio(studio('probability-foundations'), {
        toolHref: '/learn/chance',
        toolLabel: 'Open Chance lab',
        glossarySlug: 'probability',
      }),
      fromStudio(studio('random-variables'), { glossarySlug: 'random-variable', prereqIds: ['probability-foundations'] }),
      fromStudio(studio('descriptive-statistics'), {
        toolHref: '/solver',
        toolLabel: 'Statistics calculator',
        dataHref: '/analysis/descriptives.statistics',
        dataLabel: 'Try with your data',
        glossarySlug: 'mean',
      }),
      fromStudio(studio('sampling-methods'), { glossarySlug: 'sample', prereqIds: ['descriptive-statistics'] }),
      {
        id: 'distributions',
        title: FEATURED_STUDIO.title,
        summary: FEATURED_STUDIO.tagline,
        difficulty: 'core',
        href: FEATURED_STUDIO.path,
        toolHref: '/distributions/normal',
        toolLabel: 'Open Normal distribution',
        glossarySlug: 'normal-distribution',
        prereqIds: ['random-variables'],
      },
    ],
  },
  {
    id: 'inference',
    title: 'Inference',
    summary: 'Sampling distributions, intervals, tests, chi-square, and ANOVA.',
    topics: [
      fromStudio(studio('sampling-distributions-clt'), {
        toolHref: '/statistics/sampling-distributions-clt/central-limit-theorem',
        toolLabel: 'Open CLT simulator',
        glossarySlug: 'central-limit-theorem',
        prereqIds: ['sampling-methods'],
      }),
      fromStudio(studio('estimation'), {
        dataHref: '/analysis/t.oneSample',
        dataLabel: 'Confidence interval on your data',
        glossarySlug: 'confidence-interval',
        prereqIds: ['sampling-distributions-clt'],
      }),
      fromStudio(studio('hypothesis-testing'), {
        dataHref: '/analysis/t.oneSample',
        dataLabel: 'Run a t-test on your data',
        glossarySlug: 'p-value',
        prereqIds: ['estimation'],
      }),
      lab('hypothesis-testing', 'chi-square-tests', {
        dataHref: '/analysis/frequencies.contingency',
        dataLabel: 'Chi-square with your data',
        glossarySlug: 'chi-square-test',
        prereqIds: ['hypothesis-testing'],
      }),
      fromStudio(studio('anova'), {
        dataHref: '/analysis/anova.between',
        dataLabel: 'ANOVA on your data',
        glossarySlug: 'anova',
        prereqIds: ['hypothesis-testing'],
      }),
    ],
  },
  {
    id: 'regression',
    title: 'Regression & Relationships',
    summary: 'Association, simple and multiple regression, and residual checks.',
    topics: [
      fromStudio(studio('correlation-association'), {
        dataHref: '/analysis/regression.correlation',
        dataLabel: 'Correlate two columns',
        glossarySlug: 'correlation',
      }),
      lab('regression', 'simple-linear-regression', {
        dataHref: '/analysis/regression.linear',
        dataLabel: 'Fit a line to your data',
        glossarySlug: 'least-squares',
        prereqIds: ['correlation-association'],
      }),
      lab('regression', 'multiple-regression', {
        dataHref: '/analysis/regression.linear',
        dataLabel: 'Multiple regression workspace',
        prereqIds: ['regression--simple-linear-regression'],
      }),
      lab('regression', 'residual-analysis', {
        prereqIds: ['regression--simple-linear-regression'],
      }),
    ],
  },
  {
    id: 'time-series',
    title: 'Time Series',
    summary: 'Trend, seasonality, smoothing, ACF/PACF, and ARIMA intuition.',
    topics: [
      lab('time-series-basics', 'trend', { glossarySlug: 'trend' }),
      lab('time-series-basics', 'seasonality', { prereqIds: ['time-series-basics--trend'] }),
      lab('time-series-basics', 'moving-average', { prereqIds: ['time-series-basics--trend'] }),
      lab('time-series-basics', 'acf-pacf', { glossarySlug: 'autocorrelation', prereqIds: ['time-series-basics--moving-average'] }),
      lab('time-series-basics', 'ar-ma-arima-intuition', {
        dataHref: '/analysis/timeSeries.arima',
        dataLabel: 'Open ARIMA analysis',
        prereqIds: ['time-series-basics--acf-pacf'],
      }),
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced / Applied',
    summary: 'Bayesian thinking, specialized studios, statistical computing, and CS labs.',
    topics: [
      fromStudio(studio('bayesian-statistics'), {
        toolHref: '/learn/bayesian',
        toolLabel: 'Open Bayesian picture lab',
        glossarySlug: 'bayes-theorem',
        prereqIds: ['probability-foundations'],
      }),
      fromStudio(studio('nonparametric-statistics'), { prereqIds: ['hypothesis-testing'] }),
      fromStudio(studio('reliability-survival'), { dataHref: '/analysis/survival.nonparametric', dataLabel: 'Survival analysis' }),
      fromStudio(studio('statistical-simulation'), { prereqIds: ['sampling-distributions-clt'] }),
      fromStudio(studio('quality-decision-making'), { dataHref: '/analysis/qc.charts', dataLabel: 'Control charts' }),
      {
        id: 'hashing',
        title: 'Hashing (CS Lab)',
        summary: 'Hash functions, collisions, chaining, and probing with a live table.',
        difficulty: 'core',
        href: '/modules/hashing',
        toolHref: '/modules/hashing',
        toolLabel: 'Open hashing lab',
        prereqIds: [],
      },
    ],
  },
]

export const CURRICULUM_AREA_BY_ID = Object.fromEntries(CURRICULUM_AREAS.map((area) => [area.id, area])) as Record<string, CurriculumArea>

export function curriculumTopicById(topicId: string | undefined): { area: CurriculumArea; topic: CurriculumTopic } | undefined {
  if (!topicId) return undefined
  for (const area of CURRICULUM_AREAS) {
    const topic = area.topics.find((item) => item.id === topicId)
    if (topic) return { area, topic }
  }
  return undefined
}

export function curriculumPath(areaId: string, topicId?: string): string {
  return topicId ? `/learn/curriculum/${areaId}/${topicId}` : `/learn/curriculum/${areaId}`
}

export function topicLabs(topic: CurriculumTopic): StudioLab[] {
  if (!topic.studioSlug) return []
  const found = getStudio(topic.studioSlug)
  if (!found) return []
  if (topic.labSlug) return found.labs.filter((labItem) => labItem.slug === topic.labSlug)
  return found.labs
}

export function topicPrereqs(topic: CurriculumTopic): CurriculumTopic[] {
  return topic.prereqIds
    .map((id) => curriculumTopicById(id)?.topic)
    .filter((item): item is CurriculumTopic => Boolean(item))
}

export const CURRICULUM_TOPIC_COUNT = CURRICULUM_AREAS.reduce((sum, area) => sum + area.topics.length, 0)
