import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Activity, AlertTriangle, ArrowDownToLine, ArrowUpToLine, BarChart3, BrainCircuit, Calculator, CheckCircle2, ChevronDown, ChevronRight, Clipboard, Compass, Download, Expand, FileCode, FileJson, FileText, GitBranch, Hash, Keyboard, LineChart, Loader2, Menu, Network, Palette, PieChart, Play, RotateCcw, Save, Search, ShieldCheck, SlidersHorizontal, Star, TableProperties, Tags, Wand2, X } from 'lucide-react'
import { useStore } from '../store/useStore'
import type { AppTheme } from '../store/useStore'
import { defaultSelection, numericColumn, runStatModule, STAT_MODULES, type StatModuleGroup, type StatModuleResult, type StatModuleSelection } from '../lib/statModules'
import { getStatModuleLearningContent, getStatModuleProfile, type ModuleLearningContent, type ModuleProfile } from '../lib/statModuleProfiles'
import { analyzeDatasetQuality, buildCleaningRecommendations, detectColumnRoles, scoreModulesForDataset, type CleaningRecommendation, type ColumnRoleProfile, type DataQualityReport, type ModuleDatasetMatch } from '../lib/dataIntelligence'
import { useToast } from '../components/ui/toastContext'
import { SAMPLE_DATASETS } from '../lib/sampleData'
import { sampleToDataset } from '../lib/dataset'
import { saveDataset, saveProject } from '../lib/storage'
import { createProjectBundle, shareableReportHtml } from '../lib/shareBundles'
import type { AnalysisLogEntry, Dataset, Project } from '../types'

const GROUP_ICONS: Record<StatModuleGroup, typeof Calculator> = {
  Inferential: Calculator,
  'Regression & Modeling': BrainCircuit,
  'Charting & Visualization': BarChart3,
  'Advanced Workflows': Activity,
}

const asCsv = (rows: Array<Record<string, string | number>>) => {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  return [headers.join(','), ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(','))].join('\n')
}

const downloadText = (filename: string, text: string, mime = 'text/plain') => {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function StatModulesPage() {
  const { activeDataset, datasets, projects, activeProject, theme, addDataset, setActiveDataset, addProject, setActiveProject, addAnalysisLog, analysisHistory } = useStore()
  const { notify } = useToast()
  const { moduleKey: routeModuleKey } = useParams()
  const navigate = useNavigate()
  const initialModule = STAT_MODULES.some((item) => item.key === routeModuleKey) ? routeModuleKey as string : 'confidence_interval'
  const [moduleKey, setModuleKey] = useState(initialModule)
  const [selection, setSelection] = useState<StatModuleSelection>({})
  const [query, setQuery] = useState('')
  const [favoriteKeys, setFavoriteKeys] = useState<string[]>(() => JSON.parse(localStorage.getItem('stat-module-favorites') ?? '[]') as string[])
  const [recentKeys, setRecentKeys] = useState<string[]>(() => JSON.parse(localStorage.getItem('stat-module-recents') ?? '[]') as string[])
  const [showExplain, setShowExplain] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [workMode, setWorkMode] = useState<'work' | 'learn'>('work')
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<StatModuleGroup[]>([])
  const [menuDensity, setMenuDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [menuFilter, setMenuFilter] = useState<ModuleMenuFilter>('all')
  const [visitedKeys, setVisitedKeys] = useState<string[]>(() => JSON.parse(localStorage.getItem('stat-module-visited') ?? '[]') as string[])
  const [fullscreenChart, setFullscreenChart] = useState(false)
  const [resultAt, setResultAt] = useState(() => new Date())
  const [isCalculating, setIsCalculating] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [runHistory, setRunHistory] = useState<ModuleRunSnapshot[]>(() => JSON.parse(localStorage.getItem('stat-module-run-history') ?? '[]') as ModuleRunSnapshot[])
  const [comparisonTray, setComparisonTray] = useState<ModuleRunSnapshot[]>(() => JSON.parse(localStorage.getItem('stat-module-comparison-tray') ?? '[]') as ModuleRunSnapshot[])
  const searchRef = useRef<HTMLInputElement>(null)
  const menuScrollRef = useRef<HTMLDivElement>(null)

  const columns = useMemo(() => Object.keys(activeDataset?.data[0] ?? {}), [activeDataset])
  const numericCols = useMemo(
    () => activeDataset?.schema.filter((col) => col.type === 'numeric').map((col) => col.name) ?? columns,
    [activeDataset, columns]
  )
  const catCols = useMemo(
    () => activeDataset?.schema.filter((col) => col.type !== 'numeric').map((col) => col.name) ?? columns,
    [activeDataset, columns]
  )

  const dataRows = activeDataset?.data ?? []
  const selectedModule = STAT_MODULES.find((item) => item.key === moduleKey) ?? STAT_MODULES[0]
  const moduleProfile = useMemo(() => getStatModuleProfile(selectedModule), [selectedModule])
  const learningContent = useMemo(() => getStatModuleLearningContent(selectedModule, moduleProfile), [selectedModule, moduleProfile])
  const inputSpec = useMemo(() => moduleInputSpec(selectedModule), [selectedModule])
  const columnRoleProfiles = useMemo(() => activeDataset ? detectColumnRoles(activeDataset) : [], [activeDataset])
  const effectiveSelection = useMemo(
    () => moduleAwareDefaultSelection(activeDataset, dataRows, selection, selectedModule, inputSpec, columnRoleProfiles),
    [activeDataset, dataRows, selection, selectedModule, inputSpec, columnRoleProfiles]
  )
  const selectedDataSummary = useMemo(() => activeDataset ? datasetSelectionSummary(activeDataset, effectiveSelection) : null, [activeDataset, effectiveSelection])
  const selectedFieldNames = useMemo(() => inputSpec.fields
    .filter((field) => field !== 'alpha')
    .map((field) => String(effectiveSelection[field] ?? ''))
    .filter(Boolean), [inputSpec, effectiveSelection])
  const dataQualityReport = useMemo(() => analyzeDatasetQuality(activeDataset), [activeDataset])
  const cleaningRecommendations = useMemo(() => buildCleaningRecommendations(activeDataset, selectedModule.key, selectedFieldNames), [activeDataset, selectedModule.key, selectedFieldNames])
  const datasetModuleMatches = useMemo(() => scoreModulesForDataset(activeDataset), [activeDataset])
  const inputWarnings = useMemo(() => activeDataset ? validateModuleInputs(inputSpec, effectiveSelection, numericCols, catCols, dataRows) : [], [activeDataset, inputSpec, effectiveSelection, numericCols, catCols, dataRows])
  const recommendedNext = useMemo(() => recommendNextModule(selectedModule, numericCols.length, catCols.length), [selectedModule, numericCols.length, catCols.length])
  const trustReport = useMemo(() => activeDataset ? buildModuleTrustReport(activeDataset, selectedModule, moduleProfile, inputSpec, effectiveSelection, inputWarnings, resultAt) : null, [activeDataset, selectedModule, moduleProfile, inputSpec, effectiveSelection, inputWarnings, resultAt])
  const analysisGuide = useMemo(() => activeDataset ? buildAnalysisGuide(activeDataset, selectedModule, moduleProfile, inputSpec, trustReport, numericCols.length, catCols.length) : null, [activeDataset, selectedModule, moduleProfile, inputSpec, trustReport, numericCols.length, catCols.length])
  const prepReport = useMemo(() => activeDataset ? buildDataPreparationReport(activeDataset, selectedModule, inputSpec, effectiveSelection, trustReport) : null, [activeDataset, selectedModule, inputSpec, effectiveSelection, trustReport])

  let result: StatModuleResult
  try {
    result = activeDataset
      ? runStatModule(moduleKey, dataRows, effectiveSelection)
      : { title: selectedModule.title, summary: 'Load a dataset to run this module.', metrics: [] }
  } catch (error) {
    result = {
      title: selectedModule.title,
      summary: error instanceof Error ? error.message : 'Unable to compute this module with the selected columns.',
      metrics: [],
      notes: ['Try selecting different numeric or categorical columns.'],
    }
  }
  const reportPackage = useMemo(() => activeDataset ? buildModuleReportPackage(activeDataset, selectedModule, moduleProfile, effectiveSelection, result, trustReport, prepReport, analysisGuide) : null, [activeDataset, selectedModule, moduleProfile, effectiveSelection, result, trustReport, prepReport, analysisGuide])
  const validationReport = useMemo(() => activeDataset ? buildModelValidationReport(activeDataset, selectedModule, inputSpec, effectiveSelection, result, trustReport, prepReport) : null, [activeDataset, selectedModule, inputSpec, effectiveSelection, result, trustReport, prepReport])
  const workspaceReport = useMemo(() => activeDataset ? buildWorkspaceHandoffReport(activeDataset, activeProject, selectedModule, result, analysisHistory, reportPackage) : null, [activeDataset, activeProject, selectedModule, result, analysisHistory, reportPackage])

  const filteredModules = STAT_MODULES.filter((module) => {
    const text = `${module.id} ${module.title} ${module.description} ${module.group} ${SEARCH_SYNONYMS[module.key] ?? ''}`.toLowerCase()
    const matchesSearch = text.includes(query.trim().toLowerCase())
    const need = moduleNeedState(module, numericCols.length, catCols.length)
    const kind = moduleKind(module).toLowerCase()
    const requirements = moduleRequirementBadges(module).map((item) => item.toLowerCase())
    const matchesFilter = menuFilter === 'all'
      || (menuFilter === 'ready' && !need.blocked)
      || (menuFilter === 'favorites' && favoriteKeys.includes(module.key))
      || kind === menuFilter
      || requirements.includes(menuFilter)
    return matchesSearch && matchesFilter
  })
  const grouped = filteredModules.reduce((acc, module) => {
    acc[module.group] = [...(acc[module.group] ?? []), module]
    return acc
  }, {} as Record<StatModuleGroup, typeof STAT_MODULES>)
  const recommendedModuleKeys = useMemo(() => recommendedMenuModules(numericCols.length, catCols.length).map((item) => item.key), [numericCols.length, catCols.length])
  const moduleCompatibility = useMemo(() => buildModuleCompatibility(activeDataset, selectedModule, moduleProfile, inputSpec, effectiveSelection, inputWarnings), [activeDataset, selectedModule, moduleProfile, inputSpec, effectiveSelection, inputWarnings])
  const columnMeta = useMemo(() => Object.fromEntries((activeDataset?.schema ?? []).map((col) => [col.name, col])), [activeDataset])
  const selectedInputPreview = useMemo(() => buildSelectedInputPreview(activeDataset, inputSpec, effectiveSelection), [activeDataset, inputSpec, effectiveSelection])

  useEffect(() => {
    if (!activeDataset) return
    setIsCalculating(true)
    const timeout = window.setTimeout(() => setIsCalculating(false), 240)
    return () => window.clearTimeout(timeout)
  }, [activeDataset, moduleKey, effectiveSelection.num1, effectiveSelection.num2, effectiveSelection.num3, effectiveSelection.cat1, effectiveSelection.cat2, effectiveSelection.target, effectiveSelection.alpha])

  const update = (key: keyof StatModuleSelection, value: string | number) => {
    setSelection((prev) => ({ ...prev, [key]: value }))
    setResultAt(new Date())
  }

  const withBusy = async (key: string, action: () => void | Promise<void>) => {
    setBusyAction(key)
    try {
      await action()
    } finally {
      window.setTimeout(() => setBusyAction((current) => current === key ? null : current), 220)
    }
  }

  const selectModule = useCallback((key: string) => {
    setModuleKey(key)
    navigate(`/stat-modules/${key}`)
    setModuleMenuOpen(false)
    setResultAt(new Date())
    const next = [key, ...recentKeys.filter((item) => item !== key)].slice(0, 8)
    setRecentKeys(next)
    localStorage.setItem('stat-module-recents', JSON.stringify(next))
    const visited = [...new Set([key, ...visitedKeys])]
    setVisitedKeys(visited)
    localStorage.setItem('stat-module-visited', JSON.stringify(visited))
  }, [navigate, recentKeys, visitedKeys])

  const toggleFavorite = (key: string) => {
    const next = favoriteKeys.includes(key) ? favoriteKeys.filter((item) => item !== key) : [...favoriteKeys, key]
    setFavoriteKeys(next)
    localStorage.setItem('stat-module-favorites', JSON.stringify(next))
  }

  const toggleGroup = (group: StatModuleGroup) => {
    setCollapsedGroups((prev) => prev.includes(group) ? prev.filter((item) => item !== group) : [...prev, group])
  }

  const copySummary = async () => withBusy('copy', async () => {
    await navigator.clipboard.writeText(`${result.title}\n${result.summary}\n${result.metrics.map((m) => `${m.label}: ${m.value}`).join('\n')}`)
    recordAudit('Copied module summary', 'Copied result summary to clipboard.')
    notify('Result summary copied.', 'success')
  })

  const copyTable = async () => withBusy('table', async () => {
    if (!result.table?.length) return
    await navigator.clipboard.writeText(asCsv(result.table))
    recordAudit('Copied result table', `Copied ${result.table.length} result rows as CSV.`)
    notify('Table copied as CSV.', 'success')
  })

  const exportTable = () => withBusy('export', () => {
    if (!result.table?.length) return
    downloadText(`${selectedModule.key}.csv`, asCsv(result.table), 'text/csv')
    recordAudit('Exported result table', `Exported ${selectedModule.title} table as CSV.`)
    notify('Table exported as CSV.', 'success')
  })

  const loadSample = async (sampleId?: string) => {
    const sample = SAMPLE_DATASETS.find((item) => item.id === sampleId) ?? SAMPLE_DATASETS.find((item) => item.id === 'iris-flowers') ?? SAMPLE_DATASETS[0]
    const dataset = sampleToDataset(sample)
    addDataset(dataset)
    setActiveDataset(dataset)
    await saveDataset(dataset)
    notify(`${dataset.name} loaded for Stat Modules.`, 'success')
  }

  const loadModuleSample = () => withBusy('sample', () => loadSample(sampleIdForModule(selectedModule)))

  const resetInputs = () => withBusy('reset', () => {
    setSelection({})
    setResultAt(new Date())
    recordAudit('Reset module inputs', `Reset selected inputs for ${selectedModule.title}.`)
    notify('Module inputs reset to defaults.', 'info')
  })

  const saveModule = () => withBusy('save', () => {
    localStorage.setItem('stat-module-saved-state', JSON.stringify({ moduleKey, selection: effectiveSelection, savedAt: Date.now() }))
    recordAudit('Saved module state', `Saved ${selectedModule.title} setup locally.`)
    notify('Module state saved locally.', 'success')
  })

  const captureRun = () => withBusy('run', () => {
    setIsCalculating(true)
    const snapshot = buildRunSnapshot(activeDataset, selectedModule, effectiveSelection, result, trustReport)
    const next = [snapshot, ...runHistory.filter((item) => item.id !== snapshot.id)].slice(0, 12)
    setRunHistory(next)
    localStorage.setItem('stat-module-run-history', JSON.stringify(next))
    setResultAt(new Date())
    recordAudit('Recorded module run', `Captured ${selectedModule.title.replace(' Module', '')} result in version history.`)
    notify('Run captured in history.', 'success')
  })

  const addToComparisonTray = () => {
    const snapshot = buildRunSnapshot(activeDataset, selectedModule, effectiveSelection, result, trustReport)
    const next = [snapshot, ...comparisonTray.filter((item) => item.signature !== snapshot.signature)].slice(0, 4)
    setComparisonTray(next)
    localStorage.setItem('stat-module-comparison-tray', JSON.stringify(next))
    notify('Added result to comparison tray.', 'success')
  }

  const clearComparisonTray = () => {
    setComparisonTray([])
    localStorage.removeItem('stat-module-comparison-tray')
  }

  const exportModuleMarkdown = () => {
    if (!reportPackage) return
    downloadText(`${selectedModule.key}_report.md`, moduleReportMarkdown(reportPackage), 'text/markdown')
    recordAudit('Exported module report', `Exported ${selectedModule.title} as Markdown.`)
    notify('Module report exported as Markdown.', 'success')
  }

  const exportModuleHtml = () => {
    if (!reportPackage) return
    downloadText(`${selectedModule.key}_report.html`, moduleReportHtml(reportPackage), 'text/html')
    recordAudit('Exported module report', `Exported ${selectedModule.title} as HTML.`)
    notify('Module report exported as HTML.', 'success')
  }

  const exportModuleJson = () => {
    if (!reportPackage) return
    downloadText(`${selectedModule.key}_reproducible_package.json`, JSON.stringify(reportPackage, null, 2), 'application/json')
    recordAudit('Exported reproducible package', `Exported ${selectedModule.title} package as JSON.`)
    notify('Reproducible package exported as JSON.', 'success')
  }

  const exportWorkspaceBundle = () => {
    if (!activeDataset) return
    const bundle = createProjectBundle({
      datasets,
      projects,
      activeDatasetId: activeDataset.id,
      activeProjectId: activeProject?.id,
      analysisHistory,
    })
    downloadText(`statanveshak-workspace-${Date.now()}.json`, JSON.stringify(bundle, null, 2), 'application/json')
    recordAudit('Exported workspace bundle', 'Exported datasets, projects, and analysis history for offline handoff.')
    notify('Workspace bundle exported.', 'success')
  }

  const exportShareableHtml = () => {
    if (!activeDataset) return
    const html = shareableReportHtml({
      title: `${selectedModule.title.replace(' Module', '')} Workspace Handoff`,
      dataset: activeDataset,
      analysisHistory: reportPackage
        ? [{
          id: `module_report_${Date.now()}`,
          createdAt: Date.now(),
          title: selectedModule.title,
          datasetName: activeDataset.name,
          workflow: 'Stat Modules',
          variables: Object.values(effectiveSelection).filter((value): value is string => typeof value === 'string' && value.length > 0),
          method: reportPackage.method,
          resultSummary: result.summary,
          assumptions: moduleProfile.assumptions,
          interpretation: reportPackage.reportText,
          reportText: moduleReportMarkdown(reportPackage),
        }, ...analysisHistory].slice(0, 12)
        : analysisHistory,
    })
    downloadText(`statanveshak-share-${Date.now()}.html`, html, 'text/html')
    recordAudit('Exported shareable handoff', 'Exported a browser-only HTML report for review or collaboration.')
    notify('Shareable HTML exported.', 'success')
  }

  const saveProjectSnapshot = async () => {
    if (!activeDataset) return
    const project: Project = {
      id: activeProject?.id ?? `proj_${Date.now()}`,
      name: activeProject?.name ?? `${activeDataset.name} analysis`,
      createdAt: activeProject?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      datasetIds: [...new Set([...(activeProject?.datasetIds ?? []), activeDataset.id])],
      notes: [
        activeProject?.notes ?? '',
        `Saved Stat Modules snapshot: ${selectedModule.title.replace(' Module', '')}`,
        `Variables: ${Object.values(effectiveSelection).filter((value) => typeof value === 'string' && value).join(', ') || 'defaults'}`,
        `Result: ${result.summary}`,
      ].filter(Boolean).join('\n'),
    }
    await saveProject(project)
    addProject(project)
    setActiveProject(project)
    recordAudit('Saved project snapshot', `Attached ${selectedModule.title} state to project "${project.name}".`)
    notify('Project snapshot saved.', 'success')
  }

  const recordAudit = (title: string, detail: string) => {
    if (!activeDataset) return
    addAnalysisLog({
      id: `stat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      title,
      datasetName: activeDataset.name,
      workflow: 'Stat Modules',
      variables: Object.values(effectiveSelection).filter((value): value is string => typeof value === 'string' && value.length > 0),
      method: selectedModule.title,
      resultSummary: result.summary,
      assumptions: moduleProfile.assumptions,
      interpretation: detail,
      reportText: `${title}: ${detail}`,
    })
  }

  const warnings = [
    dataRows.length < 30 ? 'Small sample size may make p-values and intervals unstable.' : '',
    activeDataset?.schema.some((col) => col.missingPct > 0) ? 'Missing values detected; results use available valid rows.' : '',
    activeDataset?.schema.some((col) => col.type !== 'numeric' && col.unique > 20) ? 'Some categorical variables have many levels.' : '',
  ].filter(Boolean)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'ArrowDown') {
        const idx = STAT_MODULES.findIndex((module) => module.key === moduleKey)
        selectModule(STAT_MODULES[(idx + 1) % STAT_MODULES.length].key)
      }
      if (event.altKey && event.key === 'ArrowUp') {
        const idx = STAT_MODULES.findIndex((module) => module.key === moduleKey)
        selectModule(STAT_MODULES[(idx - 1 + STAT_MODULES.length) % STAT_MODULES.length].key)
      }
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moduleKey, selectModule])

  if (!activeDataset) {
    return <StatModulesEmptyState onLoadSample={loadSample} />
  }

  return (
    <div className="stat-modules-shell flex h-[calc(100vh-4.75rem)] min-h-0 flex-col overflow-hidden lg:flex-row">
      <aside className={`${moduleMenuOpen ? 'flex' : 'hidden'} h-72 w-full shrink-0 flex-col overflow-hidden border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 sm:flex lg:h-full lg:max-h-full lg:w-80 lg:border-b-0 lg:border-r`} aria-label="Stat modules menu">
        <div className="shrink-0 border-b border-slate-100 p-3 dark:border-slate-700">
          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-indigo-500" />
              <h1 className="font-bold text-slate-800 dark:text-white">Stat Modules</h1>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">{filteredModules.length}</span>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search modules" aria-label="Search stat modules by name, method, or synonym" className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-10 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:border-slate-600" title="Press / to search">
              /
            </span>
          </div>

          {(favoriteKeys.length > 0 || recentKeys.length > 0) && (
            <div className="mt-3 space-y-2">
              {favoriteKeys.length > 0 && <ModuleShortcutChips title="Favorites" keys={favoriteKeys} active={moduleKey} onSelect={selectModule} />}
              {recentKeys.length > 0 && <ModuleShortcutChips title="Recent" keys={recentKeys} active={moduleKey} onSelect={selectModule} />}
            </div>
          )}
          <div className="mt-3">
            <ModuleRecommendationChips keys={recommendedModuleKeys} active={moduleKey} onSelect={selectModule} />
          </div>
          <ModuleMenuFilterBar value={menuFilter} onChange={setMenuFilter} />
          <div className="mt-3 flex items-center gap-2">
            <button type="button" onClick={() => setCollapsedGroups(collapsedGroups.length ? [] : Object.keys(GROUP_ICONS) as StatModuleGroup[])} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700" title="Collapse or expand all module categories">
              <ChevronRight size={13} />
              {collapsedGroups.length ? 'Expand groups' : 'Collapse groups'}
            </button>
            <button type="button" onClick={() => setMenuDensity((value) => value === 'comfortable' ? 'compact' : 'comfortable')} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700" title="Switch module menu row density">
              <SlidersHorizontal size={13} />
              {menuDensity === 'comfortable' ? 'Comfort' : 'Compact'}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-1.5 px-1 text-[11px] text-slate-400">
            <Keyboard size={12} />
            <span>Use /, arrows, Enter · {visitedKeys.length}/{STAT_MODULES.length} explored</span>
          </div>
        </div>

        <div className="relative min-h-0 flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-5 bg-gradient-to-b from-white to-transparent dark:from-slate-800" />
        <div ref={menuScrollRef} className="stat-module-menu-scroll stat-module-scroll min-h-0 h-full overflow-y-scroll overscroll-contain p-3 pr-2 [scrollbar-gutter:stable]">
          {filteredModules.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400 dark:border-slate-700">
              No modules match this search.
            </div>
          )}
          {(Object.entries(grouped) as [StatModuleGroup, typeof STAT_MODULES][]).map(([group, modules]) => {
            const Icon = GROUP_ICONS[group]
            const collapsed = collapsedGroups.includes(group)
            return (
              <div key={group} className="mb-4">
                <button type="button" onClick={() => toggleGroup(group)} aria-expanded={!collapsed} className="sticky top-0 z-10 mb-1 flex w-full items-center gap-2 rounded-md bg-white/95 px-1 py-1 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 backdrop-blur hover:bg-slate-50 dark:bg-slate-800/95 dark:hover:bg-slate-700/80" title={`${collapsed ? 'Expand' : 'Collapse'} ${group}`}>
                  {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  <Icon size={13} />
                  <span className="min-w-0 flex-1 truncate">{group}</span>
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-300">{modules.length}</span>
                </button>
                {!collapsed && modules.map((module) => {
                  const isActive = moduleKey === module.key
                  const need = moduleNeedState(module, numericCols.length, catCols.length)
                  const ModuleIcon = moduleMenuIcon(module)
                  const rowPadding = menuDensity === 'comfortable' ? 'px-2 py-2' : 'px-2 py-1.5'
                  return (
                    <div
                      key={module.key}
                      className={`group relative mb-1 flex min-h-8 w-full items-center rounded-md border text-xs transition-colors ${
                        isActive
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                          : need.blocked
                            ? 'border-transparent text-slate-400 opacity-75 hover:bg-slate-50 dark:text-slate-500 dark:hover:bg-slate-700/60'
                            : recommendedModuleKeys.includes(module.key)
                              ? 'border-emerald-200 bg-emerald-50/70 text-slate-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-slate-200'
                              : 'border-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                      title={need.message}
                    >
                      {isActive && <span className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-1 rounded-r-full bg-white/90" />}
                      <button
                        type="button"
                        onClick={() => selectModule(module.key)}
                        aria-current={isActive ? 'page' : undefined}
                        aria-label={`Open ${module.title.replace(' Module', '')}. ${need.message}`}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            selectModule(module.key)
                            return
                          }
                          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
                          event.preventDefault()
                          const idx = STAT_MODULES.findIndex((item) => item.key === module.key)
                          const next = event.key === 'ArrowDown'
                            ? STAT_MODULES[(idx + 1) % STAT_MODULES.length]
                            : STAT_MODULES[(idx - 1 + STAT_MODULES.length) % STAT_MODULES.length]
                          selectModule(next.key)
                        }}
                        className={`flex min-w-0 flex-1 items-center gap-2 rounded-l-md text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400 ${rowPadding}`}
                      >
                        <ModuleIcon size={14} className="shrink-0" />
                        <span className="w-7 shrink-0 font-semibold">{module.id}.</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{module.title.replace(' Module', '')}</span>
                          {menuDensity === 'comfortable' && <span className={`mt-1 flex flex-wrap gap-1 ${isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>
                            <ModuleTypeBadge module={module} active={isActive} />
                            {moduleRequirementBadges(module).map((badge) => <span key={badge} className={`rounded px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-white/15' : 'bg-slate-100 dark:bg-slate-700'}`}>{badge}</span>)}
                            {visitedKeys.includes(module.key) && !isActive && <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950/35 dark:text-indigo-300">Seen</span>}
                            {recommendedModuleKeys.includes(module.key) && !isActive && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Recommended</span>}
                          </span>}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(module.key)}
                        aria-pressed={favoriteKeys.includes(module.key)}
                        className="mr-1 rounded p-1 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400"
                        title="Favorite module"
                        aria-label={`${favoriteKeys.includes(module.key) ? 'Remove' : 'Add'} favorite: ${module.title}`}
                      >
                        <Star size={12} className={favoriteKeys.includes(module.key) ? 'fill-amber-300 text-amber-300' : ''} />
                      </button>
                      <div className="pointer-events-none absolute left-2 right-2 top-[calc(100%-0.125rem)] z-30 hidden rounded-lg border border-slate-200 bg-white p-3 text-slate-600 shadow-xl group-hover:block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800 dark:text-white">{module.title.replace(' Module', '')}</p>
                          <ModuleTypeBadge module={module} />
                        </div>
                        <p className="text-xs leading-5">{module.description}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {moduleRequirementBadges(module).map((badge) => <span key={badge} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] dark:bg-slate-700">{badge}</span>)}
                        </div>
                        <p className={`mt-2 text-[11px] ${need.blocked ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}`}>{need.message}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-6 bg-gradient-to-t from-white to-transparent dark:from-slate-800" />
        <div className="absolute bottom-3 right-4 z-30 flex flex-col gap-1">
          <button type="button" onClick={() => menuScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} className="pointer-events-auto rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300" title="Jump to top">
            <ArrowUpToLine size={13} />
          </button>
          <button type="button" onClick={() => menuScrollRef.current?.scrollTo({ top: menuScrollRef.current.scrollHeight, behavior: 'smooth' })} className="pointer-events-auto rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300" title="Jump to bottom">
            <ArrowDownToLine size={13} />
          </button>
        </div>
        </div>
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto p-3 lg:p-4">
        <div className="mx-auto max-w-7xl">
          <div className="sticky top-0 z-20 -mx-4 mb-3 border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-1 text-xs text-slate-400">Analysis / Stat Modules / {selectedModule.title.replace(' Module', '')}</div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setModuleMenuOpen((value) => !value)} className="inline-flex rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-white dark:border-slate-600 dark:text-slate-300 sm:hidden" aria-label={moduleMenuOpen ? 'Close module menu' : 'Open module menu'}>
                {moduleMenuOpen ? <X size={15} /> : <Menu size={15} />}
              </button>
              <h1 className="text-base font-bold text-slate-800 dark:text-white">{selectedModule.id}. {selectedModule.title}</h1>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">{selectedModule.group}</span>
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600 dark:bg-green-900/30 dark:text-green-300">{activeDataset.name}</span>
              <span className="text-xs text-slate-400">Result {resultAt.toLocaleTimeString()}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="min-w-64 flex-1 text-xs text-slate-500 dark:text-slate-400">{selectedModule.description}</p>
              <button type="button" onClick={copySummary} disabled={busyAction === 'copy'} aria-busy={busyAction === 'copy'} className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs text-white hover:bg-indigo-700 disabled:opacity-70">{busyAction === 'copy' ? <Loader2 size={13} className="animate-spin" /> : <Clipboard size={13} />} {busyAction === 'copy' ? 'Copying' : 'Copy'}</button>
              <button type="button" onClick={copyTable} disabled={!result.table?.length || busyAction === 'table'} aria-busy={busyAction === 'table'} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300">{busyAction === 'table' ? <Loader2 size={13} className="animate-spin" /> : <TableProperties size={13} />} Table</button>
              <button type="button" onClick={exportTable} disabled={!result.table?.length || busyAction === 'export'} aria-busy={busyAction === 'export'} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300">{busyAction === 'export' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} CSV</button>
              <button type="button" onClick={loadModuleSample} disabled={busyAction === 'sample'} aria-busy={busyAction === 'sample'} className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-70 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-300">{busyAction === 'sample' ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} Sample</button>
              <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 dark:border-slate-600 dark:bg-slate-800">
                {(['work', 'learn'] as const).map((mode) => (
                  <button key={mode} type="button" onClick={() => setWorkMode(mode)} aria-pressed={workMode === mode} className={`rounded px-2 py-1 text-xs font-semibold capitalize ${workMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                    {mode}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setCompactMode((v) => !v)} aria-pressed={compactMode} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300">{compactMode ? 'Comfort' : 'Compact'}</button>
              <span className="text-xs text-slate-400 self-center">Alt+Up / Alt+Down changes module</span>
            </div>
          </div>

          {selectedDataSummary && (
            <SelectedDataStrip summary={selectedDataSummary} requirements={inputSpec.requirements} />
          )}
          <CalculationStatusBar active={isCalculating} moduleTitle={selectedModule.title.replace(' Module', '')} />
          {dataQualityReport && (
            <DataHandlingCommandCenter
              report={dataQualityReport}
              cleaning={cleaningRecommendations}
              matches={datasetModuleMatches}
              activeModuleKey={selectedModule.key}
              onSelectModule={selectModule}
            />
          )}
          <ModuleDecisionHeader compatibility={moduleCompatibility} onLoadSample={loadModuleSample} onAddCompare={addToComparisonTray} />
          {comparisonTray.length > 0 && (
            <ComparisonTray snapshots={comparisonTray} onClear={clearComparisonTray} onSelect={selectModule} />
          )}
          {trustReport && selectedModule.key !== 'simple_regression' && (
            <ModuleTrustPanel report={trustReport} compact={selectedModule.key === 'simple_regression'} />
          )}
          {analysisGuide && (
            <AnalysisGuidePanel guide={analysisGuide} activeModuleKey={selectedModule.key} onSelectModule={selectModule} />
          )}
          {prepReport && (
            <DataPreparationPanel report={prepReport} recentHistory={analysisHistory.slice(0, 4)} />
          )}
          {reportPackage && (
            <ModuleReportPackagePanel packageData={reportPackage} onMarkdown={exportModuleMarkdown} onHtml={exportModuleHtml} onJson={exportModuleJson} />
          )}
          {validationReport && (
            <ModelValidationPanel report={validationReport} activeModuleKey={selectedModule.key} onSelectModule={selectModule} />
          )}
          {workspaceReport && (
            <WorkspaceHandoffPanel report={workspaceReport} onBundle={exportWorkspaceBundle} onHtml={exportShareableHtml} onSnapshot={saveProjectSnapshot} />
          )}

          {warnings.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {warnings.map((warning) => (
                <span key={warning} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                  <AlertTriangle size={12} />
                  {warning}
                </span>
              ))}
            </div>
          )}

          {selectedModule.key === 'simple_regression' ? (
            <SimpleLinearRegressionStudio
              dataset={activeDataset}
              dataRows={dataRows}
              numericCols={numericCols}
              selection={effectiveSelection}
              result={result}
              trustReport={trustReport}
              analysisGuide={analysisGuide}
              theme={theme}
              notify={notify}
              onUpdate={update}
              onRun={captureRun}
              onReset={resetInputs}
              onExport={exportTable}
              onSave={saveModule}
              onCopy={copySummary}
              onSelectModule={selectModule}
            />
          ) : (
            <Fragment>
          {workMode === 'learn' && <ModuleTheoryPanel module={selectedModule} profile={moduleProfile} learning={learningContent} compact={compactMode} />}

          <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Inputs for {selectedModule.title.replace(' Module', '')}</h2>
                <p className="mt-1 text-xs text-slate-400">{moduleProfile.dataShape}</p>
              </div>
              <div className="flex max-w-2xl flex-wrap gap-1.5">
                {moduleProfile.inputHints.map((hint) => (
                  <span key={hint} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-300">{hint}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {inputSpec.fields.map((field) => field === 'alpha' ? (
                <AlphaInput key={field} label={moduleProfile.inputLabels.alpha ?? 'Alpha'} value={effectiveSelection.alpha} onChange={(value) => update('alpha', value)} />
              ) : (
                <Select
                  key={field}
                  label={moduleProfile.inputLabels[field] ?? defaultInputLabel(field)}
                  value={String(effectiveSelection[field] ?? '')}
                  options={field === 'cat1' || field === 'cat2' ? (catCols.length ? catCols : columns) : numericCols}
                  columnMeta={columnMeta}
                  icon={field === 'cat1' || field === 'cat2' ? undefined : 'numeric'}
                  hint={inputFieldHint(field)}
                  error={inputWarnings.find((item) => item.field === field)?.message}
                  onChange={(value) => update(field, value)}
                />
              ))}
            </div>
            {inputWarnings.length > 0 && (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {inputWarnings.map((warning) => (
                  <p key={`${warning.field}-${warning.message}`} className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">{warning.message}</p>
                ))}
              </div>
            )}
            <SelectedInputPreview rows={selectedInputPreview} />
          </section>

          <ModuleVisualWorkbench
            module={selectedModule}
            profile={moduleProfile}
            dataRows={dataRows}
            selection={effectiveSelection}
            result={result}
            compact={compactMode}
          />

          <StickyMiniActions onRun={captureRun} onReset={resetInputs} onExport={exportTable} onSave={saveModule} canExport={Boolean(result.table?.length)} busyAction={busyAction} />

          <section className={`mb-5 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 ${compactMode ? 'p-3' : 'p-5'}`}>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{result.title}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{result.summary}</p>

            {result.metrics.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                {result.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                    <p className="mb-1 text-xs text-slate-400">{metric.label}</p>
                    <p className="break-words text-sm font-bold text-slate-800 dark:text-white">{String(metric.value)}</p>
                  </div>
                ))}
              </div>
            )}

            <ModuleResultCards module={selectedModule} result={result} alpha={effectiveSelection.alpha} />

            {result.notes && (
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                {result.notes.map((note) => <p key={note}>{note}</p>)}
              </div>
            )}
            <ModuleRecoveryPanel module={selectedModule} profile={moduleProfile} inputWarnings={inputWarnings} result={result} onLoadSample={loadModuleSample} onReset={resetInputs} />
            {showExplain && (
              <ResultReadingPanel profile={moduleProfile} />
            )}
            <button onClick={() => setShowExplain((v) => !v)} className="mt-3 text-xs text-indigo-600 dark:text-indigo-300">{showExplain ? 'Hide explanation' : 'Show explanation'}</button>
            {recommendedNext && (
              <button type="button" onClick={() => selectModule(recommendedNext.key)} className="ml-3 mt-3 text-xs text-emerald-600 dark:text-emerald-300">
                Next: {recommendedNext.title.replace(' Module', '')}
              </button>
            )}
            <ResultVersionHistory snapshots={runHistory} activeModuleKey={selectedModule.key} onSelect={selectModule} />
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {result.table && result.table.length > 0 && (
              <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Table Output</h2>
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 dark:bg-slate-700/50">
                      <tr>
                        {Object.keys(result.table[0]).map((key) => (
                          <th key={key} className="px-3 py-2 text-left font-semibold">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {result.table.slice(0, 100).map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value, cell) => (
                            <td key={cell} className="px-3 py-2 text-slate-600 dark:text-slate-300">{String(value)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {result.chart && (
              <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Visualization</h2>
                  <button onClick={() => setFullscreenChart(true)} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600"><Expand size={13} /> Fullscreen</button>
                </div>
                <PlotPanel chart={result.chart} theme={theme} moduleKey={selectedModule.key} notify={notify} />
              </section>
            )}
          </div>
            </Fragment>
          )}
        </div>
      </main>
      {fullscreenChart && result.chart && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 p-6" onClick={() => setFullscreenChart(false)}>
          <div className="h-full rounded-xl bg-white p-4 dark:bg-slate-800" onClick={(event) => event.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 dark:text-white">{result.title}</h2>
              <button onClick={() => setFullscreenChart(false)} className="rounded-md bg-slate-100 px-3 py-1 text-sm dark:bg-slate-700 dark:text-slate-200">Close</button>
            </div>
            <PlotPanel chart={result.chart} theme={theme} moduleKey={selectedModule.key} notify={notify} height="calc(100vh - 130px)" />
          </div>
        </div>
      )}
    </div>
  )
}

type InputFieldKey = keyof StatModuleSelection
type ModuleInputSpec = {
  fields: InputFieldKey[]
  requirements: Array<'numeric' | 'categorical' | 'paired' | 'grouped' | 'binary' | 'time'>
}

type ModuleMenuFilter = 'all' | 'ready' | 'favorites' | 'chart' | 'model' | 'test' | 'data' | 'report' | 'numeric' | 'categorical' | 'grouped' | 'paired' | 'time'

type ModuleCompatibility = {
  score: number
  label: 'Excellent fit' | 'Good fit' | 'Needs setup' | 'Risky fit'
  difficulty: 'Beginner' | 'Applied' | 'Advanced'
  question: string
  bestUse: string[]
  avoidWhen: string[]
  fixes: Array<{ label: string; detail: string }>
  sampleId: string
}

type ModuleRunSnapshot = {
  id: string
  signature: string
  createdAt: number
  moduleKey: string
  moduleTitle: string
  datasetName: string
  summary: string
  metric: string
  score: number
  selections: Record<string, string | number>
}

type ModuleLabBlueprint = {
  phase: 1 | 2 | 3 | 4
  title: string
  focus: string
  visual: string
  controls: string[]
  resultFocus: string[]
  interpretation: string
}

const SEARCH_SYNONYMS: Record<string, string> = {
  confidence_interval: 'ci estimate uncertainty margin error plausible range',
  one_sample_tests: 'one sample z test t test compare reference average mean proportion',
  two_sample_tests: 'compare averages compare groups ab test paired independent t test difference means',
  anova: 'compare averages many groups three groups f test post hoc',
  chi_square: 'association categorical contingency observed expected independence',
  non_parametric: 'median ranks mann whitney wilcoxon kruskal distribution free',
  correlation_testing: 'relationship association pearson spearman kendall',
  simple_regression: 'predict relationship fit line slope residual',
  multiple_regression: 'predict model coefficients predictors adjusted r2',
  logistic_regression: 'binary probability odds classification threshold',
  pca: 'dimension reduction loadings scree components',
  histogram: 'distribution shape bins frequency',
  box_plot: 'spread quartiles outliers grouped distribution',
  scatter_plot: 'relationship x y correlation trendline',
}

const FIELD_REQUIREMENTS: Record<InputFieldKey, 'numeric' | 'categorical' | 'numeric' | 'numeric' | 'numeric' | 'categorical' | 'numeric'> = {
  num1: 'numeric',
  num2: 'numeric',
  num3: 'numeric',
  target: 'numeric',
  cat1: 'categorical',
  cat2: 'categorical',
  alpha: 'numeric',
}

function moduleInputSpec(module: typeof STAT_MODULES[number]): ModuleInputSpec {
  const k = module.key
  if (['bar_chart', 'pie_donut', 'pareto_chart', 'treemap'].includes(k)) return { fields: ['cat1'], requirements: ['categorical'] }
  if (['heatmap', 'sankey', 'chi_square', 'fisher_exact'].includes(k)) return { fields: ['cat1', 'cat2', 'alpha'], requirements: ['categorical', 'grouped'] }
  if (['histogram', 'density_plot', 'qq_plot', 'ecdf_plot', 'control_chart', 'line_chart', 'area_chart', 'gof_distribution', 'shapiro_wilk', 'exact_binomial', 'bootstrap_ci', 'bayesian_basics', 'weighted_statistics'].includes(k)) return { fields: ['num1', 'alpha'], requirements: ['numeric'] }
  if (['box_plot', 'violin_plot', 'anova', 'effect_size', 'non_parametric', 'levene_brown_forsythe', 'ancova', 'tukey_hsd', 'multiple_testing_corrections', 'permutation_tests'].includes(k)) return { fields: ['num1', 'cat1', 'alpha'], requirements: ['numeric', 'categorical', 'grouped'] }
  if (['scatter_plot', 'correlation_testing', 'simple_regression', 'polynomial_regression', 'clustering', 'hierarchical_dendrogram', 'dbscan', 'correlation_matrix', 'pair_plot'].includes(k)) return { fields: ['num1', 'num2', 'alpha'], requirements: ['numeric', 'paired'] }
  if (['bubble_chart', 'multiple_regression', 'regression_diagnostics', 'robust_regression', 'ridge_lasso', 'stepwise_selection', 'train_test_cv', 'model_comparison', 'robust_pca'].includes(k)) return { fields: ['target', 'num1', 'num2', 'num3', 'alpha'], requirements: ['numeric', 'paired'] }
  if (['logistic_regression', 'classification_metrics', 'logistic_se_pvalues', 'roc_auc', 'classification_models'].includes(k)) return { fields: ['target', 'num1', 'num2', 'alpha'], requirements: ['numeric', 'binary'] }
  if (['time_series_basics', 'forecasting_basics', 'survival_analysis', 'arima_ets', 'seasonal_decomposition', 'durbin_watson'].includes(k)) return { fields: ['num1', 'num2', 'alpha'], requirements: ['numeric', 'time'] }
  if (['two_sample_tests', 'repeated_measures_anova', 'mcnemar'].includes(k)) return { fields: ['num1', 'num2', 'num3', 'alpha'], requirements: ['numeric', 'paired'] }
  if (['two_way_anova_interaction'].includes(k)) return { fields: ['num1', 'cat1', 'cat2', 'alpha'], requirements: ['numeric', 'categorical', 'grouped'] }
  if (['formula_columns', 'reshape_wide_long'].includes(k)) return { fields: ['num1', 'num2', 'num3'], requirements: ['numeric'] }
  if (['merge_join_append'].includes(k)) return { fields: ['cat1'], requirements: ['categorical'] }
  return { fields: ['num1', 'num2', 'cat1', 'alpha'], requirements: module.group === 'Advanced Workflows' ? ['numeric'] : ['numeric', 'categorical'] }
}

function moduleAwareDefaultSelection(dataset: Dataset | null, dataRows: Record<string, unknown>[], selection: StatModuleSelection, module: typeof STAT_MODULES[number], spec: ModuleInputSpec, roleProfiles: ColumnRoleProfile[] = []): Required<StatModuleSelection> {
  const base = defaultSelection(dataRows, selection)
  if (!dataset) return base
  const schema = dataset.schema
  const numeric = schema.filter((col) => col.type === 'numeric')
  const categorical = schema.filter((col) => col.type !== 'numeric')
  const binaryNumeric = numeric.filter((col) => col.unique <= 2)
  const timeLike = schema.filter((col) => col.type === 'date' || /date|time|day|month|year|week|hour|season|period|order|sequence|index/i.test(col.name))
  const used = new Set<string>()
  const explicit = (field: InputFieldKey, pool: Dataset['schema']) => {
    const value = String(selection[field] ?? '')
    const found = pool.find((col) => col.name === value)
    if (found) {
      used.add(found.name)
      return found.name
    }
    return ''
  }
  const choose = (field: InputFieldKey, pool: Dataset['schema'], role: 'target' | 'predictor' | 'group' | 'time' | 'weight' | 'binary' = 'predictor') => {
    const manual = explicit(field, pool)
    if (manual) return manual
    const ranked = [...pool]
      .filter((col) => !used.has(col.name))
      .sort((a, b) => columnRoleScore(b, role, module, dataset.rows, roleProfiles) - columnRoleScore(a, role, module, dataset.rows, roleProfiles))
    const picked = ranked[0] ?? pool[0]
    if (picked) used.add(picked.name)
    return picked?.name ?? ''
  }
  const wantsBinary = spec.requirements.includes('binary') || /logistic|classification|roc|binary|churn|approval|readmission/i.test(`${module.key} ${module.title}`)
  const wantsTime = spec.requirements.includes('time')
  const wantsWeight = /weighted|survey weight/i.test(`${module.key} ${module.title}`)
  const targetPool = wantsBinary && binaryNumeric.length ? binaryNumeric : numeric
  const num1Role = wantsTime ? 'time' : wantsWeight ? 'weight' : 'predictor'

  const next: Required<StatModuleSelection> = {
    num1: spec.fields.includes('num1') ? choose('num1', wantsTime && timeLike.length ? timeLike : numeric, num1Role) : base.num1,
    num2: spec.fields.includes('num2') ? choose('num2', numeric, wantsBinary ? 'binary' : 'predictor') : base.num2,
    num3: spec.fields.includes('num3') ? choose('num3', numeric, 'predictor') : base.num3,
    target: spec.fields.includes('target') ? choose('target', targetPool, wantsBinary ? 'binary' : 'target') : base.target,
    cat1: spec.fields.includes('cat1') ? choose('cat1', categorical.length ? categorical : schema, 'group') : base.cat1,
    cat2: spec.fields.includes('cat2') ? choose('cat2', categorical.length ? categorical : schema, 'group') : base.cat2,
    alpha: selection.alpha ?? base.alpha,
  }

  if (next.num2 === next.num1 && numeric.length > 1) next.num2 = choose('num2', numeric, 'predictor') || base.num2
  if (next.target === next.num1 && numeric.length > 1) next.target = choose('target', targetPool, wantsBinary ? 'binary' : 'target') || base.target
  return next
}

function columnRoleScore(col: Dataset['schema'][number], role: 'target' | 'predictor' | 'group' | 'time' | 'weight' | 'binary', module: typeof STAT_MODULES[number], rows: number, roleProfiles: ColumnRoleProfile[] = []) {
  const name = col.name.toLowerCase()
  let score = 100
  const profile = roleProfiles.find((item) => item.name === col.name)
  const idLike = col.type === 'id' || /(^id$|_id$|id$|uuid|code|serial)/i.test(col.name) || col.unique / Math.max(rows, 1) > 0.96
  if (idLike) score -= 55
  if (profile) {
    score += (profile.roles[role] ?? 0) * 0.6
    if (profile.primaryRole === role) score += 28
    if (profile.primaryRole === 'id' && role !== 'group') score -= 45
    if (profile.primaryRole === 'text' && role !== 'group') score -= 25
  }
  score -= Math.min(25, col.missingPct)
  if (role === 'target') {
    if (/target|outcome|response|result|score|total|revenue|sales|price|value|rating|yield|temperature|readmission|approval|churn|fraud|conversion/i.test(name)) score += 45
    if (/predictor|feature|input|id|index/i.test(name)) score -= 20
  }
  if (role === 'predictor') {
    if (/hours|age|income|price|units|attendance|temperature|rain|humidity|speed|weight|height|distance|duration|experience|spend|discount|credit|rating|day|month|year/i.test(name)) score += 30
    if (/target|outcome|response|result|churn|approval|readmission|fraud/i.test(name)) score -= 18
  }
  if (role === 'group') {
    if (/group|category|class|type|segment|region|gender|species|treatment|section|channel|grade|status|team|department|operator|machine/i.test(name)) score += 45
    if (col.unique > Math.max(25, Math.sqrt(rows))) score -= 30
    if (col.unique <= 1) score -= 50
  }
  if (role === 'time') {
    if (col.type === 'date') score += 55
    if (/date|time|day|month|year|week|hour|season|period|order|sequence|index/i.test(name)) score += 50
  }
  if (role === 'weight') {
    if (/weight|wt|survey|population|count|frequency/i.test(name)) score += 55
    if (col.type !== 'numeric') score -= 30
  }
  if (role === 'binary') {
    if (col.unique <= 2) score += 55
    if (/churn|approval|approved|readmission|fraud|converted|conversion|success|target|label|class|binary/i.test(name)) score += 40
    if (col.unique > 5) score -= 45
  }
  if (/simple_regression|scatter|correlation/i.test(module.key) && /day|month|year|time|date/i.test(name)) score += 12
  return score
}

function moduleWorkbenchTitle(module: typeof STAT_MODULES[number]) {
  const blueprint = MODULE_LAB_BLUEPRINTS[module.key]
  if (blueprint) return blueprint.title
  const titles: Record<string, string> = {
    histogram: 'Histogram Shape Explorer',
    box_plot: 'Boxplot Spread Lab',
    scatter_plot: 'Scatter Relationship Lab',
    simple_regression: 'Regression Fit Lab',
    multiple_regression: 'Coefficient & Residual Lab',
    logistic_regression: 'Probability Threshold Lab',
    anova: 'ANOVA Group Means Lab',
    chi_square: 'Observed vs Expected Lab',
    pca: 'PCA Scree & Loading Lab',
    classification_metrics: 'Classification Threshold Lab',
    correlation_testing: 'Correlation Evidence Lab',
    confidence_interval: 'Interval Precision Lab',
  }
  return titles[module.key] ?? `${module.title.replace(' Module', '')} Lab`
}

const MODULE_LAB_BLUEPRINTS: Record<string, ModuleLabBlueprint> = {
  confidence_interval: { phase: 1, title: 'Interval Precision Lab', focus: 'Estimate uncertainty around a mean, proportion, variance, or difference.', visual: 'Interval strips with center, width, and zero-crossing cues.', controls: ['Alpha slider', 'Estimator focus', 'Width comparison'], resultFocus: ['Interval bounds', 'Margin of error', 'Crosses zero'], interpretation: 'Read the interval as plausible population values, then judge whether its width is practically useful.' },
  one_sample_tests: { phase: 1, title: 'One-Sample Decision Lab', focus: 'Compare one sample against a fixed reference value.', visual: 'Reference line, sample center, and p-value decision meter.', controls: ['Reference value', 'Alpha slider', 'Test family cards'], resultFocus: ['z/t p-value', 'Observed mean', 'Decision'], interpretation: 'The question is whether the sample is surprisingly far from the reference under random sampling.' },
  two_sample_tests: { phase: 1, title: 'Two-Sample Difference Lab', focus: 'Compare two samples or paired measurements.', visual: 'Difference direction, group overlap, and paired/independent evidence.', controls: ['Paired vs independent view', 'Alpha slider', 'Effect direction'], resultFocus: ['Welch p', 'Paired p', 'Mean difference'], interpretation: 'Choose the design first; paired and independent tests answer different questions.' },
  anova: { phase: 1, title: 'ANOVA Group Means Lab', focus: 'Check whether three or more groups differ in their means.', visual: 'Group balance, means, and between-vs-within variation.', controls: ['Group selector', 'Alpha slider', 'Post-hoc preview'], resultFocus: ['F statistic', 'p-value', 'Eta squared'], interpretation: 'A significant ANOVA says at least one group differs; use post-hoc comparisons to locate where.' },
  chi_square: { phase: 1, title: 'Observed vs Expected Lab', focus: 'Test whether categorical counts differ from expected patterns.', visual: 'Cell/node preview, observed-vs-expected contribution, sparse-cell warning.', controls: ['Category pair', 'Top cells', 'Alpha slider'], resultFocus: ['Chi-square', 'df', 'p-value'], interpretation: 'Large gaps between observed and expected cells drive the test.' },
  non_parametric: { phase: 1, title: 'Rank-Based Evidence Lab', focus: 'Compare groups when rank methods are safer than mean-based tests.', visual: 'Rank strip, median focus, and non-parametric decision meter.', controls: ['Design chooser', 'Alpha slider', 'Rank summary'], resultFocus: ['Mann-Whitney', 'Wilcoxon', 'Kruskal-Wallis'], interpretation: 'Rank tests compare ordering and location without leaning as hard on normality.' },
  correlation_testing: { phase: 1, title: 'Correlation Evidence Lab', focus: 'Measure how strongly two numeric variables move together.', visual: 'Scatter with trendline and strength gauge.', controls: ['Pearson/Spearman/Kendall focus', 'Residual stems', 'Outlier toggle'], resultFocus: ['Pearson r', 'Spearman rho', 'p-value'], interpretation: 'Correlation is association, not causation; inspect the scatter before trusting the number.' },
  power_sample_size: { phase: 1, title: 'Power Planning Lab', focus: 'Estimate how sample size, alpha, power, and effect size trade off.', visual: 'Power curve and sample-size target cards.', controls: ['Alpha slider', 'Effect-size scenario', 'Target power'], resultFocus: ['Estimated n', 'Power', 'Detectable effect'], interpretation: 'Power planning is strongest before data collection, because it turns practical effect size into sample size.' },
  effect_size: { phase: 1, title: 'Practical Effect Lab', focus: 'Translate statistical differences into practical magnitude.', visual: 'Magnitude gauge, overlap card, and risk/odds comparison.', controls: ['Effect family', 'Group selector', 'Magnitude guide'], resultFocus: ['Cohen d', 'Eta squared', 'Odds/risk ratio'], interpretation: 'Statistical evidence and practical importance are separate; effect size answers the practical size question.' },
  gof_distribution: { phase: 1, title: 'Distribution Fit Lab', focus: 'Compare observed numeric data to theoretical distribution shapes.', visual: 'Histogram overlay, fit leaderboard, and shape/support warnings.', controls: ['Bins', 'Density overlay', 'Fit focus'], resultFocus: ['Best fit', 'Statistic', 'Support warning'], interpretation: 'The best rank is only useful if the distribution support and shape make sense for the variable.' },
  simple_regression: { phase: 1, title: 'Regression Fit Lab', focus: 'Fit and interpret one straight-line relationship.', visual: 'Scatter, fitted line, residual stems, and slope card.', controls: ['Residual toggle', 'Outlier toggle', 'Alpha slider'], resultFocus: ['Slope', 'R2', 'p-value'], interpretation: 'Slope is expected change in Y for one unit of X; residuals show where the line fails.' },
  multiple_regression: { phase: 1, title: 'Coefficient & Residual Lab', focus: 'Model one target using multiple numeric predictors.', visual: 'Coefficient focus, metric bars, and residual diagnostics.', controls: ['Predictor set', 'Residual toggle', 'Alpha slider'], resultFocus: ['Coefficients', 'Adjusted R2', 'p-values'], interpretation: 'Each coefficient is conditional on the other predictors, so read it as an adjusted association.' },
  logistic_regression: { phase: 1, title: 'Probability Threshold Lab', focus: 'Model a binary target and explore classification thresholds.', visual: 'Threshold confusion matrix and odds-ratio cards.', controls: ['Threshold slider', 'Predictor selector', 'Alpha slider'], resultFocus: ['Odds ratios', 'Accuracy', 'Threshold'], interpretation: 'Use probability and odds language; threshold choice changes classification behavior.' },
  polynomial_regression: { phase: 1, title: 'Curved Fit Lab', focus: 'Check whether a curved relationship improves fit.', visual: 'Straight vs curved fit preview with residual comparison.', controls: ['Degree focus', 'Residual toggle', 'Overfit warning'], resultFocus: ['Degree', 'R2/Adj R2', 'Residual pattern'], interpretation: 'More curve can improve fit but may overfit; residuals decide whether the shape is useful.' },
  regression_diagnostics: { phase: 1, title: 'Regression Trust Lab', focus: 'Diagnose whether a regression model is reliable.', visual: 'Residual, leverage, Cook distance, and VIF diagnostic cards.', controls: ['Residual toggle', 'Outlier toggle', 'Diagnostic focus'], resultFocus: ['Cook distance', 'VIF', 'Residual spread'], interpretation: 'Diagnostics explain when the fitted equation should be trusted, revised, or reported with caution.' },
  time_series_basics: { phase: 1, title: 'Time-Series Pattern Lab', focus: 'Inspect trend and lag structure over row order.', visual: 'Sequence chart with moving average and lag signal.', controls: ['Window slider', 'Trend focus', 'Lag view'], resultFocus: ['Moving average', 'Lag-1 correlation', 'Trend'], interpretation: 'Row order is part of the data; smoothing reveals pattern but can hide sudden changes.' },
  forecasting_basics: { phase: 1, title: 'Forecast Baseline Lab', focus: 'Compare simple forecast baselines for a sequence.', visual: 'Observed series with naive, moving average, and smoothing overlays.', controls: ['Window slider', 'Smoothing scenario', 'Forecast horizon'], resultFocus: ['MAE', 'Baseline comparison', 'Forecast direction'], interpretation: 'Simple baselines are sanity checks; beat them before trusting a more complex forecast.' },
  clustering: { phase: 1, title: 'Cluster Map Lab', focus: 'Explore natural groups in two numeric dimensions.', visual: 'Centered scatter, centroid cards, and cluster separation cues.', controls: ['K focus', 'Scale warning', 'Outlier view'], resultFocus: ['Cluster count', 'Centroids', 'Within spread'], interpretation: 'Clusters are proximity summaries; they need domain meaning before becoming segments.' },
  pca: { phase: 1, title: 'PCA Scree & Loading Lab', focus: 'Reduce numeric variables into component directions.', visual: 'Explained variance cards, loading signs, and score-screen preview.', controls: ['Variable pair', 'Variance focus', 'Loading guide'], resultFocus: ['PC1 explained', 'PC2 remainder', 'Loadings'], interpretation: 'Components are weighted combinations; read both explained variance and loading direction.' },
  classification_metrics: { phase: 1, title: 'Classification Threshold Lab', focus: 'Understand how threshold changes classification performance.', visual: 'Confusion matrix, decision meter, and metric cards.', controls: ['Threshold slider', 'Score/target selector', 'Metric focus'], resultFocus: ['Accuracy', 'Precision', 'Recall/F1'], interpretation: 'Precision and recall trade off; choose the metric that matches the cost of errors.' },
  histogram: { phase: 2, title: 'Histogram Shape Explorer', focus: 'Understand the distribution shape of one numeric variable.', visual: 'Histogram bars with bin control, density line, and skew cue.', controls: ['Bins', 'Density overlay', 'Outlier scan'], resultFocus: ['Shape', 'Center', 'Spread'], interpretation: 'Start with shape, then check whether bin choices change the story.' },
  bar_chart: { phase: 2, title: 'Category Bar Lab', focus: 'Compare category frequencies in a readable order.', visual: 'Sorted bars, count/percent framing, and top-N filtering.', controls: ['Top N', 'Sort by count', 'Count focus'], resultFocus: ['Largest category', 'Category count', 'Long tail'], interpretation: 'A good bar chart makes the biggest categories and the long tail easy to scan.' },
  line_chart: { phase: 2, title: 'Sequence Line Lab', focus: 'Track numeric movement over row order.', visual: 'Line chart with moving average and point density.', controls: ['Window', 'Smoothing', 'Trend cue'], resultFocus: ['Trend', 'Spikes', 'Runs'], interpretation: 'Use smoothing to reveal direction, but inspect raw movement for sudden changes.' },
  area_chart: { phase: 2, title: 'Area Trend Lab', focus: 'Show magnitude over sequence order with filled context.', visual: 'Filled sequence with moving average and baseline.', controls: ['Window', 'Baseline', 'Cumulative cue'], resultFocus: ['Total area', 'Trend', 'Peaks'], interpretation: 'Area emphasizes accumulated magnitude, so make sure the baseline is meaningful.' },
  scatter_plot: { phase: 2, title: 'Scatter Relationship Lab', focus: 'Inspect relationship, trend, residuals, and unusual points.', visual: 'Scatter with regression line, residual stems, and outlier markers.', controls: ['Residuals', 'Outliers', 'Trendline'], resultFocus: ['Correlation', 'Direction', 'Outliers'], interpretation: 'The pattern and outliers matter as much as the correlation number.' },
  bubble_chart: { phase: 2, title: 'Bubble Relationship Lab', focus: 'Compare two numeric axes while a third numeric field controls size.', visual: 'Bubble scatter with size legend and scale cue.', controls: ['Bubble scale', 'Outliers', 'Trendline'], resultFocus: ['X/Y relation', 'Size influence', 'Large bubbles'], interpretation: 'Check whether large bubbles dominate the visual story.' },
  box_plot: { phase: 2, title: 'Boxplot Spread Lab', focus: 'Compare spread, quartiles, and outliers across groups.', visual: 'IQR box, fences, outlier markers, and group balance panel.', controls: ['Outliers', 'Group selector', 'Quartile focus'], resultFocus: ['Median', 'IQR', 'Outliers'], interpretation: 'Boxplots are compact; read median, IQR, and outliers before comparing groups.' },
  violin_plot: { phase: 2, title: 'Violin Distribution Lab', focus: 'Compare full distribution shape across groups.', visual: 'Density shape with box overlay and group balance.', controls: ['Density', 'Outliers', 'Group sort'], resultFocus: ['Shape', 'Spread', 'Group balance'], interpretation: 'Violin plots show shape; wide areas mean more observations around that value.' },
  density_plot: { phase: 2, title: 'Density Smoothness Lab', focus: 'View a smoothed distribution and compare it to histogram bins.', visual: 'Histogram plus density overlay and tail callouts.', controls: ['Bins', 'Density', 'Tail focus'], resultFocus: ['Modes', 'Tails', 'Skew'], interpretation: 'Density is a smoothed estimate, so confirm it against the raw histogram.' },
  heatmap: { phase: 2, title: 'Heatmap Cell Inspector', focus: 'Find concentrated category combinations.', visual: 'Two-category matrix with count intensity and cell labels.', controls: ['Top N', 'Cell labels', 'Count focus'], resultFocus: ['Hot cells', 'Sparse cells', 'Row/column balance'], interpretation: 'Interpret the darkest cells with the row and column totals in mind.' },
  correlation_matrix: { phase: 2, title: 'Correlation Matrix Lab', focus: 'Compare pairwise relationships across selected numeric variables.', visual: 'Mini correlation grid with signed strength colors.', controls: ['Variable subset', 'Threshold cue', 'Strength legend'], resultFocus: ['Strongest pair', 'Direction', 'Weak pairs'], interpretation: 'Use the matrix to choose relationships worth inspecting in scatter plots.' },
  pair_plot: { phase: 2, title: 'Pair Plot Matrix Lab', focus: 'Scan several numeric relationships at once.', visual: 'Pairwise scatter panels plus distribution diagonal.', controls: ['Opacity', 'Matrix focus', 'Diagonal histograms'], resultFocus: ['Strong pairs', 'Curved pairs', 'Outliers'], interpretation: 'Pair plots are for screening; open the strongest pair for detailed modeling.' },
  qq_plot: { phase: 2, title: 'Q-Q Normality Lab', focus: 'Check whether numeric data follows a normal reference shape.', visual: 'Q-Q scatter with reference-line interpretation.', controls: ['Reference line', 'Tail cue', 'Deviation focus'], resultFocus: ['Tail deviation', 'Middle fit', 'Normality signal'], interpretation: 'Normal data roughly follows the line; tail bends are often the first warning.' },
  ecdf_plot: { phase: 2, title: 'ECDF Percentile Lab', focus: 'Read cumulative percent at thresholds.', visual: 'Step-like cumulative curve with percentile markers.', controls: ['Threshold marker', 'Percentile focus', 'Group overlay'], resultFocus: ['Median', 'Quartiles', 'Threshold share'], interpretation: 'ECDF answers “what share is at or below this value?” directly.' },
  pareto_chart: { phase: 2, title: 'Pareto Concentration Lab', focus: 'Find the few categories that explain most rows.', visual: 'Sorted bars with cumulative share and 80/20 marker.', controls: ['Top N', 'Cumulative share', 'Long-tail grouping'], resultFocus: ['Vital few', '80% point', 'Long tail'], interpretation: 'Pareto charts help prioritize categories where concentration is high.' },
  control_chart: { phase: 2, title: 'Process Stability Lab', focus: 'Check whether an ordered process is stable.', visual: 'Sequence with centerline and control-limit bands.', controls: ['Window', 'Limit markers', 'Rule scan'], resultFocus: ['Centerline', 'UCL/LCL', 'Rule breaks'], interpretation: 'Points outside limits or long runs suggest special-cause variation.' },
  pie_donut: { phase: 2, title: 'Share Composition Lab', focus: 'Show category share as parts of a whole.', visual: 'Donut wedges with small-slice and largest-share cards.', controls: ['Top N', 'Small slices', 'Percent labels'], resultFocus: ['Largest share', 'Small slices', 'Total categories'], interpretation: 'Use shares only when parts clearly add to one meaningful whole.' },
  treemap: { phase: 2, title: 'Treemap Proportion Lab', focus: 'Pack category sizes into a space-efficient comparison.', visual: 'Treemap rectangles sized by count with label density.', controls: ['Top N', 'Color groups', 'Label density'], resultFocus: ['Largest blocks', 'Tiny blocks', 'Category count'], interpretation: 'Treemaps are best for seeing dominance, not precise comparisons.' },
  sankey: { phase: 2, title: 'Sankey Flow Lab', focus: 'Show how rows move between two categorical states.', visual: 'Source-to-target flow cards and thick-link preview.', controls: ['Top N', 'Minimum flow', 'Source/target'], resultFocus: ['Largest flow', 'Node count', 'Dropped small flows'], interpretation: 'Read Sankey width as volume; keep categories limited so the flow remains legible.' },
  dashboard_builder: { phase: 2, title: 'Starter Dashboard Lab', focus: 'Arrange useful chart and KPI blocks for the selected dataset.', visual: 'Dashboard grid preview with KPI, chart, table, and filter panels.', controls: ['Panel presets', 'Layout preview', 'Export focus'], resultFocus: ['Panels', 'Rows documented', 'Chart readiness'], interpretation: 'A dashboard should answer a small set of recurring questions quickly.' },
  two_way_anova_interaction: { phase: 3, title: 'Two-Factor Interaction Lab', focus: 'Separate two main effects from their interaction.', visual: 'Cell means grid with interaction and balance warnings.', controls: ['Factor A', 'Factor B', 'Alpha slider'], resultFocus: ['Factor A p', 'Factor B p', 'Interaction p'], interpretation: 'Interaction asks whether one factor changes the effect of the other factor.' },
  repeated_measures_anova: { phase: 3, title: 'Repeated Measures Lab', focus: 'Compare repeated numeric conditions within the same row.', visual: 'Subject trajectory lines and condition mean cards.', controls: ['Condition columns', 'Within-row contrast', 'Alpha slider'], resultFocus: ['F', 'p-value', 'Subjects'], interpretation: 'Repeated measures depend on within-subject changes, not independent group differences.' },
  ancova: { phase: 3, title: 'Adjusted Means Lab', focus: 'Compare groups after accounting for a numeric covariate.', visual: 'Covariate scatter with adjusted coefficient cards.', controls: ['Covariate', 'Group factor', 'Adjustment view'], resultFocus: ['Adjusted R2', 'Covariate p', 'Group estimates'], interpretation: 'ANCOVA asks whether groups differ after removing covariate influence.' },
  manova: { phase: 3, title: 'Multi-Outcome Screen Lab', focus: 'Screen multiple outcomes for group differences.', visual: 'Outcome effect cards and mini outcome panels.', controls: ['Outcome set', 'Group factor', 'Screening caveat'], resultFocus: ['Average eta2', 'Outcome p-values', 'Outcomes'], interpretation: 'This is a screening view; formal MANOVA needs multivariate assumptions.' },
  tukey_hsd: { phase: 3, title: 'Post-Hoc Pair Map Lab', focus: 'Locate which group pairs differ after ANOVA.', visual: 'Pairwise comparison ladder with p-value emphasis.', controls: ['Pair focus', 'Alpha guide', 'Sort by p'], resultFocus: ['Comparisons', 'q values', 'p approx'], interpretation: 'Post-hoc tests answer where differences are after ANOVA says some difference exists.' },
  multiple_testing_corrections: { phase: 3, title: 'Correction Ladder Lab', focus: 'See which p-values survive multiple-testing correction.', visual: 'Raw vs adjusted p-value ladder and threshold marker.', controls: ['Correction method', 'Alpha marker', 'Sort by raw p'], resultFocus: ['Tests', 'Adjusted p', 'Retained signals'], interpretation: 'Corrections reduce false positives when many comparisons are made.' },
  fisher_exact: { phase: 3, title: 'Exact 2x2 Table Lab', focus: 'Test association in small 2x2 categorical tables.', visual: '2x2 count table with odds-ratio card.', controls: ['Two categories', 'Exact p', 'Odds ratio'], resultFocus: ['p-value', 'Odds ratio', 'Cell counts'], interpretation: 'Fisher exact is useful when chi-square cell counts are too sparse.' },
  mcnemar: { phase: 3, title: 'Paired Binary Change Lab', focus: 'Test directional change in paired binary outcomes.', visual: 'Before/after discordant-pair matrix.', controls: ['Before column', 'After column', 'Discordant focus'], resultFocus: ['Discordant pairs', 'Chi-square', 'p-value'], interpretation: 'Only discordant pairs drive McNemar because unchanged pairs do not show direction.' },
  exact_binomial: { phase: 3, title: 'Exact Binomial Tail Lab', focus: 'Test binary success count against a reference probability.', visual: 'Success/failure cards with tail-shading histogram.', controls: ['Success coding', 'Reference p', 'Tail view'], resultFocus: ['Successes', 'n', 'p-value'], interpretation: 'The exact test asks whether this many successes is unusual under the reference probability.' },
  shapiro_wilk: { phase: 3, title: 'Normality Screen Lab', focus: 'Check whether one numeric variable is plausibly normal.', visual: 'Histogram/density screen plus Q-Q style cue.', controls: ['Bins', 'Density', 'Tail cue'], resultFocus: ['W', 'p approx', 'n'], interpretation: 'Normality screens are sensitive; inspect the shape, not only the p-value.' },
  levene_brown_forsythe: { phase: 3, title: 'Equal Variance Lab', focus: 'Compare spread consistency across groups.', visual: 'Group spread bars and variance-test cards.', controls: ['Group factor', 'Center method', 'Alpha marker'], resultFocus: ['Levene p', 'Brown-Forsythe p', 'Group balance'], interpretation: 'Unequal variance affects which group comparison methods are reliable.' },
  durbin_watson: { phase: 3, title: 'Residual Autocorrelation Lab', focus: 'Check if regression residuals are correlated over sequence order.', visual: 'Residual sequence and DW scale.', controls: ['Predictor', 'Outcome', 'Lag focus'], resultFocus: ['DW', 'R2', 'Autocorrelation risk'], interpretation: 'DW near 2 suggests little first-order autocorrelation; low values suggest persistence.' },
  breusch_pagan: { phase: 3, title: 'Variance Pattern Lab', focus: 'Check whether residual variance changes with predictors.', visual: 'Residual-spread diagnostic and LM decision meter.', controls: ['Predictors', 'Target', 'Variance trend'], resultFocus: ['LM', 'df', 'p-value'], interpretation: 'Heteroscedasticity means uncertainty may be uneven across fitted values.' },
  robust_regression: { phase: 3, title: 'Outlier-Resistant Fit Lab', focus: 'Compare fitted relationships after downweighting outliers.', visual: 'OLS-style scatter plus downweighted-row and coefficient cards.', controls: ['Outlier view', 'Weight focus', 'Predictor set'], resultFocus: ['Downweighted rows', 'Robust estimates', 'Influence'], interpretation: 'Robust regression reduces outlier pull instead of deleting observations.' },
  ridge_lasso: { phase: 3, title: 'Coefficient Shrinkage Lab', focus: 'Show how regularization stabilizes coefficients.', visual: 'Ridge vs lasso coefficient bars.', controls: ['Penalty view', 'Predictor set', 'Shrinkage focus'], resultFocus: ['Lambda', 'Ridge coefficients', 'Lasso approx'], interpretation: 'Regularization trades a little bias for more stable predictions.' },
  stepwise_selection: { phase: 3, title: 'Stepwise Selection Lab', focus: 'Build a model by adding predictors that improve adjusted R2.', visual: 'Forward-selection timeline and candidate cards.', controls: ['Candidate predictors', 'Adjusted R2', 'Stop rule'], resultFocus: ['Selected predictors', 'Best adj R2', 'Steps'], interpretation: 'Stepwise selection is exploratory; validate the selected model before reporting.' },
  logistic_se_pvalues: { phase: 3, title: 'Logistic Wald Evidence Lab', focus: 'Inspect logistic coefficients, standard errors, and odds ratios.', visual: 'Odds-ratio table, threshold matrix, and Wald cards.', controls: ['Threshold', 'Predictors', 'Odds view'], resultFocus: ['Accuracy', 'SE', 'Wald p'], interpretation: 'Odds ratios need uncertainty; large estimates with large SE can still be unstable.' },
  roc_auc: { phase: 3, title: 'ROC Ranking Lab', focus: 'Assess threshold-free binary classification ranking.', visual: 'Threshold mini matrix and AUC score card.', controls: ['Threshold', 'Score', 'Target'], resultFocus: ['AUC', 'TPR/FPR', 'Threshold'], interpretation: 'AUC reads ranking quality, while threshold metrics read one chosen operating point.' },
  train_test_cv: { phase: 3, title: 'Validation Split Lab', focus: 'Check how model performance changes outside training rows.', visual: 'Train/test split bar and RMSE cards.', controls: ['Split view', 'Fold concept', 'Error focus'], resultFocus: ['Train n', 'Test n', 'Test RMSE'], interpretation: 'Validation estimates future performance better than training fit alone.' },
  missing_imputation: { phase: 3, title: 'Imputation Preview Lab', focus: 'Preview replacement values and missingness impact.', visual: 'Missingness meter and mean/median replacement cards.', controls: ['Method choice', 'Before/after', 'Missing scan'], resultFocus: ['Missing count', 'Mean impute', 'Median impute'], interpretation: 'Imputation is a modeling choice; record the method and inspect missingness pattern.' },
  transformation_history: { phase: 3, title: 'Audit Trail Lab', focus: 'Record reproducible choices for selected columns and settings.', visual: 'Analysis timeline with settings summary.', controls: ['Selected columns', 'Alpha', 'Export audit'], resultFocus: ['Rows', 'Columns tracked', 'Action'], interpretation: 'An audit trail turns a click workflow into a reproducible analysis record.' },
  undo_redo_cleaning: { phase: 3, title: 'Cleaning Command Stack Lab', focus: 'Preview reversible data-cleaning operations.', visual: 'Undo/redo stack with operation recovery notes.', controls: ['Undo preview', 'Redo preview', 'Operation list'], resultFocus: ['Undo ready', 'Redo ready', 'Operations'], interpretation: 'Reversible cleaning makes exploration safer because every change has a recovery path.' },
  formula_columns: { phase: 3, title: 'Computed Column Formula Lab', focus: 'Preview a numeric computed column from selected fields.', visual: 'Formula expression, row preview, and computed distribution.', controls: ['Formula preview', 'Row sample', 'Validation'], resultFocus: ['Computed n', 'Computed mean', 'Preview rows'], interpretation: 'Computed columns should preserve units and be easy to explain later.' },
  merge_join_append: { phase: 3, title: 'Join Readiness Lab', focus: 'Assess whether a categorical key is suitable for merge/append workflows.', visual: 'Key uniqueness meter and join diagram.', controls: ['Key field', 'Uniqueness', 'Append estimate'], resultFocus: ['Unique keys', 'Append rows', 'Compatibility'], interpretation: 'Good joins depend on clear keys; duplicate keys can multiply rows unexpectedly.' },
  reshape_wide_long: { phase: 3, title: 'Reshape Preview Lab', focus: 'Preview wide-to-long transformation for selected measures.', visual: 'Before/after row expansion and measure list.', controls: ['Measure columns', 'Long preview', 'Row estimate'], resultFocus: ['Preview rows', 'Variables', 'Values'], interpretation: 'Reshaping changes structure, not values; verify identifiers and measure names.' },
  report_builder: { phase: 4, title: 'Report Assembly Lab', focus: 'Assemble analysis outputs into report sections.', visual: 'Section outline with readiness cards.', controls: ['Section order', 'Result blocks', 'Export readiness'], resultFocus: ['Sections', 'Rows documented', 'Missing parts'], interpretation: 'A report should connect dataset, method, result, chart, and plain-language conclusion.' },
  export_pdf_html_docx: { phase: 4, title: 'Export Package Lab', focus: 'Check which report formats are ready.', visual: 'Format readiness cards for HTML, PDF, and Word-compatible export.', controls: ['Format tabs', 'Print preview', 'Asset check'], resultFocus: ['HTML', 'PDF', 'Word-compatible'], interpretation: 'Exports are only useful when tables, charts, and interpretation are bundled coherently.' },
  script_export: { phase: 4, title: 'Script Recipe Lab', focus: 'Turn the current analysis into reproducible script steps.', visual: 'Code-style recipe with copy-ready lines.', controls: ['Language', 'Selected columns', 'Alpha'], resultFocus: ['Language', 'Recipe lines', 'Dependencies'], interpretation: 'A reproducible script should show load, select, run, and export steps.' },
  saved_sessions: { phase: 4, title: 'Session Restore Lab', focus: 'Define the saved state needed to reopen analysis later.', visual: 'Session schema cards with restore checklist.', controls: ['State fields', 'Restore preview', 'Timestamp'], resultFocus: ['Session fields', 'Dataset id', 'Selection'], interpretation: 'A saved session must preserve enough state to rebuild the same screen and result.' },
  project_notebook: { phase: 4, title: 'Notebook Timeline Lab', focus: 'Record analysis history as notebook entries.', visual: 'Notebook timeline with timestamp and note preview.', controls: ['Entry type', 'Notes', 'Replay action'], resultFocus: ['Entry type', 'Timestamp', 'Note'], interpretation: 'Notebook entries make exploratory work auditable and easier to explain.' },
  chart_editor: { phase: 4, title: 'Chart Editing Lab', focus: 'Tune titles, axes, legends, and palette metadata.', visual: 'Chart metadata editor preview.', controls: ['Title', 'Axes', 'Palette'], resultFocus: ['Title', 'Palette', 'Selected variables'], interpretation: 'Chart edits should clarify the statistical story without changing the evidence.' },
  dashboard_layout_builder: { phase: 4, title: 'Dashboard Layout Lab', focus: 'Arrange KPI, chart, table, and note panels.', visual: 'Grid layout preview with panel coordinates.', controls: ['Panel presets', 'Resize', 'Layout save'], resultFocus: ['Panels', 'Grid', 'Coordinates'], interpretation: 'A dashboard layout should keep repeated decisions visible and scannable.' },
  chart_templates: { phase: 4, title: 'Chart Template Gallery Lab', focus: 'Choose reusable chart presets for common analysis stories.', visual: 'Template cards with compatible-use labels.', controls: ['Template gallery', 'Preview', 'Apply preset'], resultFocus: ['Templates', 'Preset names', 'Compatibility'], interpretation: 'Templates speed up common workflows but should still match variable types.' },
  weighted_statistics: { phase: 4, title: 'Weighted Estimate Lab', focus: 'Compare weighted estimates and weight influence.', visual: 'Weight distribution and weighted result cards.', controls: ['Value column', 'Weight column', 'Influence scan'], resultFocus: ['Weighted mean', 'Weighted variance', 'Total weight'], interpretation: 'Extreme weights can dominate weighted statistics, so inspect the weight column.' },
  bootstrap_ci: { phase: 4, title: 'Bootstrap Distribution Lab', focus: 'Use resampling to estimate uncertainty.', visual: 'Bootstrap interval strip and observed mean card.', controls: ['Iterations', 'CI markers', 'Distribution view'], resultFocus: ['Mean', '2.5%', '97.5%'], interpretation: 'Bootstrap intervals describe resampling uncertainty from the observed data.' },
  permutation_tests: { phase: 4, title: 'Permutation Null Lab', focus: 'Compare observed group difference against shuffled-label results.', visual: 'Null distribution concept with observed p-value marker.', controls: ['Iterations', 'Observed marker', 'Group labels'], resultFocus: ['p-value', 'Iterations', 'Observed difference'], interpretation: 'Permutation tests ask how unusual the observed statistic is if labels were exchangeable.' },
  bayesian_basics: { phase: 4, title: 'Bayesian Update Lab', focus: 'Update a beta prior with binary successes and failures.', visual: 'Prior/posterior cards and posterior mean gauge.', controls: ['Prior strength', 'Success coding', 'Credible interval'], resultFocus: ['Posterior alpha', 'Posterior beta', 'Posterior mean'], interpretation: 'Bayesian updating combines prior assumptions with observed successes and failures.' },
  survival_analysis: { phase: 4, title: 'Survival Curve Lab', focus: 'Track survival probability over event time.', visual: 'Kaplan-Meier sequence and event summary cards.', controls: ['Time column', 'Event indicator', 'Risk table'], resultFocus: ['Events', 'Last survival', 'Time steps'], interpretation: 'Survival curves step down when events happen and stay flat during censored periods.' },
  arima_ets: { phase: 4, title: 'Time-Series Forecast Structure Lab', focus: 'Inspect AR(1) persistence and smoothing baseline.', visual: 'Sequence diagnostic with ETS next-value cards.', controls: ['Window', 'Smoothing', 'Lag focus'], resultFocus: ['AR(1) phi', 'Next ETS', 'Persistence'], interpretation: 'AR and smoothing baselines reveal persistence before heavier forecasting models.' },
  seasonal_decomposition: { phase: 4, title: 'Seasonal Components Lab', focus: 'Separate trend, seasonal amplitude, and residual movement.', visual: 'Sequence trend screen and seasonal amplitude card.', controls: ['Season length', 'Trend', 'Residuals'], resultFocus: ['Seasonal amplitude', 'Trend', 'Residual pattern'], interpretation: 'Seasonality is repeating structure after trend is accounted for.' },
  robust_pca: { phase: 4, title: 'Robust PCA Screen Lab', focus: 'Screen multivariable structure and outlier influence.', visual: 'Correlation/PCA cards with cluster-style score preview.', controls: ['Variables', 'Outlier highlight', 'Variance bars'], resultFocus: ['Variables', 'Avg abs correlation', 'Outliers'], interpretation: 'Robust PCA is useful when component structure may be distorted by unusual rows.' },
  hierarchical_dendrogram: { phase: 4, title: 'Dendrogram Merge Lab', focus: 'Preview hierarchical merge distances.', visual: 'Merge timeline and distance bars.', controls: ['Cut height', 'Distance metric', 'Merge table'], resultFocus: ['Points', 'Merges', 'Distances'], interpretation: 'Large jumps in merge distance suggest natural cluster splits.' },
  dbscan: { phase: 4, title: 'Density Cluster Lab', focus: 'Separate dense clusters from noise points.', visual: 'Cluster scatter with noise and density metrics.', controls: ['Epsilon', 'Min points', 'Noise highlight'], resultFocus: ['Clusters', 'Noise', 'Density'], interpretation: 'DBSCAN calls sparse points noise and dense neighborhoods clusters.' },
  classification_models: { phase: 4, title: 'Classification Baseline Lab', focus: 'Compare simple classification baselines before heavier models.', visual: 'Threshold confusion matrix and baseline score cards.', controls: ['Threshold', 'Score column', 'Target'], resultFocus: ['Baseline accuracy', 'Threshold', 'Errors'], interpretation: 'A simple baseline is the minimum performance a serious classifier should beat.' },
  model_comparison: { phase: 4, title: 'Model Comparison Lab', focus: 'Compare OLS, ridge, robust, and baseline model summaries.', visual: 'Model leaderboard with score cards.', controls: ['Model family', 'Metric focus', 'Winner note'], resultFocus: ['OLS R2', 'Ridge terms', 'Robust terms'], interpretation: 'Model comparison should balance fit, stability, and interpretability.' },
  assumption_diagnostics: { phase: 4, title: 'Assumption Dashboard Lab', focus: 'Surface normality, variance, sample size, and grouping risks.', visual: 'Assumption checklist with severity badges.', controls: ['Diagnostic focus', 'Warnings', 'Linked modules'], resultFocus: ['Normality p', 'Variance p', 'Groups'], interpretation: 'Assumption diagnostics guide which result needs caution or a different method.' },
  plain_language_interpretation: { phase: 4, title: 'Plain-Language Result Lab', focus: 'Translate numeric output into non-technical wording.', visual: 'Interpretation sentence with evidence cards.', controls: ['Audience tone', 'Caution insert', 'Decision sentence'], resultFocus: ['Correlation', 'Direction', 'Strength'], interpretation: 'Plain language should be accurate, cautious, and tied to the selected variables.' },
  warning_system: { phase: 4, title: 'Warning Dashboard Lab', focus: 'Flag invalid-assumption and data-quality risks.', visual: 'Warning badges for small n, missingness, and category overload.', controls: ['Severity', 'Fix suggestions', 'Affected modules'], resultFocus: ['Small n', 'Missing', 'Many categories'], interpretation: 'Warnings should point to what the user can fix next.' },
  engine_unit_tests: { phase: 4, title: 'Engine Test Board Lab', focus: 'Show statistical engine sanity-check coverage.', visual: 'Pass/covered status board.', controls: ['Test family', 'Failure details', 'Coverage'], resultFocus: ['Regression', 'Correlation', 'Distribution checks'], interpretation: 'Unit tests protect module calculations from regressions.' },
  golden_value_tests: { phase: 4, title: 'Golden Reference Lab', focus: 'Compare outputs against known reference tools.', visual: 'Reference target cards and tolerance checklist.', controls: ['Reference tool', 'Tolerance', 'Check list'], resultFocus: ['Golden checks', 'Reference targets', 'Test rows'], interpretation: 'Golden-value tests anchor browser results against trusted statistical packages.' },
}

function StatModulesEmptyState({ onLoadSample }: { onLoadSample: () => void }) {
  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
            <Activity size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">No dataset loaded</h1>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">Load a sample dataset here and start using module-specific inputs, charts, and result cards immediately.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={onLoadSample} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Play size={15} />
            Load Iris sample
          </button>
          <a href="#/data/upload" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
            <Download size={15} />
            Upload data
          </a>
        </div>
      </div>
    </div>
  )
}

function SelectedDataStrip({ summary, requirements }: { summary: ReturnType<typeof datasetSelectionSummary>; requirements: ModuleInputSpec['requirements'] }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800" role="status" aria-label="Selected dataset and variable summary">
      <span className="font-semibold text-slate-700 dark:text-slate-200">{summary.name}</span>
      <span className="text-slate-400">{summary.rows.toLocaleString()} rows</span>
      <span className="text-slate-400">{summary.missing.toLocaleString()} missing cells</span>
      {summary.fields.map((field) => (
        <span key={field.label} className="rounded-full bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-700 dark:text-slate-300">{field.label}: {field.value}</span>
      ))}
      {requirements.map((item) => (
        <span key={item} title={`This module expects ${item} data`} className="rounded-full bg-indigo-50 px-2 py-1 font-semibold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">{item}</span>
      ))}
    </div>
  )
}

function CalculationStatusBar({ active, moduleTitle }: { active: boolean; moduleTitle: string }) {
  return (
    <div className={`mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
      active
        ? 'border-indigo-100 bg-indigo-50 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/25 dark:text-indigo-200'
        : 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-200'
    }`} role="status" aria-live="polite">
      {active ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
      <span className="font-semibold">{active ? `Updating ${moduleTitle} outputs...` : `${moduleTitle} outputs are ready.`}</span>
      <span className="hidden text-slate-500 dark:text-slate-300 sm:inline">Charts, result cards, and export package use the current selections.</span>
    </div>
  )
}

type TrustReport = {
  score: number
  level: 'Strong' | 'Review' | 'Caution'
  checks: TrustCheck[]
  assumptions: string[]
  reproducibility: Array<{ label: string; value: string }>
}

type TrustCheck = { label: string; status: 'pass' | 'warn' | 'info'; detail: string }

type AnalysisGuide = {
  stage: 'Explore' | 'Model' | 'Diagnose' | 'Report'
  question: string
  nextAction: string
  steps: Array<{ label: string; status: 'done' | 'active' | 'next' }>
  recommendations: Array<{ key?: string; title: string; reason: string; action: string; path?: string }>
}

type DataPreparationReport = {
  readiness: 'Ready' | 'Prepare' | 'High Risk'
  selectedColumns: Array<{ name: string; type: string; missingPct: number; unique: number; role: string }>
  actions: Array<{ title: string; detail: string; path: string; tone: 'warn' | 'info' | 'ok' }>
  auditSummary: string
}

type ModuleReportPackage = {
  app: 'StatAnveshak'
  type: 'stat-module-report'
  version: 1
  createdAt: string
  dataset: { id: string; name: string; rows: number; columns: number }
  module: { key: string; id: number; title: string; group: string; question: string }
  selections: Record<string, string | number>
  method: string
  result: StatModuleResult
  trust?: TrustReport | null
  preparation?: DataPreparationReport | null
  guide?: AnalysisGuide | null
  reportText: string
  reproducibleRecipe: string[]
}

type ModelValidationReport = {
  status: 'Validated' | 'Needs validation' | 'Reference check'
  focus: string
  checks: Array<{ label: string; status: 'pass' | 'warn' | 'info'; detail: string }>
  advancedModules: Array<{ key: string; title: string; reason: string }>
  referencePlan: string[]
}

type WorkspaceHandoffReport = {
  scale: 'Light' | 'Moderate' | 'Heavy'
  scaleDetail: string
  projectName: string
  handoffItems: Array<{ label: string; value: string; status: 'ready' | 'review' }>
  savedWorkflow: string[]
}

function ModuleTrustPanel({ report, compact = false }: { report: TrustReport; compact?: boolean }) {
  const levelClass = report.level === 'Strong'
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300'
    : report.level === 'Review'
      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/35 dark:text-amber-300'
      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/35 dark:text-rose-300'
  return (
    <section className={`mb-4 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
            <ShieldCheck size={20} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Trust & reproducibility</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${levelClass}`}>{report.level} · {report.score}/100</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Automatic checks for assumptions, missing data, selected inputs, sample size, and exact analysis state.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {report.reproducibility.map((item) => (
            <span key={item.label} title={item.value} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
              <FileJson size={11} />
              {item.label}: {item.value}
            </span>
          ))}
        </div>
      </div>
      <div className={`mt-3 grid gap-2 ${compact ? 'lg:grid-cols-4' : 'md:grid-cols-2 xl:grid-cols-4'}`}>
        {report.checks.map((check) => (
          <div key={check.label} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
            <div className="mb-1 flex items-center gap-1.5">
              {check.status === 'pass' ? <CheckCircle2 size={14} className="text-emerald-500" /> : check.status === 'warn' ? <AlertTriangle size={14} className="text-amber-500" /> : <ShieldCheck size={14} className="text-indigo-500" />}
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{check.label}</p>
            </div>
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{check.detail}</p>
          </div>
        ))}
      </div>
      {!compact && (
        <div className="mt-3 flex flex-wrap gap-2">
          {report.assumptions.map((assumption) => (
            <span key={assumption} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">{assumption}</span>
          ))}
        </div>
      )}
    </section>
  )
}

function WorkspaceHandoffPanel({ report, onBundle, onHtml, onSnapshot }: { report: WorkspaceHandoffReport; onBundle: () => void; onHtml: () => void; onSnapshot: () => void }) {
  const scaleClass = report.scale === 'Light'
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300'
    : report.scale === 'Moderate'
      ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/35 dark:text-sky-300'
      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/35 dark:text-amber-300'
  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Download size={20} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Workspace handoff & scale</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${scaleClass}`}>{report.scale}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{report.scaleDetail}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onSnapshot} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"><Save size={13} /> Snapshot</button>
          <button type="button" onClick={onHtml} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"><FileText size={13} /> Handoff HTML</button>
          <button type="button" onClick={onBundle} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"><FileJson size={13} /> Workspace bundle</button>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-2 md:grid-cols-2">
          {report.handoffItems.map((item) => (
            <div key={item.label} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.label}</p>
                {item.status === 'ready' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-amber-500" />}
              </div>
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Saved workflow recipe</p>
          <ol className="space-y-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
            {report.savedWorkflow.map((step, index) => <li key={step}>{index + 1}. {step}</li>)}
          </ol>
        </div>
      </div>
    </section>
  )
}

function ModelValidationPanel({ report, activeModuleKey, onSelectModule }: { report: ModelValidationReport; activeModuleKey: string; onSelectModule: (key: string) => void }) {
  const statusClass = report.status === 'Validated'
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300'
    : report.status === 'Reference check'
      ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/35 dark:text-sky-300'
      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/35 dark:text-amber-300'
  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
            <BrainCircuit size={20} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Validation & advanced modeling</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>{report.status}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{report.focus}</p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 xl:grid-cols-[1fr_1fr_0.9fr]">
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Validation checks</p>
          <div className="space-y-2">
            {report.checks.map((check) => (
              <div key={check.label} className="flex gap-2 text-xs">
                {check.status === 'pass' ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" /> : check.status === 'warn' ? <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" /> : <ShieldCheck size={14} className="mt-0.5 shrink-0 text-indigo-500" />}
                <div><p className="font-bold text-slate-700 dark:text-slate-200">{check.label}</p><p className="leading-5 text-slate-500 dark:text-slate-400">{check.detail}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Advanced next modules</p>
          <div className="space-y-2">
            {report.advancedModules.map((module) => (
              <button key={module.key} type="button" disabled={module.key === activeModuleKey} onClick={() => onSelectModule(module.key)} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left text-xs hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-indigo-950/25">
                <span className="block font-bold text-slate-700 dark:text-slate-200">{module.title}</span>
                <span className="mt-1 block leading-5 text-slate-500 dark:text-slate-400">{module.reason}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Reference QA plan</p>
          <ol className="space-y-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
            {report.referencePlan.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}
          </ol>
        </div>
      </div>
    </section>
  )
}

function ModuleReportPackagePanel({ packageData, onMarkdown, onHtml, onJson }: { packageData: ModuleReportPackage; onMarkdown: () => void; onHtml: () => void; onJson: () => void }) {
  const ready = packageData.trust?.level === 'Strong' && packageData.preparation?.readiness !== 'High Risk'
  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300">
            <FileText size={20} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Report package</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ready ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/35 dark:text-amber-300'}`}>{ready ? 'Report-ready' : 'Needs review'}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Exports include method wording, result metrics, assumptions, selected variables, trust checks, preparation status, and a reproducible recipe.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onMarkdown} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"><FileText size={13} /> Markdown</button>
          <button type="button" onClick={onHtml} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"><FileCode size={13} /> HTML</button>
          <button type="button" onClick={onJson} className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 dark:bg-white dark:text-slate-900"><FileJson size={13} /> JSON</button>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Report wording</p>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{packageData.reportText}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Recipe</p>
          <ol className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
            {packageData.reproducibleRecipe.slice(0, 5).map((step, index) => <li key={step}>{index + 1}. {step}</li>)}
          </ol>
        </div>
      </div>
    </section>
  )
}

function DataPreparationPanel({ report, recentHistory }: { report: DataPreparationReport; recentHistory: AnalysisLogEntry[] }) {
  const readinessClass = report.readiness === 'Ready'
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300'
    : report.readiness === 'Prepare'
      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/35 dark:text-amber-300'
      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/35 dark:text-rose-300'
  return (
    <section className="mb-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wand2 size={18} className="text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">Data preparation cockpit</h2>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${readinessClass}`}>{report.readiness}</span>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {report.actions.map((action) => (
            <Link key={action.title} to={action.path} className={`rounded-lg border p-3 transition hover:-translate-y-0.5 hover:shadow-sm ${
              action.tone === 'warn'
                ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200'
                : action.tone === 'ok'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-200'
                  : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}>
              <p className="text-xs font-bold">{action.title}</p>
              <p className="mt-1 text-xs leading-5 opacity-80">{action.detail}</p>
            </Link>
          ))}
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-700">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-700/50">
              <tr><th className="px-3 py-2 text-left">Selected column</th><th className="px-3 py-2 text-left">Role</th><th className="px-3 py-2 text-right">Missing</th><th className="px-3 py-2 text-right">Unique</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {report.selectedColumns.map((column) => (
                <tr key={`${column.role}-${column.name}`}>
                  <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">{column.name}<span className="ml-1 font-normal text-slate-400">({column.type})</span></td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{column.role}</td>
                  <td className={`px-3 py-2 text-right font-semibold ${column.missingPct >= 20 ? 'text-amber-600 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>{column.missingPct.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">{column.unique.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-3 flex items-center gap-2">
          <GitBranch size={17} className="text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">Audit trail</h2>
        </div>
        <p className="mb-3 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500 dark:bg-slate-900 dark:text-slate-400">{report.auditSummary}</p>
        <div className="space-y-2">
          {recentHistory.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 p-3 text-xs text-slate-400 dark:border-slate-700">No saved analysis actions yet. Run, copy, export, or save a module to create an audit entry.</p>}
          {recentHistory.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-slate-100 p-3 dark:border-slate-700">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-bold text-slate-700 dark:text-slate-200">{entry.title}</p>
                <span className="shrink-0 text-[11px] text-slate-400">{new Date(entry.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{entry.interpretation || entry.resultSummary}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DataHandlingCommandCenter({ report, cleaning, matches, activeModuleKey, onSelectModule }: {
  report: DataQualityReport
  cleaning: CleaningRecommendation[]
  matches: ModuleDatasetMatch[]
  activeModuleKey: string
  onSelectModule: (key: string) => void
}) {
  const levelClass = report.level === 'Strong'
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300'
    : report.level === 'Review'
      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/35 dark:text-amber-300'
      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/35 dark:text-rose-300'
  const topRoles = report.columnRoles
    .filter((col) => col.primaryRole !== 'unknown')
    .sort((a, b) => (b.riskFlags.length ? 12 : 0) + b.roles[b.primaryRole] - ((a.riskFlags.length ? 12 : 0) + a.roles[a.primaryRole]))
    .slice(0, 6)
  const topMatches = matches.slice(0, 5)

  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/35 dark:text-emerald-300">
            <ShieldCheck size={20} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Data handling command center</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${levelClass}`}>{report.level} data health</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Quality scan, cleaning actions, large-data strategy, inferred column roles, and best module paths for this dataset.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-right sm:grid-cols-4">
          {[
            ['Score', `${report.score}/100`],
            ['Missing', `${report.missingPct.toFixed(1)}%`],
            ['Duplicates', report.duplicateRows.toLocaleString()],
            ['Outlier cols', report.outlierColumns.length.toString()],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-100 p-3 dark:border-slate-700">
            <div className="mb-2 flex items-center gap-2">
              <Wand2 size={15} className="text-indigo-500" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-white">Fix now recommendations</h3>
            </div>
            <div className="space-y-2">
              {cleaning.map((item) => (
                <Link key={`${item.title}-${item.route}`} to={item.route} className={`block rounded-lg border p-3 transition hover:-translate-y-0.5 ${
                  item.severity === 'warn'
                    ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200'
                    : item.severity === 'ok'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-200'
                      : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold">{item.title}</p>
                    <span className="shrink-0 rounded-md bg-white/70 px-2 py-1 text-[11px] font-semibold dark:bg-slate-800/70">{item.action}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 opacity-80">{item.detail}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 p-3 dark:border-slate-700">
            <div className="mb-2 flex items-center gap-2">
              <Activity size={15} className="text-indigo-500" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-white">Large dataset strategy</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-500 dark:bg-slate-700 dark:text-slate-300">{report.largeData.mode}</span>
            </div>
            <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500 dark:bg-slate-900 dark:text-slate-400">{report.largeData.memoryWarning}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900"><span className="text-slate-400">Sample</span><p className="font-bold text-slate-800 dark:text-white">{report.largeData.sampleRows.toLocaleString()} rows</p></div>
              <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900"><span className="text-slate-400">Page size</span><p className="font-bold text-slate-800 dark:text-white">{report.largeData.pageSize.toLocaleString()} rows</p></div>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
              {report.largeData.tactics.map((tactic) => <li key={tactic}>- {tactic}</li>)}
            </ul>
          </div>

          <div className="rounded-lg border border-slate-100 p-3 dark:border-slate-700 lg:col-span-2">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Tags size={15} className="text-indigo-500" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-white">Detected column roles</h3>
              {Object.entries(report.typeSummary).map(([type, count]) => (
                <span key={type} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-700 dark:text-slate-300">{type}: {count}</span>
              ))}
            </div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {topRoles.map((col) => (
                <div key={col.name} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-white">{col.name}</p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold capitalize text-indigo-600 dark:bg-slate-800 dark:text-indigo-300">{col.primaryRole}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{col.reasons[0]}</p>
                  {col.riskFlags[0] && <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-amber-600 dark:text-amber-300">{col.riskFlags[0]}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 p-3 dark:border-slate-700">
          <div className="mb-2 flex items-center gap-2">
            <Compass size={15} className="text-indigo-500" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-white">Dataset-to-module matching</h3>
          </div>
          <div className="space-y-2">
            {topMatches.map((match) => (
              <button key={match.key} type="button" onClick={() => onSelectModule(match.key)} disabled={match.key === activeModuleKey} className="w-full rounded-lg border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50 disabled:cursor-default disabled:border-indigo-200 disabled:bg-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30 dark:disabled:border-indigo-800 dark:disabled:bg-indigo-950/30">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-bold text-slate-800 dark:text-white">{match.title}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    match.label === 'Excellent' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : match.label === 'Good' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                        : match.label === 'Prepare' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                  }`}>{match.score}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">{match.group} · {match.label}{match.key === activeModuleKey ? ' · Current' : ''}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{match.reasons.join('; ') || 'Available columns can support this module after role selection.'}</p>
              </button>
            ))}
          </div>
          {report.suspiciousColumns.length > 0 && (
            <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/25 dark:text-amber-200">
              <p className="font-bold">Suspicious columns</p>
              <p className="mt-1 line-clamp-3">{report.suspiciousColumns.slice(0, 3).map((item) => `${item.name}: ${item.reason}`).join(' ')}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function AnalysisGuidePanel({ guide, activeModuleKey, onSelectModule }: { guide: AnalysisGuide; activeModuleKey: string; onSelectModule: (key: string) => void }) {
  return (
    <section className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300">
            <Compass size={20} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Guided analysis path</h2>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300">{guide.stage}</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{guide.question}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{guide.nextAction}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {guide.steps.map((step, index) => (
            <span key={step.label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              step.status === 'done'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                : step.status === 'active'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-500 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {step.status === 'done' ? <CheckCircle2 size={11} /> : <span>{index + 1}</span>}
              {step.label}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {guide.recommendations.map((item) => (
          <div key={`${item.title}-${item.key ?? item.path}`} className="rounded-lg border border-white bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-bold text-slate-800 dark:text-white">{item.title}</p>
            <p className="mt-1 min-h-10 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.reason}</p>
            {item.key ? (
              <button type="button" disabled={item.key === activeModuleKey} onClick={() => onSelectModule(item.key!)} className="mt-2 inline-flex rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-700">
                {item.key === activeModuleKey ? 'Current module' : item.action}
              </button>
            ) : item.path ? (
              <Link to={item.path} className="mt-2 inline-flex rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300">
                {item.action}
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}

function StickyMiniActions({ onRun, onReset, onExport, onSave, canExport, busyAction }: { onRun: () => void; onReset: () => void; onExport: () => void; onSave: () => void; canExport: boolean; busyAction: string | null }) {
  return (
    <div className="sticky top-24 z-10 mb-3 flex justify-end">
      <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <button type="button" title="Run module with current selections" aria-busy={busyAction === 'run'} disabled={busyAction === 'run'} onClick={onRun} className="inline-flex items-center gap-1 border-r border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-70 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">{busyAction === 'run' ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} {busyAction === 'run' ? 'Running' : 'Run'}</button>
        <button type="button" title="Reset inputs to dataset defaults" aria-busy={busyAction === 'reset'} disabled={busyAction === 'reset'} onClick={onReset} className="inline-flex items-center gap-1 border-r border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-70 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">{busyAction === 'reset' ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Reset</button>
        <button type="button" title={canExport ? 'Export the result table as CSV' : 'This module has no table to export'} aria-busy={busyAction === 'export'} onClick={onExport} disabled={!canExport || busyAction === 'export'} className="inline-flex items-center gap-1 border-r border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">{busyAction === 'export' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Export</button>
        <button type="button" title="Save this module setup locally" aria-busy={busyAction === 'save'} disabled={busyAction === 'save'} onClick={onSave} className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-70 dark:text-indigo-300 dark:hover:bg-indigo-900/20">{busyAction === 'save' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save</button>
      </div>
    </div>
  )
}

function AlphaInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="text-xs text-slate-500" title="Alpha is the decision threshold used by hypothesis tests.">
      {label}
      <input type="number" min="0.001" max="0.2" step="0.001" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
      <input type="range" min="0.001" max="0.2" step="0.001" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 w-full accent-indigo-600" />
    </label>
  )
}

function ModuleResultCards({ module, result, alpha }: { module: typeof STAT_MODULES[number]; result: StatModuleResult; alpha: number }) {
  const pValue = firstPValue(result)
  const coefficientRows = result.table?.filter((row) => Object.keys(row).some((key) => /coef|slope|beta|odds/i.test(key))).slice(0, 3) ?? []
  const metric = (pattern: RegExp) => result.metrics.find((item) => pattern.test(item.label))
  if (module.key === 'pca') {
    return (
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <ResultInsightCard label="PC1 explained" value={metric(/pc1|explained/i)?.value ?? 'See chart'} tone="indigo" />
        <ResultInsightCard label="Loading guide" value="Check sign and size" tone="emerald" />
        <ResultInsightCard label="Next view" value="Scree + biplot" />
      </div>
    )
  }
  if (module.group === 'Inferential' || /test|anova|chi|fisher|mcnemar|binomial/i.test(module.key)) {
    return (
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <ResultInsightCard label="p-value" value={pValue === null ? 'Not detected' : pValue.toFixed(4)} tone={pValue !== null && pValue < alpha ? 'rose' : 'emerald'} />
        <ResultInsightCard label="Decision" value={pValue !== null && pValue < alpha ? 'Reject threshold crossed' : 'No reject threshold'} />
        <ResultInsightCard label="Alpha" value={alpha} />
      </div>
    )
  }
  if (module.group === 'Regression & Modeling' || /regression|model/i.test(module.key)) {
    return (
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <ResultInsightCard label="Fit" value={metric(/r2|accuracy|auc|f1/i)?.value ?? 'Inspect diagnostics'} tone="indigo" />
        <ResultInsightCard label="Coefficients" value={coefficientRows.length ? `${coefficientRows.length} shown` : 'Metric/table output'} />
        <ResultInsightCard label="Diagnostic" value="Check residual view" tone="emerald" />
      </div>
    )
  }
  return null
}

function ResultInsightCard({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'slate' | 'indigo' | 'emerald' | 'rose' }) {
  const toneClass = tone === 'indigo' ? 'text-indigo-600 dark:text-indigo-300' : tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-300' : tone === 'rose' ? 'text-rose-600 dark:text-rose-300' : 'text-slate-800 dark:text-white'
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
      <p className="mb-1 text-xs text-slate-400">{label}</p>
      <p className={`break-words text-sm font-bold ${toneClass}`}>{String(value)}</p>
    </div>
  )
}

function SimpleLinearRegressionStudio({ dataset, dataRows, numericCols, selection, result, trustReport, analysisGuide, theme, notify, onUpdate, onRun, onReset, onExport, onSave, onCopy, onSelectModule }: { dataset: Dataset; dataRows: Record<string, unknown>[]; numericCols: string[]; selection: Required<StatModuleSelection>; result: StatModuleResult; trustReport: TrustReport | null; analysisGuide: AnalysisGuide | null; theme: AppTheme; notify: (message: string, tone?: 'success' | 'info') => void; onUpdate: (key: keyof StatModuleSelection, value: string | number) => void; onRun: () => void; onReset: () => void; onExport: () => void; onSave: () => void; onCopy: () => void; onSelectModule: (key: string) => void }) {
  const [tab, setTab] = useState<'fit' | 'explain' | 'diagnose' | 'predict'>('fit')
  const [showConfidence, setShowConfidence] = useState(true)
  const [showPrediction, setShowPrediction] = useState(true)
  const [predictionX, setPredictionX] = useState('')
  const pairs = pairedRows(dataRows, selection.num1, selection.num2).sort((a, b) => a[0] - b[0])
  const line = regressionLine(pairs)
  const xs = pairs.map(([x]) => x)
  const ys = pairs.map(([, y]) => y)
  const mx = localMean(xs)
  const sxx = xs.reduce((sum, x) => sum + (x - mx) ** 2, 0)
  const fitted = line ? xs.map((x) => line.a + line.b * x) : []
  const residuals = ys.map((y, i) => y - fitted[i])
  const sse = residuals.reduce((sum, r) => sum + r * r, 0)
  const rmse = Math.sqrt(sse / Math.max(1, pairs.length - 2))
  const r = correlation(xs, ys)
  const r2 = r ** 2
  const tCrit = 1.96
  const bandRows = line ? xs.map((x, i) => {
    const yhat = fitted[i]
    const seMean = rmse * Math.sqrt((1 / Math.max(1, pairs.length)) + ((x - mx) ** 2 / Math.max(sxx, 1e-9)))
    const sePred = Math.sqrt(rmse ** 2 + seMean ** 2)
    return { x, yhat, ciLo: yhat - tCrit * seMean, ciHi: yhat + tCrit * seMean, piLo: yhat - tCrit * sePred, piHi: yhat + tCrit * sePred }
  }) : []
  const slopeRow = result.table?.find((row) => String(row.term) !== 'Intercept')
  const interceptRow = result.table?.find((row) => String(row.term) === 'Intercept')
  const slope = Number(slopeRow?.estimate ?? line?.b ?? 0)
  const intercept = Number(interceptRow?.estimate ?? line?.a ?? 0)
  const pValue = Number(slopeRow?.p)
  const predX = Number(predictionX || mx || xs[0] || 0)
  const predY = intercept + slope * predX
  const predSeMean = rmse * Math.sqrt((1 / Math.max(1, pairs.length)) + ((predX - mx) ** 2 / Math.max(sxx, 1e-9)))
  const predSe = Math.sqrt(rmse ** 2 + predSeMean ** 2)
  const strong = r2 >= 0.7
  const chart = {
    data: [
      { type: 'scatter', mode: 'markers', x: xs, y: ys, name: `Observations (${pairs.length})`, marker: { color: '#4f46e5', size: 5, opacity: 0.72 } },
      ...(showPrediction && bandRows.length ? [
        { type: 'scatter', mode: 'lines', x: bandRows.map((row) => row.x), y: bandRows.map((row) => row.piHi), line: { color: 'rgba(14,165,233,0)' }, showlegend: false, hoverinfo: 'skip' },
        { type: 'scatter', mode: 'lines', x: bandRows.map((row) => row.x), y: bandRows.map((row) => row.piLo), fill: 'tonexty', fillcolor: 'rgba(14,165,233,0.12)', line: { color: 'rgba(14,165,233,0)' }, name: '95% Prediction band', hoverinfo: 'skip' },
      ] : []),
      ...(showConfidence && bandRows.length ? [
        { type: 'scatter', mode: 'lines', x: bandRows.map((row) => row.x), y: bandRows.map((row) => row.ciHi), line: { color: 'rgba(99,102,241,0)' }, showlegend: false, hoverinfo: 'skip' },
        { type: 'scatter', mode: 'lines', x: bandRows.map((row) => row.x), y: bandRows.map((row) => row.ciLo), fill: 'tonexty', fillcolor: 'rgba(99,102,241,0.16)', line: { color: 'rgba(99,102,241,0)' }, name: '95% Confidence band', hoverinfo: 'skip' },
      ] : []),
      { type: 'scatter', mode: 'lines', x: xs, y: fitted, name: 'Fitted line', line: { color: '#4338ca', width: 3 } },
      { type: 'scatter', mode: 'markers', x: [predX], y: [predY], name: 'Prediction', marker: { color: '#ef4444', size: 10, line: { color: '#ffffff', width: 2 } } },
    ],
    layout: { title: '', margin: { l: 48, r: 20, t: 12, b: 48 }, xaxis: { title: selection.num1 }, yaxis: { title: selection.num2 }, legend: { orientation: 'v', x: 1.02, y: 0.96 } },
  }
  const residualChart = {
    data: [
      { type: 'scatter', mode: 'markers', x: fitted, y: residuals, name: 'Residuals', marker: { color: '#4f46e5', size: 5, opacity: 0.72 } },
      { type: 'scatter', mode: 'lines', x: [Math.min(...fitted), Math.max(...fitted)], y: [0, 0], name: 'Zero line', line: { color: '#ef4444', dash: 'dash' } },
    ],
    layout: { title: '', margin: { l: 44, r: 16, t: 10, b: 42 }, xaxis: { title: 'Fitted values' }, yaxis: { title: 'Residuals' }, showlegend: true },
  }
  const ciLow = slope - tCrit * Number(slopeRow?.se ?? 0)
  const ciHigh = slope + tCrit * Number(slopeRow?.se ?? 0)
  const slopeDirection = slope >= 0 ? 'positive' : 'negative'

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">Analysis / Regression / Simple Linear Regression</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Simple Linear Regression Studio</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Model, explain, diagnose, and predict the relationship between two numeric variables.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-300">{dataset.name} · {dataset.rows.toLocaleString()} rows</span>
            <button onClick={onExport} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"><Download size={13} /> Export report</button>
            <button onClick={onSave} className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"><Save size={13} /> Save model</button>
          </div>
        </div>
        <div className="mb-4 flex gap-4 border-b border-slate-200 text-sm dark:border-slate-700">
          {(['fit', 'explain', 'diagnose', 'predict'] as const).map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)} className={`border-b-2 px-1 pb-3 font-semibold capitalize ${tab === item ? 'border-indigo-600 text-indigo-600 dark:text-indigo-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}>{item}</button>
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_0.7fr_0.8fr_0.8fr_auto]">
          <Select label="X (Predictor)" value={selection.num1} options={numericCols} icon="numeric" onChange={(value) => onUpdate('num1', value)} hint="Predictor or explanatory variable." />
          <Select label="Y (Response)" value={selection.num2} options={numericCols} icon="numeric" onChange={(value) => onUpdate('num2', value)} hint="Response or outcome variable." />
          <AlphaInput label="Confidence level" value={selection.alpha} onChange={(value) => onUpdate('alpha', value)} />
          <ToggleControl label="Confidence band" checked={showConfidence} onChange={setShowConfidence} />
          <ToggleControl label="Prediction band" checked={showPrediction} onChange={setShowPrediction} />
          <button onClick={onRun} className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><LineChart size={15} /> Fit model</button>
        </div>
        <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-300">Both variables are numeric and different.</p>
      </section>
      {trustReport && <ModuleTrustPanel report={trustReport} compact />}
      {analysisGuide && <AnalysisGuidePanel guide={analysisGuide} activeModuleKey="simple_regression" onSelectModule={onSelectModule} />}

      {tab === 'fit' && (
        <div className="grid gap-4 xl:grid-cols-[1.65fr_0.95fr]">
          <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{selection.num2} explained by {selection.num1}</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md bg-indigo-50 px-3 py-1.5 font-mono text-sm text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">y = {intercept.toFixed(3)} + {slope.toFixed(3)}x</span>
                <span className="text-slate-500 dark:text-slate-400">Each one-unit increase in {selection.num1} changes {selection.num2} by {slope.toFixed(3)} on average.</span>
              </div>
            </div>
            <PlotPanel chart={chart} theme={theme} moduleKey="simple_regression_fit" notify={notify} height="380px" />
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Model summary</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${strong ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>{strong ? 'Strong relationship' : 'Review relationship'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <RegressionMetric label="R²" value={r2.toFixed(2)} />
              <RegressionMetric label="Adjusted R²" value={String(result.metrics.find((m) => m.label === 'adj R2')?.value ?? r2.toFixed(2))} />
              <RegressionMetric label="RMSE" value={rmse.toFixed(3)} />
              <RegressionMetric label="n" value={pairs.length.toLocaleString()} />
            </div>
            <CoefficientTable rows={result.table ?? []} y={selection.num2} />
            <button onClick={onCopy} className="mt-3 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300">Copy model summary</button>
          </section>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_1.15fr_0.9fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <MiniTitle title="Effect and uncertainty" detail="Slope confidence interval" />
          <div className="mt-6 h-28">
            <svg viewBox="0 0 560 130" className="h-full w-full">
              <line x1="48" x2="520" y1="68" y2="68" stroke="#cbd5e1" strokeWidth="2" />
              <line x1="280" x2="280" y1="34" y2="102" stroke="#94a3b8" strokeDasharray="5 5" />
              <line x1="330" x2="430" y1="68" y2="68" stroke="#4f46e5" strokeWidth="4" />
              <circle cx="380" cy="68" r="8" fill="#4f46e5" />
              <text x="304" y="36" fill="#4f46e5" fontSize="14">{slope.toFixed(3)} (95% CI: {ciLow.toFixed(3)}, {ciHigh.toFixed(3)})</text>
            </svg>
          </div>
          <p className={`text-xs font-semibold ${slope >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>{slopeDirection === 'positive' ? 'Positive' : 'Negative'} effect: higher {selection.num1} means {slopeDirection === 'positive' ? 'higher' : 'lower'} {selection.num2} on average.</p>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-2 flex items-center justify-between">
            <MiniTitle title="Residual check" detail="Fitted versus error" />
            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">Review pattern</span>
          </div>
          <PlotPanel chart={residualChart} theme={theme} moduleKey="simple_regression_residuals" notify={notify} height="260px" />
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <MiniTitle title="Predict a value" detail={selection.num1} />
          <label className="text-xs text-slate-500">
            {selection.num1}
            <input type="number" value={predictionX} placeholder={mx.toFixed(2)} onChange={(event) => setPredictionX(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
          </label>
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
            <p className="text-xs text-slate-400">Predicted {selection.num2}</p>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-300">{Number.isFinite(predY) ? predY.toFixed(2) : '-'}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div><p className="text-slate-400">95% Confidence interval</p><p className="font-bold text-indigo-600 dark:text-indigo-300">{(predY - tCrit * predSeMean).toFixed(2)} to {(predY + tCrit * predSeMean).toFixed(2)}</p></div>
              <div><p className="text-slate-400">95% Prediction interval</p><p className="font-bold text-sky-600 dark:text-sky-300">{(predY - tCrit * predSe).toFixed(2)} to {(predY + tCrit * predSe).toFixed(2)}</p></div>
            </div>
          </div>
          <button onClick={() => setTab('predict')} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"><LineChart size={13} /> Show on chart</button>
        </section>
      </div>

      {tab !== 'fit' && (
        <section className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/25 dark:text-indigo-200">
          {tab === 'explain' && `The slope says how much ${selection.num2} changes, on average, for one unit of ${selection.num1}. R² says the line explains about ${(r2 * 100).toFixed(0)}% of the variation.`}
          {tab === 'diagnose' && 'Check residuals for curvature, fan shape, and extreme points. A visible pattern means a straight line may be too simple.'}
          {tab === 'predict' && 'Prediction intervals are wider than confidence intervals because they include uncertainty for a future individual observation.'}
        </section>
      )}

      <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-100 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-800/95">
        <p className="text-sm text-slate-600 dark:text-slate-300">{selection.num1} explains about <strong>{(r2 * 100).toFixed(0)}%</strong> of the variation in {selection.num2}. The fitted association is {slopeDirection}.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setTab('explain')} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:border-slate-600 dark:text-indigo-300">Explain coefficients</button>
          <button onClick={() => setTab('diagnose')} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:border-slate-600 dark:text-indigo-300">Check assumptions</button>
          <button onClick={onReset} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"><RotateCcw size={13} className="inline" /> Reset</button>
        </div>
      </div>
    </div>
  )
}

function RegressionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 text-center dark:border-slate-700">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-indigo-600 dark:text-indigo-300">{value}</p>
    </div>
  )
}

function CoefficientTable({ rows, y }: { rows: Array<Record<string, string | number>>; y: string }) {
  if (!rows.length) return null
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-700">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-700/50">
          <tr><th className="px-2 py-2 text-left">Coefficient</th><th className="px-2 py-2 text-right">Estimate</th><th className="px-2 py-2 text-right">SE</th><th className="px-2 py-2 text-right">t</th><th className="px-2 py-2 text-right">p-value</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {rows.map((row) => <tr key={String(row.term)}><td className="px-2 py-2 font-semibold text-slate-700 dark:text-slate-200">{String(row.term)}</td><td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">{String(row.estimate)}</td><td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">{String(row.se)}</td><td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">{String(row.t)}</td><td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">{Number(row.p) < 0.001 ? 'p < 0.001' : String(row.p)}</td></tr>)}
        </tbody>
      </table>
      <p className="px-2 py-2 text-xs text-slate-400">Dependent variable: {y}</p>
    </div>
  )
}

function moduleKind(module: typeof STAT_MODULES[number]) {
  if (/chart|plot|histogram|scatter|heatmap|treemap|sankey|visual|map|violin|boxplot|bar|line|area|pie|donut|bubble|dashboard/i.test(`${module.key} ${module.title}`)) return 'Chart'
  if (/regression|model|classifier|prediction|pca|cluster|factor|forecast|time_series|validation/i.test(`${module.key} ${module.title}`)) return 'Model'
  if (/test|anova|chi|mann|wilcoxon|kruskal|friedman|binomial|permutation|bootstrap|bayesian|interval|power|effect/i.test(`${module.key} ${module.title}`)) return 'Test'
  if (/clean|join|merge|reshape|imputation|transform|formula|data/i.test(`${module.key} ${module.title}`)) return 'Data'
  if (/report|export|script|notebook|template|state|warning|qa|reference|interpret/i.test(`${module.key} ${module.title}`)) return 'Report'
  return 'Tool'
}

function moduleMenuIcon(module: typeof STAT_MODULES[number]) {
  const kind = moduleKind(module)
  if (kind === 'Chart') {
    if (/pie|donut/i.test(module.key)) return PieChart
    if (/sankey|network|flow/i.test(module.key)) return Network
    return LineChart
  }
  if (kind === 'Model') return BrainCircuit
  if (kind === 'Data') return Tags
  if (kind === 'Report') return Clipboard
  return Calculator
}

function ModuleTypeBadge({ module, active = false }: { module: typeof STAT_MODULES[number]; active?: boolean }) {
  const kind = moduleKind(module)
  const className = active
    ? 'bg-white/15 text-white'
    : kind === 'Chart'
      ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
      : kind === 'Model'
        ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
        : kind === 'Data'
          ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'
          : kind === 'Report'
            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${className}`}>{kind}</span>
}

function moduleRequirementBadges(module: typeof STAT_MODULES[number]) {
  const text = `${module.key} ${module.title} ${module.description}`.toLowerCase()
  const badges: string[] = []
  if (/paired|wilcoxon|mcnemar|repeated|friedman/.test(text)) badges.push('Paired')
  if (/group|anova|boxplot|violin|kruskal|mann|categor|chi|contingency|post_hoc|comparison/.test(text)) badges.push('Grouped')
  if (/chi|categor|class|binary|mcnemar|bar|pie|donut|sankey|treemap/.test(text)) badges.push('Categorical')
  if (/time|seasonal|forecast|series|control/.test(text)) badges.push('Time')
  if (!/chi|categorical dashboard|bar|pie|donut|sankey|treemap/.test(text)) badges.push('Numeric')
  return [...new Set(badges)].slice(0, 3)
}

function moduleNeedState(module: typeof STAT_MODULES[number], numericCount: number, catCount: number) {
  const badges = moduleRequirementBadges(module)
  const numericNeeded = badges.includes('Numeric')
  const catNeeded = badges.includes('Categorical') || badges.includes('Grouped')
  const needs: string[] = []
  if (numericNeeded && numericCount === 0) needs.push('a numeric column')
  if (catNeeded && catCount === 0) needs.push('a categorical/group column')
  if (badges.includes('Paired') && numericCount < 2) needs.push('two numeric columns')
  if (needs.length) return { blocked: true, message: `Needs ${needs.join(' and ')}.` }
  return { blocked: false, message: 'Ready for the loaded dataset.' }
}

function recommendedMenuModules(numericCount: number, catCount: number) {
  const keys = [
    numericCount >= 1 ? 'histogram' : '',
    numericCount >= 1 && catCount >= 1 ? 'box_plot' : '',
    numericCount >= 2 ? 'scatter_plot' : '',
    numericCount >= 2 ? 'simple_regression' : '',
    catCount >= 2 ? 'chi_square' : '',
    numericCount >= 1 && catCount >= 1 ? 'anova' : '',
  ].filter(Boolean)
  return keys.map((key) => STAT_MODULES.find((module) => module.key === key)).filter(Boolean) as typeof STAT_MODULES
}

function ModuleShortcutChips({ title, keys, active, onSelect }: { title: string; keys: string[]; active: string; onSelect: (key: string) => void }) {
  return (
    <div>
      <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      <div className="stat-module-scroll flex gap-1.5 overflow-x-auto pb-1">
        {keys.map((key) => {
          const module = STAT_MODULES.find((item) => item.key === key)
          if (!module) return null
          return (
            <button key={key} type="button" onClick={() => onSelect(key)} aria-current={active === key ? 'page' : undefined} className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${active === key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}>
              {module.id}. {module.title.replace(' Module', '')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ModuleRecommendationChips({ keys, active, onSelect }: { keys: string[]; active: string; onSelect: (key: string) => void }) {
  if (!keys.length) return null
  return (
    <div>
      <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Recommended</p>
      <div className="stat-module-scroll flex gap-1.5 overflow-x-auto pb-1">
        {keys.map((key) => {
          const module = STAT_MODULES.find((item) => item.key === key)
          if (!module) return null
          return (
            <button key={key} type="button" onClick={() => onSelect(key)} aria-current={active === key ? 'page' : undefined} className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${active === key ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/35 dark:text-emerald-300 dark:hover:bg-emerald-900/50'}`}>
              {module.title.replace(' Module', '')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ModuleMenuFilterBar({ value, onChange }: { value: ModuleMenuFilter; onChange: (value: ModuleMenuFilter) => void }) {
  const filters: Array<{ key: ModuleMenuFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'ready', label: 'Ready' },
    { key: 'favorites', label: 'Fav' },
    { key: 'test', label: 'Tests' },
    { key: 'model', label: 'Models' },
    { key: 'chart', label: 'Charts' },
    { key: 'numeric', label: 'Numeric' },
    { key: 'categorical', label: 'Cats' },
    { key: 'paired', label: 'Paired' },
    { key: 'time', label: 'Time' },
  ]
  return (
    <div className="mt-3">
      <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Filters</p>
      <div className="stat-module-scroll flex gap-1.5 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <button key={filter.key} type="button" onClick={() => onChange(filter.key)} aria-pressed={value === filter.key} className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${value === filter.key ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}>
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ModuleDecisionHeader({ compatibility, onLoadSample, onAddCompare }: { compatibility: ModuleCompatibility; onLoadSample: () => void; onAddCompare: () => void }) {
  const tone = compatibility.score >= 82
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-200'
    : compatibility.score >= 62
      ? 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/25 dark:text-sky-200'
      : compatibility.score >= 42
        ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200'
        : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-200'
  return (
    <section className="mb-3 grid gap-3 lg:grid-cols-[1.1fr_1fr_1fr]">
      <div className={`rounded-xl border p-3 ${tone}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-bold dark:bg-slate-900/40">{compatibility.label} · {compatibility.score}/100</span>
          <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-bold dark:bg-slate-900/40">{compatibility.difficulty}</span>
        </div>
        <p className="mt-2 text-sm font-semibold leading-6">{compatibility.question}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Best used when</p>
        <div className="flex flex-wrap gap-1.5">
          {compatibility.bestUse.map((item) => <span key={item} className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300">{item}</span>)}
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Avoid / fix first</p>
          <div className="flex gap-1.5">
            <button type="button" onClick={onAddCompare} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300">Compare</button>
            <button type="button" onClick={onLoadSample} className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700">Sample</button>
          </div>
        </div>
        <div className="space-y-1.5">
          {compatibility.avoidWhen.map((item) => <p key={item} className="text-xs leading-5 text-slate-500 dark:text-slate-400">{item}</p>)}
          {compatibility.fixes.slice(0, 2).map((fix) => <p key={fix.label} className="rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-700 dark:bg-amber-950/25 dark:text-amber-300"><b>{fix.label}:</b> {fix.detail}</p>)}
        </div>
      </div>
    </section>
  )
}

function ComparisonTray({ snapshots, onClear, onSelect }: { snapshots: ModuleRunSnapshot[]; onClear: () => void; onSelect: (key: string) => void }) {
  return (
    <section className="mb-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Comparison tray</p>
        <button type="button" onClick={onClear} className="text-xs font-semibold text-slate-400 hover:text-rose-500">Clear</button>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {snapshots.map((snapshot) => (
          <button key={snapshot.id} type="button" onClick={() => onSelect(snapshot.moduleKey)} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-indigo-950/25">
            <span className="block truncate text-xs font-bold text-slate-700 dark:text-slate-200">{snapshot.moduleTitle}</span>
            <span className="mt-1 block truncate text-xs text-slate-400">{snapshot.datasetName}</span>
            <span className="mt-2 block text-sm font-bold text-indigo-600 dark:text-indigo-300">{snapshot.metric}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function SelectedInputPreview({ rows }: { rows: Array<{ role: string; name: string; type: string; missing: string; unique: number; sample: string }> }) {
  if (!rows.length) return null
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-700">
      <div className="grid grid-cols-[0.8fr_1fr_0.8fr_0.8fr_0.8fr_1.2fr] bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:bg-slate-900">
        {['Role', 'Column', 'Type', 'Missing', 'Unique', 'Sample'].map((head) => <span key={head} className="px-2 py-2">{head}</span>)}
      </div>
      {rows.map((row) => (
        <div key={`${row.role}-${row.name}`} className="grid grid-cols-[0.8fr_1fr_0.8fr_0.8fr_0.8fr_1.2fr] border-t border-slate-100 text-xs dark:border-slate-700">
          <span className="px-2 py-2 font-semibold text-slate-600 dark:text-slate-300">{row.role}</span>
          <span className="truncate px-2 py-2 text-slate-700 dark:text-slate-200">{row.name}</span>
          <span className="px-2 py-2 text-slate-500">{row.type}</span>
          <span className="px-2 py-2 text-slate-500">{row.missing}</span>
          <span className="px-2 py-2 text-slate-500">{row.unique}</span>
          <span className="truncate px-2 py-2 text-slate-400">{row.sample}</span>
        </div>
      ))}
    </div>
  )
}

function ResultVersionHistory({ snapshots, activeModuleKey, onSelect }: { snapshots: ModuleRunSnapshot[]; activeModuleKey: string; onSelect: (key: string) => void }) {
  const rows = snapshots.filter((snapshot) => snapshot.moduleKey === activeModuleKey).slice(0, 4)
  if (!rows.length) return null
  return (
    <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Version history</p>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {rows.map((snapshot) => (
          <button key={snapshot.id} type="button" onClick={() => onSelect(snapshot.moduleKey)} className="rounded-md bg-white p-2 text-left text-xs shadow-sm dark:bg-slate-800">
            <span className="block font-bold text-slate-700 dark:text-slate-200">{new Date(snapshot.createdAt).toLocaleTimeString()}</span>
            <span className="mt-1 block truncate text-indigo-600 dark:text-indigo-300">{snapshot.metric}</span>
            <span className="mt-1 block truncate text-slate-400">{snapshot.summary}</span>
          </button>
        ))}
      </div>
    </div>
  )
}


function datasetSelectionSummary(dataset: Dataset, selection: Required<StatModuleSelection>) {
  const missing = dataset.schema.reduce((sum, col) => sum + col.missing, 0)
  return {
    name: dataset.name,
    rows: dataset.rows,
    missing,
    fields: [
      { label: 'X', value: selection.num1 },
      { label: 'Y', value: selection.num2 },
      { label: 'Group', value: selection.cat1 },
      { label: 'Target', value: selection.target },
    ].filter((item) => item.value),
  }
}

function buildModuleCompatibility(dataset: Dataset | null, module: typeof STAT_MODULES[number], profile: ModuleProfile, spec: ModuleInputSpec, selection: Required<StatModuleSelection>, inputWarnings: Array<{ field: InputFieldKey; message: string }>): ModuleCompatibility {
  if (!dataset) {
    return {
      score: 0,
      label: 'Needs setup',
      difficulty: module.group === 'Advanced Workflows' || module.id >= 100 ? 'Advanced' : module.group === 'Regression & Modeling' || module.group === 'Inferential' ? 'Applied' : 'Beginner',
      question: profile.question,
      bestUse: [profile.useWhen.replace(/\.$/, '')],
      avoidWhen: ['Load a compatible dataset before running this module.'],
      fixes: [{ label: 'Dataset', detail: 'Load a sample dataset or upload your own data.' }],
      sampleId: sampleIdForModule(module),
    }
  }
  const selected = spec.fields.filter((field) => field !== 'alpha').map((field) => String(selection[field] ?? '')).filter(Boolean)
  const schemas = dataset.schema.filter((col) => selected.includes(col.name))
  const missingPenalty = schemas.reduce((sum, col) => sum + Math.min(18, col.missingPct / 2), 0)
  const uniqueRisk = schemas.some((col) => col.type !== 'numeric' && col.unique > Math.max(20, Math.sqrt(dataset.rows)))
  const nPenalty = dataset.rows < 30 ? 20 : dataset.rows < 100 ? 8 : 0
  const score = Math.round(Math.max(0, Math.min(100, 100 - inputWarnings.length * 16 - missingPenalty - nPenalty - (uniqueRisk ? 10 : 0))))
  const label: ModuleCompatibility['label'] = score >= 86 ? 'Excellent fit' : score >= 70 ? 'Good fit' : score >= 45 ? 'Needs setup' : 'Risky fit'
  const difficulty: ModuleCompatibility['difficulty'] = module.group === 'Advanced Workflows' || module.id >= 100 ? 'Advanced' : module.group === 'Regression & Modeling' || module.group === 'Inferential' ? 'Applied' : 'Beginner'
  const bestUse = [
    profile.useWhen.replace(/\.$/, ''),
    spec.requirements.includes('paired') ? 'paired numeric rows are available' : '',
    spec.requirements.includes('grouped') ? 'groups have enough rows' : '',
    spec.requirements.includes('time') ? 'row order represents time or sequence' : '',
  ].filter(Boolean).slice(0, 3)
  const avoidWhen = [
    inputWarnings.length ? 'Required inputs are missing or incompatible.' : '',
    uniqueRisk ? 'A selected categorical field has too many sparse levels.' : '',
    dataset.rows < 30 ? 'Sample size is small for stable inference.' : '',
    schemas.some((col) => col.missingPct > 20) ? 'Selected columns have high missingness.' : '',
    profile.commonMistakes[0] ?? 'Do not report this module without checking assumptions.',
  ].filter(Boolean).slice(0, 3)
  const fixes = inputWarnings.map((warning) => ({ label: defaultInputLabel(warning.field), detail: warning.message }))
  return {
    score,
    label,
    difficulty,
    question: profile.question,
    bestUse,
    avoidWhen,
    fixes,
    sampleId: sampleIdForModule(module),
  }
}

function buildSelectedInputPreview(dataset: Dataset | null, spec: ModuleInputSpec, selection: Required<StatModuleSelection>) {
  if (!dataset) return []
  return spec.fields
    .filter((field) => field !== 'alpha')
    .map((field) => {
      const name = String(selection[field] ?? '')
      const schema = dataset.schema.find((col) => col.name === name)
      if (!schema) return null
      return {
        role: defaultInputLabel(field),
        name,
        type: schema.type,
        missing: `${schema.missingPct.toFixed(1)}%`,
        unique: schema.unique,
        sample: schema.sample.slice(0, 3).map((item) => String(item)).join(', '),
      }
    })
    .filter(Boolean) as Array<{ role: string; name: string; type: string; missing: string; unique: number; sample: string }>
}

function buildRunSnapshot(dataset: Dataset | null, module: typeof STAT_MODULES[number], selection: Required<StatModuleSelection>, result: StatModuleResult, trust: TrustReport | null): ModuleRunSnapshot {
  const selections = Object.fromEntries(Object.entries(selection).filter(([, value]) => value !== undefined && value !== '')) as Record<string, string | number>
  const metric = result.metrics[0] ? `${result.metrics[0].label}: ${result.metrics[0].value}` : result.summary
  const signature = `${module.key}:${dataset?.id ?? 'none'}:${JSON.stringify(selections)}:${metric}`
  return {
    id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    signature,
    createdAt: Date.now(),
    moduleKey: module.key,
    moduleTitle: module.title.replace(' Module', ''),
    datasetName: dataset?.name ?? 'No dataset',
    summary: result.summary,
    metric,
    score: trust?.score ?? 0,
    selections,
  }
}

function sampleIdForModule(module: typeof STAT_MODULES[number]) {
  const text = `${module.key} ${module.title} ${module.description}`.toLowerCase()
  if (/time|forecast|seasonal|arima|line|area/.test(text)) return 'monthly-sales'
  if (/classification|logistic|roc|pca|cluster|scatter|correlation|regression/.test(text)) return 'iris-flowers'
  if (/anova|group|box|violin|non.parametric|student|education/.test(text)) return 'student-marks'
  if (/quality|control|process|shapiro|levene|gof/.test(text)) return 'manufacturing-defects'
  if (/chi|categor|sankey|bar|pie|donut|pareto|treemap/.test(text)) return 'customer-churn'
  return 'iris-flowers'
}

function buildModuleTrustReport(dataset: Dataset, module: typeof STAT_MODULES[number], profile: ModuleProfile, spec: ModuleInputSpec, selection: Required<StatModuleSelection>, inputWarnings: Array<{ field: InputFieldKey; message: string }>, resultAt: Date): TrustReport {
  const selectedFields = spec.fields
    .filter((field) => field !== 'alpha')
    .map((field) => String(selection[field] ?? ''))
    .filter(Boolean)
  const selectedSchemas = dataset.schema.filter((col) => selectedFields.includes(col.name))
  const selectedMissingPct = selectedSchemas.length ? Math.max(...selectedSchemas.map((col) => col.missingPct)) : 0
  const validRows = selectedFields.length
    ? dataset.data.filter((row) => selectedFields.every((field) => row[field] !== null && row[field] !== undefined && String(row[field]).trim() !== '')).length
    : dataset.rows
  const highCardinality = selectedSchemas.some((col) => col.type !== 'numeric' && col.unique > Math.min(30, dataset.rows * 0.4))
  const idLikeSelected = selectedSchemas.some((col) => col.type === 'id' || col.unique / Math.max(dataset.rows, 1) > 0.95)
  const sparse = spec.requirements.includes('categorical') && selectedSchemas.some((col) => col.type !== 'numeric' && col.unique > Math.max(12, Math.sqrt(dataset.rows)))
  const score = Math.max(0, Math.min(100,
    100
    - inputWarnings.length * 14
    - (validRows < 30 ? 15 : validRows < 100 ? 6 : 0)
    - (selectedMissingPct >= 20 ? 16 : selectedMissingPct > 0 ? 6 : 0)
    - (highCardinality ? 8 : 0)
    - (idLikeSelected ? 12 : 0)
    - (sparse ? 8 : 0)
  ))
  const level: TrustReport['level'] = score >= 82 ? 'Strong' : score >= 62 ? 'Review' : 'Caution'
  const checks: TrustCheck[] = [
    {
      label: 'Inputs',
      status: inputWarnings.length ? 'warn' : 'pass',
      detail: inputWarnings.length ? `${inputWarnings.length} input issue${inputWarnings.length > 1 ? 's' : ''} need attention.` : 'Selected columns match the module requirements.',
    },
    {
      label: 'Rows used',
      status: validRows >= 100 ? 'pass' : validRows >= 30 ? 'info' : 'warn',
      detail: `${validRows.toLocaleString()} valid rows from ${dataset.rows.toLocaleString()} total rows.`,
    },
    {
      label: 'Missing data',
      status: selectedMissingPct >= 20 ? 'warn' : selectedMissingPct > 0 ? 'info' : 'pass',
      detail: selectedMissingPct ? `Highest selected-column missingness is ${selectedMissingPct.toFixed(1)}%.` : 'No missing values detected in selected columns.',
    },
    {
      label: 'Design fit',
      status: idLikeSelected || sparse ? 'warn' : highCardinality ? 'info' : 'pass',
      detail: idLikeSelected ? 'An identifier-like selected column may distort analysis.' : sparse ? 'Categorical levels may be sparse; inspect cell counts.' : highCardinality ? 'A selected category has many levels; consider grouping.' : `${module.group} design is compatible with the selected data shape.`,
    },
  ]
  return {
    score: Math.round(score),
    level,
    checks,
    assumptions: profile.assumptions.slice(0, 4),
    reproducibility: [
      { label: 'module', value: module.key },
      { label: 'dataset', value: dataset.id.slice(0, 8) },
      { label: 'rows', value: String(validRows) },
      { label: 'run', value: resultAt.toLocaleTimeString() },
    ],
  }
}

function buildAnalysisGuide(dataset: Dataset, module: typeof STAT_MODULES[number], profile: ModuleProfile, spec: ModuleInputSpec, trust: TrustReport | null, numericCount: number, catCount: number): AnalysisGuide {
  const stage: AnalysisGuide['stage'] = module.group === 'Charting & Visualization'
    ? 'Explore'
    : module.key.includes('diagnostic') || module.key.includes('assumption') || module.key === 'regression_diagnostics'
      ? 'Diagnose'
      : module.key.includes('report') || module.key.includes('export') || module.key.includes('interpret')
        ? 'Report'
        : 'Model'
  const stepOrder: AnalysisGuide['stage'][] = ['Explore', 'Model', 'Diagnose', 'Report']
  const activeIndex = stepOrder.indexOf(stage)
  const steps = stepOrder.map((label, index) => ({
    label,
    status: index < activeIndex ? 'done' as const : index === activeIndex ? 'active' as const : 'next' as const,
  }))
  const highMissing = dataset.schema.some((col) => col.missingPct >= 20)
  const recommendations: AnalysisGuide['recommendations'] = []

  if (highMissing) {
    recommendations.push({ title: 'Clean missing data first', reason: 'At least one column has 20% or more missing values, so inference should include a cleaning or imputation note.', action: 'Open data prep', path: '/data/clean' })
  }
  if (stage !== 'Explore') {
    recommendations.push({ key: numericCount >= 2 ? 'scatter_plot' : 'histogram', title: numericCount >= 2 ? 'Inspect relationship visually' : 'Inspect distribution shape', reason: 'A quick chart catches outliers, skew, clusters, and scale problems before reading model output.', action: 'Open chart module' })
  }
  if (stage === 'Explore') {
    if (numericCount >= 2) recommendations.push({ key: 'correlation_testing', title: 'Test relationship strength', reason: 'The dataset has at least two numeric columns, so correlation is a natural next check after visual exploration.', action: 'Open correlation' })
    if (numericCount >= 1 && catCount >= 1) recommendations.push({ key: 'anova', title: 'Compare grouped means', reason: 'Numeric plus categorical fields can answer whether groups differ in the selected measure.', action: 'Open ANOVA' })
  }
  if (stage === 'Model') {
    recommendations.push({ key: module.group === 'Regression & Modeling' ? 'regression_diagnostics' : 'effect_size', title: module.group === 'Regression & Modeling' ? 'Check model assumptions' : 'Add practical effect size', reason: module.group === 'Regression & Modeling' ? 'A model should be diagnosed before it becomes a reportable finding.' : 'Effect size separates practical magnitude from p-value evidence.', action: 'Open next module' })
  }
  if (stage === 'Diagnose') {
    recommendations.push({ key: 'plain_language_interpretation', title: 'Translate the result', reason: 'After diagnostics, convert the statistical output into a clear conclusion with limitations.', action: 'Open interpretation' })
  }
  if ((trust?.score ?? 0) >= 75) {
    recommendations.push({ title: 'Draft report section', reason: 'Trust checks look acceptable, so this analysis is ready for a report draft with assumptions and selected variables.', action: 'Open reports', path: '/reports' })
  } else {
    recommendations.push({ key: 'warning_system', title: 'Review warnings', reason: 'Trust checks suggest at least one caveat. Use the warning module before reporting.', action: 'Open warnings' })
  }

  const uniqueRecommendations = recommendations
    .filter((item, index, list) => index === list.findIndex((other) => (other.key ?? other.path ?? other.title) === (item.key ?? item.path ?? item.title)))
    .slice(0, 3)

  return {
    stage,
    question: profile.question,
    nextAction: guideNextAction(stage, module, spec, trust),
    steps,
    recommendations: uniqueRecommendations,
  }
}

function buildDataPreparationReport(dataset: Dataset, module: typeof STAT_MODULES[number], spec: ModuleInputSpec, selection: Required<StatModuleSelection>, trust: TrustReport | null): DataPreparationReport {
  const roleLabels: Record<InputFieldKey, string> = {
    num1: 'Primary numeric',
    num2: 'Second numeric',
    num3: 'Third numeric',
    target: 'Target',
    cat1: 'Primary group',
    cat2: 'Second group',
    alpha: 'Alpha',
  }
  const selectedColumns = spec.fields
    .filter((field) => field !== 'alpha')
    .map((field) => {
      const name = String(selection[field] ?? '')
      const schema = dataset.schema.find((col) => col.name === name)
      return schema ? { name, type: schema.type, missingPct: schema.missingPct, unique: schema.unique, role: roleLabels[field] } : null
    })
    .filter(Boolean) as DataPreparationReport['selectedColumns']
  const highMissing = selectedColumns.filter((col) => col.missingPct >= 20)
  const anyMissing = selectedColumns.filter((col) => col.missingPct > 0)
  const idLike = selectedColumns.filter((col) => col.unique / Math.max(dataset.rows, 1) > 0.95)
  const highCardinality = selectedColumns.filter((col) => ['categorical', 'text', 'id'].includes(col.type) && col.unique > Math.max(15, Math.sqrt(dataset.rows)))
  const numericSelected = selectedColumns.filter((col) => col.type === 'numeric')
  const actions: DataPreparationReport['actions'] = []

  if (highMissing.length) {
    actions.push({ title: 'Handle high missingness', detail: `${highMissing.map((col) => col.name).join(', ')} need imputation, filtering, or a complete-case note.`, path: '/data/clean', tone: 'warn' })
  } else if (anyMissing.length) {
    actions.push({ title: 'Document missing values', detail: `${anyMissing.length} selected column${anyMissing.length > 1 ? 's have' : ' has'} some missing values. Record handling before reporting.`, path: '/data/clean', tone: 'info' })
  } else {
    actions.push({ title: 'Missingness looks clean', detail: 'Selected columns have no detected missing values. Continue to assumptions and reporting.', path: '/data/preview', tone: 'ok' })
  }
  if (idLike.length) {
    actions.push({ title: 'Remove identifier leakage', detail: `${idLike.map((col) => col.name).join(', ')} looks ID-like. Avoid it as a predictor or grouping variable.`, path: '/data/workbench', tone: 'warn' })
  }
  if (highCardinality.length) {
    actions.push({ title: 'Group long categories', detail: `${highCardinality.map((col) => col.name).join(', ')} has many levels. Consider recoding or top-N grouping.`, path: '/data/workbench', tone: 'info' })
  }
  if (numericSelected.length && ['simple_regression', 'multiple_regression', 'polynomial_regression', 'gof_distribution', 'histogram'].includes(module.key)) {
    actions.push({ title: 'Check transforms/outliers', detail: 'Numeric modeling may benefit from log, z-score, or outlier review before final interpretation.', path: '/data/workbench', tone: (trust?.score ?? 100) < 75 ? 'warn' : 'info' })
  }
  if (spec.requirements.includes('grouped')) {
    actions.push({ title: 'Verify group balance', detail: 'Grouped methods need enough rows per level. Inspect frequency tables before trusting p-values.', path: '/data/workbench', tone: 'info' })
  }
  if (!actions.some((item) => item.path === '/data/workbench')) {
    actions.push({ title: 'Open preparation workbench', detail: 'Use variable view, quality checks, transforms, and reproducible log before final reporting.', path: '/data/workbench', tone: 'info' })
  }
  const readiness: DataPreparationReport['readiness'] = highMissing.length || idLike.length ? 'High Risk' : (trust?.score ?? 100) < 82 || anyMissing.length || highCardinality.length ? 'Prepare' : 'Ready'
  return {
    readiness,
    selectedColumns: selectedColumns.length ? selectedColumns : dataset.schema.slice(0, 4).map((col) => ({ name: col.name, type: col.type, missingPct: col.missingPct, unique: col.unique, role: 'Available' })),
    actions: actions.slice(0, 4),
    auditSummary: `This analysis state tracks ${module.title.replace(' Module', '')}, selected variables, assumptions, trust score, and export/copy/save actions in the shared analysis history.`,
  }
}

function buildModuleReportPackage(dataset: Dataset, module: typeof STAT_MODULES[number], profile: ModuleProfile, selection: Required<StatModuleSelection>, result: StatModuleResult, trust: TrustReport | null, preparation: DataPreparationReport | null, guide: AnalysisGuide | null): ModuleReportPackage {
  const selections = Object.fromEntries(Object.entries(selection).filter(([, value]) => value !== undefined && value !== '')) as Record<string, string | number>
  const metricText = result.metrics.length ? result.metrics.map((metric) => `${metric.label}=${metric.value}`).join(', ') : 'no numeric metrics returned'
  const trustText = trust ? `Trust level: ${trust.level} (${trust.score}/100).` : 'Trust checks were not available.'
  const prepText = preparation ? `Preparation readiness: ${preparation.readiness}.` : 'Preparation readiness was not available.'
  return {
    app: 'StatAnveshak',
    type: 'stat-module-report',
    version: 1,
    createdAt: new Date().toISOString(),
    dataset: { id: dataset.id, name: dataset.name, rows: dataset.rows, columns: dataset.cols },
    module: { key: module.key, id: module.id, title: module.title, group: module.group, question: profile.question },
    selections,
    method: `${module.title.replace(' Module', '')}. ${profile.useWhen}`,
    result,
    trust,
    preparation,
    guide,
    reportText: `${result.title}: ${result.summary} Key output: ${metricText}. ${trustText} ${prepText} Interpret this result with the listed assumptions and selected-variable caveats.`,
    reproducibleRecipe: [
      `Load dataset "${dataset.name}" (${dataset.rows} rows, ${dataset.cols} columns).`,
      `Open Stat Modules and select "${module.title.replace(' Module', '')}".`,
      `Use selections: ${Object.entries(selections).map(([key, value]) => `${key}=${value}`).join(', ') || 'defaults'}.`,
      `Run the module and record metrics: ${metricText}.`,
      `Review trust checks: ${trust?.checks.map((check) => `${check.label}: ${check.status}`).join(', ') ?? 'not available'}.`,
      `Document assumptions: ${profile.assumptions.join('; ')}.`,
      'Export Markdown, HTML, JSON, and chart PNG artifacts for the final report.',
    ],
  }
}

function buildModelValidationReport(dataset: Dataset, module: typeof STAT_MODULES[number], spec: ModuleInputSpec, selection: Required<StatModuleSelection>, result: StatModuleResult, trust: TrustReport | null, preparation: DataPreparationReport | null): ModelValidationReport {
  const isModel = module.group === 'Regression & Modeling' || /regression|model|forecast|classification|pca|cluster|survival|bayesian|train|validation/i.test(module.key)
  const isReferenceModule = ['engine_unit_tests', 'golden_value_tests'].includes(module.key)
  const selectedFields = spec.fields.filter((field) => field !== 'alpha').map((field) => String(selection[field] ?? '')).filter(Boolean)
  const validRows = selectedFields.length
    ? dataset.data.filter((row) => selectedFields.every((field) => row[field] !== null && row[field] !== undefined && String(row[field]).trim() !== '')).length
    : dataset.rows
  const hasTable = Boolean(result.table?.length)
  const hasChart = Boolean(result.chart?.data?.length)
  const highRisk = trust?.level === 'Caution' || preparation?.readiness === 'High Risk'
  const checks: ModelValidationReport['checks'] = [
    { label: 'Holdout readiness', status: validRows >= 80 ? 'pass' : validRows >= 30 ? 'info' : 'warn', detail: validRows >= 80 ? `${validRows} valid rows can support a basic train/test split.` : `${validRows} valid rows; use bootstrap or simpler diagnostics before heavy validation.` },
    { label: 'Output completeness', status: hasTable && hasChart ? 'pass' : hasTable || hasChart ? 'info' : 'warn', detail: hasTable && hasChart ? 'Both table and chart outputs are available for review.' : hasTable ? 'Table output is available; add a visual diagnostic when possible.' : hasChart ? 'Chart output is available; export metrics/table for reporting.' : 'No table/chart artifact was returned by this module.' },
    { label: 'Risk gate', status: highRisk ? 'warn' : 'pass', detail: highRisk ? 'Trust or preparation checks indicate caveats before advanced modeling.' : 'Trust and preparation checks are acceptable for the next validation step.' },
    { label: 'Reference coverage', status: isReferenceModule ? 'pass' : 'info', detail: isReferenceModule ? 'This module is itself a QA/reference-check module.' : 'Use engine and golden-value modules before treating calculations as release-grade.' },
  ]
  const advancedModules: ModelValidationReport['advancedModules'] = []
  if (isModel && !['regression_diagnostics', 'train_test_cv'].includes(module.key)) {
    advancedModules.push({ key: 'regression_diagnostics', title: 'Regression Diagnostics', reason: 'Check residual pattern, leverage, Cook distance, and predictor stability before reporting a model.' })
  }
  if (isModel && module.key !== 'train_test_cv') {
    advancedModules.push({ key: 'train_test_cv', title: 'Train/Test and Cross-Validation', reason: 'Estimate out-of-sample behavior instead of relying only on in-sample fit.' })
  }
  if (/regression|model|outlier|scatter|correlation/i.test(`${module.key} ${module.title}`) && module.key !== 'robust_regression') {
    advancedModules.push({ key: 'robust_regression', title: 'Robust Regression', reason: 'Compare against an outlier-resistant fit when unusual rows may pull coefficients.' })
  }
  if (isModel && module.key !== 'model_comparison') {
    advancedModules.push({ key: 'model_comparison', title: 'Model Comparison Dashboard', reason: 'Compare ordinary, regularized, robust, and baseline model summaries.' })
  }
  advancedModules.push({ key: 'engine_unit_tests', title: 'Engine Unit Tests', reason: 'Confirm core calculation families are covered by deterministic sanity checks.' })
  advancedModules.push({ key: 'golden_value_tests', title: 'Golden-Value Tests', reason: 'Anchor outputs against known R/SPSS/SciPy-style reference targets.' })

  return {
    status: isReferenceModule ? 'Reference check' : highRisk || (isModel && validRows < 80) ? 'Needs validation' : 'Validated',
    focus: isModel
      ? 'Use validation modules to separate model fit, generalization, robustness, and reference-quality computation.'
      : 'Even non-model modules benefit from reference checks, artifact completeness, and release-grade QA coverage.',
    checks,
    advancedModules: advancedModules
      .filter((item, index, list) => item.key !== module.key && index === list.findIndex((other) => other.key === item.key))
      .slice(0, 4),
    referencePlan: [
      'Run current module with selected variables and record trust score.',
      'Compare output shape against the module result table and chart artifacts.',
      'Run Engine Unit Tests for deterministic sanity coverage.',
      'Run Golden-Value Tests before release or high-stakes reporting.',
      'Record validation action in the report package JSON.',
    ],
  }
}

function buildWorkspaceHandoffReport(dataset: Dataset, activeProject: Project | null, module: typeof STAT_MODULES[number], result: StatModuleResult, history: AnalysisLogEntry[], reportPackage: ModuleReportPackage | null): WorkspaceHandoffReport {
  const cells = dataset.rows * dataset.cols
  const scale: WorkspaceHandoffReport['scale'] = cells > 1_000_000 || dataset.rows > 100_000 ? 'Heavy' : cells > 100_000 || dataset.rows > 10_000 ? 'Moderate' : 'Light'
  const scaleDetail = scale === 'Heavy'
    ? 'Large-data workflow: prefer sampled previews, DuckDB query pages, workerized schema detection, and exported bundles rather than huge visual renders.'
    : scale === 'Moderate'
      ? 'Moderate-size workflow: charts should stay responsive, but table previews and report exports should remain scoped.'
      : 'Light browser workflow: current dataset size is comfortable for local interactive analysis.'
  const hasProject = Boolean(activeProject)
  const hasReport = Boolean(reportPackage)
  const hasHistory = history.length > 0
  return {
    scale,
    scaleDetail,
    projectName: activeProject?.name ?? 'No active project',
    handoffItems: [
      { label: 'Project', value: hasProject ? `${activeProject!.name} is active.` : 'Create or save a snapshot to attach this analysis to a project.', status: hasProject ? 'ready' : 'review' },
      { label: 'Dataset', value: `${dataset.name}: ${dataset.rows.toLocaleString()} rows x ${dataset.cols} columns.`, status: 'ready' },
      { label: 'Module state', value: `${module.title.replace(' Module', '')}: ${result.summary}`, status: 'ready' },
      { label: 'Report package', value: hasReport ? 'Markdown, HTML, JSON, and chart PNG exports are available.' : 'Generate module output before exporting a report package.', status: hasReport ? 'ready' : 'review' },
      { label: 'Analysis history', value: hasHistory ? `${history.length} notebook/audit entries are available for handoff.` : 'Run, save, copy, or export actions to build audit history.', status: hasHistory ? 'ready' : 'review' },
      { label: 'Scale path', value: scale === 'Heavy' ? 'Use Query/Workbench for large-data filtering before visual modules.' : 'Interactive modules are suitable for current size.', status: scale === 'Heavy' ? 'review' : 'ready' },
    ],
    savedWorkflow: [
      'Load or import the workspace bundle.',
      'Open the active project and attached dataset.',
      `Navigate to Stat Modules > ${module.title.replace(' Module', '')}.`,
      'Review trust, preparation, reporting, and validation panels.',
      'Use report package exports for final handoff.',
    ],
  }
}

function moduleReportMarkdown(pkg: ModuleReportPackage) {
  const metrics = pkg.result.metrics.map((metric) => `| ${metric.label} | ${metric.value} |`).join('\n') || '| - | - |'
  const selections = Object.entries(pkg.selections).map(([key, value]) => `| ${key} | ${value} |`).join('\n') || '| - | - |'
  const checks = pkg.trust?.checks.map((check) => `| ${check.label} | ${check.status} | ${check.detail} |`).join('\n') ?? '| - | - | - |'
  const prep = pkg.preparation?.actions.map((action) => `- **${action.title}:** ${action.detail}`).join('\n') ?? '- No preparation actions recorded.'
  return `# ${pkg.module.title.replace(' Module', '')} Report

Generated: ${new Date(pkg.createdAt).toLocaleString()}

## Dataset
${pkg.dataset.name}: ${pkg.dataset.rows} rows, ${pkg.dataset.columns} columns

## Question
${pkg.module.question}

## Method
${pkg.method}

## Selected Variables
| Field | Value |
|---|---|
${selections}

## Results
${pkg.result.summary}

| Metric | Value |
|---|---:|
${metrics}

## Trust Checks
Trust level: ${pkg.trust?.level ?? 'Not available'} (${pkg.trust?.score ?? '-'} / 100)

| Check | Status | Detail |
|---|---|---|
${checks}

## Data Preparation
Readiness: ${pkg.preparation?.readiness ?? 'Not available'}

${prep}

## Report Wording
${pkg.reportText}

## Reproducible Recipe
${pkg.reproducibleRecipe.map((step, index) => `${index + 1}. ${step}`).join('\n')}
`
}

function moduleReportHtml(pkg: ModuleReportPackage) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${reportEscape(pkg.module.title)} Report</title><style>
body{font-family:Inter,system-ui,sans-serif;margin:36px;color:#1f2937;line-height:1.55}h1{color:#4338ca}h2{margin-top:28px;color:#334155;border-bottom:1px solid #e5e7eb;padding-bottom:6px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid #e5e7eb;padding:8px;text-align:left}.meta,.box{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:12px}.badge{display:inline-block;border-radius:999px;background:#eef2ff;color:#4338ca;padding:4px 10px;font-size:12px;font-weight:700}</style></head><body>
<h1>${reportEscape(pkg.module.title.replace(' Module', ''))}</h1>
<p class="meta">Dataset: ${reportEscape(pkg.dataset.name)} | ${pkg.dataset.rows} rows x ${pkg.dataset.columns} columns | Generated: ${new Date(pkg.createdAt).toLocaleString()}</p>
<p><span class="badge">Trust: ${reportEscape(pkg.trust?.level ?? 'Not available')} ${pkg.trust?.score ?? '-'}/100</span></p>
<h2>Question</h2><p>${reportEscape(pkg.module.question)}</p>
<h2>Method</h2><p>${reportEscape(pkg.method)}</p>
<h2>Results</h2><p>${reportEscape(pkg.result.summary)}</p>
<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${pkg.result.metrics.map((metric) => `<tr><td>${reportEscape(metric.label)}</td><td>${reportEscape(metric.value)}</td></tr>`).join('') || '<tr><td>-</td><td>-</td></tr>'}</tbody></table>
<h2>Trust Checks</h2><table><thead><tr><th>Check</th><th>Status</th><th>Detail</th></tr></thead><tbody>${pkg.trust?.checks.map((check) => `<tr><td>${reportEscape(check.label)}</td><td>${reportEscape(check.status)}</td><td>${reportEscape(check.detail)}</td></tr>`).join('') ?? '<tr><td>-</td><td>-</td><td>-</td></tr>'}</tbody></table>
<h2>Data Preparation</h2><p>${reportEscape(pkg.preparation?.readiness ?? 'Not available')}</p><ul>${pkg.preparation?.actions.map((action) => `<li><b>${reportEscape(action.title)}:</b> ${reportEscape(action.detail)}</li>`).join('') ?? '<li>No preparation actions recorded.</li>'}</ul>
<h2>Report Wording</h2><div class="box">${reportEscape(pkg.reportText)}</div>
<h2>Reproducible Recipe</h2><ol>${pkg.reproducibleRecipe.map((step) => `<li>${reportEscape(step)}</li>`).join('')}</ol>
</body></html>`
}

function reportEscape(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char))
}

function guideNextAction(stage: AnalysisGuide['stage'], module: typeof STAT_MODULES[number], spec: ModuleInputSpec, trust: TrustReport | null) {
  if ((trust?.score ?? 100) < 62) return 'Fix the highlighted data or input caveats before treating this result as report-ready.'
  if (stage === 'Explore') return 'Use this visual evidence to choose a test or model that matches the pattern you see.'
  if (stage === 'Model') return spec.requirements.includes('paired') ? 'Read fit/evidence, then check diagnostics for residual pattern and influential rows.' : 'Read the result, then add effect size or uncertainty before reporting.'
  if (stage === 'Diagnose') return 'Resolve assumption warnings or document limitations, then translate the result into plain language.'
  return `Export ${module.title.replace(' Module', '')} with assumptions, selected variables, and reproducibility metadata.`
}

function validateModuleInputs(spec: ModuleInputSpec, selection: Required<StatModuleSelection>, numericCols: string[], catCols: string[], dataRows: Record<string, unknown>[]) {
  const warnings: Array<{ field: InputFieldKey; message: string }> = []
  spec.fields.forEach((field) => {
    if (field === 'alpha') return
    const value = String(selection[field] ?? '')
    if (!value) warnings.push({ field, message: `${defaultInputLabel(field)} is required for this module.` })
    if (['num1', 'num2', 'num3', 'target'].includes(field) && !numericCols.includes(value)) warnings.push({ field, message: `${defaultInputLabel(field)} should be numeric.` })
    if (['cat1', 'cat2'].includes(field) && catCols.length > 0 && !catCols.includes(value)) warnings.push({ field, message: `${defaultInputLabel(field)} should be categorical.` })
  })
  if (spec.requirements.includes('paired') && numericColumn(dataRows, selection.num1).length !== numericColumn(dataRows, selection.num2).length) warnings.push({ field: 'num2', message: 'Paired modules need matching valid rows for the selected numeric columns.' })
  if (spec.requirements.includes('binary')) {
    const target = numericColumn(dataRows, selection.target)
    const unique = new Set(target.map((value) => value > 0 ? 1 : 0))
    if (target.length === 0 || unique.size < 2) warnings.push({ field: 'target', message: 'Classification modules need a binary target with both classes present.' })
  }
  return warnings
}

function recommendNextModule(module: typeof STAT_MODULES[number], numericCount: number, catCount: number) {
  const key = module.group === 'Charting & Visualization'
    ? numericCount >= 2 ? 'correlation_testing' : 'confidence_interval'
    : module.group === 'Inferential'
      ? numericCount >= 2 ? 'simple_regression' : 'histogram'
      : module.group === 'Regression & Modeling'
        ? 'regression_diagnostics'
        : catCount >= 2 ? 'chi_square' : 'histogram'
  return STAT_MODULES.find((item) => item.key === key && item.key !== module.key) ?? null
}

function defaultInputLabel(field: InputFieldKey) {
  const labels: Record<InputFieldKey, string> = {
    num1: 'Numeric 1',
    num2: 'Numeric 2',
    num3: 'Numeric 3',
    cat1: 'Category 1',
    cat2: 'Category 2',
    target: 'Target',
    alpha: 'Alpha',
  }
  return labels[field]
}

function inputFieldHint(field: InputFieldKey) {
  if (field === 'target') return 'Outcome column used by prediction or classification modules.'
  if (field === 'alpha') return 'Decision threshold for inferential modules.'
  if (field.startsWith('cat')) return 'Grouping or label column; low-cardinality categories work best.'
  return 'Numeric measurement column used for calculations and visual axes.'
}

function ModuleTheoryPanel({ module, profile, learning, compact }: { module: typeof STAT_MODULES[number]; profile: ModuleProfile; learning: ModuleLearningContent; compact: boolean }) {
  return (
    <section className={`mb-4 space-y-3 ${compact ? 'text-sm' : ''}`} aria-label={`${module.title.replace(' Module', '')} learning content`}>
      <div className="grid gap-3 xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/30">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300">Learn mode</span>
            <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200">{module.group}</span>
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">Question</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">{profile.question}</p>
          <p className="mt-3 text-xs leading-5 text-indigo-700 dark:text-indigo-200">{profile.useWhen}</p>
          <GlossaryChips terms={learning.glossaryTerms} />
        </div>
        <WorkedExampleCard example={learning.workedExample} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {learning.formulas.map((formula) => (
          <FormulaCard key={formula.label} formula={formula} />
        ))}
      </div>

      <GlossaryReference terms={learning.glossaryTerms} />

      <div className={`grid gap-3 ${compact ? 'lg:grid-cols-3' : 'xl:grid-cols-[1fr_1fr_1fr_0.9fr]'}`}>
        <GuideCard title="Academic Notes" items={learning.academicNotes} tone="slate" />
        <GuideCard title="Do Not Use When" items={learning.misuseWarnings} tone="rose" />
        <GuideCard title="Assumptions" items={profile.assumptions} tone="amber" />
        <GuideCard title="Citations" items={learning.citations} tone="emerald" />
      </div>

      <div className={`grid gap-3 ${compact ? 'lg:grid-cols-2' : 'xl:grid-cols-[1fr_1fr]'}`}>
        <GuideCard title="Workflow" items={profile.workflow} />
        <GuideCard title="Interpretation Guidance" items={profile.readResult} tone="indigo" />
      </div>
    </section>
  )
}

function FormulaCard({ formula }: { formula: ModuleLearningContent['formulas'][number] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{formula.label}</p>
      <code className="mt-3 block rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white dark:bg-black">{formula.expression}</code>
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{formula.note}</p>
    </div>
  )
}

function WorkedExampleCard({ example }: { example: ModuleLearningContent['workedExample'] }) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/25">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">Worked example</p>
      <h3 className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">{example.title}</h3>
      <p className="mt-2 text-xs leading-5 text-emerald-800 dark:text-emerald-200">{example.setup}</p>
      <ol className="mt-3 space-y-1.5 text-xs leading-5 text-slate-700 dark:text-slate-200">
        {example.steps.map((step, index) => <li key={step}>{index + 1}. {step}</li>)}
      </ol>
      <p className="mt-3 rounded-lg bg-white/80 p-2 text-xs font-semibold leading-5 text-emerald-800 dark:bg-slate-900/70 dark:text-emerald-200">{example.takeaway}</p>
    </div>
  )
}

function GlossaryChips({ terms }: { terms: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Glossary terms">
      {terms.map((term) => (
        <a key={term} href={`#glossary-${term.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} title={glossaryDefinition(term)} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm hover:bg-indigo-100 dark:bg-slate-900 dark:text-indigo-200 dark:hover:bg-indigo-900/50">
          {term}
        </a>
      ))}
    </div>
  )
}

function GlossaryReference({ terms }: { terms: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Glossary</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {terms.map((term) => (
          <div key={term} id={`glossary-${term.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{term}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{glossaryDefinition(term)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function glossaryDefinition(term: string) {
  const definitions: Record<string, string> = {
    'p-value': 'Probability of a result at least this extreme if the null model were true.',
    alpha: 'Decision threshold for rejecting the null hypothesis.',
    'confidence interval': 'Range of plausible population values under a chosen confidence level.',
    'effect size': 'Practical magnitude of a difference or association.',
    'standard error': 'Estimated sampling variability of an estimate.',
    R2: 'Share of response variation explained by a regression model.',
    'adjusted R2': 'R2 adjusted for predictor count.',
    coefficient: 'Model estimate for the effect or association of a predictor.',
    residual: 'Observed value minus fitted value.',
    precision: 'Share of predicted positives that are truly positive.',
    recall: 'Share of actual positives that are found.',
    F1: 'Harmonic mean of precision and recall.',
    'ROC AUC': 'Ranking ability across classification thresholds.',
    threshold: 'Cutoff used to convert a score into a class.',
    'odds ratio': 'Multiplicative change in odds for a predictor change.',
    histogram: 'Chart showing counts across numeric bins.',
    density: 'Scaled distribution shape where area is comparable.',
    outlier: 'Observation far from the main pattern.',
    distribution: 'Pattern of values in a variable.',
    quartile: 'Cut point dividing ordered data into quarters.',
    PCA: 'Method that rotates variables into components explaining variance.',
    loading: 'Weight showing how a variable contributes to a component.',
    'explained variance': 'Share of total variation captured by a component or model.',
    cluster: 'Group of nearby observations under a distance rule.',
    bootstrap: 'Resampling rows with replacement to estimate uncertainty.',
    'permutation test': 'Shuffling labels to build a null distribution.',
    reproducibility: 'Ability to rerun the same analysis from recorded inputs and settings.',
  }
  return definitions[term] ?? 'Key term used by this module. See the learning notes and result guidance for interpretation.'
}

function ResultReadingPanel({ profile }: { profile: ModuleProfile }) {
  return (
    <div className="mt-4 grid gap-3 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200 lg:grid-cols-2">
      <div>
        <div className="mb-2 font-semibold">How to read this module</div>
        <ul className="space-y-1.5">
          {profile.readResult.map((item) => <li key={item}>- {item}</li>)}
        </ul>
      </div>
      <div>
        <div className="mb-2 font-semibold">Common mistakes</div>
        <ul className="space-y-1.5">
          {profile.commonMistakes.map((item) => <li key={item}>- {item}</li>)}
        </ul>
      </div>
    </div>
  )
}

function ModuleRecoveryPanel({ module, profile, inputWarnings, result, onLoadSample, onReset }: { module: typeof STAT_MODULES[number]; profile: ModuleProfile; inputWarnings: Array<{ field: InputFieldKey; message: string }>; result: StatModuleResult; onLoadSample: () => void; onReset: () => void }) {
  const failed = result.metrics.length === 0 || (result.notes ?? []).some((note) => /failed|not enough|not estimable|invalid/i.test(note))
  if (!failed && inputWarnings.length === 0) return null
  const fixes = moduleRecoveryFixes(module, profile, inputWarnings, result)
  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/25" role="alert" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 dark:bg-slate-900 dark:text-amber-300">
            <AlertTriangle size={17} />
          </span>
          <div>
            <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Make this module run cleanly</p>
            <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-200">{profile.dataShape}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onReset} className="rounded-md border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-200 dark:hover:bg-amber-950/40">Reset inputs</button>
          <button type="button" onClick={onLoadSample} className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">Load matching sample</button>
        </div>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {fixes.map((fix) => (
          <div key={fix.title} className="rounded-lg bg-white/80 p-3 text-xs dark:bg-slate-900/70">
            <p className="font-bold text-amber-900 dark:text-amber-100">{fix.title}</p>
            <p className="mt-1 leading-5 text-amber-800 dark:text-amber-200">{fix.detail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function moduleRecoveryFixes(module: typeof STAT_MODULES[number], profile: ModuleProfile, inputWarnings: Array<{ field: InputFieldKey; message: string }>, result: StatModuleResult) {
  const fixes = inputWarnings.map((warning) => ({
    title: `${defaultInputLabel(warning.field)} needs attention`,
    detail: warning.message,
  }))
  if (/regression|correlation|pca|scatter|cluster/i.test(module.key)) fixes.push({ title: 'Use complete numeric pairs', detail: 'Choose two different numeric columns with at least two complete rows after missing values are filtered.' })
  if (/anova|box|violin|kruskal|levene|permutation|effect/i.test(module.key)) fixes.push({ title: 'Check group balance', detail: 'Use a categorical group with at least two levels and enough numeric rows inside each group.' })
  if (/chi|fisher|sankey|heatmap/i.test(module.key)) fixes.push({ title: 'Check category levels', detail: 'Pick two categorical columns with at least two usable levels; combine rare levels when cells are sparse.' })
  if (/classification|logistic|roc/i.test(module.key)) fixes.push({ title: 'Use a binary target', detail: 'Select a target column coded with two levels, then use numeric scores or predictors for the model inputs.' })
  if (/time|forecast|seasonal|arima|survival/i.test(module.key)) fixes.push({ title: 'Confirm row order', detail: 'Use an ordered time/index variable and enough sequential numeric values before reading trend or survival output.' })
  if (result.metrics.length === 0) fixes.push({ title: 'Try the module sample', detail: `Load a sample shaped for ${module.title.replace(' Module', '')}, then replace one input at a time with your dataset columns.` })
  if (!fixes.length) fixes.push({ title: 'Use the intended data shape', detail: profile.dataShape })
  return fixes.slice(0, 4)
}

function GuideCard({ title, items, tone = 'slate' }: { title: string; items: string[]; tone?: 'slate' | 'amber' | 'emerald' | 'rose' | 'indigo' }) {
  const toneClass = tone === 'amber'
    ? 'border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200'
    : tone === 'emerald'
      ? 'border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200'
      : tone === 'rose'
        ? 'border-rose-100 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200'
        : tone === 'indigo'
          ? 'border-indigo-100 bg-indigo-50 text-indigo-800 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-200'
          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide opacity-70">{title}</p>
      <ul className="space-y-2 text-xs leading-5">
        {items.map((item) => <li key={item}>- {item}</li>)}
      </ul>
    </div>
  )
}

function ModuleVisualWorkbench({ module, profile, dataRows, selection, result, compact }: { module: typeof STAT_MODULES[number]; profile: ModuleProfile; dataRows: Record<string, unknown>[]; selection: Required<StatModuleSelection>; result: StatModuleResult; compact: boolean }) {
  const [bins, setBins] = useState(14)
  const [topN, setTopN] = useState(8)
  const [threshold, setThreshold] = useState(0.5)
  const [smooth, setSmooth] = useState(5)
  const [showDensity, setShowDensity] = useState(true)
  const [showOutliers, setShowOutliers] = useState(true)
  const [showResiduals, setShowResiduals] = useState(false)
  const values = numericColumn(dataRows, selection.num1)
  const second = numericColumn(dataRows, selection.num2)
  const third = numericColumn(dataRows, selection.num3)
  const pairs = pairedRows(dataRows, selection.num1, selection.num2)
  const counts = categoryCounts(dataRows, selection.cat1).slice(0, topN)
  const pairCounts = categoryPairCounts(dataRows, selection.cat1, selection.cat2).slice(0, topN)
  const blueprint = MODULE_LAB_BLUEPRINTS[module.key]
  const emptyState = moduleWorkbenchEmptyState(module, values, pairs, counts, pairCounts)

  return (
    <section className={`mb-4 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{moduleWorkbenchTitle(module)}</h2>
          <p className="mt-1 text-xs text-slate-400">{profile.interactiveTools.join(' / ')}</p>
        </div>
        <WorkbenchControls
          module={module}
          bins={bins}
          setBins={setBins}
          topN={topN}
          setTopN={setTopN}
          threshold={threshold}
          setThreshold={setThreshold}
          smooth={smooth}
          setSmooth={setSmooth}
          showDensity={showDensity}
          setShowDensity={setShowDensity}
          showOutliers={showOutliers}
          setShowOutliers={setShowOutliers}
          showResiduals={showResiduals}
          setShowResiduals={setShowResiduals}
        />
      </div>

      {blueprint && <ModuleDepthBlueprint blueprint={blueprint} />}

      {emptyState ? (
        <EmptyVisual title={emptyState.title} detail={emptyState.detail} />
      ) : (
        <Fragment>

      {module.group === 'Charting & Visualization' && (
        <ChartModuleWorkbench moduleKey={module.key} values={values} second={second} third={third} pairs={pairs} counts={counts} pairCounts={pairCounts} bins={bins} showDensity={showDensity} showOutliers={showOutliers} showResiduals={showResiduals} />
      )}
      {module.group === 'Regression & Modeling' && (
        <ModelingWorkbench moduleKey={module.key} values={values} second={second} pairs={pairs} result={result} threshold={threshold} smooth={smooth} showResiduals={showResiduals} />
      )}
      {module.group === 'Inferential' && (
        <InferentialWorkbench moduleKey={module.key} values={values} second={second} pairs={pairs} counts={counts} pairCounts={pairCounts} alpha={selection.alpha} result={result} />
      )}
      {module.group === 'Advanced Workflows' && (
        <AdvancedWorkflowWorkbench moduleKey={module.key} values={values} second={second} third={third} pairs={pairs} counts={counts} pairCounts={pairCounts} result={result} smooth={smooth} threshold={threshold} />
      )}
        </Fragment>
      )}
    </section>
  )
}

function moduleWorkbenchEmptyState(module: typeof STAT_MODULES[number], values: number[], pairs: [number, number][], counts: Array<{ label: string; count: number }>, pairCounts: Array<{ source: string; target: string; count: number }>) {
  const title = `${module.title.replace(' Module', '')} needs compatible data`
  const reqs = moduleRequirementBadges(module)
  if (reqs.includes('Paired') && pairs.length < 2) return { title, detail: 'Select two numeric columns with at least two complete paired rows. Missing, blank, or text values are filtered before drawing.' }
  if (reqs.includes('Grouped') && counts.length < 2) return { title, detail: 'Select a categorical group column with at least two usable levels and a numeric measure for each group.' }
  if (reqs.includes('Categorical') && pairCounts.length === 0 && /chi|heatmap|sankey|fisher/i.test(module.key)) return { title, detail: 'Select two categorical columns that form a non-empty contingency table.' }
  if (reqs.includes('Categorical') && counts.length === 0) return { title, detail: 'Select a categorical column with at least one non-empty level.' }
  if (reqs.includes('Numeric') && values.length === 0) return { title, detail: 'Select a numeric column with valid values. Blank cells and text values are ignored.' }
  return null
}

function WorkbenchControls({ module, bins, setBins, topN, setTopN, threshold, setThreshold, smooth, setSmooth, showDensity, setShowDensity, showOutliers, setShowOutliers, showResiduals, setShowResiduals }: { module: typeof STAT_MODULES[number]; bins: number; setBins: (value: number) => void; topN: number; setTopN: (value: number) => void; threshold: number; setThreshold: (value: number) => void; smooth: number; setSmooth: (value: number) => void; showDensity: boolean; setShowDensity: (value: boolean) => void; showOutliers: boolean; setShowOutliers: (value: boolean) => void; showResiduals: boolean; setShowResiduals: (value: boolean) => void }) {
  const wantsBins = ['histogram', 'density_plot', 'qq_plot', 'ecdf_plot', 'gof_distribution', 'shapiro_wilk'].includes(module.key)
  const wantsTop = module.group === 'Charting & Visualization' || ['chi_square', 'fisher_exact', 'merge_join_append'].includes(module.key)
  const wantsThreshold = ['logistic_regression', 'classification_metrics', 'logistic_se_pvalues', 'roc_auc', 'classification_models'].includes(module.key)
  const wantsSmooth = ['time_series_basics', 'forecasting_basics', 'arima_ets', 'seasonal_decomposition', 'control_chart', 'line_chart', 'area_chart'].includes(module.key)
  const wantsDensity = ['histogram', 'density_plot', 'gof_distribution'].includes(module.key)
  const wantsOutliers = ['box_plot', 'violin_plot', 'scatter_plot', 'simple_regression', 'regression_diagnostics'].includes(module.key)
  const wantsResiduals = ['scatter_plot', 'simple_regression', 'multiple_regression', 'polynomial_regression', 'regression_diagnostics'].includes(module.key)
  return (
    <div className="flex flex-wrap gap-3">
      {wantsBins && <RangeControl label="Bins" value={bins} min={6} max={32} step={1} onChange={setBins} />}
      {wantsTop && <RangeControl label="Top N" value={topN} min={3} max={16} step={1} onChange={setTopN} />}
      {wantsThreshold && <RangeControl label="Threshold" value={threshold} min={0.05} max={0.95} step={0.05} onChange={setThreshold} />}
      {wantsSmooth && <RangeControl label="Window" value={smooth} min={2} max={20} step={1} onChange={setSmooth} />}
      {wantsDensity && <ToggleControl label="Density" checked={showDensity} onChange={setShowDensity} />}
      {wantsOutliers && <ToggleControl label="Outliers" checked={showOutliers} onChange={setShowOutliers} />}
      {wantsResiduals && <ToggleControl label="Residuals" checked={showResiduals} onChange={setShowResiduals} />}
    </div>
  )
}

function ToggleControl({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-300" title={`Toggle ${label.toLowerCase()} layer`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="accent-indigo-600" />
      {label}
    </label>
  )
}

function ModuleDepthBlueprint({ blueprint }: { blueprint: ModuleLabBlueprint }) {
  return (
    <div className="mb-4 grid gap-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3 dark:border-indigo-900/40 dark:bg-indigo-950/20 lg:grid-cols-[1.1fr_1fr_1fr]">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">Phase {blueprint.phase} depth</p>
        <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{blueprint.focus}</p>
        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-300">{blueprint.interpretation}</p>
      </div>
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Specific visual</p>
        <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">{blueprint.visual}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {blueprint.controls.map((control) => <span key={control} className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-indigo-600 dark:bg-slate-800 dark:text-indigo-300">{control}</span>)}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Result focus</p>
        <div className="grid gap-1.5">
          {blueprint.resultFocus.map((item) => <span key={item} className="rounded-md bg-white px-2 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item}</span>)}
        </div>
      </div>
    </div>
  )
}

function RangeControl({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <label className="min-w-32 text-xs font-semibold text-slate-500">
      <span className="flex justify-between gap-2"><span>{label}</span><span>{Number.isInteger(value) ? value : value.toFixed(2)}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 w-full accent-indigo-600" />
    </label>
  )
}

function ChartModuleWorkbench({ moduleKey, values, second, third, pairs, counts, pairCounts, bins, showDensity, showOutliers, showResiduals }: { moduleKey: string; values: number[]; second: number[]; third: number[]; pairs: [number, number][]; counts: Array<{ label: string; count: number }>; pairCounts: Array<{ source: string; target: string; count: number }>; bins: number; showDensity: boolean; showOutliers: boolean; showResiduals: boolean }) {
  if (moduleKey === 'histogram') return <HistogramDepthLab values={values} bins={bins} showDensity={showDensity} />
  if (moduleKey === 'bar_chart') return <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]"><CategoryBars counts={counts} title="Sorted category bars" /><CategorySummaryCards counts={counts} /></div>
  if (moduleKey === 'line_chart') return <SeriesSvg values={values} smooth={4} title="Sequence line lab" />
  if (moduleKey === 'area_chart') return <AreaSeriesMini values={values} smooth={4} />
  if (moduleKey === 'scatter_plot') return <ScatterRelationshipLab pairs={pairs} showOutliers={showOutliers} showResiduals={showResiduals} />
  if (moduleKey === 'bubble_chart') return <BubbleMini pairs={pairs} sizes={third} showOutliers={showOutliers} />
  if (moduleKey === 'box_plot') return <BoxDepthLab values={values} counts={counts} showOutliers={showOutliers} />
  if (moduleKey === 'violin_plot') return <ViolinMini values={values} counts={counts} showDensity={showDensity} />
  if (moduleKey === 'density_plot') return <HistogramSvgMini values={values} bins={bins} title="Density smoothness lab" showDensity />
  if (moduleKey === 'heatmap') return <HeatmapMini cells={pairCounts} />
  if (moduleKey === 'correlation_matrix') return <CorrelationMatrixMini values={values} second={second} third={third} />
  if (moduleKey === 'pair_plot') return <PairPlotMini values={values} second={second} third={third} />
  if (moduleKey === 'qq_plot') return <QqMini values={values} />
  if (moduleKey === 'ecdf_plot') return <EcdfMini values={values} />
  if (moduleKey === 'pareto_chart') return <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]"><CategoryBars counts={counts} title="Pareto sorted bars" /><ParetoStrip counts={counts} /></div>
  if (moduleKey === 'control_chart') return <ControlChartMini values={values} />
  if (moduleKey === 'pie_donut') return <PieDonutMini counts={counts} />
  if (moduleKey === 'treemap') return <TreemapMini counts={counts} />
  if (moduleKey === 'sankey') return <SankeyMini cells={pairCounts} />
  if (moduleKey === 'dashboard_builder') return <DashboardPreview />
  return <HistogramSvgMini values={values} bins={bins} title="Distribution preview" showDensity={showDensity} />
}

function ModelingWorkbench({ moduleKey, values, second, pairs, result, threshold, smooth, showResiduals }: { moduleKey: string; values: number[]; second: number[]; pairs: [number, number][]; result: StatModuleResult; threshold: number; smooth: number; showResiduals: boolean }) {
  if (moduleKey === 'time_series_basics') return <TimeSeriesDepthLab values={values} result={result} smooth={smooth} />
  if (moduleKey === 'forecasting_basics') return <ForecastDepthLab values={values} result={result} smooth={smooth} />
  if (moduleKey === 'clustering') return <ClusterDepthLab pairs={pairs} result={result} />
  if (moduleKey === 'pca') return <PcaMini values={values} second={second} />
  if (['logistic_regression', 'classification_metrics'].includes(moduleKey)) return <ClassificationMini scores={values} labels={second} threshold={threshold} />
  if (moduleKey === 'multiple_regression') return <RegressionCoefficientLab pairs={pairs} result={result} showResiduals={showResiduals} />
  if (moduleKey === 'polynomial_regression') return <ScatterSvg pairs={pairs} curved title="Polynomial shape check" residuals={showResiduals} />
  return <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]"><ScatterSvg pairs={pairs} title="Model fit workspace" residuals={showResiduals} /><MetricBars metrics={result.metrics} /></div>
}

function InferentialWorkbench({ moduleKey, values, second, pairs, counts, pairCounts, alpha, result }: { moduleKey: string; values: number[]; second: number[]; pairs: [number, number][]; counts: Array<{ label: string; count: number }>; pairCounts: Array<{ source: string; target: string; count: number }>; alpha: number; result: StatModuleResult }) {
  const pValue = firstPValue(result)
  if (moduleKey === 'confidence_interval') return <IntervalDepthLab result={result} values={values} />
  if (['one_sample_tests', 'two_sample_tests'].includes(moduleKey)) return <HypothesisTestDepthLab result={result} alpha={alpha} values={values} second={second} />
  if (moduleKey === 'power_sample_size') return <PowerDepthLab alpha={alpha} result={result} />
  if (moduleKey === 'non_parametric') return <RankTestDepthLab values={values} counts={counts} result={result} />
  if (moduleKey === 'effect_size') return <EffectSizeDepthLab result={result} />
  if (moduleKey === 'anova') return <AnovaDepthLab counts={counts} result={result} alpha={alpha} />
  if (moduleKey === 'chi_square') return <ChiSquareDepthLab cells={pairCounts} result={result} alpha={alpha} />
  if (moduleKey === 'correlation_testing') return <CorrelationDepthLab pairs={pairs.length ? pairs : values.map((v, i) => [v, second[i]]).filter((pair) => pair.every(Number.isFinite)) as [number, number][]} result={result} alpha={alpha} />
  if (moduleKey === 'gof_distribution') return <HistogramSvgMini values={values} bins={18} title="Observed distribution for fit" showDensity />
  return <DecisionMeter pValue={pValue} alpha={alpha} />
}

function AdvancedWorkflowWorkbench({ moduleKey, values, second, third, pairs, counts, pairCounts, result, smooth, threshold }: { moduleKey: string; values: number[]; second: number[]; third: number[]; pairs: [number, number][]; counts: Array<{ label: string; count: number }>; pairCounts: Array<{ source: string; target: string; count: number }>; result: StatModuleResult; smooth: number; threshold: number }) {
  if (moduleKey === 'two_way_anova_interaction') return <TwoWayAnovaMini cells={pairCounts} result={result} />
  if (moduleKey === 'repeated_measures_anova') return <RepeatedMeasuresMini values={values} second={second} third={third} result={result} />
  if (moduleKey === 'ancova') return <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]"><ScatterSvg pairs={pairs} title="Covariate adjustment screen" /><MetricBars metrics={result.metrics} /></div>
  if (moduleKey === 'manova') return <OutcomeScreenMini result={result} />
  if (['tukey_hsd', 'multiple_testing_corrections'].includes(moduleKey)) return <PairwiseTableMini result={result} />
  if (moduleKey === 'fisher_exact') return <ExactTableMini result={result} />
  if (moduleKey === 'mcnemar') return <DiscordantPairsMini result={result} />
  if (moduleKey === 'exact_binomial') return <BinomialTailMini values={values} result={result} />
  if (moduleKey === 'shapiro_wilk') return <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]"><HistogramSvgMini values={values} bins={18} title="Normality histogram" showDensity /><QqMini values={values} /></div>
  if (moduleKey === 'levene_brown_forsythe') return <SpreadTestMini values={values} counts={counts} result={result} />
  if (moduleKey === 'durbin_watson') return <AutocorrelationMini values={values} result={result} smooth={smooth} />
  if (moduleKey === 'breusch_pagan') return <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]"><ScatterSvg pairs={pairs} title="Variance pattern screen" residuals /><MetricBars metrics={result.metrics} /></div>
  if (moduleKey === 'robust_regression') return <RobustRegressionDepthLab pairs={pairs} result={result} />
  if (moduleKey === 'ridge_lasso') return <RegularizationDepthLab result={result} />
  if (moduleKey === 'stepwise_selection') return <WorkflowTimeline result={result} title="Stepwise selection timeline" />
  if (['logistic_se_pvalues', 'roc_auc'].includes(moduleKey)) return <ClassificationMini scores={values} labels={second} threshold={threshold} />
  if (moduleKey === 'train_test_cv') return <ValidationSplitMini result={result} />
  if (moduleKey === 'missing_imputation') return <ImputationMini values={values} result={result} />
  if (moduleKey === 'transformation_history') return <WorkflowTimeline result={result} title="Transformation audit trail" />
  if (moduleKey === 'undo_redo_cleaning') return <WorkflowTimeline result={result} title="Cleaning command stack" />
  if (moduleKey === 'formula_columns') return <FormulaColumnMini values={values} second={second} result={result} />
  if (moduleKey === 'merge_join_append') return <JoinReadinessMini counts={counts} result={result} />
  if (moduleKey === 'reshape_wide_long') return <ReshapePreviewMini result={result} />
  if (moduleKey === 'report_builder') return <ReportBuilderDepthLab result={result} />
  if (moduleKey === 'export_pdf_html_docx') return <ExportPackageDepthLab result={result} />
  if (moduleKey === 'script_export') return <ScriptRecipeDepthLab result={result} />
  if (moduleKey === 'saved_sessions') return <StateSchemaMini result={result} title="Session restore schema" />
  if (moduleKey === 'project_notebook') return <NotebookMini result={result} />
  if (moduleKey === 'chart_editor') return <ChartEditorMini result={result} />
  if (moduleKey === 'dashboard_layout_builder') return <DashboardLayoutMini result={result} />
  if (moduleKey === 'chart_templates') return <TemplateGalleryMini result={result} />
  if (moduleKey === 'weighted_statistics') return <WeightedStatsMini values={values} weights={second} result={result} />
  if (moduleKey === 'bootstrap_ci') return <BootstrapDepthLab values={values} result={result} />
  if (moduleKey === 'permutation_tests') return <PermutationDepthLab counts={counts} result={result} />
  if (moduleKey === 'bayesian_basics') return <BayesianDepthLab result={result} />
  if (moduleKey === 'survival_analysis') return <SurvivalCurveMini values={values} second={second} result={result} smooth={smooth} />
  if (moduleKey === 'arima_ets') return <AutocorrelationMini values={values} result={result} smooth={smooth} />
  if (moduleKey === 'seasonal_decomposition') return <SeasonalComponentsMini values={values} result={result} smooth={smooth} />
  if (moduleKey === 'robust_pca') return <PcaMini values={values} second={second} />
  if (moduleKey === 'hierarchical_dendrogram') return <MergeDistanceMini result={result} />
  if (moduleKey === 'dbscan') return <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]"><ClusterMini pairs={pairs} /><MetricBars metrics={result.metrics} /></div>
  if (moduleKey === 'classification_models') return <ClassificationMini scores={values} labels={second} threshold={threshold} />
  if (moduleKey === 'model_comparison') return <ModelComparisonMini result={result} />
  if (moduleKey === 'assumption_diagnostics') return <AssumptionDashboardMini result={result} />
  if (moduleKey === 'plain_language_interpretation') return <PlainLanguageMini result={result} />
  if (moduleKey === 'warning_system') return <WarningDashboardMini result={result} />
  if (moduleKey === 'engine_unit_tests') return <QaStatusMini result={result} title="Engine test board" />
  if (moduleKey === 'golden_value_tests') return <GoldenReferenceMini result={result} />
  if (['survival_analysis', 'arima_ets', 'seasonal_decomposition'].includes(moduleKey)) return <SeriesSvg values={values} smooth={smooth} title="Sequence diagnostic" />
  if (['roc_auc', 'classification_models', 'logistic_se_pvalues'].includes(moduleKey)) return <ClassificationMini scores={values} labels={second} threshold={threshold} />
  if (['hierarchical_dendrogram', 'dbscan', 'robust_pca'].includes(moduleKey)) return <ClusterMini pairs={pairs} />
  if (['chart_editor', 'dashboard_layout_builder', 'chart_templates', 'report_builder', 'export_pdf_html_docx'].includes(moduleKey)) return <DashboardPreview />
  if (['script_export', 'saved_sessions', 'project_notebook'].includes(moduleKey)) return <WorkflowTimeline result={result} />
  if (counts.length) return <CategoryBars counts={counts} title="Workflow category profile" />
  return <MetricBars metrics={result.metrics} />
}

function EmptyVisual({ title, detail = 'Choose compatible columns to render this visual.' }: { title: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-950">
      <MiniTitle title={title} detail="Waiting for valid data" />
      <p className="mt-8 text-sm font-semibold text-slate-500 dark:text-slate-300">{detail}</p>
    </div>
  )
}

function HistogramSvgMini({ values, bins, title, showDensity = false }: { values: number[]; bins: number; title: string; showDensity?: boolean }) {
  const hist = histogramBins(values, bins)
  if (!hist.length) return <EmptyVisual title={title} detail="Select a numeric column with valid values." />
  const max = Math.max(...hist.map((bin) => bin.count), 1)
  const points = hist.map((bin, i) => {
    const w = 700 / Math.max(hist.length, 1)
    const x = 40 + i * w + w / 2
    const y = 220 - (bin.count / max) * 190
    return `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
  return (
    <div>
      <MiniTitle title={title} detail={`${values.length.toLocaleString()} valid values`} />
      <svg viewBox="0 0 760 260" className="h-64 min-h-56 w-full rounded-lg bg-slate-50 dark:bg-slate-950" role="img" aria-label={title}>
        {hist.map((bin, i) => {
          const w = 700 / Math.max(hist.length, 1)
          const h = (bin.count / max) * 190
          return <rect key={`${bin.start}-${i}`} x={40 + i * w} y={220 - h} width={Math.max(2, w - 3)} height={h} rx="4" fill="#4f46e5" opacity="0.75" />
        })}
        {showDensity && <path d={points} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />}
        <line x1="38" x2="738" y1="220" y2="220" stroke="#94a3b8" />
      </svg>
    </div>
  )
}

function SeriesSvg({ values, smooth, title }: { values: number[]; smooth: number; title: string }) {
  const shown = values.slice(0, 160)
  if (!shown.length) return <EmptyVisual title={title} detail="Select a numeric sequence with valid values." />
  const smoothed = movingAverage(shown, smooth)
  const min = Math.min(...shown, ...smoothed)
  const max = Math.max(...shown, ...smoothed)
  const px = (i: number) => 36 + (i / Math.max(shown.length - 1, 1)) * 700
  const py = (v: number) => 220 - ((v - min) / Math.max(max - min, 1)) * 180
  const path = shown.map((v, i) => `${i ? 'L' : 'M'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ')
  const maPath = smoothed.map((v, i) => `${i ? 'L' : 'M'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ')
  return (
    <div>
      <MiniTitle title={title} detail={`${shown.length.toLocaleString()} points, moving window ${smooth}`} />
      <svg viewBox="0 0 760 260" className="h-64 min-h-56 w-full rounded-lg bg-slate-50 dark:bg-slate-950" role="img" aria-label={title}>
        <path d={path} fill="none" stroke="#94a3b8" strokeWidth="2" />
        <path d={maPath} fill="none" stroke="#4f46e5" strokeWidth="3" />
        <line x1="36" x2="736" y1="220" y2="220" stroke="#cbd5e1" />
      </svg>
    </div>
  )
}

function ScatterSvg({ pairs, title, curved = false, showOutliers = false, residuals = false }: { pairs: [number, number][]; title: string; curved?: boolean; showOutliers?: boolean; residuals?: boolean }) {
  const shown = pairs.slice(0, 220)
  if (shown.length < 2) return <EmptyVisual title={title} detail="Select two numeric columns with at least two paired rows." />
  const xs = shown.map(([x]) => x), ys = shown.map(([, y]) => y)
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const px = (x: number) => 42 + ((x - minX) / Math.max(maxX - minX, 1)) * 680
  const py = (y: number) => 220 - ((y - minY) / Math.max(maxY - minY, 1)) * 180
  const line = regressionLine(shown)
  return (
    <div>
      <MiniTitle title={title} detail={`${shown.length.toLocaleString()} paired rows`} />
      <svg viewBox="0 0 760 260" className="h-64 min-h-56 w-full rounded-lg bg-slate-50 dark:bg-slate-950" role="img" aria-label={title}>
        {shown.map(([x, y], i) => {
          const fitted = line ? line.a + line.b * x : y
          const resid = y - fitted
          const outlier = showOutliers && Math.abs(resid) > Math.max(1, localMean(ys.map((item, idx) => Math.abs(item - (line ? line.a + line.b * xs[idx] : item)))) * 2)
          return (
            <g key={i}>
              {residuals && line && <line x1={px(x)} x2={px(x)} y1={py(y)} y2={py(fitted)} stroke="#f97316" strokeWidth="1" opacity="0.35" />}
              <circle cx={px(x)} cy={py(y)} r={outlier ? 5 : 3} fill={outlier ? '#f97316' : '#4f46e5'} opacity="0.6" />
            </g>
          )
        })}
        {line && <line x1={px(minX)} y1={py(line.a + line.b * minX)} x2={px(maxX)} y2={py(line.a + line.b * maxX)} stroke="#10b981" strokeWidth="3" />}
        {curved && <path d={`M ${px(minX)} ${py(line ? line.a + line.b * minX : minY)} Q ${px((minX + maxX) / 2)} ${py(maxY)} ${px(maxX)} ${py(line ? line.a + line.b * maxX : maxY)}`} fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="6 6" />}
      </svg>
    </div>
  )
}

function CategoryBars({ counts, title = 'Category profile' }: { counts: Array<{ label: string; count: number }>; title?: string }) {
  if (!counts.length) return <EmptyVisual title={title} detail="Select a categorical column with at least one non-empty level." />
  const max = Math.max(...counts.map((item) => item.count), 1)
  return (
    <div>
      <MiniTitle title={title} detail={`${counts.length} displayed categories`} />
      <div className="space-y-2 rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        {counts.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex justify-between gap-3 text-xs font-semibold text-slate-500"><span className="truncate">{item.label}</span><span>{item.count}</span></div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${(item.count / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CategorySummaryCards({ counts }: { counts: Array<{ label: string; count: number }> }) {
  if (!counts.length) return <EmptyVisual title="Category summary" detail="Select a categorical column." />
  const total = counts.reduce((sum, item) => sum + item.count, 0) || 1
  const top = counts[0]
  return (
    <div className="grid gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
      <MiniTitle title="Category scan" detail={`${counts.length} visible levels`} />
      <ResultInsightCard label="Largest" value={top.label} tone="indigo" />
      <ResultInsightCard label="Largest share" value={`${Math.round(top.count / total * 100)}%`} tone="emerald" />
      <ResultInsightCard label="Long tail" value={`${Math.max(0, counts.length - 5)} after top 5`} />
    </div>
  )
}

function AreaSeriesMini({ values, smooth }: { values: number[]; smooth: number }) {
  const shown = values.slice(0, 160)
  if (!shown.length) return <EmptyVisual title="Area trend lab" detail="Select a numeric sequence with valid values." />
  const smoothed = movingAverage(shown, smooth)
  const min = Math.min(...shown, ...smoothed)
  const max = Math.max(...shown, ...smoothed)
  const px = (i: number) => 36 + (i / Math.max(shown.length - 1, 1)) * 700
  const py = (v: number) => 220 - ((v - min) / Math.max(max - min, 1)) * 180
  const areaPath = `${shown.map((v, i) => `${i ? 'L' : 'M'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ')} L ${px(shown.length - 1)} 220 L 36 220 Z`
  const maPath = smoothed.map((v, i) => `${i ? 'L' : 'M'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ')
  return (
    <div>
      <MiniTitle title="Area trend lab" detail={`${shown.length.toLocaleString()} points`} />
      <svg viewBox="0 0 760 260" className="h-64 w-full rounded-lg bg-slate-50 dark:bg-slate-950" role="img" aria-label="Area trend lab">
        <path d={areaPath} fill="#4f46e5" opacity="0.22" />
        <path d={maPath} fill="none" stroke="#4f46e5" strokeWidth="3" />
        <line x1="36" x2="736" y1="220" y2="220" stroke="#cbd5e1" />
      </svg>
    </div>
  )
}

function BubbleMini({ pairs, sizes, showOutliers }: { pairs: [number, number][]; sizes: number[]; showOutliers: boolean }) {
  const shown = pairs.slice(0, 180)
  if (shown.length < 2) return <EmptyVisual title="Bubble relationship lab" detail="Select X, Y, and size numeric columns." />
  const xs = shown.map(([x]) => x), ys = shown.map(([, y]) => y)
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const cleanSizes = sizes.slice(0, shown.length).map((value) => Math.abs(value)).filter(Number.isFinite)
  const maxSize = Math.max(...cleanSizes, 1)
  const px = (x: number) => 42 + ((x - minX) / Math.max(maxX - minX, 1)) * 680
  const py = (y: number) => 220 - ((y - minY) / Math.max(maxY - minY, 1)) * 180
  return (
    <div>
      <MiniTitle title="Bubble relationship lab" detail={`${shown.length} bubbles; size from third numeric field`} />
      <svg viewBox="0 0 760 260" className="h-64 w-full rounded-lg bg-slate-50 dark:bg-slate-950" role="img" aria-label="Bubble relationship lab">
        {shown.map(([x, y], index) => {
          const size = Math.abs(sizes[index] ?? 1)
          const large = showOutliers && size > maxSize * 0.75
          return <circle key={index} cx={px(x)} cy={py(y)} r={4 + (size / maxSize) * 16} fill={large ? '#f97316' : '#4f46e5'} opacity="0.35" stroke={large ? '#f97316' : '#4f46e5'} />
        })}
      </svg>
    </div>
  )
}

function ViolinMini({ values, counts, showDensity }: { values: number[]; counts: Array<{ label: string; count: number }>; showDensity: boolean }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <HistogramSvgMini values={values} bins={18} title="Violin density screen" showDensity={showDensity} />
      <CategoryBars counts={counts} title="Group balance for violin" />
    </div>
  )
}

function HeatmapMini({ cells }: { cells: Array<{ source: string; target: string; count: number }> }) {
  if (!cells.length) return <EmptyVisual title="Heatmap cell inspector" detail="Select two categorical columns." />
  const sources = [...new Set(cells.map((cell) => cell.source))].slice(0, 6)
  const targets = [...new Set(cells.map((cell) => cell.target))].slice(0, 6)
  const max = Math.max(...cells.map((cell) => cell.count), 1)
  const findCount = (source: string, target: string) => cells.find((cell) => cell.source === source && cell.target === target)?.count ?? 0
  return (
    <div>
      <MiniTitle title="Heatmap cell inspector" detail={`${sources.length} x ${targets.length} visible cells`} />
      <div className="overflow-x-auto rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        <div className="grid min-w-[520px] gap-1" style={{ gridTemplateColumns: `120px repeat(${targets.length}, minmax(56px, 1fr))` }}>
          <div />
          {targets.map((target) => <div key={target} className="truncate text-center text-xs font-semibold text-slate-500">{target}</div>)}
          {sources.map((source) => (
            <Fragment key={source}>
              <div className="truncate text-xs font-semibold text-slate-500">{source}</div>
              {targets.map((target) => {
                const value = findCount(source, target)
                return <div key={`${source}-${target}`} className="rounded p-2 text-center text-xs font-bold text-white" style={{ backgroundColor: `rgba(79,70,229,${0.18 + (value / max) * 0.82})` }}>{value}</div>
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

function CorrelationMatrixMini({ values, second, third }: { values: number[]; second: number[]; third: number[] }) {
  const vars = [
    { name: 'Numeric 1', values },
    { name: 'Numeric 2', values: second },
    { name: 'Numeric 3', values: third },
  ]
  const cells = vars.flatMap((a) => vars.map((b) => ({ a: a.name, b: b.name, r: a.name === b.name ? 1 : correlation(a.values, b.values) })))
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
      <MiniTitle title="Correlation matrix lab" detail="Signed strength colors" />
      <div className="grid grid-cols-3 gap-2">
        {cells.map((cell) => {
          const valid = Number.isFinite(cell.r)
          const opacity = valid ? 0.18 + Math.abs(cell.r) * 0.82 : 0.12
          const bg = cell.r >= 0 ? `rgba(79,70,229,${opacity})` : `rgba(244,63,94,${opacity})`
          return <div key={`${cell.a}-${cell.b}`} className="rounded-lg p-3 text-center text-xs font-bold text-white" style={{ backgroundColor: bg }} title={`${cell.a} vs ${cell.b}`}>{valid ? cell.r.toFixed(2) : '-'}</div>
        })}
      </div>
    </div>
  )
}

function PairPlotMini({ values, second, third }: { values: number[]; second: number[]; third: number[] }) {
  const panels: Array<{ title: string; pairs: [number, number][] }> = [
    { title: '1 vs 2', pairs: values.map((value, i) => [value, second[i]] as [number, number]).filter((pair) => pair.every(Number.isFinite)) },
    { title: '1 vs 3', pairs: values.map((value, i) => [value, third[i]] as [number, number]).filter((pair) => pair.every(Number.isFinite)) },
    { title: '2 vs 3', pairs: second.map((value, i) => [value, third[i]] as [number, number]).filter((pair) => pair.every(Number.isFinite)) },
  ]
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {panels.map((panel) => (
        <div key={panel.title} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
          <MiniTitle title={panel.title} detail={`${panel.pairs.length} rows`} />
          <ScatterSvg pairs={panel.pairs} title={panel.title} />
        </div>
      ))}
    </div>
  )
}

function ControlChartMini({ values }: { values: number[] }) {
  const shown = values.slice(0, 160)
  if (shown.length < 2) return <EmptyVisual title="Process stability lab" detail="Select an ordered numeric process measure." />
  const meanValue = localMean(shown)
  const sdValue = Math.sqrt(localMean(shown.map((value) => (value - meanValue) ** 2)))
  const ucl = meanValue + 3 * sdValue
  const lcl = meanValue - 3 * sdValue
  const min = Math.min(...shown, lcl), max = Math.max(...shown, ucl)
  const px = (i: number) => 36 + (i / Math.max(shown.length - 1, 1)) * 700
  const py = (v: number) => 220 - ((v - min) / Math.max(max - min, 1)) * 180
  const path = shown.map((v, i) => `${i ? 'L' : 'M'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ')
  return (
    <div>
      <MiniTitle title="Process stability lab" detail={`center ${meanValue.toFixed(2)}`} />
      <svg viewBox="0 0 760 260" className="h-64 w-full rounded-lg bg-slate-50 dark:bg-slate-950" role="img" aria-label="Process stability lab">
        {[ucl, meanValue, lcl].map((line, index) => <line key={index} x1="36" x2="736" y1={py(line)} y2={py(line)} stroke={index === 1 ? '#10b981' : '#f97316'} strokeDasharray={index === 1 ? '' : '6 6'} />)}
        <path d={path} fill="none" stroke="#4f46e5" strokeWidth="2.5" />
        {shown.map((value, i) => (value > ucl || value < lcl) ? <circle key={i} cx={px(i)} cy={py(value)} r="4" fill="#f43f5e" /> : null)}
      </svg>
    </div>
  )
}

function PieDonutMini({ counts }: { counts: Array<{ label: string; count: number }> }) {
  if (!counts.length) return <EmptyVisual title="Share composition lab" detail="Select a categorical column." />
  const total = counts.reduce((sum, item) => sum + item.count, 0) || 1
  let offset = 0
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <svg viewBox="0 0 220 220" className="h-64 w-full rounded-lg bg-slate-50 dark:bg-slate-950" role="img" aria-label="Share composition lab">
        {counts.slice(0, 8).map((item, index) => {
          const share = item.count / total
          const dash = `${share * 100} ${100 - share * 100}`
          const circle = <circle key={item.label} cx="110" cy="110" r="72" fill="none" stroke={index % 2 ? '#10b981' : '#4f46e5'} strokeWidth="34" strokeDasharray={dash} strokeDashoffset={-offset} transform="rotate(-90 110 110)" opacity={0.45 + index * 0.05} />
          offset += share * 100
          return circle
        })}
        <circle cx="110" cy="110" r="42" fill="#f8fafc" />
      </svg>
      <CategorySummaryCards counts={counts} />
    </div>
  )
}

function TreemapMini({ counts }: { counts: Array<{ label: string; count: number }> }) {
  if (!counts.length) return <EmptyVisual title="Treemap proportion lab" detail="Select a categorical column." />
  const total = counts.reduce((sum, item) => sum + item.count, 0) || 1
  return (
    <div>
      <MiniTitle title="Treemap proportion lab" detail="Rectangle size follows count" />
      <div className="flex h-64 flex-wrap content-start gap-1 rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
        {counts.slice(0, 12).map((item, index) => (
          <div key={item.label} className={`flex min-h-14 items-end rounded-lg p-2 text-xs font-bold text-white ${index % 3 === 0 ? 'bg-indigo-500' : index % 3 === 1 ? 'bg-emerald-500' : 'bg-sky-500'}`} style={{ width: `${Math.max(18, item.count / total * 100)}%`, flexGrow: item.count }}>
            <span className="truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SankeyMini({ cells }: { cells: Array<{ source: string; target: string; count: number }> }) {
  if (!cells.length) return <EmptyVisual title="Sankey flow lab" detail="Select source and target categorical columns." />
  const max = Math.max(...cells.map((cell) => cell.count), 1)
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
      <MiniTitle title="Sankey flow lab" detail={`${cells.length} visible flows`} />
      <div className="space-y-2">
        {cells.slice(0, 8).map((cell) => (
          <div key={`${cell.source}-${cell.target}`} className="grid grid-cols-[minmax(0,1fr)_minmax(80px,1.4fr)_minmax(0,1fr)] items-center gap-2 text-xs">
            <span className="truncate font-semibold text-slate-600 dark:text-slate-300">{cell.source}</span>
            <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(8, cell.count / max * 100)}%` }} /></div>
            <span className="truncate text-right font-semibold text-slate-600 dark:text-slate-300">{cell.target} ({cell.count})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TwoWayAnovaMini({ cells, result }: { cells: Array<{ source: string; target: string; count: number }>; result: StatModuleResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <HeatmapMini cells={cells} />
      <div className="grid gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        <MiniTitle title="Interaction evidence" detail="Main effects plus interaction" />
        {result.metrics.map((metric) => <ResultInsightCard key={metric.label} label={metric.label} value={metric.value} tone={/interaction/i.test(metric.label) ? 'rose' : 'indigo'} />)}
      </div>
    </div>
  )
}

function RepeatedMeasuresMini({ values, second, third, result }: { values: number[]; second: number[]; third: number[]; result: StatModuleResult }) {
  const rows = values.map((value, i) => [value, second[i], third[i]]).filter((row) => row.every(Number.isFinite)).slice(0, 80)
  const means = [values, second, third].map((series) => localMean(series))
  if (!rows.length) return <EmptyVisual title="Repeated measures lab" detail="Select three numeric repeated-condition columns." />
  const min = Math.min(...rows.flat(), ...means), max = Math.max(...rows.flat(), ...means)
  const px = (i: number) => 80 + i * 250
  const py = (v: number) => 210 - ((v - min) / Math.max(max - min, 1)) * 160
  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
      <div>
        <MiniTitle title="Subject trajectories" detail={`${rows.length} paired rows`} />
        <svg viewBox="0 0 760 250" className="h-64 w-full rounded-lg bg-slate-50 dark:bg-slate-950" role="img" aria-label="Repeated measures trajectories">
          {rows.map((row, index) => <path key={index} d={row.map((v, i) => `${i ? 'L' : 'M'} ${px(i)} ${py(v)}`).join(' ')} fill="none" stroke="#94a3b8" strokeWidth="1" opacity="0.25" />)}
          <path d={means.map((v, i) => `${i ? 'L' : 'M'} ${px(i)} ${py(v)}`).join(' ')} fill="none" stroke="#4f46e5" strokeWidth="4" />
          {means.map((v, i) => <circle key={i} cx={px(i)} cy={py(v)} r="6" fill="#4f46e5" />)}
        </svg>
      </div>
      <MetricBars metrics={result.metrics} />
    </div>
  )
}

function OutcomeScreenMini({ result }: { result: StatModuleResult }) {
  const rows = result.table?.slice(0, 6) ?? []
  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        <MiniTitle title="Outcome screening cards" detail={`${rows.length} outcomes or effects`} />
        <div className="grid gap-3 md:grid-cols-3">
          {rows.map((row, index) => <ResultInsightCard key={index} label={String(row.outcome ?? row.source ?? `Outcome ${index + 1}`)} value={String(row.p ?? row.eta2 ?? row.F ?? '-')} tone={index % 2 ? 'emerald' : 'indigo'} />)}
        </div>
      </div>
      <MetricBars metrics={result.metrics} />
    </div>
  )
}

function PairwiseTableMini({ result }: { result: StatModuleResult }) {
  const rows = result.table?.slice(0, 8) ?? []
  if (!rows.length) return <EmptyVisual title="Pairwise comparison ladder" detail="Run a pairwise comparison module with grouped data." />
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
      <MiniTitle title="Pairwise comparison ladder" detail={`${rows.length} comparisons shown`} />
      <div className="space-y-2">
        {rows.map((row, index) => {
          const p = Number(row.pApprox ?? row.p ?? row.holm ?? row.bonferroni ?? 1)
          return (
            <div key={index} className="rounded-lg bg-white p-3 dark:bg-slate-800">
              <div className="mb-2 flex justify-between gap-3 text-xs font-semibold text-slate-500"><span className="truncate">{String(row.comparison ?? row.test ?? `Comparison ${index + 1}`)}</span><span>{Number.isFinite(p) ? p.toFixed(4) : '-'}</span></div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(4, Math.min(100, (1 - Math.min(p, 1)) * 100))}%` }} /></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ExactTableMini({ result }: { result: StatModuleResult }) {
  const row = result.table?.[0] ?? {}
  const cells = ['a', 'b', 'c', 'd'].map((key) => Number(row[key] ?? 0))
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        {cells.map((value, index) => <div key={index} className="rounded-lg bg-white p-5 text-center dark:bg-slate-800"><p className="text-xs text-slate-400">Cell {index + 1}</p><p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p></div>)}
      </div>
      <MetricBars metrics={result.metrics} />
    </div>
  )
}

function DiscordantPairsMini({ result }: { result: StatModuleResult }) {
  const discordant = Number(result.metrics.find((metric) => /discordant/i.test(metric.label))?.value ?? 0)
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        <MiniTitle title="Discordant-pair focus" detail="Only changed pairs drive the test" />
        <div className="mt-6 rounded-lg bg-white p-6 text-center dark:bg-slate-800"><p className="text-xs text-slate-400">Discordant pairs</p><p className="text-4xl font-bold text-indigo-600 dark:text-indigo-300">{discordant}</p></div>
      </div>
      <DecisionMeter pValue={firstPValue(result)} alpha={0.05} />
    </div>
  )
}

function BinomialTailMini({ values, result }: { values: number[]; result: StatModuleResult }) {
  const successes = Number(result.metrics.find((metric) => /success/i.test(metric.label))?.value ?? values.filter((value) => value > 0).length)
  const n = Number(result.metrics.find((metric) => metric.label === 'n')?.value ?? values.length)
  const failures = Math.max(0, n - successes)
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        <MiniTitle title="Success/failure split" detail={`${n} trials`} />
        <div className="mt-5 flex h-20 overflow-hidden rounded-lg">
          <div className="bg-indigo-500" style={{ width: `${n ? successes / n * 100 : 0}%` }} />
          <div className="bg-slate-300 dark:bg-slate-700" style={{ width: `${n ? failures / n * 100 : 100}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ResultInsightCard label="Successes" value={successes} tone="indigo" />
          <ResultInsightCard label="Failures" value={failures} />
        </div>
      </div>
      <DecisionMeter pValue={firstPValue(result)} alpha={0.05} />
    </div>
  )
}

function SpreadTestMini({ values, counts, result }: { values: number[]; counts: Array<{ label: string; count: number }>; result: StatModuleResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <BoxPlotMini values={values} counts={counts} showOutliers />
      <MetricBars metrics={result.metrics} />
    </div>
  )
}

function AutocorrelationMini({ values, result, smooth }: { values: number[]; result: StatModuleResult; smooth: number }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <SeriesSvg values={values} smooth={smooth} title="Residual sequence screen" />
      <MetricBars metrics={result.metrics} />
    </div>
  )
}

function RobustRegressionMini({ pairs, result }: { pairs: [number, number][]; result: StatModuleResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
      <ScatterSvg pairs={pairs} title="Outlier-resistant fit screen" showOutliers residuals />
      <MetricBars metrics={result.metrics} />
    </div>
  )
}

function CoefficientComparisonMini({ result }: { result: StatModuleResult }) {
  const rows = result.table?.slice(0, 8) ?? []
  if (!rows.length) return <MetricBars metrics={result.metrics} />
  const max = Math.max(...rows.flatMap((row) => [Math.abs(Number(row.ridge)), Math.abs(Number(row.lassoApprox))]).filter(Number.isFinite), 1)
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
      <MiniTitle title="Coefficient shrinkage" detail="Ridge vs lasso approximation" />
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={index}>
            <div className="mb-1 text-xs font-semibold text-slate-500">{String(row.term)}</div>
            <div className="grid gap-1">
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.abs(Number(row.ridge)) / max * 100}%` }} /></div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.abs(Number(row.lassoApprox)) / max * 100}%` }} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ValidationSplitMini({ result }: { result: StatModuleResult }) {
  const train = Number(result.metrics.find((metric) => /train/i.test(metric.label))?.value ?? 0)
  const test = Number(result.metrics.find((metric) => /test n/i.test(metric.label))?.value ?? 0)
  const total = Math.max(train + test, 1)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        <MiniTitle title="Validation split" detail={`${train}/${test} rows`} />
        <div className="mt-6 flex h-16 overflow-hidden rounded-lg">
          <div className="bg-indigo-500" style={{ width: `${train / total * 100}%` }} />
          <div className="bg-emerald-500" style={{ width: `${test / total * 100}%` }} />
        </div>
      </div>
      <MetricBars metrics={result.metrics} />
    </div>
  )
}

function ImputationMini({ values, result }: { values: number[]; result: StatModuleResult }) {
  const missing = Number(result.metrics.find((metric) => /missing/i.test(metric.label))?.value ?? 0)
  const valid = values.length
  const total = Math.max(valid + missing, 1)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        <MiniTitle title="Missingness meter" detail={`${missing} missing, ${valid} valid`} />
        <div className="mt-6 h-5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full bg-amber-500" style={{ width: `${missing / total * 100}%` }} />
        </div>
      </div>
      <MetricBars metrics={result.metrics} />
    </div>
  )
}

function FormulaColumnMini({ values, second, result }: { values: number[]; second: number[]; result: StatModuleResult }) {
  const computed = values.map((value, i) => value + (second[i] ?? 0)).filter(Number.isFinite)
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <HistogramSvgMini values={computed} bins={14} title="Computed column distribution" showDensity />
      <WorkflowTimeline result={result} title="Formula row preview" />
    </div>
  )
}

function JoinReadinessMini({ counts, result }: { counts: Array<{ label: string; count: number }>; result: StatModuleResult }) {
  const duplicateKeys = counts.filter((item) => item.count > 1).length
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <CategoryBars counts={counts} title="Join key frequency" />
      <div className="grid gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        <MiniTitle title="Join readiness" detail="Duplicate keys can multiply rows" />
        <ResultInsightCard label="Duplicate keys" value={duplicateKeys} tone={duplicateKeys ? 'rose' : 'emerald'} />
        {result.metrics.map((metric) => <ResultInsightCard key={metric.label} label={metric.label} value={metric.value} />)}
      </div>
    </div>
  )
}

function ReshapePreviewMini({ result }: { result: StatModuleResult }) {
  return <WorkflowTimeline result={result} title="Wide-to-long preview" />
}

function ReportAssemblyMini({ result }: { result: StatModuleResult }) {
  const sections = result.table?.map((row) => String(row.section ?? 'Section')) ?? []
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        <MiniTitle title="Report assembly outline" detail={`${sections.length} sections`} />
        <div className="space-y-2">
          {sections.map((section, index) => <div key={section} className="flex items-center gap-3 rounded-lg bg-white p-3 text-sm dark:bg-slate-800"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">{index + 1}</span><span className="font-semibold text-slate-700 dark:text-slate-200">{section}</span></div>)}
        </div>
      </div>
      <MetricBars metrics={result.metrics} />
    </div>
  )
}

function ExportPackageMini({ result }: { result: StatModuleResult }) {
  return <StatusCardGrid title="Export package readiness" metrics={result.metrics} tones={['emerald', 'indigo', 'slate']} />
}

function ScriptRecipeMini({ result }: { result: StatModuleResult }) {
  return <WorkflowTimeline result={result} title="Reproducible script recipe" />
}

function StateSchemaMini({ result, title }: { result: StatModuleResult; title: string }) {
  const fields = result.table?.map((row) => String(row.field ?? Object.values(row)[0] ?? 'field')) ?? []
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
      <MiniTitle title={title} detail={`${fields.length} state fields`} />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => <div key={field} className="rounded-lg bg-white p-3 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{field}</div>)}
      </div>
    </div>
  )
}

function NotebookMini({ result }: { result: StatModuleResult }) {
  return <WorkflowTimeline result={result} title="Notebook timeline" />
}

function ChartEditorMini({ result }: { result: StatModuleResult }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        <MiniTitle title="Chart metadata editor" detail="Title, axes, palette" />
        <div className="rounded-lg bg-white p-4 dark:bg-slate-800">
          <div className="h-28 rounded-md border border-dashed border-slate-300 p-3 dark:border-slate-600">
            <div className="mb-3 h-3 w-2/3 rounded bg-indigo-200 dark:bg-indigo-900" />
            <div className="grid h-16 grid-cols-4 items-end gap-2">
              {[45, 80, 55, 68].map((h, i) => <div key={i} className="rounded-t bg-indigo-500" style={{ height: `${h}%` }} />)}
            </div>
          </div>
        </div>
      </div>
      <MetricBars metrics={result.metrics} />
    </div>
  )
}

function DashboardLayoutMini({ result }: { result: StatModuleResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <DashboardPreview />
      <WorkflowTimeline result={result} title="Layout coordinates" />
    </div>
  )
}

function TemplateGalleryMini({ result }: { result: StatModuleResult }) {
  const templates = result.table?.map((row) => String(row.template ?? Object.values(row)[0] ?? 'Template')) ?? []
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
      <MiniTitle title="Template gallery" detail={`${templates.length} visible presets`} />
      <div className="grid gap-3 md:grid-cols-4">
        {templates.map((template, index) => <div key={template} className="rounded-lg bg-white p-3 dark:bg-slate-800"><div className={`mb-3 h-16 rounded ${index % 2 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-indigo-100 dark:bg-indigo-900/30'}`} /><p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{template}</p></div>)}
      </div>
    </div>
  )
}

function WeightedStatsMini({ values, weights, result }: { values: number[]; weights: number[]; result: StatModuleResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <ScatterSvg pairs={values.map((value, i) => [value, weights[i]] as [number, number]).filter((pair) => pair.every(Number.isFinite))} title="Value vs weight influence" showOutliers />
      <MetricBars metrics={result.metrics} />
    </div>
  )
}

function BootstrapIntervalMini({ values, result }: { values: number[]; result: StatModuleResult }) {
  const meanMetric = Number(result.metrics.find((metric) => metric.label === 'mean')?.value ?? localMean(values))
  const low = Number(result.metrics.find((metric) => metric.label === '2.5%')?.value ?? meanMetric)
  const high = Number(result.metrics.find((metric) => metric.label === '97.5%')?.value ?? meanMetric)
  const min = Math.min(low, meanMetric, high), max = Math.max(low, meanMetric, high)
  const px = (v: number) => 60 + ((v - min) / Math.max(max - min, 1)) * 620
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
      <MiniTitle title="Bootstrap interval strip" detail="Percentile confidence interval" />
      <svg viewBox="0 0 760 150" className="h-40 w-full rounded-lg bg-white dark:bg-slate-800">
        <line x1={px(low)} x2={px(high)} y1="75" y2="75" stroke="#4f46e5" strokeWidth="8" strokeLinecap="round" />
        <circle cx={px(meanMetric)} cy="75" r="9" fill="#10b981" />
      </svg>
      <div className="mt-3 grid gap-2 md:grid-cols-3">{result.metrics.map((metric) => <ResultInsightCard key={metric.label} label={metric.label} value={metric.value} />)}</div>
    </div>
  )
}

function PermutationNullMini({ counts, result }: { counts: Array<{ label: string; count: number }>; result: StatModuleResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <CategoryBars counts={counts} title="Permutation group labels" />
      <DecisionMeter pValue={firstPValue(result)} alpha={0.05} />
    </div>
  )
}

function BayesianUpdateMini({ result }: { result: StatModuleResult }) {
  const meanValue = Number(result.metrics.find((metric) => /posterior mean/i.test(metric.label))?.value ?? 0)
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
      <MiniTitle title="Bayesian posterior update" detail="Beta prior plus observed binary data" />
      <div className="h-5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full bg-indigo-500" style={{ width: `${Math.max(4, meanValue * 100)}%` }} /></div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">{result.metrics.map((metric) => <ResultInsightCard key={metric.label} label={metric.label} value={metric.value} />)}</div>
    </div>
  )
}

function SurvivalCurveMini({ values, second, result, smooth }: { values: number[]; second: number[]; result: StatModuleResult; smooth: number }) {
  const eventRows = values.map((time, i) => ({ time, event: second[i] > 0 ? 1 : 0 })).filter((row) => Number.isFinite(row.time))
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <SeriesSvg values={eventRows.map((row) => row.time)} smooth={smooth} title="Survival time sequence" />
      <StatusCardGrid title="Survival summary" metrics={result.metrics} />
    </div>
  )
}

function SeasonalComponentsMini({ values, result, smooth }: { values: number[]; result: StatModuleResult; smooth: number }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <AreaSeriesMini values={values} smooth={smooth} />
      <MetricBars metrics={result.metrics} />
    </div>
  )
}

function MergeDistanceMini({ result }: { result: StatModuleResult }) {
  return <WorkflowTimeline result={result} title="Dendrogram merge distances" />
}

function ModelComparisonMini({ result }: { result: StatModuleResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <WorkflowTimeline result={result} title="Model leaderboard" />
      <MetricBars metrics={result.metrics} />
    </div>
  )
}

function AssumptionDashboardMini({ result }: { result: StatModuleResult }) {
  return <StatusCardGrid title="Assumption diagnostics" metrics={result.metrics} tones={['rose', 'amber', 'indigo']} />
}

function PlainLanguageMini({ result }: { result: StatModuleResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <div className="rounded-lg bg-indigo-50 p-4 dark:bg-indigo-950/30">
        <MiniTitle title="Plain-language sentence" detail="Editable interpretation target" />
        <p className="text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">{result.summary}</p>
      </div>
      <MetricBars metrics={result.metrics} />
    </div>
  )
}

function WarningDashboardMini({ result }: { result: StatModuleResult }) {
  return <StatusCardGrid title="Warning dashboard" metrics={result.metrics} tones={['amber', 'rose', 'indigo']} />
}

function QaStatusMini({ result, title }: { result: StatModuleResult; title: string }) {
  return <StatusCardGrid title={title} metrics={result.metrics} tones={['emerald', 'emerald', 'emerald']} />
}

function GoldenReferenceMini({ result }: { result: StatModuleResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <StatusCardGrid title="Reference coverage" metrics={result.metrics} />
      <WorkflowTimeline result={result} title="Golden reference targets" />
    </div>
  )
}

function StatusCardGrid({ title, metrics, tones = ['indigo', 'emerald', 'slate'] }: { title: string; metrics: StatModuleResult['metrics']; tones?: Array<'slate' | 'indigo' | 'emerald' | 'rose' | 'amber'> }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
      <MiniTitle title={title} detail={`${metrics.length} status cards`} />
      <div className="grid gap-3 md:grid-cols-3">
        {metrics.map((metric, index) => <ResultInsightCard key={metric.label} label={metric.label} value={metric.value} tone={tones[index % tones.length] === 'amber' ? 'slate' : tones[index % tones.length] as 'slate' | 'indigo' | 'emerald' | 'rose'} />)}
      </div>
    </div>
  )
}

function PowerDepthLab({ alpha, result }: { alpha: number; result: StatModuleResult }) {
  const nMetric = result.metrics.find((metric) => /n per group|sample|proportion n/i.test(metric.label))
  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
      <PowerCurveMini alpha={alpha} result={result} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <ResultInsightCard label="Planning target" value={nMetric ? nMetric.value : 'See curve'} tone="indigo" />
        <ResultInsightCard label="Alpha tradeoff" value={`alpha ${alpha}`} />
        <ResultInsightCard label="Professional cue" value="Choose practical effect before sample size" tone="emerald" />
        <ResultInsightCard label="Report note" value="State target power and assumed effect" />
      </div>
    </div>
  )
}

function RankTestDepthLab({ values, counts, result }: { values: number[]; counts: Array<{ label: string; count: number }>; result: StatModuleResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
      <RankStripMini values={values} counts={counts} result={result} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <ResultInsightCard label="Rank method" value="Compares order/location" tone="indigo" />
        <ResultInsightCard label="Group balance" value={`${counts.length} groups shown`} />
        <ResultInsightCard label="Robustness cue" value="Safer for skew/outliers" tone="emerald" />
        <ResultInsightCard label="Selected values" value={values.length.toLocaleString()} />
      </div>
    </div>
  )
}

function EffectSizeDepthLab({ result }: { result: StatModuleResult }) {
  const numeric = result.metrics.map((metric) => ({ label: metric.label, value: Number(metric.value) })).filter((item) => Number.isFinite(item.value))
  const strongest = numeric.reduce((best, item) => Math.abs(item.value) > Math.abs(best.value) ? item : best, numeric[0] ?? { label: 'effect', value: 0 })
  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
      <EffectGaugeMini result={result} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <ResultInsightCard label="Strongest metric" value={strongest.label} tone="indigo" />
        <ResultInsightCard label="Magnitude" value={Number.isFinite(strongest.value) ? strongest.value.toFixed(3) : '-'} />
        <ResultInsightCard label="Interpretation" value="Practical size, not p-value" tone="emerald" />
        <ResultInsightCard label="Report cue" value="Pair with CI or test result" />
      </div>
    </div>
  )
}

function TimeSeriesDepthLab({ values, result, smooth }: { values: number[]; result: StatModuleResult; smooth: number }) {
  const lag = correlation(values.slice(0, -1), values.slice(1))
  const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0
  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
      <SeriesSvg values={values} smooth={smooth} title="Time-series pattern lab" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <ResultInsightCard label="Lag-1 signal" value={Number.isFinite(lag) ? lag.toFixed(3) : '-'} tone="indigo" />
        <ResultInsightCard label="Start to end" value={Number.isFinite(trend) ? trend.toFixed(2) : '-'} />
        <ResultInsightCard label="Smoothing window" value={smooth} />
        <MetricBars metrics={result.metrics} />
      </div>
    </div>
  )
}

function ForecastDepthLab({ values, result, smooth }: { values: number[]; result: StatModuleResult; smooth: number }) {
  const nextNaive = values.at(-1)
  const smoothed = movingAverage(values, smooth).at(-1)
  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
      <SeriesSvg values={values} smooth={smooth} title="Forecast baseline lab" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <ResultInsightCard label="Naive next" value={Number.isFinite(Number(nextNaive)) ? Number(nextNaive).toFixed(2) : '-'} tone="indigo" />
        <ResultInsightCard label="Smoothed next" value={Number.isFinite(Number(smoothed)) ? Number(smoothed).toFixed(2) : '-'} />
        <ResultInsightCard label="Baseline rule" value="Beat naive before complex models" tone="emerald" />
        <MetricBars metrics={result.metrics} />
      </div>
    </div>
  )
}

function ClusterDepthLab({ pairs, result }: { pairs: [number, number][]; result: StatModuleResult }) {
  const centered = pairs.slice(0, 220)
  const spread = centered.length ? localMean(centered.map(([x, y]) => Math.hypot(x - localMean(centered.map(([vx]) => vx)), y - localMean(centered.map(([, vy]) => vy))))) : 0
  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
      <ClusterMini pairs={pairs} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <ResultInsightCard label="Points mapped" value={pairs.length.toLocaleString()} tone="indigo" />
        <ResultInsightCard label="Centered spread" value={spread.toFixed(2)} />
        <ResultInsightCard label="Interpretation" value="Clusters need domain labels" tone="emerald" />
        <MetricBars metrics={result.metrics} />
      </div>
    </div>
  )
}

function RobustRegressionDepthLab({ pairs, result }: { pairs: [number, number][]; result: StatModuleResult }) {
  const downweighted = result.metrics.find((metric) => /downweighted/i.test(metric.label))
  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
      <RobustRegressionMini pairs={pairs} result={result} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <ResultInsightCard label="Downweighted rows" value={downweighted?.value ?? 'See metrics'} tone="rose" />
        <ResultInsightCard label="Purpose" value="Reduce outlier pull" tone="indigo" />
        <ResultInsightCard label="Report cue" value="Compare with OLS fit" tone="emerald" />
        <ResultInsightCard label="Paired rows" value={pairs.length.toLocaleString()} />
      </div>
    </div>
  )
}

function RegularizationDepthLab({ result }: { result: StatModuleResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
      <CoefficientComparisonMini result={result} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <ResultInsightCard label="Ridge" value="Shrinks all coefficients" tone="indigo" />
        <ResultInsightCard label="Lasso" value="Can zero weak terms" tone="emerald" />
        <ResultInsightCard label="Tradeoff" value="Bias for stability" />
        <MetricBars metrics={result.metrics} />
      </div>
    </div>
  )
}

function BootstrapDepthLab({ values, result }: { values: number[]; result: StatModuleResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
      <BootstrapIntervalMini values={values} result={result} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <ResultInsightCard label="Observed rows" value={values.length.toLocaleString()} tone="indigo" />
        <ResultInsightCard label="Uncertainty type" value="Resampling interval" tone="emerald" />
        <ResultInsightCard label="Assumption" value="Rows represent sampling process" />
        <MetricBars metrics={result.metrics} />
      </div>
    </div>
  )
}

function PermutationDepthLab({ counts, result }: { counts: Array<{ label: string; count: number }>; result: StatModuleResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr]">
      <PermutationNullMini counts={counts} result={result} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <ResultInsightCard label="Exchangeability" value="Labels can be shuffled" tone="indigo" />
        <ResultInsightCard label="Groups" value={counts.length || '-'} />
        <ResultInsightCard label="Decision cue" value="Observed vs shuffled null" tone="emerald" />
        <MetricBars metrics={result.metrics} />
      </div>
    </div>
  )
}

function BayesianDepthLab({ result }: { result: StatModuleResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr]">
      <BayesianUpdateMini result={result} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <ResultInsightCard label="Prior" value="Assumption before data" tone="indigo" />
        <ResultInsightCard label="Posterior" value="Prior + evidence" tone="emerald" />
        <ResultInsightCard label="Report cue" value="State prior strength clearly" />
        <MetricBars metrics={result.metrics} />
      </div>
    </div>
  )
}

function ReportBuilderDepthLab({ result }: { result: StatModuleResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
      <ReportAssemblyMini result={result} />
      <StatusCardGrid title="Report completeness checks" metrics={[
        { label: 'Dataset', value: 'needed' },
        { label: 'Method', value: 'needed' },
        { label: 'Result', value: 'needed' },
        { label: 'Chart', value: 'recommended' },
        { label: 'Limitations', value: 'needed' },
      ]} />
    </div>
  )
}

function ExportPackageDepthLab({ result }: { result: StatModuleResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
      <ExportPackageMini result={result} />
      <StatusCardGrid title="Asset checklist" metrics={[
        { label: 'Tables', value: 'CSV/HTML' },
        { label: 'Charts', value: 'PNG' },
        { label: 'Narrative', value: 'Markdown/HTML' },
        { label: 'State', value: 'JSON' },
      ]} />
    </div>
  )
}

function ScriptRecipeDepthLab({ result }: { result: StatModuleResult }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
      <ScriptRecipeMini result={result} />
      <StatusCardGrid title="Reproducibility checks" metrics={[
        { label: 'Load data', value: 'included' },
        { label: 'Select variables', value: 'included' },
        { label: 'Run method', value: 'included' },
        { label: 'Export result', value: 'recommended' },
      ]} />
    </div>
  )
}

function ParetoStrip({ counts }: { counts: Array<{ label: string; count: number }> }) {
  if (!counts.length) return <EmptyVisual title="Cumulative share" detail="Select a categorical column to build a Pareto strip." />
  const total = counts.reduce((sum, item) => sum + item.count, 0) || 1
  let cumulative = 0
  return (
    <div>
      <MiniTitle title="Cumulative share" detail="Pareto-style concentration" />
      <div className="overflow-hidden rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        <div className="flex h-24 rounded-md">
          {counts.map((item, i) => {
            cumulative += item.count
            return <div key={item.label} title={`${item.label}: ${Math.round((cumulative / total) * 100)}% cumulative`} className={i % 2 ? 'bg-emerald-500' : 'bg-indigo-500'} style={{ width: `${(item.count / total) * 100}%` }} />
          })}
        </div>
      </div>
    </div>
  )
}

function FlowPreview({ counts }: { counts: Array<{ label: string; count: number }> }) {
  if (!counts.length) return <EmptyVisual title="Flow / cell preview" detail="Select categorical fields to build cell previews." />
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
      <MiniTitle title="Flow / cell preview" detail="Top categories as analysis nodes" />
      <div className="grid gap-2 md:grid-cols-3">
        {counts.slice(0, 6).map((item, i) => <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800"><span className="text-xs text-slate-400">Node {i + 1}</span><p className="truncate font-semibold text-slate-700 dark:text-slate-200">{item.label}</p><p className="text-xs text-slate-500">{item.count} rows</p></div>)}
      </div>
    </div>
  )
}

function DecisionMeter({ pValue, alpha }: { pValue: number | null; alpha: number }) {
  const p = pValue ?? 1
  const position = Math.min(100, Math.max(0, (p / Math.max(alpha * 2, 0.001)) * 100))
  const reject = pValue !== null && pValue < alpha
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
      <MiniTitle title="Decision meter" detail={pValue === null ? 'No p-value metric detected' : `p = ${p.toFixed(4)}, alpha = ${alpha}`} />
      <div className="relative mt-6 h-4 rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="absolute inset-y-0 left-0 rounded-l-full bg-rose-500" style={{ width: '50%' }} />
        <div className="absolute top-1/2 h-8 w-1 -translate-y-1/2 rounded bg-slate-900 dark:bg-white" style={{ left: `${position}%` }} />
      </div>
      <p className={`mt-4 text-sm font-semibold ${reject ? 'text-rose-600 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-300'}`}>{reject ? 'Evidence crosses the alpha threshold.' : 'Evidence does not cross the alpha threshold.'}</p>
    </div>
  )
}

function PowerCurveMini({ alpha, result }: { alpha: number; result: StatModuleResult }) {
  const points = Array.from({ length: 16 }, (_, index) => {
    const effect = 0.15 + index * 0.09
    const power = 1 - Math.exp(-effect * 3.4 / Math.max(alpha * 8, 0.05))
    return { effect, power: Math.min(0.99, power) }
  })
  const path = points.map((point, i) => `${i ? 'L' : 'M'} ${48 + i * 44} ${210 - point.power * 160}`).join(' ')
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div>
        <MiniTitle title="Power curve" detail={`alpha = ${alpha}`} />
        <svg viewBox="0 0 760 260" className="h-64 w-full rounded-lg bg-slate-50 dark:bg-slate-950" role="img" aria-label="Power curve">
          <line x1="48" x2="720" y1="210" y2="210" stroke="#cbd5e1" />
          <line x1="48" x2="48" y1="40" y2="210" stroke="#cbd5e1" />
          <line x1="48" x2="720" y1="82" y2="82" stroke="#10b981" strokeDasharray="6 6" />
          <path d={path} fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
          <text x="56" y="76" fontSize="12" fill="#10b981">80% target</text>
        </svg>
      </div>
      <MetricBars metrics={result.metrics} />
    </div>
  )
}

function RankStripMini({ values, counts, result }: { values: number[]; counts: Array<{ label: string; count: number }>; result: StatModuleResult }) {
  const sorted = [...values].sort((a, b) => a - b).slice(0, 120)
  if (sorted.length < 2) return <EmptyVisual title="Rank strip" detail="Select a numeric outcome for rank-based comparison." />
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <div>
        <MiniTitle title="Rank strip" detail={`${sorted.length} ordered values`} />
        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
          <div className="flex h-16 items-end gap-0.5">
            {sorted.map((value, index) => <div key={`${value}-${index}`} className="flex-1 rounded-t bg-indigo-500/70" style={{ height: `${20 + (index / Math.max(sorted.length - 1, 1)) * 44}px` }} title={`Rank ${index + 1}: ${value}`} />)}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {result.metrics.slice(0, 3).map((metric) => <ResultInsightCard key={metric.label} label={metric.label} value={metric.value} />)}
          </div>
        </div>
      </div>
      <CategoryBars counts={counts} title="Group balance for ranks" />
    </div>
  )
}

function EffectGaugeMini({ result }: { result: StatModuleResult }) {
  const numeric = result.metrics.map((metric) => ({ label: metric.label, value: Math.abs(Number(metric.value)) })).filter((metric) => Number.isFinite(metric.value))
  const primary = numeric[0]
  const value = primary ? Math.min(1, primary.value / 2) : 0
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
      <MiniTitle title="Effect magnitude gauge" detail={primary ? primary.label : 'No numeric effect detected'} />
      <div className="relative mt-6 h-5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500" style={{ width: `${Math.max(8, value * 100)}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-slate-500">
        <span>Small</span><span>Medium</span><span>Large</span>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {result.metrics.slice(0, 3).map((metric) => <ResultInsightCard key={metric.label} label={metric.label} value={metric.value} />)}
      </div>
    </div>
  )
}

function MetricBars({ metrics }: { metrics: StatModuleResult['metrics'] }) {
  const numeric = metrics.map((metric) => ({ label: metric.label, value: Number(metric.value) })).filter((metric) => Number.isFinite(metric.value)).slice(0, 6)
  if (!numeric.length) return <EmptyVisual title="Metric shape" detail="Run a module that returns numeric metrics." />
  const max = Math.max(...numeric.map((metric) => Math.abs(metric.value)), 1)
  return (
    <div>
      <MiniTitle title="Metric shape" detail="Numeric output as comparable bars" />
      <div className="space-y-2 rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        {numeric.map((metric) => <div key={metric.label}><div className="mb-1 flex justify-between gap-3 text-xs font-semibold text-slate-500"><span>{metric.label}</span><span>{metric.value.toFixed(3)}</span></div><div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, Math.abs(metric.value) / max * 100)}%` }} /></div></div>)}
      </div>
    </div>
  )
}

function HistogramDepthLab({ values, bins, showDensity }: { values: number[]; bins: number; showDensity: boolean }) {
  const sorted = [...values].sort((a, b) => a - b)
  if (sorted.length < 2) return <EmptyVisual title="Histogram shape explorer" detail="Select a numeric column with valid values." />
  const meanValue = localMean(sorted)
  const median = quantile(sorted, 0.5)
  const q1 = quantile(sorted, 0.25)
  const q3 = quantile(sorted, 0.75)
  const iqr = q3 - q1
  const skewHint = meanValue > median ? 'Right-skew cue' : meanValue < median ? 'Left-skew cue' : 'Balanced center'
  const outliers = sorted.filter((value) => value < q1 - 1.5 * iqr || value > q3 + 1.5 * iqr).length
  return (
    <div className="grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
      <HistogramSvgMini values={values} bins={bins} title="Histogram shape explorer" showDensity={showDensity} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <ResultInsightCard label="Shape read" value={skewHint} tone="indigo" />
        <ResultInsightCard label="Center gap" value={`mean ${meanValue.toFixed(2)} / median ${median.toFixed(2)}`} />
        <ResultInsightCard label="IQR" value={iqr.toFixed(2)} tone="emerald" />
        <ResultInsightCard label="Outlier scan" value={`${outliers} outside 1.5 x IQR`} tone={outliers ? 'rose' : 'emerald'} />
      </div>
    </div>
  )
}

function ScatterRelationshipLab({ pairs, showOutliers, showResiduals }: { pairs: [number, number][]; showOutliers: boolean; showResiduals: boolean }) {
  const corr = correlation(pairs.map(([x]) => x), pairs.map(([, y]) => y))
  const line = regressionLine(pairs)
  const slope = line?.b ?? 0
  const strength = Math.abs(corr) >= 0.7 ? 'Strong' : Math.abs(corr) >= 0.4 ? 'Moderate' : 'Weak'
  return (
    <div className="grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
      <ScatterSvg pairs={pairs} title="Scatter relationship lab" showOutliers={showOutliers} residuals={showResiduals} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <ResultInsightCard label="Correlation" value={Number.isFinite(corr) ? corr.toFixed(3) : '-'} tone="indigo" />
        <ResultInsightCard label="Strength" value={Number.isFinite(corr) ? strength : 'Needs paired data'} />
        <ResultInsightCard label="Direction" value={slope > 0 ? 'Positive slope' : slope < 0 ? 'Negative slope' : 'Flat/unclear'} tone={slope ? 'emerald' : 'slate'} />
        <ResultInsightCard label="Residual layer" value={showResiduals ? 'Visible' : 'Hidden'} />
      </div>
    </div>
  )
}

function BoxDepthLab({ values, counts, showOutliers }: { values: number[]; counts: Array<{ label: string; count: number }>; showOutliers: boolean }) {
  const sorted = [...values].sort((a, b) => a - b)
  const q1 = sorted.length ? quantile(sorted, 0.25) : 0
  const med = sorted.length ? quantile(sorted, 0.5) : 0
  const q3 = sorted.length ? quantile(sorted, 0.75) : 0
  const outliers = sorted.filter((value) => value < q1 - 1.5 * (q3 - q1) || value > q3 + 1.5 * (q3 - q1)).length
  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.85fr]">
      <BoxPlotMini values={values} counts={counts} showOutliers={showOutliers} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <ResultInsightCard label="Median" value={med.toFixed(2)} tone="indigo" />
        <ResultInsightCard label="Q1 to Q3" value={`${q1.toFixed(2)} to ${q3.toFixed(2)}`} />
        <ResultInsightCard label="Outliers" value={showOutliers ? outliers : 'Hidden'} tone={outliers ? 'rose' : 'emerald'} />
        <ResultInsightCard label="Groups shown" value={counts.length || 'No group'} />
      </div>
    </div>
  )
}

function IntervalDepthLab({ result, values }: { result: StatModuleResult; values: number[] }) {
  const intervals = result.metrics.filter((metric) => String(metric.value).includes('[')).slice(0, 5)
  const parsed = intervals.map((metric) => ({ metric, bounds: parseIntervalBounds(String(metric.value)) }))
  const widths = parsed.map((item) => item.bounds ? Math.abs(item.bounds[1] - item.bounds[0]) : 0).filter(Boolean)
  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
      <IntervalMini result={result} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <ResultInsightCard label="Rows behind interval" value={values.length.toLocaleString()} tone="indigo" />
        <ResultInsightCard label="Narrowest width" value={widths.length ? Math.min(...widths).toFixed(3) : 'Not parsed'} />
        <ResultInsightCard label="Widest width" value={widths.length ? Math.max(...widths).toFixed(3) : 'Not parsed'} />
        <ResultInsightCard label="Report cue" value="State estimate, interval, and confidence level" tone="emerald" />
      </div>
    </div>
  )
}

function HypothesisTestDepthLab({ result, alpha, values, second }: { result: StatModuleResult; alpha: number; values: number[]; second: number[] }) {
  const pValue = firstPValue(result)
  const diff = values.length && second.length ? localMean(values) - localMean(second) : localMean(values)
  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
      <DecisionMeter pValue={pValue} alpha={alpha} />
      <div className="grid gap-3 sm:grid-cols-2">
        <ResultInsightCard label="Decision" value={pValue !== null && pValue < alpha ? 'Reject at alpha' : 'Fail to reject'} tone={pValue !== null && pValue < alpha ? 'rose' : 'emerald'} />
        <ResultInsightCard label="Alpha" value={alpha} />
        <ResultInsightCard label="Mean / difference cue" value={Number.isFinite(diff) ? diff.toFixed(3) : '-'} tone="indigo" />
        <ResultInsightCard label="Valid numeric rows" value={values.length.toLocaleString()} />
      </div>
    </div>
  )
}

function AnovaDepthLab({ counts, result, alpha }: { counts: Array<{ label: string; count: number }>; result: StatModuleResult; alpha: number }) {
  const pValue = firstPValue(result)
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_0.9fr]">
      <CategoryBars counts={counts} title="Group balance before ANOVA" />
      <MetricBars metrics={result.metrics} />
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        <MiniTitle title="ANOVA interpretation" detail={`alpha ${alpha}`} />
        <div className="space-y-3">
          <ResultInsightCard label="Omnibus decision" value={pValue !== null && pValue < alpha ? 'At least one mean differs' : 'No group mean signal'} tone={pValue !== null && pValue < alpha ? 'rose' : 'emerald'} />
          <ResultInsightCard label="Post-hoc need" value={pValue !== null && pValue < alpha ? 'Compare pairs next' : 'Usually not needed'} />
          <ResultInsightCard label="Groups checked" value={counts.length} />
        </div>
      </div>
    </div>
  )
}

function ChiSquareDepthLab({ cells, result, alpha }: { cells: Array<{ source: string; target: string; count: number }>; result: StatModuleResult; alpha: number }) {
  const pValue = firstPValue(result)
  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
      <HeatmapMini cells={cells} />
      <div className="grid gap-3 sm:grid-cols-2">
        <ResultInsightCard label="Association decision" value={pValue !== null && pValue < alpha ? 'Association signal' : 'No association signal'} tone={pValue !== null && pValue < alpha ? 'rose' : 'emerald'} />
        <ResultInsightCard label="Cells displayed" value={cells.length} />
        <ResultInsightCard label="Largest cell" value={cells[0] ? `${cells[0].source} x ${cells[0].target}` : '-'} tone="indigo" />
        <ResultInsightCard label="Expected-count reminder" value="Check sparse cells before reporting" />
        <MetricBars metrics={result.metrics} />
      </div>
    </div>
  )
}

function CorrelationDepthLab({ pairs, result, alpha }: { pairs: [number, number][]; result: StatModuleResult; alpha: number }) {
  const corr = correlation(pairs.map(([x]) => x), pairs.map(([, y]) => y))
  const pValue = firstPValue(result)
  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
      <ScatterSvg pairs={pairs} title="Correlation evidence lab" showOutliers residuals />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <ResultInsightCard label="Pearson signal" value={Number.isFinite(corr) ? corr.toFixed(3) : '-'} tone="indigo" />
        <ResultInsightCard label="Evidence" value={pValue !== null && pValue < alpha ? 'Statistically flagged' : 'Not flagged'} tone={pValue !== null && pValue < alpha ? 'rose' : 'emerald'} />
        <ResultInsightCard label="Paired rows" value={pairs.length.toLocaleString()} />
        <ResultInsightCard label="Caution" value="Inspect curve/outliers before causal language" />
      </div>
    </div>
  )
}

function RegressionCoefficientLab({ pairs, result, showResiduals }: { pairs: [number, number][]; result: StatModuleResult; showResiduals: boolean }) {
  const rows = result.table?.slice(0, 5) ?? []
  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
      <ScatterSvg pairs={pairs} title="Coefficient and residual lab" residuals={showResiduals} showOutliers />
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        <MiniTitle title="Coefficient interpretation" detail={`${rows.length} terms`} />
        <div className="space-y-2">
          {rows.length ? rows.map((row, index) => (
            <div key={index} className="rounded-lg bg-white p-3 text-xs dark:bg-slate-800">
              <p className="font-bold text-slate-700 dark:text-slate-200">{String(row.term ?? `Term ${index + 1}`)}</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">estimate {String(row.estimate ?? '-')} · p {String(row.p ?? '-')}</p>
            </div>
          )) : <MetricBars metrics={result.metrics} />}
        </div>
      </div>
    </div>
  )
}

function IntervalMini({ result }: { result: StatModuleResult }) {
  const intervals = result.metrics.filter((metric) => String(metric.value).includes('[')).slice(0, 4)
  if (!intervals.length) return <EmptyVisual title="Interval reader" detail="This result does not include interval-shaped metrics yet." />
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
      <MiniTitle title="Interval reader" detail="Intervals crossing the center line need extra caution" />
      <div className="space-y-3">
        {intervals.map((metric) => <div key={metric.label} className="rounded-lg bg-white p-3 text-sm dark:bg-slate-800"><p className="text-xs font-semibold text-slate-400">{metric.label}</p><p className="font-bold text-slate-700 dark:text-slate-100">{String(metric.value)}</p></div>)}
      </div>
    </div>
  )
}

function ClassificationMini({ scores, labels, threshold }: { scores: number[]; labels: number[]; threshold: number }) {
  const rows = scores.map((score, i) => ({ score, label: labels[i] > 0 ? 1 : 0 })).filter((row) => Number.isFinite(row.score))
  if (rows.length < 2) return <EmptyVisual title="Classification threshold" detail="Select a score column and a binary target column." />
  const cutoff = quantile(rows.map((row) => row.score).sort((a, b) => a - b), threshold)
  const tp = rows.filter((row) => row.score >= cutoff && row.label === 1).length
  const fp = rows.filter((row) => row.score >= cutoff && row.label === 0).length
  const tn = rows.filter((row) => row.score < cutoff && row.label === 0).length
  const fn = rows.filter((row) => row.score < cutoff && row.label === 1).length
  const precision = tp / Math.max(tp + fp, 1)
  const recall = tp / Math.max(tp + fn, 1)
  const accuracy = (tp + tn) / Math.max(rows.length, 1)
  const f1 = (2 * precision * recall) / Math.max(precision + recall, 1e-9)
  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr_0.9fr]">
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        <MiniTitle title="Confusion matrix" detail={`cutoff ${cutoff.toFixed(3)}`} />
        <div className="grid grid-cols-2 gap-2">
          {[['TP', tp], ['FP', fp], ['FN', fn], ['TN', tn]].map(([label, value]) => <div key={label} className="rounded-lg bg-white p-4 text-center dark:bg-slate-800"><p className="text-xs font-semibold text-slate-400">{label}</p><p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p></div>)}
        </div>
      </div>
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        <MiniTitle title="Threshold operating point" detail={`threshold quantile ${threshold.toFixed(2)}`} />
        <div className="space-y-3">
          {[['Accuracy', accuracy], ['Precision', precision], ['Recall', recall], ['F1', f1]].map(([label, value]) => (
            <div key={String(label)}>
              <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500"><span>{label}</span><span>{Number(value).toFixed(3)}</span></div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, Number(value) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <ResultInsightCard label="Positive class share" value={`${Math.round(rows.filter((row) => row.label === 1).length / rows.length * 100)}%`} tone="indigo" />
        <ResultInsightCard label="False positives" value={fp} tone={fp ? 'rose' : 'emerald'} />
        <ResultInsightCard label="False negatives" value={fn} tone={fn ? 'rose' : 'emerald'} />
        <ResultInsightCard label="Decision" value="Tune threshold to error cost" />
      </div>
    </div>
  )
}

function ClusterMini({ pairs }: { pairs: [number, number][] }) {
  const shown = pairs.slice(0, 220)
  const cx = localMean(shown.map(([x]) => x))
  const cy = localMean(shown.map(([, y]) => y))
  return <ScatterSvg pairs={shown.map(([x, y]) => [x - cx, y - cy]) as [number, number][]} title="Centered cluster map" />
}

function PcaMini({ values, second }: { values: number[]; second: number[] }) {
  const corr = correlation(values, second)
  if (!Number.isFinite(corr)) return <EmptyVisual title="PCA scree & loading lab" detail="Select two numeric variables with paired values." />
  const pc1 = Math.min(0.99, Math.max(0.5, (1 + Math.abs(corr)) / 2))
  const pc2 = 1 - pc1
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        <MiniTitle title="PCA scree & loading lab" detail={`Two-variable correlation ${corr.toFixed(3)}`} />
        <div className="mt-4 space-y-3">
          {[['PC1 explained', pc1], ['PC2 explained', pc2]].map(([label, value]) => (
            <div key={String(label)}>
              <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500"><span>{label}</span><span>{Math.round(Number(value) * 100)}%</span></div>
              <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Number(value) * 100}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <ResultInsightCard label="Loading X" value={corr >= 0 ? '+' : '-'} tone="indigo" />
          <ResultInsightCard label="Loading Y" value="+" tone="emerald" />
        </div>
      </div>
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
        <MiniTitle title="Loading direction map" detail="How to read component signs" />
        <svg viewBox="0 0 360 260" className="h-64 w-full rounded-lg bg-white dark:bg-slate-800" role="img" aria-label="PCA loading arrows">
          <line x1="180" x2="180" y1="28" y2="232" stroke="#cbd5e1" />
          <line x1="44" x2="316" y1="130" y2="130" stroke="#cbd5e1" />
          <line x1="180" y1="130" x2={corr >= 0 ? 286 : 74} y2="72" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
          <line x1="180" y1="130" x2="272" y2="190" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
          <circle cx="180" cy="130" r="5" fill="#0f172a" />
          <text x={corr >= 0 ? 292 : 42} y="70" fontSize="12" fill="#4f46e5">X</text>
          <text x="278" y="204" fontSize="12" fill="#10b981">Y</text>
        </svg>
      </div>
    </div>
  )
}

function CorrelationMini({ pairs }: { pairs: [number, number][] }) {
  const corr = correlation(pairs.map(([x]) => x), pairs.map(([, y]) => y))
  if (!Number.isFinite(corr)) return <EmptyVisual title="Correlation strength" detail="Select two numeric variables with paired rows." />
  return <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950"><MiniTitle title="Correlation strength" detail="Selected pair" /><div className="mt-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.abs(corr || 0) * 100}%` }} /></div><p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">r approx {Number.isFinite(corr) ? corr.toFixed(3) : '-'}</p></div>
}

function QqMini({ values }: { values: number[] }) {
  const sorted = [...values].sort((a, b) => a - b)
  if (sorted.length < 2) return <EmptyVisual title="Q-Q style check" detail="Select a numeric column with at least two values." />
  const z = sorted.map((_, i) => (i - sorted.length / 2) / Math.max(sorted.length / 6, 1))
  return <ScatterSvg pairs={z.map((x, i) => [x, sorted[i]]) as [number, number][]} title="Q-Q style check" />
}

function EcdfMini({ values }: { values: number[] }) {
  const sorted = [...values].sort((a, b) => a - b).slice(0, 220)
  if (sorted.length < 2) return <EmptyVisual title="ECDF threshold reader" detail="Select a numeric column with at least two values." />
  return <ScatterSvg pairs={sorted.map((x, i) => [x, (i + 1) / sorted.length]) as [number, number][]} title="ECDF threshold reader" />
}

function BoxPlotMini({ values, counts, showOutliers }: { values: number[]; counts: Array<{ label: string; count: number }>; showOutliers: boolean }) {
  const sorted = [...values].sort((a, b) => a - b)
  if (sorted.length < 5) return <EmptyVisual title="Boxplot spread lab" detail="Select a numeric column with at least five valid values." />
  const q1 = quantile(sorted, 0.25)
  const med = quantile(sorted, 0.5)
  const q3 = quantile(sorted, 0.75)
  const iqr = q3 - q1
  const lo = Math.max(sorted[0], q1 - 1.5 * iqr)
  const hi = Math.min(sorted[sorted.length - 1], q3 + 1.5 * iqr)
  const min = sorted[0], max = sorted[sorted.length - 1]
  const px = (v: number) => 50 + ((v - min) / Math.max(max - min, 1)) * 660
  const outliers = sorted.filter((value) => value < lo || value > hi).slice(0, 24)
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <div>
        <MiniTitle title="Boxplot spread lab" detail={`${sorted.length.toLocaleString()} values`} />
        <svg viewBox="0 0 760 220" className="h-56 w-full rounded-lg bg-slate-50 dark:bg-slate-950" role="img" aria-label="Boxplot spread lab">
          <line x1={px(lo)} x2={px(hi)} y1="110" y2="110" stroke="#64748b" strokeWidth="3" />
          <rect x={px(q1)} y="70" width={Math.max(4, px(q3) - px(q1))} height="80" rx="8" fill="#4f46e5" opacity="0.75" />
          <line x1={px(med)} x2={px(med)} y1="65" y2="155" stroke="#ffffff" strokeWidth="4" />
          <line x1={px(lo)} x2={px(lo)} y1="85" y2="135" stroke="#64748b" strokeWidth="3" />
          <line x1={px(hi)} x2={px(hi)} y1="85" y2="135" stroke="#64748b" strokeWidth="3" />
          {showOutliers && outliers.map((value, index) => <circle key={`${value}-${index}`} cx={px(value)} cy={index % 2 ? 50 : 170} r="4" fill="#f97316" opacity="0.8" />)}
        </svg>
      </div>
      <CategoryBars counts={counts} title="Group comparison preview" />
    </div>
  )
}

function DashboardPreview() {
  return (
    <div className="grid grid-cols-4 gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
      {['KPI', 'Chart', 'Table', 'Notes', 'Filter', 'Export'].map((panel, i) => <div key={panel} className={`rounded-lg bg-white p-4 text-sm font-semibold text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-200 ${i === 1 ? 'col-span-2 row-span-2' : ''}`}>{panel}</div>)}
    </div>
  )
}

function WorkflowTimeline({ result, title = 'Workflow preview' }: { result: StatModuleResult; title?: string }) {
  const rows = result.table?.slice(0, 5) ?? result.metrics.map((metric) => ({ step: metric.label, value: metric.value }))
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
      <MiniTitle title={title} detail={`${rows.length} recorded steps`} />
      <div className="mt-3 space-y-2">
        {rows.map((row, i) => <div key={i} className="flex gap-3 rounded-lg bg-white p-3 text-xs dark:bg-slate-800"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">{i + 1}</span><span className="min-w-0 truncate text-slate-600 dark:text-slate-300">{Object.entries(row).map(([k, v]) => `${k}: ${String(v)}`).join(' | ')}</span></div>)}
      </div>
    </div>
  )
}

function MiniTitle({ title, detail }: { title: string; detail: string }) {
  return <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3><span className="text-xs text-slate-400">{detail}</span></div>
}

function pairedRows(data: Record<string, unknown>[], a: string, b: string) {
  return data.map((row) => [Number(row[a]), Number(row[b])] as [number, number]).filter((pair) => pair.every(Number.isFinite))
}

function categoryCounts(data: Record<string, unknown>[], col: string) {
  const counts = new Map<string, number>()
  data.forEach((row) => {
    const key = String(row[col] ?? '(missing)')
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })
  return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)
}

function categoryPairCounts(data: Record<string, unknown>[], sourceCol: string, targetCol: string) {
  const counts = new Map<string, { source: string; target: string; count: number }>()
  data.forEach((row) => {
    const source = String(row[sourceCol] ?? '(missing)')
    const target = String(row[targetCol] ?? '(missing)')
    const key = `${source}\u0000${target}`
    const current = counts.get(key) ?? { source, target, count: 0 }
    current.count += 1
    counts.set(key, current)
  })
  return [...counts.values()].sort((a, b) => b.count - a.count)
}

function histogramBins(values: number[], targetBins: number) {
  const clean = values.filter(Number.isFinite)
  if (!clean.length) return []
  const min = Math.min(...clean)
  const max = Math.max(...clean)
  const width = max === min ? 1 : (max - min) / targetBins
  const bins = Array.from({ length: targetBins }, (_, index) => ({ start: min + index * width, end: min + (index + 1) * width, count: 0 }))
  clean.forEach((value) => {
    const index = Math.min(targetBins - 1, Math.max(0, Math.floor((value - min) / width)))
    bins[index].count += 1
  })
  return bins
}

function movingAverage(values: number[], window: number) {
  return values.map((_, index) => localMean(values.slice(Math.max(0, index - window + 1), index + 1)))
}

function localMean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

function quantile(sorted: number[], p: number) {
  if (!sorted.length) return 0
  const index = (sorted.length - 1) * p
  const lo = Math.floor(index)
  const hi = Math.ceil(index)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (index - lo)
}

function correlation(a: number[], b: number[]) {
  const pairs = a.map((value, i) => [value, b[i]] as [number, number]).filter((pair) => pair.every(Number.isFinite))
  const xs = pairs.map(([x]) => x)
  const ys = pairs.map(([, y]) => y)
  const mx = localMean(xs)
  const my = localMean(ys)
  const sx = Math.sqrt(localMean(xs.map((x) => (x - mx) ** 2)))
  const sy = Math.sqrt(localMean(ys.map((y) => (y - my) ** 2)))
  return localMean(pairs.map(([x, y]) => (x - mx) * (y - my))) / Math.max(sx * sy, 1e-9)
}

function regressionLine(pairs: [number, number][]) {
  if (pairs.length < 2) return null
  const xs = pairs.map(([x]) => x)
  const ys = pairs.map(([, y]) => y)
  const mx = localMean(xs)
  const my = localMean(ys)
  const den = xs.reduce((sum, x) => sum + (x - mx) ** 2, 0)
  if (!den) return null
  const b = pairs.reduce((sum, [x, y]) => sum + (x - mx) * (y - my), 0) / den
  return { a: my - b * mx, b }
}

function firstPValue(result: StatModuleResult) {
  const metric = result.metrics.find((item) => /p(?:-| |$)|p-value|p approx/i.test(item.label))
  const value = Number(metric?.value)
  return Number.isFinite(value) ? value : null
}

function parseIntervalBounds(value: string): [number, number] | null {
  const match = value.match(/\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]/)
  if (!match) return null
  const low = Number(match[1])
  const high = Number(match[2])
  return Number.isFinite(low) && Number.isFinite(high) ? [low, high] : null
}

function ModuleShortcutList({ title, keys, active, onSelect }: { title: string; keys: string[]; active: string; onSelect: (key: string) => void }) {
  return (
    <div className="mb-3">
      <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      {keys.map((key) => {
        const module = STAT_MODULES.find((item) => item.key === key)
        if (!module) return null
        return (
          <button key={key} onClick={() => onSelect(key)} className={`mb-1 w-full truncate rounded-md px-2 py-1 text-left text-xs ${active === key ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
            {module.id}. {module.title.replace(' Module', '')}
          </button>
        )
      })}
    </div>
  )
}

function PlotPanel({ chart, theme, moduleKey, notify, height = '420px' }: { chart: { data: unknown[]; layout?: Record<string, unknown> }; theme: AppTheme; moduleKey: string; notify: (message: string, tone?: 'success' | 'info') => void; height?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const plotlyRef = useRef<Awaited<ReturnType<typeof loadPlotly>> | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [chartTitle, setChartTitle] = useState(String((chart.layout?.title as string | undefined) ?? moduleKey.replace(/_/g, ' ')))
  const [palette, setPalette] = useState<'indigo' | 'emerald' | 'rose'>('indigo')
  const [exportSize, setExportSize] = useState<'slide' | 'report' | 'wide'>('report')
  const colorway = useMemo(() => palette === 'emerald'
    ? ['#059669', '#0ea5e9', '#84cc16', '#f59e0b', '#64748b']
    : palette === 'rose'
      ? ['#e11d48', '#7c3aed', '#f97316', '#0ea5e9', '#64748b']
      : ['#4f46e5', '#0ea5e9', '#a78bfa', '#f97316', '#64748b'], [palette])
  const exportDims = exportSize === 'slide' ? { width: 1280, height: 720 } : exportSize === 'wide' ? { width: 1800, height: 900 } : { width: 1400, height: 1000 }
  const hasDrawableData = chart.data.some((trace) => {
    const item = trace as Record<string, unknown>
    return Array.isArray(item.x) && item.x.length > 0 || Array.isArray(item.y) && item.y.length > 0 || Array.isArray(item.z) && item.z.length > 0 || Array.isArray(item.labels) && item.labels.length > 0
  })

  useEffect(() => {
    let cancelled = false
    const render = async () => {
      if (!ref.current) return
      try {
        setStatus('loading')
        if (!hasDrawableData) {
          setStatus('ready')
          return
        }
        const Plotly = plotlyRef.current ?? await loadPlotly()
        plotlyRef.current = Plotly
        if (cancelled || !ref.current) return
        await Plotly.react(
          ref.current,
          chart.data as Array<Record<string, unknown>>,
          {
            autosize: true,
            paper_bgcolor: theme === 'dark' ? '#1e293b' : '#ffffff',
            plot_bgcolor: theme === 'dark' ? '#0f172a' : '#f8fafc',
            font: { color: theme === 'dark' ? '#cbd5e1' : '#334155', family: 'Inter, system-ui, sans-serif', size: 12 },
            ...(chart.layout ?? {}),
            title: { text: chartTitle, font: { size: 15 } },
            colorway,
          },
          { responsive: true, displaylogo: false }
        )
        if (!cancelled) setStatus('ready')
      } catch (error) {
        if (!cancelled) {
          setStatus('error')
          setErrorMessage(error instanceof Error ? error.message : 'Chart rendering failed.')
        }
      }
    }
    render()
    return () => {
      cancelled = true
    }
  }, [chart, theme, chartTitle, colorway, hasDrawableData])

  const exportPng = async () => {
    if (!ref.current) return
    try {
      const Plotly = plotlyRef.current ?? await loadPlotly()
      plotlyRef.current = Plotly
      const url = await Plotly.toImage(ref.current, { format: 'png', height: exportDims.height, width: exportDims.width })
      const link = document.createElement('a')
      link.href = url
      link.download = `${moduleKey}.png`
      link.click()
      notify('Chart exported as PNG.', 'success')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to export chart.', 'info')
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900">
        <Palette size={14} className="text-indigo-500" />
        <input value={chartTitle} onChange={(event) => setChartTitle(event.target.value)} className="min-w-48 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200" aria-label="Chart title" />
        <select value={palette} onChange={(event) => setPalette(event.target.value as typeof palette)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200" aria-label="Chart palette">
          <option value="indigo">Indigo</option>
          <option value="emerald">Emerald</option>
          <option value="rose">Rose</option>
        </select>
        <select value={exportSize} onChange={(event) => setExportSize(event.target.value as typeof exportSize)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200" aria-label="Export size">
          <option value="report">Report</option>
          <option value="slide">Slide</option>
          <option value="wide">Wide</option>
        </select>
      </div>
      <div className="relative">
        {!hasDrawableData && (
          <EmptyVisual title="Chart needs data" detail="The calculation returned chart metadata, but no drawable rows survived filtering. Select compatible variables or load the module sample." />
        )}
        {status === 'loading' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 text-xs font-semibold text-slate-500 backdrop-blur dark:bg-slate-900/75 dark:text-slate-300" role="status" aria-live="polite">
            <span className="inline-flex items-center gap-2"><Loader2 size={15} className="animate-spin text-indigo-500" /> Loading interactive chart...</span>
          </div>
        )}
        {status === 'error' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-300" role="alert">
            <p className="font-semibold">Chart could not render.</p>
            <p className="mt-1 text-xs leading-5">{errorMessage}</p>
            <p className="mt-2 text-xs leading-5">Try a smaller export size, switch palette once to refresh, or choose columns with fewer missing/invalid values.</p>
          </div>
        )}
        <div ref={ref} aria-label={`${moduleKey.replace(/_/g, ' ')} chart`} style={{ width: '100%', minHeight: height, display: status === 'error' || !hasDrawableData ? 'none' : 'block' }} />
      </div>
      <button type="button" onClick={exportPng} disabled={status !== 'ready' || !hasDrawableData} className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300" title={hasDrawableData ? 'Export chart as PNG' : 'No drawable chart data to export'}>
        <Download size={12} />
        PNG
      </button>
    </div>
  )
}

type LazyPlotly = {
  react: (el: HTMLElement, data: unknown[], layout: Record<string, unknown>, config: Record<string, unknown>) => Promise<unknown>
  toImage: (el: HTMLElement, opts: { format: 'png'; height: number; width: number }) => Promise<string>
}

async function loadPlotly(): Promise<LazyPlotly> {
  const mod = await import('plotly.js-dist-min')
  return mod.default as unknown as LazyPlotly
}

function Select({ label, value, options, columnMeta, onChange, icon, hint, error }: { label: string; value: string; options: string[]; columnMeta?: Record<string, Dataset['schema'][number]>; onChange: (value: string) => void; icon?: 'numeric'; hint?: string; error?: string }) {
  return (
    <label className="text-xs text-slate-500" title={hint}>
      <span className="inline-flex items-center gap-1">{icon === 'numeric' && <Hash size={11} />}{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-700 dark:bg-slate-700 dark:text-slate-200 ${error ? 'border-amber-300 focus:border-amber-400' : 'border-slate-200 dark:border-slate-600'}`}
      >
        {options.length === 0 && <option value="">No compatible columns</option>}
        {options.map((option) => {
          const meta = columnMeta?.[option]
          const suffix = meta ? ` · ${meta.type} · miss ${meta.missingPct.toFixed(1)}% · ${meta.unique} unique` : ''
          return <option key={option} value={option}>{option}{suffix}</option>
        })}
      </select>
      {value && columnMeta?.[value] && (
        <span className="mt-1 flex flex-wrap gap-1">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">{columnMeta[value].type}</span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">{columnMeta[value].missingPct.toFixed(1)}% missing</span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">{columnMeta[value].unique} unique</span>
        </span>
      )}
      {error && <span className="mt-1 block text-[11px] leading-4 text-amber-600 dark:text-amber-300">{error}</span>}
    </label>
  )
}
