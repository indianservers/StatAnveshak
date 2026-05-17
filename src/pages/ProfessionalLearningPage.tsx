import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Copy,
  Database,
  Download,
  FileText,
  GraduationCap,
  ListChecks,
  NotebookPen,
  Route,
  ShieldCheck,
  Sigma,
  Target,
  Trash2,
  Upload,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { SAMPLE_DATASETS } from '../lib/sampleData'
import { sampleToDataset } from '../lib/dataset'
import { saveDataset, saveProject } from '../lib/storage'
import {
  classroomSubmissionMarkdown,
  createClassroomSubmission,
  createProjectBundle,
  downloadFile,
  parseProjectBundle,
  shareableReportHtml,
} from '../lib/shareBundles'
import {
  FORMULA_BRIDGES,
  INSTRUCTOR_TEMPLATES,
  LEARNING_PATHS,
  PRACTICE_BANK,
  REPORT_TEMPLATES,
  TEACHING_DATASET_LIBRARY,
  assumptionPanel,
  interpretationNarrative,
  recommendTest,
  type DecisionGoal,
  type PracticeKind,
  type SampleDesign,
  type VariableShape,
} from '../lib/professionalLearning'
import type { AnalysisLogEntry } from '../types'

type TabKey = 'paths' | 'practice' | 'wizard' | 'assumptions' | 'formulas' | 'datasets' | 'instructor' | 'templates' | 'notebook' | 'share'

const TABS: Array<{ key: TabKey; label: string; icon: typeof BookOpen }> = [
  { key: 'paths', label: 'Paths', icon: Route },
  { key: 'practice', label: 'Practice', icon: ListChecks },
  { key: 'wizard', label: 'Decision Wizard', icon: Target },
  { key: 'assumptions', label: 'Assumptions', icon: ShieldCheck },
  { key: 'formulas', label: 'Formulas', icon: Sigma },
  { key: 'datasets', label: 'Datasets', icon: Database },
  { key: 'instructor', label: 'Instructor', icon: GraduationCap },
  { key: 'templates', label: 'Templates', icon: FileText },
  { key: 'notebook', label: 'Notebook', icon: NotebookPen },
  { key: 'share', label: 'Share', icon: Upload },
]

export function ProfessionalLearningPage() {
  const {
    activeDataset,
    datasets,
    addDataset,
    setActiveDataset,
    projects,
    activeProject,
    addProject,
    analysisHistory,
    addAnalysisLog,
    removeAnalysisLog,
    clearAnalysisHistory,
  } = useStore()
  const [tab, setTab] = useState<TabKey>('paths')
  const [practiceKind, setPracticeKind] = useState<PracticeKind | 'all'>('all')
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [goal, setGoal] = useState<DecisionGoal>('compare-groups')
  const [shape, setShape] = useState<VariableShape>('numeric')
  const [design, setDesign] = useState<SampleDesign>('two-independent')
  const [method, setMethod] = useState('Welch two-sample t-test')
  const [variables, setVariables] = useState<string[]>([])
  const [resultSummary, setResultSummary] = useState('the evidence is not yet recorded; run an analysis or replace this text with the observed result')
  const [studentName, setStudentName] = useState('')
  const [course, setCourse] = useState('Statistics')
  const [assignment, setAssignment] = useState('StatAnveshak analysis submission')
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const numericColumns = activeDataset?.schema.filter((col) => col.type === 'numeric').map((col) => col.name) ?? []
  const selectableColumns = activeDataset?.schema.map((col) => col.name) ?? []
  const visiblePractice = PRACTICE_BANK.filter((item) => practiceKind === 'all' || item.kind === practiceKind)
  const recommendation = recommendTest(goal, shape, design)
  const assumptionChecks = assumptionPanel(activeDataset, method.toLowerCase(), variables)
  const assumptionWarnings = assumptionChecks.filter((check) => check.status !== 'ok').map((check) => check.detail)
  const narrative = interpretationNarrative(method, resultSummary, assumptionWarnings.slice(0, 2))

  const formulaExample = useMemo(() => {
    if (!activeDataset || numericColumns.length === 0) return null
    const col = activeDataset.schema.find((item) => item.name === numericColumns[0])
    if (!col || typeof col.mean !== 'number' || typeof col.std !== 'number') return null
    const x = Number(col.sample.find((value) => typeof value === 'number') ?? col.mean)
    const z = col.std === 0 ? 0 : (x - col.mean) / col.std
    return { column: col.name, x, mean: col.mean, sd: col.std, z }
  }, [activeDataset, numericColumns])

  const loadTeachingDataset = async (sampleId: string) => {
    const sample = SAMPLE_DATASETS.find((item) => item.id === sampleId)
    if (!sample) return
    const dataset = sampleToDataset(sample)
    addDataset(dataset)
    setActiveDataset(dataset)
    await saveDataset(dataset)
    navigate('/data/preview')
  }

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text)
  }

  const recordNotebookEntry = () => {
    const entry: AnalysisLogEntry = {
      id: `analysis_${Date.now()}`,
      createdAt: Date.now(),
      title: `${method} - ${activeDataset?.name ?? 'No dataset'}`,
      datasetName: activeDataset?.name,
      workflow: 'Professional Learning decision wizard',
      variables,
      method,
      resultSummary,
      assumptions: assumptionChecks.map((check) => `${check.label}: ${check.detail}`),
      interpretation: narrative.plain,
      reportText: narrative.report,
    }
    addAnalysisLog(entry)
    setTab('notebook')
  }

  const exportNotebook = () => {
    const body = analysisHistory.map((entry) => [
      `# ${entry.title}`,
      `Date: ${new Date(entry.createdAt).toLocaleString()}`,
      `Dataset: ${entry.datasetName ?? '-'}`,
      `Workflow: ${entry.workflow}`,
      `Variables: ${entry.variables.join(', ') || '-'}`,
      `Method: ${entry.method}`,
      '',
      '## Assumptions',
      ...entry.assumptions.map((item) => `- ${item}`),
      '',
      '## Result',
      entry.resultSummary,
      '',
      '## Interpretation',
      entry.interpretation,
      '',
      '## Report Text',
      entry.reportText,
    ].join('\n')).join('\n\n---\n\n')
    downloadFile('statanveshak-analysis-notebook.md', body || '# StatAnveshak Analysis Notebook\n\nNo entries yet.', 'text/markdown;charset=utf-8')
  }

  const exportProjectBundle = () => {
    const bundle = createProjectBundle({
      datasets: activeDataset ? [activeDataset, ...datasets.filter((item) => item.id !== activeDataset.id)] : datasets,
      projects,
      activeDatasetId: activeDataset?.id,
      activeProjectId: activeProject?.id,
      analysisHistory,
    })
    downloadFile(`statanveshak-project-bundle-${Date.now()}.json`, JSON.stringify(bundle, null, 2))
  }

  const importProjectBundle = async (file?: File) => {
    if (!file) return
    setImportMessage(null)
    try {
      const bundle = parseProjectBundle(JSON.parse(await file.text()))
      await Promise.all([
        ...bundle.datasets.map((dataset) => saveDataset(dataset)),
        ...bundle.projects.map((project) => saveProject(project)),
      ])
      bundle.datasets.forEach((dataset) => addDataset(dataset))
      bundle.projects.forEach((project) => addProject(project))
      bundle.analysisHistory.forEach((entry) => addAnalysisLog(entry))
      const active = bundle.datasets.find((dataset) => dataset.id === bundle.activeDatasetId) ?? bundle.datasets[0]
      if (active) setActiveDataset(active)
      setImportMessage(`Imported ${bundle.datasets.length} datasets, ${bundle.projects.length} projects, and ${bundle.analysisHistory.length} notebook entries.`)
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : 'Import failed.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const exportShareableReport = () => {
    const html = shareableReportHtml({
      title: `${activeDataset?.name ?? 'StatAnveshak'} Shareable Report`,
      dataset: activeDataset,
      analysisHistory,
    })
    downloadFile(`statanveshak-shareable-report-${Date.now()}.html`, html, 'text/html;charset=utf-8')
  }

  const exportClassroomSubmission = (format: 'json' | 'markdown') => {
    const submission = createClassroomSubmission({
      studentName,
      course,
      assignment,
      dataset: activeDataset,
      notebookEntries: analysisHistory,
    })
    if (format === 'json') {
      downloadFile(`classroom-submission-${Date.now()}.json`, JSON.stringify(submission, null, 2))
    } else {
      downloadFile(`classroom-submission-${Date.now()}.md`, classroomSubmissionMarkdown(submission), 'text/markdown;charset=utf-8')
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Professional learning and practice</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-800 dark:text-white">Statistics Learning Paths, Practice, and Reporting Studio</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
              Guided curriculum, question bank, test-selection wizard, assumption checks, formula bridges, teaching datasets, instructor packs, report templates, and reproducible notebooks.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs text-slate-400">Active dataset</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200">{activeDataset ? `${activeDataset.name} (${activeDataset.rows} rows)` : 'None loaded'}</p>
          </div>
        </div>

        <div className="mb-5 overflow-auto border-b border-slate-200 dark:border-slate-700">
          <div className="flex min-w-max gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium ${
                  tab === key
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'paths' && (
          <div className="grid gap-4 lg:grid-cols-2">
            {LEARNING_PATHS.map((path) => (
              <section key={path.id} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">{path.audience}</p>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">{path.title}</h2>
                  </div>
                  <BookOpen className="text-slate-300" size={22} />
                </div>
                <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{path.outcome}</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {path.modules.map((module) => <span key={module} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">{module}</span>)}
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {path.practiceTargets.map((target) => (
                    <div key={target} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">{target}</div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {tab === 'practice' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Categorized Practice Engine</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">MCQs, numeric drills, interpretations, dataset tasks, and professional cases.</p>
              </div>
              <select value={practiceKind} onChange={(event) => setPracticeKind(event.target.value as PracticeKind | 'all')} className="input-select max-w-56">
                <option value="all">All question types</option>
                <option value="mcq">MCQ</option>
                <option value="numeric">Numeric</option>
                <option value="interpretation">Interpretation</option>
                <option value="dataset-task">Dataset task</option>
                <option value="case-study">Case study</option>
              </select>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {visiblePractice.map((question) => {
                const selected = selectedAnswers[question.id]
                const correct = selected && selected.trim().toLowerCase() === question.answer.trim().toLowerCase()
                return (
                  <div key={question.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">{question.kind}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-700">{question.level}</span>
                      <span className="text-xs text-slate-400">{question.topic}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{question.prompt}</p>
                    {question.choices ? (
                      <div className="mt-3 grid gap-2">
                        {question.choices.map((choice) => (
                          <button key={choice} type="button" onClick={() => setSelectedAnswers((answers) => ({ ...answers, [question.id]: choice }))} className={`rounded-md border px-3 py-2 text-left text-xs ${selected === choice ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                            {choice}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input value={selected ?? ''} onChange={(event) => setSelectedAnswers((answers) => ({ ...answers, [question.id]: event.target.value }))} placeholder="Type your answer or decision" className="mt-3 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
                    )}
                    {selected && (
                      <div className={`mt-3 rounded-md p-3 text-xs ${correct ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'}`}>
                        <p className="font-semibold">{correct ? 'Correct' : `Expected: ${question.answer}`}</p>
                        <p className="mt-1">{question.explanation}</p>
                      </div>
                    )}
                    {question.datasetHint && <p className="mt-3 text-xs text-slate-400">Dataset: {question.datasetHint}</p>}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {tab === 'wizard' && (
          <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-4 text-lg font-bold text-slate-800 dark:text-white">Which Test Should I Use?</h2>
              <WizardSelect label="Research goal" value={goal} onChange={(value) => setGoal(value as DecisionGoal)} options={[
                ['compare-groups', 'Compare groups'],
                ['relationship', 'Study relationship'],
                ['predict', 'Predict outcome'],
                ['describe', 'Describe data'],
                ['fit-distribution', 'Fit distribution'],
              ]} />
              <WizardSelect label="Variable shape" value={shape} onChange={(value) => setShape(value as VariableShape)} options={[
                ['numeric', 'Numeric'],
                ['categorical', 'Categorical'],
                ['mixed', 'Mixed'],
                ['time', 'Time series'],
              ]} />
              <WizardSelect label="Sample design" value={design} onChange={(value) => setDesign(value as SampleDesign)} options={[
                ['one-sample', 'One sample'],
                ['two-independent', 'Two independent groups'],
                ['paired', 'Paired/repeated'],
                ['three-plus', 'Three or more groups'],
                ['observational', 'Observational'],
              ]} />
            </div>
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-900/20">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Recommendation</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{recommendation}</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {['Define H0 and H1 before computing.', 'Check sample design and independence.', 'Inspect assumptions and outliers.', 'Report effect size and limitation, not only p-value.'].map((item) => (
                  <div key={item} className="flex items-start gap-2 rounded-md bg-white/70 p-3 text-sm text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => { setMethod(recommendation.split(' with ')[0]); setTab('assumptions') }} className="mt-5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Use in Assumption Panel
              </button>
            </div>
          </section>
        )}

        {tab === 'assumptions' && (
          <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-4 text-lg font-bold text-slate-800 dark:text-white">Assumption Setup</h2>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Method</label>
              <input value={method} onChange={(event) => setMethod(event.target.value)} className="mb-4 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
              <label className="mb-1 block text-xs font-semibold text-slate-500">Variables</label>
              <div className="max-h-56 space-y-2 overflow-auto rounded-md border border-slate-200 p-2 dark:border-slate-700">
                {selectableColumns.length ? selectableColumns.map((col) => (
                  <label key={col} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input type="checkbox" checked={variables.includes(col)} onChange={(event) => setVariables((items) => event.target.checked ? [...items, col] : items.filter((item) => item !== col))} />
                    {col}
                  </label>
                )) : <p className="text-xs text-slate-400">Load a dataset to select variables.</p>}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {assumptionChecks.map((check) => (
                <div key={check.label} className={`rounded-lg border p-4 ${check.status === 'ok' ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20' : check.status === 'warn' ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'}`}>
                  <div className="mb-2 flex items-center gap-2">
                    {check.status === 'ok' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className="text-amber-500" />}
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">{check.label}</h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{check.detail}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'formulas' && (
          <div className="grid gap-4 lg:grid-cols-2">
            {FORMULA_BRIDGES.map((item) => (
              <section key={item.id} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.purpose}</p>
                <div className="my-4 rounded-md bg-slate-900 px-4 py-3 font-mono text-sm text-white">{item.formula}</div>
                <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {item.steps.map((step, index) => <li key={step}><strong>Step {index + 1}:</strong> {step}</li>)}
                </ol>
                {item.id === 'z-score' && formulaExample && (
                  <div className="mt-4 rounded-md bg-indigo-50 p-3 text-sm text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200">
                    Using {formulaExample.column}: z = ({round(formulaExample.x)} - {round(formulaExample.mean)}) / {round(formulaExample.sd)} = {round(formulaExample.z)}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {tab === 'datasets' && (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {TEACHING_DATASET_LIBRARY.map((entry) => {
              const sample = SAMPLE_DATASETS.find((item) => item.id === entry.sampleId)
              if (!sample) return null
              return (
                <section key={entry.sampleId} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-bold text-slate-800 dark:text-white">{sample.name}</h2>
                      <p className="text-xs text-slate-400">{sample.category} - {sample.data.length} rows - {entry.difficulty}</p>
                    </div>
                    <Database size={18} className="text-indigo-500" />
                  </div>
                  <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">{sample.description}</p>
                  <div className="mb-3 flex flex-wrap gap-2">{entry.concepts.map((concept) => <span key={concept} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">{concept}</span>)}</div>
                  <p className="mb-4 rounded-md bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-900/50 dark:text-slate-300">{entry.task}</p>
                  <button type="button" onClick={() => loadTeachingDataset(entry.sampleId)} className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700">Load dataset</button>
                </section>
              )
            })}
          </div>
        )}

        {tab === 'instructor' && (
          <div className="grid gap-4 lg:grid-cols-2">
            {INSTRUCTOR_TEMPLATES.map((template) => (
              <section key={template.title} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{template.title}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Output: {template.output}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {template.rubric.map((item) => <div key={item} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">{item}</div>)}
                </div>
              </section>
            ))}
          </div>
        )}

        {tab === 'templates' && (
          <div className="grid gap-4 lg:grid-cols-2">
            {REPORT_TEMPLATES.map((template) => {
              const text = `${template.title}\n\n${template.sections.map((section) => `## ${section}\n`).join('\n')}`
              return (
                <section key={template.title} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">{template.title}</h2>
                    <button type="button" onClick={() => copyText(text)} className="rounded-md border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700" title="Copy template">
                      <Copy size={15} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">{template.sections.map((section) => <span key={section} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">{section}</span>)}</div>
                </section>
              )
            })}
          </div>
        )}

        {tab === 'notebook' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Analysis History and Notebook</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Save wizard outputs, assumption checks, interpretation text, and report wording.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={recordNotebookEntry} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700"><NotebookPen size={14} /> Record current</button>
                <button type="button" onClick={exportNotebook} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"><Download size={14} /> Export</button>
                <button type="button" onClick={clearAnalysisHistory} className="inline-flex items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/20"><Trash2 size={14} /> Clear</button>
              </div>
            </div>
            <div className="mb-5 rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Current interpretation layer</h3>
              <textarea value={resultSummary} onChange={(event) => setResultSummary(event.target.value)} className="mb-3 h-20 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
              <div className="grid gap-3 md:grid-cols-2">
                <NarrativeCard title="Plain language" text={narrative.plain} onCopy={copyText} />
                <NarrativeCard title="Report wording" text={narrative.report} onCopy={copyText} />
                <NarrativeCard title="APA checklist" text={narrative.apa} onCopy={copyText} />
                <NarrativeCard title="Do not conclude" text={narrative.doNotConclude} onCopy={copyText} />
              </div>
            </div>
            <div className="space-y-3">
              {analysisHistory.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-400 dark:border-slate-700">No notebook entries yet. Record the current wizard/assumption/interpretation state to start a reproducible analysis log.</p>
              ) : analysisHistory.map((entry) => (
                <article key={entry.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white">{entry.title}</h3>
                      <p className="text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString()} - {entry.datasetName ?? 'No dataset'}</p>
                    </div>
                    <button type="button" onClick={() => removeAnalysisLog(entry.id)} className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20"><Trash2 size={14} /></button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{entry.interpretation}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'share' && (
          <section className="grid gap-5 xl:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex items-center gap-2">
                <Database size={18} className="text-indigo-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Project Bundle</h2>
              </div>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                Export or import a browser-only bundle containing datasets, projects, active selections, and notebook history. This is the offline-safe way to move work between machines.
              </p>
              <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900/50"><strong>{datasets.length}</strong><br />datasets</div>
                <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900/50"><strong>{projects.length}</strong><br />projects</div>
                <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900/50"><strong>{analysisHistory.length}</strong><br />logs</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={exportProjectBundle} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700">
                  <Download size={14} />
                  Export bundle
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
                  <Upload size={14} />
                  Import bundle
                </button>
                <input ref={fileInputRef} type="file" accept=".json,application/json" className="sr-only" onChange={(event) => importProjectBundle(event.target.files?.[0])} />
              </div>
              {importMessage && <p className="mt-3 rounded-md bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-900/50 dark:text-slate-300">{importMessage}</p>}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex items-center gap-2">
                <FileText size={18} className="text-emerald-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Shareable Report</h2>
              </div>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                Generate a standalone HTML report that can be emailed, archived, printed to PDF, or submitted with a project. It includes dataset schema and notebook interpretation entries.
              </p>
              <div className="mb-4 rounded-md bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                No data leaves the browser. The exported HTML is created locally from IndexedDB and in-memory state.
              </div>
              <button type="button" onClick={exportShareableReport} className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700">
                <Download size={14} />
                Export HTML report
              </button>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardList size={18} className="text-amber-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Classroom Submission</h2>
              </div>
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Student name</span>
                  <input value={studentName} onChange={(event) => setStudentName(event.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Course</span>
                  <input value={course} onChange={(event) => setCourse(event.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Assignment</span>
                  <input value={assignment} onChange={(event) => setAssignment(event.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => exportClassroomSubmission('markdown')} className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-3 py-2 text-xs font-medium text-white hover:bg-amber-600">
                  <Download size={14} />
                  Submission .md
                </button>
                <button type="button" onClick={() => exportClassroomSubmission('json')} className="inline-flex items-center gap-2 rounded-md border border-amber-200 px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/20">
                  <Download size={14} />
                  Submission .json
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function WizardSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="input-select">
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  )
}

function NarrativeCard({ title, text, onCopy }: { title: string; text: string; onCopy: (text: string) => void }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        <button type="button" onClick={() => onCopy(text)} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700" title="Copy">
          <Copy size={13} />
        </button>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">{text}</p>
    </div>
  )
}

function round(value: number) {
  return Number(value.toFixed(3)).toLocaleString()
}
