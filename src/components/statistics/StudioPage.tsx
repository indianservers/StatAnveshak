import { useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Compass, FlaskConical, GraduationCap, LayoutGrid, Lightbulb, Play } from 'lucide-react'
import {
  conceptCount,
  labPath,
  relatedStudios,
  STUDIO_CATEGORIES,
  STUDIOS_ROOT,
  type Studio,
  type StudioLab,
} from '../../lib/statisticsStudios'
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
import { LabIcon as PfLabIcon, ProbabilityHeroArt } from '../probability/icons'
import { LabIcon as RvLabIcon, RandomVariablesHeroArt } from '../random-variables/icons'
import { LabIcon as DsLabIcon, DescriptiveStatsHeroArt } from '../descriptive-statistics/icons'
import { LabIcon as SmLabIcon, SamplingMethodsHeroArt } from '../sampling-methods/icons'
import { LabIcon as CltLabIcon, SamplingDistributionsHeroArt } from '../sampling-distributions-clt/icons'
import { BayesianHeroArt, LabIcon as BayesLabIcon } from '../bayesian-statistics/icons'
import { CorrelationHeroArt, LabIcon as CaLabIcon } from '../correlation-association/icons'
import { LabIcon as RegLabIcon, RegressionHeroArt } from '../regression-studio/icons'
import { LabIcon as TsLabIcon, TimeSeriesHeroArt } from '../time-series-basics/icons'
import { AnovaHeroArt, LabIcon as AnovaLabIcon } from '../anova-studio/icons'
import { HOME_ACTION_CLASS, HomeSection } from '../home/HomeSection'
import { StudioIconStyles } from '../visual/StudioIcons'
import { LabMark, StudioHeroMark } from './labMarks'
import { StudioCard } from './StudioCard'
import { ACCENTS, FOCUS_RING, LEVEL_CLASSES, LEVEL_LABELS } from './studioTheme'

type LabIconComponent = ComponentType<{ id: string; size?: number }>
type HeroArtComponent = ComponentType<{ active: boolean }>

const LAB_ICONS: Record<string, LabIconComponent> = {
  [PF_STUDIO_SLUG]: PfLabIcon,
  [RV_STUDIO_SLUG]: RvLabIcon,
  [DS_STUDIO_SLUG]: DsLabIcon,
  [SM_STUDIO_SLUG]: SmLabIcon,
  [CLT_STUDIO_SLUG]: CltLabIcon,
  [BAYES_STUDIO_SLUG]: BayesLabIcon,
  [CA_STUDIO_SLUG]: CaLabIcon,
  [REG_STUDIO_SLUG]: RegLabIcon,
  [TS_STUDIO_SLUG]: TsLabIcon,
  [ANOVA_STUDIO_SLUG]: AnovaLabIcon,
}

const HERO_ARTS: Record<string, HeroArtComponent> = {
  [PF_STUDIO_SLUG]: ProbabilityHeroArt,
  [RV_STUDIO_SLUG]: RandomVariablesHeroArt,
  [DS_STUDIO_SLUG]: DescriptiveStatsHeroArt,
  [SM_STUDIO_SLUG]: SamplingMethodsHeroArt,
  [CLT_STUDIO_SLUG]: SamplingDistributionsHeroArt,
  [BAYES_STUDIO_SLUG]: BayesianHeroArt,
  [CA_STUDIO_SLUG]: CorrelationHeroArt,
  [REG_STUDIO_SLUG]: RegressionHeroArt,
  [TS_STUDIO_SLUG]: TimeSeriesHeroArt,
  [ANOVA_STUDIO_SLUG]: AnovaHeroArt,
}

const LEVEL_ORDER: StudioLab['level'][] = ['intro', 'core', 'advanced']

export function StudioPage({ studio }: { studio: Studio }) {
  const category = STUDIO_CATEGORIES.find((item) => item.id === studio.category)
  const related = relatedStudios(studio)
  const LabIcon = LAB_ICONS[studio.slug]
  const levels = LEVEL_ORDER.filter((level) => studio.labs.some((lab) => lab.level === level))

  return (
    <main className="min-w-0 px-4 py-6 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
      <StudioIconStyles />
      <div className="mx-auto flex w-full max-w-[1300px] flex-col gap-6">
        <StudioHero studio={studio} categoryTitle={category?.title} levels={levels} />

        <HomeSection
          id="studio-labs-heading"
          icon={FlaskConical}
          iconClass={ACCENTS[studio.accent].chip}
          title="Labs in this studio"
          description={`${studio.labs.length} hands-on labs. Open any lab, or work through them in order.`}
          action={
            <Link to={STUDIOS_ROOT} className={HOME_ACTION_CLASS}>
              <LayoutGrid size={15} aria-hidden /> All studios
            </Link>
          }
        >
          <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {studio.labs.map((lab, index) => (
              <li key={lab.slug} className="min-w-0">
                <LabCard studio={studio} lab={lab} index={index} LabIcon={LabIcon} />
              </li>
            ))}
          </ol>
        </HomeSection>

        {related.length > 0 && (
          <HomeSection
            id="related-studios-heading"
            icon={Compass}
            iconClass="bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300"
            title="Related studios"
            description="Studios that build on, or lead into, this one."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <StudioCard key={item.slug} studio={item} />
              ))}
            </div>
          </HomeSection>
        )}

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

function StudioHero({ studio, categoryTitle, levels }: { studio: Studio; categoryTitle?: string; levels: StudioLab['level'][] }) {
  const [active, setActive] = useState(false)
  const HeroArt = HERO_ARTS[studio.slug]
  const first = studio.labs[0]
  const stats: Array<{ icon: typeof FlaskConical; value: string; label: string; tone: string }> = [
    { icon: FlaskConical, value: String(studio.labs.length), label: 'Interactive labs', tone: 'bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300' },
    { icon: Lightbulb, value: String(conceptCount(studio)), label: 'Concepts covered', tone: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300' },
    {
      icon: GraduationCap,
      value: levels.map((level) => LEVEL_LABELS[level]).join(' → ') || '—',
      label: 'Level',
      tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
  ]

  return (
    <section
      aria-labelledby="studio-hero-heading"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className="relative overflow-hidden rounded-3xl border border-indigo-100/80 bg-gradient-to-br from-white via-indigo-50/50 to-violet-100/60 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-indigo-950/30 dark:to-violet-950/30"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-25"
        style={{ backgroundImage: 'radial-gradient(rgba(99,102,241,0.18) 1px, transparent 1px)', backgroundSize: '18px 18px', maskImage: 'linear-gradient(110deg, transparent 10%, black 55%)' }}
      />
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-300/30 blur-3xl dark:bg-violet-700/20" />

      <div className="relative grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:p-10">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="home-rise flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-500 dark:text-indigo-300">
            <Link to={STUDIOS_ROOT} className={`rounded hover:text-indigo-700 dark:hover:text-indigo-200 ${FOCUS_RING}`}>
              Studios
            </Link>
            {categoryTitle && (
              <>
                <span className="text-indigo-300" aria-hidden>·</span>
                <span>{categoryTitle}</span>
              </>
            )}
          </nav>
          <h1 id="studio-hero-heading" className="home-rise mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl xl:text-5xl" style={{ animationDelay: '80ms' }}>
            {studio.title}
          </h1>
          <p className="home-rise mt-2 text-base font-semibold text-indigo-700 dark:text-indigo-300" style={{ animationDelay: '120ms' }}>
            {studio.tagline}
          </p>
          <p className="home-rise mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base" style={{ animationDelay: '160ms' }}>
            {studio.summary}
          </p>

          <div className="home-rise mt-6 flex flex-wrap items-center gap-3" style={{ animationDelay: '220ms' }}>
            {first && (
              <Link
                to={labPath(studio.slug, first.slug)}
                className={`group inline-flex min-h-12 items-center gap-3 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:bg-indigo-700 ${FOCUS_RING}`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <Play size={12} fill="currentColor" aria-hidden />
                </span>
                Start first lab
                <ArrowRight size={16} className="transition group-hover:translate-x-0.5" aria-hidden />
              </Link>
            )}
            <a
              href="#studio-labs-heading"
              className={`inline-flex min-h-12 items-center gap-2.5 rounded-xl border border-slate-200 bg-white/90 px-5 text-sm font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-indigo-700 ${FOCUS_RING}`}
              onClick={(event) => {
                event.preventDefault()
                document.getElementById('studio-labs-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              <LayoutGrid size={17} className="text-indigo-500" aria-hidden />
              Browse labs
            </a>
          </div>

          <ul className="home-rise mt-7 grid gap-4 sm:grid-cols-3" style={{ animationDelay: '280ms' }}>
            {stats.map(({ icon: Icon, value, label, tone }) => (
              <li key={label} className="flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                  <Icon size={18} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black text-slate-900 dark:text-white">{value}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{label}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="home-rise flex min-h-[220px] items-center justify-center overflow-hidden rounded-3xl border border-white/80 bg-white/80 p-4 shadow-xl shadow-indigo-900/10 ring-1 ring-indigo-100 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:ring-slate-800" style={{ animationDelay: '200ms' }}>
          {HeroArt ? <HeroArt active={active} /> : <StudioHeroMark slug={studio.slug} active={active} />}
        </div>
      </div>
    </section>
  )
}

function LabCard({ studio, lab, index, LabIcon }: { studio: Studio; lab: StudioLab; index: number; LabIcon?: LabIconComponent }) {
  const tokens = ACCENTS[studio.accent]
  return (
    <Link
      to={labPath(studio.slug, lab.slug)}
      className={`group flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 ${tokens.ring} ${FOCUS_RING}`}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl transition group-hover:scale-105 ${tokens.wash}`} aria-hidden>
          {LabIcon ? <LabIcon id={lab.slug} size={52} /> : <LabMark slug={lab.slug} size={52} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black tracking-wide text-slate-400">LAB {String(index + 1).padStart(2, '0')}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${LEVEL_CLASSES[lab.level]}`}>
              {LEVEL_LABELS[lab.level]}
            </span>
          </span>
          <span className="mt-1 block text-sm font-black leading-snug text-slate-950 dark:text-white">{lab.title}</span>
        </span>
      </div>
      <span className="block text-xs leading-5 text-slate-500 dark:text-slate-400">{lab.summary}</span>
      <span className="flex flex-wrap gap-1.5" aria-label={`Concepts covered in ${lab.title}`}>
        {lab.concepts.slice(0, 4).map((concept) => (
          <span key={concept} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {concept}
          </span>
        ))}
        {lab.concepts.length > 4 && (
          <span className="rounded-full px-1 py-0.5 text-[11px] font-semibold text-slate-400">+{lab.concepts.length - 4}</span>
        )}
      </span>
      <span className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs font-bold text-indigo-600 dark:text-indigo-300">
        Open lab
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-400" aria-hidden>
          <ArrowRight size={14} />
        </span>
      </span>
    </Link>
  )
}
