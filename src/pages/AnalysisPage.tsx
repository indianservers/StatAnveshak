import { Navigate, useParams } from 'react-router-dom'
import { ANALYSIS_BY_ID } from '../analysis/catalog'
import { AnalysisWorkspace } from '../components/analysis/AnalysisWorkspace'

export function AnalysisPage() {
  const { analysisId } = useParams()
  if (!analysisId) return <Navigate to="/analysis/descriptives.statistics" replace />
  const id = ANALYSIS_BY_ID[analysisId] ? analysisId : 'descriptives.statistics'
  if (analysisId !== id) return <Navigate to={`/analysis/${id}`} replace />
  return <AnalysisWorkspace analysisId={id} />
}
