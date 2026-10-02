import {
  Activity,
  AreaChart,
  Atom,
  BadgeCheck,
  BarChart3,
  BarChart4,
  BookA,
  BookMarked,
  BookOpen,
  Bot,
  Boxes,
  Brain,
  Briefcase,
  Calculator,
  CalendarRange,
  ClipboardList,
  CloudRain,
  Code2,
  Columns2,
  Compass,
  Cpu,
  Crosshair,
  Database,
  Dice3,
  Dice5,
  Eye,
  FileBarChart,
  FileDown,
  FileSearch,
  FileText,
  Filter,
  FlaskConical,
  FolderOpen,
  FunctionSquare,
  Gauge,
  GitMerge,
  GraduationCap,
  Grid3x3,
  HeartPulse,
  Home,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Library,
  LifeBuoy,
  LineChart,
  ListOrdered,
  Map as MapIcon,
  Network,
  Orbit,
  PackageCheck,
  PlayCircle,
  Rocket,
  Route,
  Ruler,
  Scale,
  ScatterChart,
  School,
  Settings,
  ShieldCheck,
  Shapes,
  Shuffle,
  Sigma,
  Sparkles,
  StickyNote,
  Table2,
  Target,
  TerminalSquare,
  TrendingUp,
  Upload,
  Variable,
  Wand2,
  type LucideIcon,
} from 'lucide-react'
import { FEATURED_STUDIO, STUDIO_CATEGORIES, STUDIOS_ROOT, studioPath, studiosByCategory } from '../../lib/statisticsStudios'

export type WorkspaceMode = 'learn' | 'analyze'

export type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  description?: string
}

export type NavGroup = {
  title: string
  icon: LucideIcon
  items: NavItem[]
}

export type NavCategory = {
  id: string
  label: string
  icon: LucideIcon
  /** Shell mode the destination pages live in; switching keeps the top bar's dataset controls consistent. */
  mode?: WorkspaceMode
  /** Direct link for categories without a panel. */
  to?: string
  groups?: NavGroup[]
  /** Route prefixes that mark this category as the current section. */
  match: string[]
  footer?: NavItem
}

const STUDIO_ICONS: Record<string, LucideIcon> = {
  'probability-foundations': Dice5,
  'random-variables': Variable,
  'descriptive-statistics': BarChart3,
  'sampling-methods': Filter,
  'sampling-distributions-clt': AreaChart,
  estimation: Crosshair,
  'hypothesis-testing': Scale,
  'bayesian-statistics': Brain,
  'correlation-association': ScatterChart,
  regression: TrendingUp,
  anova: BarChart4,
  'time-series-basics': LineChart,
  'nonparametric-statistics': ListOrdered,
  'reliability-survival': HeartPulse,
  'multivariate-statistics': Boxes,
  'statistical-simulation': Shuffle,
  'quality-decision-making': BadgeCheck,
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  foundations: Sparkles,
  inference: Target,
  modeling: TrendingUp,
  advanced: Rocket,
}

const studioGroups: NavGroup[] = STUDIO_CATEGORIES.map((category) => ({
  title: category.title,
  icon: CATEGORY_ICONS[category.id] ?? LayoutGrid,
  items: [
    ...studiosByCategory(category.id).map((studio) => ({
      label: studio.shortTitle,
      to: studioPath(studio),
      icon: STUDIO_ICONS[studio.slug] ?? FlaskConical,
      description: `${studio.labs.length} labs`,
    })),
    ...(category.id === 'foundations'
      ? [{ label: 'Distributions', to: FEATURED_STUDIO.path, icon: Activity, description: `${FEATURED_STUDIO.labCount} labs` }]
      : []),
  ],
}))

export const NAV_MENU: NavCategory[] = [
  { id: 'home', label: 'Home', icon: Home, to: '/', match: [] },
  {
    id: 'data',
    label: 'Data',
    icon: Database,
    mode: 'analyze',
    match: ['/data', '/projects'],
    groups: [
      {
        title: 'Import',
        icon: Upload,
        items: [
          { label: 'Upload Data', to: '/data/upload', icon: Upload, description: 'CSV, Excel, JSON, samples' },
          { label: 'Data Preview', to: '/data/preview', icon: Eye, description: 'Schema, types, missing data' },
        ],
      },
      {
        title: 'Edit & Prepare',
        icon: Wand2,
        items: [
          { label: 'Data Grid', to: '/data/grid', icon: Table2, description: 'Edit, filter, export' },
          { label: 'Clean & Transform', to: '/data/clean', icon: Wand2, description: 'Recode, impute, derive' },
        ],
      },
      {
        title: 'Workbenches',
        icon: ClipboardList,
        items: [
          { label: 'Statistics Workbench', to: '/data/workbench', icon: ClipboardList, description: 'Guided variable review' },
          { label: 'Query Workbench', to: '/data/query', icon: TerminalSquare, description: 'Local queries' },
        ],
      },
      {
        title: 'Organize',
        icon: FolderOpen,
        items: [{ label: 'Projects', to: '/projects', icon: FolderOpen, description: 'Notes and dataset collections' }],
      },
    ],
  },
  {
    id: 'explore',
    label: 'Explore',
    icon: Compass,
    mode: 'analyze',
    match: ['/explore', '/distributions'],
    groups: [
      {
        title: 'Summaries',
        icon: Sigma,
        items: [
          { label: 'Descriptive Statistics', to: '/explore/summary', icon: Sigma, description: 'Centre, spread, shape' },
          { label: 'Frequency Tables', to: '/explore/frequency', icon: ListOrdered, description: 'Counts and cross-tabs' },
        ],
      },
      {
        title: 'Visualize',
        icon: BarChart3,
        items: [
          { label: 'Charts', to: '/explore/charts', icon: BarChart3, description: 'Histogram, box, scatter' },
          { label: 'Correlation', to: '/explore/correlation', icon: ScatterChart, description: 'Pearson, Spearman, Kendall' },
          { label: 'Raincloud Plots', to: '/analysis/descriptives.raincloud', icon: CloudRain, description: 'Density, box, raw points' },
          { label: 'Flexplot', to: '/analysis/descriptives.flexplot', icon: LineChart, description: 'Plot grammar' },
        ],
      },
      {
        title: 'Distributions',
        icon: Activity,
        items: [
          { label: 'Distribution Explorer', to: '/distributions', icon: Activity, description: 'Parameters and simulation' },
          { label: 'Distribution Families', to: '/analysis/distributions.explorer', icon: Shapes, description: 'Compare named families' },
        ],
      },
    ],
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: FlaskConical,
    mode: 'analyze',
    match: ['/analysis', '/inference', '/regression', '/advanced', '/stat-modules', '/syllabus', '/modules'],
    footer: { label: 'Open the Analysis workspace (all modules)', to: '/analysis', icon: LayoutDashboard },
    groups: [
      {
        title: 'Compare Groups',
        icon: Columns2,
        items: [
          { label: 'One-Sample T-Test', to: '/analysis/t.oneSample', icon: Target },
          { label: 'Independent T-Test', to: '/analysis/t.independent', icon: Columns2 },
          { label: 'ANOVA', to: '/analysis/anova.between', icon: BarChart4 },
          { label: 'Contingency Tables', to: '/analysis/frequencies.contingency', icon: Grid3x3 },
          { label: 'Power Analysis', to: '/analysis/power.analysis', icon: Gauge },
        ],
      },
      {
        title: 'Relationships & Models',
        icon: TrendingUp,
        items: [
          { label: 'Correlation', to: '/analysis/regression.correlation', icon: ScatterChart },
          { label: 'Linear Regression', to: '/analysis/regression.linear', icon: TrendingUp },
          { label: 'Linear Mixed Models', to: '/analysis/mixed.lmm', icon: Layers },
          { label: 'PCA', to: '/analysis/factor.pca', icon: Orbit },
          { label: 'Factor Analysis (CFA)', to: '/analysis/factor.cfa', icon: Boxes },
          { label: 'SEM', to: '/analysis/sem.sem', icon: Network },
          { label: 'Meta-Analysis', to: '/analysis/meta.analysis', icon: Library },
        ],
      },
      {
        title: 'Bayesian',
        icon: Brain,
        items: [
          { label: 'Learn Bayes', to: '/analysis/learnBayes.labs', icon: Brain },
          { label: 'Bayes Factor Functions', to: '/analysis/bff.general', icon: FunctionSquare },
          { label: 'From Summary Statistics', to: '/analysis/summaryStats.fromPublished', icon: FileBarChart },
          { label: 'Robust T-Tests', to: '/analysis/robustT.modelAveraged', icon: ShieldCheck },
          { label: 'JAGS (MCMC)', to: '/analysis/jags.model', icon: Cpu },
          { label: 'Bain', to: '/analysis/bain.tests', icon: Scale },
        ],
      },
      {
        title: 'Time, ML & Quality',
        icon: Bot,
        items: [
          { label: 'ARIMA', to: '/analysis/timeSeries.arima', icon: LineChart },
          { label: 'Prophet Forecast', to: '/analysis/prophet.forecast', icon: CalendarRange },
          { label: 'Kaplan–Meier', to: '/analysis/survival.nonparametric', icon: HeartPulse },
          { label: 'ML Regression', to: '/analysis/ml.regression', icon: Bot },
          { label: 'ML Clustering', to: '/analysis/ml.clustering', icon: Atom },
          { label: 'Control Charts', to: '/analysis/qc.charts', icon: Activity },
          { label: 'Process Capability', to: '/analysis/qc.capability', icon: Ruler },
          { label: 'Attribute Sampling', to: '/analysis/acceptance.attribute', icon: PackageCheck },
          { label: 'Data Auditing', to: '/analysis/audit.data', icon: FileSearch },
        ],
      },
      {
        title: 'Libraries',
        icon: Library,
        items: [
          { label: 'Analysis Workspace', to: '/analysis', icon: LayoutDashboard, description: 'All 35 modules' },
          { label: 'Inference Tests', to: '/inference', icon: Sigma, description: 'Sampling-distribution machine' },
          { label: 'Advanced Analysis', to: '/advanced', icon: Rocket, description: 'Diagnostics and workflows' },
          { label: 'Stat Modules', to: '/stat-modules', icon: Boxes, description: 'Large module library' },
          { label: 'Syllabus Modules', to: '/syllabus', icon: BookMarked, description: 'Syllabus-aligned' },
          { label: 'CS Modules', to: '/modules', icon: Code2, description: 'Algorithms and security' },
        ],
      },
    ],
  },
  {
    id: 'studios',
    label: 'Studios',
    icon: LayoutGrid,
    mode: 'learn',
    match: [STUDIOS_ROOT],
    footer: { label: 'Browse all Probability & Statistics Studios', to: STUDIOS_ROOT, icon: LayoutGrid },
    groups: studioGroups,
  },
  {
    id: 'learn',
    label: 'Learn',
    icon: GraduationCap,
    mode: 'learn',
    match: ['/learn', '/classroom', '/professional-learning', '/solver'],
    groups: [
      {
        title: 'Start Here',
        icon: PlayCircle,
        items: [
          { label: 'Continue Learning', to: '/learn', icon: PlayCircle, description: 'Pick up where you left off' },
          { label: 'Learning Paths', to: '/learn/paths', icon: Route, description: 'Beginner to research tracks' },
          { label: 'Curriculum Map', to: '/learn/curriculum', icon: MapIcon, description: 'Every area and topic' },
        ],
      },
      {
        title: 'Visual Chapters',
        icon: BookOpen,
        items: [
          { label: 'Chance', to: '/learn/chance', icon: Dice3 },
          { label: 'Compound Probability', to: '/learn/compound', icon: GitMerge },
          { label: 'Frequentist Inference', to: '/learn/frequentist', icon: Sigma },
          { label: 'Bayesian Inference', to: '/learn/bayesian', icon: Brain },
          { label: 'Regression', to: '/learn/regression', icon: TrendingUp },
        ],
      },
      {
        title: 'Practice & Teach',
        icon: Briefcase,
        items: [
          { label: 'Professional Learning', to: '/professional-learning', icon: Briefcase, description: 'Practice bank and templates' },
          { label: 'Statistics Solver', to: '/solver', icon: Calculator, description: 'Step-by-step solutions' },
          { label: 'Classroom', to: '/classroom', icon: School, description: 'Assignments and replays' },
          { label: 'Lesson Wall', to: '/learn/wall', icon: StickyNote, description: 'Saved lesson stages' },
        ],
      },
    ],
  },
  {
    id: 'output',
    label: 'Output',
    icon: FileText,
    mode: 'analyze',
    match: ['/dashboard', '/reports'],
    groups: [
      {
        title: 'Results',
        icon: FileText,
        items: [
          { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, description: 'KPIs and saved work' },
          { label: 'Export & Reports', to: '/reports', icon: FileDown, description: 'Reports and stage PNGs' },
        ],
      },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    icon: LifeBuoy,
    match: ['/documentation', '/docs', '/glossary', '/sitemap', '/settings'],
    groups: [
      {
        title: 'Reference',
        icon: BookOpen,
        items: [
          { label: 'Documentation', to: '/documentation', icon: BookOpen, description: 'Every tool explained' },
          { label: 'Glossary', to: '/glossary', icon: BookA, description: '200+ statistics terms' },
          { label: 'Sitemap', to: '/sitemap', icon: Network, description: 'All pages and modules' },
        ],
      },
      {
        title: 'App',
        icon: Settings,
        items: [{ label: 'Settings', to: '/settings', icon: Settings, description: 'Storage, accessibility, preferences' }],
      },
    ],
  },
]

export function isCategoryActive(category: NavCategory, pathname: string): boolean {
  if (category.id === 'home') return pathname === '/'
  return category.match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}
