import { useMemo } from 'react'
import { inspectDataset, type DatasetInspection, type DatasetStatus } from '../lib/datasetGuard'
import { useStore } from '../store/useStore'

export type UseDatasetResult = DatasetInspection & {
  ready: boolean
  storageStatus: DatasetStatus
  storageError: string | null
}

export function useDataset(): UseDatasetResult {
  const activeDataset = useStore((state) => state.activeDataset)
  const storageStatus = useStore((state) => state.storageStatus)
  const storageError = useStore((state) => state.storageError)

  return useMemo(() => {
    if (storageStatus === 'loading') {
      return {
        status: 'empty',
        dataset: null,
        message: 'Loading workspace...',
        numericColumns: [],
        categoricalColumns: [],
        ready: false,
        storageStatus,
        storageError,
      }
    }
    if (storageStatus === 'error') {
      return {
        status: 'error',
        dataset: null,
        message: storageError ?? 'Something went wrong. Try again.',
        numericColumns: [],
        categoricalColumns: [],
        ready: false,
        storageStatus,
        storageError,
      }
    }
    const inspected = inspectDataset(activeDataset)
    return {
      ...inspected,
      ready: inspected.status === 'loaded',
      storageStatus,
      storageError,
    }
  }, [activeDataset, storageError, storageStatus])
}
