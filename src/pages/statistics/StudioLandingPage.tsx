import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, FlaskConical, Lightbulb } from 'lucide-react'
import {
  conceptCount,
  getStudio,
  labPath,
  relatedStudios,
  STUDIO_CATEGORIES,
  STUDIOS_ROOT,
  studioPath,
} from '../../lib/statisticsStudios'
import { StudioIcon, StudioIconStyles } from '../../components/visual/StudioIcons'
import { StudioBreadcrumb } from '../../components/statistics/StudioBreadcrumb'
import { ACCENTS, FOCUS_RING, LEVEL_CLASSES, LEVEL_LABELS } from '../../components/statistics/studioTheme'
import { ProbabilityStudioHome } from '../../components/probability/ProbabilityStudioHome'
import { RandomVariablesStudioHome } from '../../components/random-variables/RandomVariablesStudioHome'
import { DescriptiveStatsStudioHome } from '../../components/descriptive-statistics/DescriptiveStatsStudioHome'
import { SamplingMethodsStudioHome } from '../../components/sampling-methods/SamplingMethodsStudioHome'
import { SamplingDistributionsStudioHome } from '../../components/sampling-distributions-clt/SamplingDistributionsStudioHome'
import { BayesianStudioHome } from '../../components/bayesian-statistics/BayesianStudioHome'
import { CorrelationStudioHome } from '../../components/correlation-association/CorrelationStudioHome'
import { RegressionStudioHome } from '../../components/regression-studio/RegressionStudioHome'
import { TimeSeriesStudioHome } from '../../components/time-series-basics/TimeSeriesStudioHome'
import { AnovaStudioHome } from '../../components/anova-studio/AnovaStudioHome'
import { StudioHomeScreen } from '../../components/statistics/StudioHomeScreen'
import { PF_STUDIO_SLUG } from '../../lib/probabilityFoundations'
import { RV_STUDIO_SLUG } from '../../lib/randomVariables'
import { DS_STUDIO_SLUG } from '../../lib/descriptiveStatistics'
import { SM_STUDIO_SLUG } from '../../lib/samplingMethods'
import { CLT_STUDIO_SLUG } from '../../lib/samplingDistributionsClt'
import { BAYES_STUDIO_SLUG } from '../../lib/bayesianStatistics'
import { CA_STUDIO_SLUG } from '../../lib/correlationAssociation'
import { REG_STUDIO_SLUG } from '../../lib/regressionStudio'
import { TS_STUDIO_SLUG } from '../../lib/timeSeriesBasics'
import { ANOVA_STUDIO_SLUG } from '../../lib/anovaStudio'

export function StudioLandingPage() {
  const { studioSlug } = useParams()
  const studio = getStudio(studioSlug)
  const [heroActive, setHeroActive] = useState(false)

  if (!studio) return <StudioNotFound slug={studioSlug} />
  if (studio.slug === PF_STUDIO_SLUG) return <ProbabilityStudioHome />
  if (studio.slug === RV_STUDIO_SLUG) return <RandomVariablesStudioHome />
  if (studio.slug === DS_STUDIO_SLUG) return <DescriptiveStatsStudioHome />
  if (studio.slug === CLT_STUDIO_SLUG) return <SamplingDistributionsStudioHome />
  if (studio.slug === SM_STUDIO_SLUG) return <SamplingMethodsStudioHome />
  if (studio.slug === CA_STUDIO_SLUG) return <CorrelationStudioHome />
  if (studio.slug === BAYES_STUDIO_SLUG) return <BayesianStudioHome />
  if (studio.slug === REG_STUDIO_SLUG) return <RegressionStudioHome />
  if (studio.slug === TS_STUDIO_SLUG) return <TimeSeriesStudioHome />
  if (studio.slug === ANOVA_STUDIO_SLUG) return <AnovaStudioHome />
  if (
    studio.slug === 'estimation' ||
    studio.slug === 'hypothesis-testing' ||
    studio.slug === 'nonparametric-statistics' ||
    studio.slug === 'reliability-survival' ||
    studio.slug === 'multivariate-statistics' ||
    studio.slug === 'statistical-simulation' ||
    studio.slug === 'quality-decision-making'
  ) {
    return <StudioHomeScreen studio={studio} />
  }

  const accent = ACCENTS[studio.accent]
  const category = STUDIO_CATEGORIES.find((item) => item.id === studio.category)
  const related = relatedStudios(studio)

  return (
    <main className="min-w-0 bg-[#f7f8fb] px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <StudioIconStyles />
      <div className="mx-auto flex w-full max-w-[1300px] flex-col gap-6">
        <StudioBreadcrumb trail={[{ label: studio.title }]} />

        <section className="grid items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            {category && (
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500">{category.title}</p>
            )}
            <h1 className="mt-1.5 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {studio.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{studio.summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${accent.chip}`}>
                <FlaskConical size={13} aria-hidden /> {studio.labs.length} labs
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${accent.chip}`}>
                <Lightbulb size={13} aria-hidden /> {conceptCount(studio)} concepts
              </span>
              <Link
                to={labPath(studio.slug, studio.labs[0].slug)}
                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 ${FOCUS_RING}`}
              >
                Start first lab <ArrowRight size={15} aria-hidden />
              </Link>
            </div>
          </div>

          <div
            onMouseEnter={() => setHeroActive(true)}
            onMouseLeave={() => setHeroActive(false)}
            className={`flex h-40 items-center justify-center rounded-2xl p-5 ${accent.wash}`}
          >
            <StudioIcon icon={studio.icon} active={heroActive} />
          </div>
        </section>

        <section aria-labelledby="studio-labs-heading">
          <h2 id="studio-labs-heading" className="mb-3 text-lg font-black tracking-tight text-slate-950 dark:text-white">
            Labs in this studio
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {studio.labs.map((lab, index) => (
              <article
                key={lab.slug}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-black text-slate-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${LEVEL_CLASSES[lab.level]}`}
                  >
                    {LEVEL_LABELS[lab.level]}
                  </span>
                </div>
                <h3 className="mt-1 text-sm font-black leading-snug text-slate-950 dark:text-white">{lab.title}</h3>
                <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{lab.summary}</p>

                <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={`Concepts covered in ${lab.title}`}>
                  {lab.concepts.map((concept) => (
                    <li
                      key={concept}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {concept}
                    </li>
                  ))}
                </ul>

                <Link
                  to={labPath(studio.slug, lab.slug)}
                  className={`mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-600 ${FOCUS_RING}`}
                >
                  Open lab <ArrowRight size={15} aria-hidden />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="related-studios-heading">
          <h2 id="related-studios-heading" className="mb-3 text-lg font-black tracking-tight text-slate-950 dark:text-white">
            Related studios
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                to={studioPath(item)}
                className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800 ${FOCUS_RING}`}
              >
                <span className={`flex h-12 w-14 shrink-0 items-center justify-center rounded-xl p-1.5 ${ACCENTS[item.accent].wash}`}>
                  <StudioIcon icon={item.icon} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-slate-950 dark:text-white">{item.title}</span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{item.labs.length} labs</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <Link
          to={STUDIOS_ROOT}
          className={`inline-flex w-fit items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 ${FOCUS_RING}`}
        >
          <ArrowLeft size={15} aria-hidden /> All Probability &amp; Statistics Studios
        </Link>
      </div>
    </main>
  )
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
