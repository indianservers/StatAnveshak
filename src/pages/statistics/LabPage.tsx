import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  LineChart,
  Repeat,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import { getLab, getStudio, labPath, STUDIOS_ROOT, studioPath } from '../../lib/statisticsStudios'
import { StudioIcon, StudioIconStyles } from '../../components/visual/StudioIcons'
import { StudioBreadcrumb } from '../../components/statistics/StudioBreadcrumb'
import { LabSection } from '../../components/statistics/LabSection'
import { ACCENTS, FOCUS_RING, LEVEL_CLASSES, LEVEL_LABELS } from '../../components/statistics/studioTheme'
import { ProbabilityLabScreen } from '../../components/probability/ProbabilityLabScreen'
import { RandomVariableLabScreen } from '../../components/random-variables/RandomVariableLabScreen'
import { DescriptiveStatsLabScreen } from '../../components/descriptive-statistics/DescriptiveStatsLabScreen'
import { SamplingMethodsLabScreen } from '../../components/sampling-methods/SamplingMethodsLabScreen'
import { SamplingDistributionsLabScreen } from '../../components/sampling-distributions-clt/SamplingDistributionsLabScreen'
import { BayesianLabScreen } from '../../components/bayesian-statistics/BayesianLabScreen'
import { CorrelationLabScreen } from '../../components/correlation-association/CorrelationLabScreen'
import { RegressionLabScreen } from '../../components/regression-studio/RegressionLabScreen'
import { TimeSeriesLabScreen } from '../../components/time-series-basics/TimeSeriesLabScreen'
import { AnovaLabScreen } from '../../components/anova-studio/AnovaLabScreen'
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

export function LabPage() {
  const { studioSlug, labSlug } = useParams()
  const found = getLab(studioSlug, labSlug)
  const [iconActive, setIconActive] = useState(false)

  if (!found) return <LabNotFound studioSlug={studioSlug} labSlug={labSlug} />

  const { studio, lab } = found
  if (studio.slug === PF_STUDIO_SLUG) return <ProbabilityLabScreen studio={studio} lab={lab} />
  if (studio.slug === RV_STUDIO_SLUG) return <RandomVariableLabScreen studio={studio} lab={lab} />
  if (studio.slug === DS_STUDIO_SLUG) return <DescriptiveStatsLabScreen studio={studio} lab={lab} />
  if (studio.slug === CLT_STUDIO_SLUG) return <SamplingDistributionsLabScreen studio={studio} lab={lab} />
  if (studio.slug === SM_STUDIO_SLUG) return <SamplingMethodsLabScreen studio={studio} lab={lab} />
  if (studio.slug === CA_STUDIO_SLUG) return <CorrelationLabScreen studio={studio} lab={lab} />
  if (studio.slug === BAYES_STUDIO_SLUG) return <BayesianLabScreen studio={studio} lab={lab} />
  if (studio.slug === REG_STUDIO_SLUG) return <RegressionLabScreen studio={studio} lab={lab} />
  if (studio.slug === TS_STUDIO_SLUG) return <TimeSeriesLabScreen studio={studio} lab={lab} />
  if (studio.slug === ANOVA_STUDIO_SLUG) return <AnovaLabScreen studio={studio} lab={lab} />
  const accent = ACCENTS[studio.accent]
  const index = studio.labs.findIndex((item) => item.slug === lab.slug)
  const previous = index > 0 ? studio.labs[index - 1] : undefined
  const next = index < studio.labs.length - 1 ? studio.labs[index + 1] : undefined

  return (
    <main className="min-w-0 bg-[#f7f8fb] px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <StudioIconStyles />
      <div className="mx-auto flex w-full max-w-[1300px] flex-col gap-5">
        <StudioBreadcrumb trail={[{ label: studio.title, to: studioPath(studio) }, { label: lab.title }]} />

        <section className="grid items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[minmax(0,1fr)_120px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={studioPath(studio)}
                className={`rounded text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-500 hover:text-indigo-600 ${FOCUS_RING}`}
              >
                {studio.title}
              </Link>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${LEVEL_CLASSES[lab.level]}`}
              >
                {LEVEL_LABELS[lab.level]}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                Lab {index + 1} of {studio.labs.length}
              </span>
            </div>
            <h1 className="mt-1.5 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{lab.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{lab.summary}</p>

            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Concepts in this lab">
              {lab.concepts.map((concept) => (
                <li
                  key={concept}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${accent.chip}`}
                >
                  {concept}
                </li>
              ))}
            </ul>
          </div>

          <div
            onMouseEnter={() => setIconActive(true)}
            onMouseLeave={() => setIconActive(false)}
            className={`hidden h-24 items-center justify-center rounded-2xl p-3 sm:flex ${accent.wash}`}
          >
            <StudioIcon icon={studio.icon} active={iconActive} />
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <LabSection
              icon={LineChart}
              title="Visualization"
              description={`The interactive picture for ${lab.title.toLowerCase()}.`}
              tall
              outline={[
                'Live chart driven by the lab parameters',
                'Accessible text summary of what the chart shows',
                'Highlighting for the concept currently being explained',
              ]}
            />
            <LabSection
              icon={SlidersHorizontal}
              title="Controls"
              description="Parameters you can move to see the concept respond."
              outline={[
                'Sliders and inputs for the governing parameters',
                'Preset scenarios that jump to instructive settings',
                'Reset and reproducible-seed controls',
              ]}
            />
            <LabSection
              icon={Repeat}
              title="Simulation"
              description="Repeat the experiment many times and watch the pattern build."
              outline={[
                'Run one trial, run many, or run continuously',
                'Running summary of simulated results',
                'Comparison against the theoretical result',
              ]}
            />
          </div>

          <div className="flex flex-col gap-4">
            <LabSection
              icon={BookOpen}
              title="Explanation"
              description="The idea in words, then in notation."
              outline={['Plain-language intuition', 'Formal definition and formula', 'Common misinterpretations to avoid']}
            />
            <LabSection
              icon={Sparkles}
              title="Examples"
              description="Worked examples using the loaded teaching dataset."
              outline={['A worked numeric example', 'A real-world framing of the same idea']}
            />
            <LabSection
              icon={ClipboardCheck}
              title="Practice"
              description="Check whether the intuition actually transferred."
              outline={['Guided questions with feedback', 'Self-check on the concepts listed above']}
            />
          </div>
        </div>

        <nav
          aria-label="Lab navigation"
          className="flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
        >
          {previous ? (
            <Link
              to={labPath(studio.slug, previous.slug)}
              className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 ${FOCUS_RING}`}
            >
              <ArrowLeft size={15} aria-hidden /> {previous.title}
            </Link>
          ) : (
            <Link
              to={studioPath(studio)}
              className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 ${FOCUS_RING}`}
            >
              <ArrowLeft size={15} aria-hidden /> Back to {studio.title}
            </Link>
          )}

          {next && (
            <Link
              to={labPath(studio.slug, next.slug)}
              className={`inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-700 ${FOCUS_RING}`}
            >
              {next.title} <ArrowRight size={15} aria-hidden />
            </Link>
          )}
        </nav>
      </div>
    </main>
  )
}

function LabNotFound({ studioSlug, labSlug }: { studioSlug?: string; labSlug?: string }) {
  const studio = getStudio(studioSlug)

  return (
    <main className="min-w-0 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-black text-slate-950 dark:text-white">Lab not found</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {studio
            ? `"${labSlug}" is not a lab in ${studio.title}.`
            : 'That lab address does not match a studio in this section.'}
        </p>
        <Link
          to={studio ? studioPath(studio) : STUDIOS_ROOT}
          className={`mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 ${FOCUS_RING}`}
        >
          {studio ? `Back to ${studio.title}` : 'Back to studios'}
        </Link>
      </div>
    </main>
  )
}
