import { Link } from 'react-router-dom'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { ANALYSIS_BY_ID } from '../../analysis/catalog'
import { useStore } from '../../store/useStore'
import { FOCUS_RING } from '../statistics/studioTheme'
import { HomeGlyph, type GlyphKind, type GlyphTone } from './HomeGlyphs'
import { HOME_ACTION_CLASS, HomeSection } from './HomeSection'
import { ANALYSIS_COUNT, MODULE_GROUPS } from './homeCatalog'

const TOOLS: Array<{ id: string; title: string; description: string; glyph: GlyphKind; tone: GlyphTone }> = [
  { id: 'regression.linear', title: 'Regression', description: 'Model relationships and make predictions.', glyph: 'line', tone: 'indigo' },
  { id: 'regression.correlation', title: 'Correlation', description: 'Measure and visualize relationships.', glyph: 'scatter', tone: 'emerald' },
  { id: 'anova.between', title: 'ANOVA', description: 'Compare groups and understand variation.', glyph: 'boxes', tone: 'orange' },
  { id: 'timeSeries.arima', title: 'Time Series', description: 'Explore trends, seasonality and time dependence.', glyph: 'wave', tone: 'amber' },
  { id: 't.paired', title: 'Nonparametric', description: 'Methods beyond parametric assumptions.', glyph: 'steps', tone: 'rose' },
  { id: 'factor.pca', title: 'Multivariate', description: 'Work with multiple variables together.', glyph: 'cluster', tone: 'violet' },
]

const AVAILABLE_TOOLS = TOOLS.filter((tool) => ANALYSIS_BY_ID[tool.id]?.implemented)
const COUNT_LABEL = ANALYSIS_COUNT >= 10 ? `${Math.floor(ANALYSIS_COUNT / 10) * 10}+` : String(ANALYSIS_COUNT)

export function HomeAnalysisTools() {
  const setWorkspaceMode = useStore((state) => state.setWorkspaceMode)

  return (
    <HomeSection
      id="home-tools-heading"
      icon={TrendingUp}
      iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300"
      title="Analysis Tools"
      description={`Explore ${COUNT_LABEL} analysis methods across ${MODULE_GROUPS.length} modules. Choose a method, then run it on your dataset.`}
      action={(
        <Link to="/analysis" onClick={() => setWorkspaceMode('analyze')} className={HOME_ACTION_CLASS}>
          Open analysis workspace <ArrowRight size={15} aria-hidden />
        </Link>
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {AVAILABLE_TOOLS.map((tool, index) => (
          <Link
            key={tool.id}
            to={`/analysis/${tool.id}`}
            onClick={() => setWorkspaceMode('analyze')}
            className={`home-rise group flex min-h-[8.5rem] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800 ${FOCUS_RING}`}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <span className="flex items-start gap-3">
              <span className="transition duration-300 group-hover:scale-110">
                <HomeGlyph kind={tool.glyph} tone={tool.tone} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black text-slate-950 dark:text-white">{tool.title}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{tool.description}</span>
              </span>
            </span>
            <span aria-hidden className="mt-auto flex h-7 w-7 items-center justify-center self-end rounded-full bg-slate-100 text-slate-500 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-400">
              <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>
    </HomeSection>
  )
}
