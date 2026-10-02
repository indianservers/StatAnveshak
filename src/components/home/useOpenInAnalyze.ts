import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'

/** Analysis, data, and workbench surfaces live in analyze mode, so switch the shell before navigating. */
export function useOpenInAnalyze() {
  const setWorkspaceMode = useStore((state) => state.setWorkspaceMode)
  const navigate = useNavigate()
  return useCallback((path: string) => {
    setWorkspaceMode('analyze')
    navigate(path)
  }, [navigate, setWorkspaceMode])
}
