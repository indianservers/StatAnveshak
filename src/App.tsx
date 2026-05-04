import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { ProjectsPage } from './pages/ProjectsPage'
import { UploadPage } from './pages/data/UploadPage'
import { PreviewPage } from './pages/data/PreviewPage'
import { GridPage } from './pages/data/GridPage'
import { CleanPage } from './pages/data/CleanPage'
import { SummaryPage } from './pages/explore/SummaryPage'
import { ChartsPage } from './pages/explore/ChartsPage'
import { CorrelationPage } from './pages/explore/CorrelationPage'
import { FrequencyPage } from './pages/explore/FrequencyPage'
import { DistributionsPage } from './pages/DistributionsPage'
import { InferencePage } from './pages/InferencePage'
import { RegressionPage } from './pages/RegressionPage'
import { AdvancedAnalysisPage } from './pages/AdvancedAnalysisPage'
import { StatModulesPage } from './pages/StatModulesPage'
import { ComputingModulesPage } from './pages/ComputingModulesPage'
import { SyllabusModulesPage } from './pages/SyllabusModulesPage'
import { DashboardPage } from './pages/DashboardPage'
import { ReportsPage } from './pages/ReportsPage'
import { LearnPage } from './pages/LearnPage'
import { SettingsPage } from './pages/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="data/upload" element={<UploadPage />} />
          <Route path="data/preview" element={<PreviewPage />} />
          <Route path="data/grid" element={<GridPage />} />
          <Route path="data/clean" element={<CleanPage />} />
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
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
