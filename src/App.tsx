import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })))
const UploadPage = lazy(() => import('./pages/data/UploadPage').then((m) => ({ default: m.UploadPage })))
const PreviewPage = lazy(() => import('./pages/data/PreviewPage').then((m) => ({ default: m.PreviewPage })))
const GridPage = lazy(() => import('./pages/data/GridPage').then((m) => ({ default: m.GridPage })))
const CleanPage = lazy(() => import('./pages/data/CleanPage').then((m) => ({ default: m.CleanPage })))
const WorkbenchPage = lazy(() => import('./pages/data/WorkbenchPage').then((m) => ({ default: m.WorkbenchPage })))
const QueryPage = lazy(() => import('./pages/data/QueryPage').then((m) => ({ default: m.QueryPage })))
const SummaryPage = lazy(() => import('./pages/explore/SummaryPage').then((m) => ({ default: m.SummaryPage })))
const ChartsPage = lazy(() => import('./pages/explore/ChartsPage').then((m) => ({ default: m.ChartsPage })))
const CorrelationPage = lazy(() => import('./pages/explore/CorrelationPage').then((m) => ({ default: m.CorrelationPage })))
const FrequencyPage = lazy(() => import('./pages/explore/FrequencyPage').then((m) => ({ default: m.FrequencyPage })))
const DistributionsPage = lazy(() => import('./pages/DistributionsPage').then((m) => ({ default: m.DistributionsPage })))
const InferencePage = lazy(() => import('./pages/InferencePage').then((m) => ({ default: m.InferencePage })))
const RegressionPage = lazy(() => import('./pages/RegressionPage').then((m) => ({ default: m.RegressionPage })))
const AdvancedAnalysisPage = lazy(() => import('./pages/AdvancedAnalysisPage').then((m) => ({ default: m.AdvancedAnalysisPage })))
const StatModulesPage = lazy(() => import('./pages/StatModulesPage').then((m) => ({ default: m.StatModulesPage })))
const ComputingModulesPage = lazy(() => import('./pages/ComputingModulesPage').then((m) => ({ default: m.ComputingModulesPage })))
const SyllabusModulesPage = lazy(() => import('./pages/SyllabusModulesPage').then((m) => ({ default: m.SyllabusModulesPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const LearnPage = lazy(() => import('./pages/LearnPage').then((m) => ({ default: m.LearnPage })))
const SolverPage = lazy(() => import('./pages/SolverPage').then((m) => ({ default: m.SolverPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      <span className="ml-3">Loading workspace...</span>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="data/upload" element={<UploadPage />} />
              <Route path="data/preview" element={<PreviewPage />} />
              <Route path="data/grid" element={<GridPage />} />
              <Route path="data/clean" element={<CleanPage />} />
              <Route path="data/workbench" element={<WorkbenchPage />} />
              <Route path="data/query" element={<QueryPage />} />
              <Route path="explore/summary" element={<SummaryPage />} />
              <Route path="explore/charts" element={<ChartsPage />} />
              <Route path="explore/correlation" element={<CorrelationPage />} />
              <Route path="explore/frequency" element={<FrequencyPage />} />
              <Route path="distributions" element={<DistributionsPage />} />
              <Route path="distributions/:distributionId" element={<DistributionsPage />} />
              <Route path="inference" element={<InferencePage />} />
              <Route path="regression" element={<RegressionPage />} />
              <Route path="advanced" element={<AdvancedAnalysisPage />} />
              <Route path="stat-modules" element={<StatModulesPage />} />
              <Route path="stat-modules/:moduleKey" element={<StatModulesPage />} />
              <Route path="modules" element={<ComputingModulesPage />} />
              <Route path="modules/:moduleKey" element={<ComputingModulesPage />} />
              <Route path="syllabus" element={<SyllabusModulesPage />} />
              <Route path="syllabus/:moduleKey" element={<SyllabusModulesPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="learn" element={<LearnPage />} />
              <Route path="solver" element={<SolverPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </HashRouter>
    </ErrorBoundary>
  )
}

export default App
