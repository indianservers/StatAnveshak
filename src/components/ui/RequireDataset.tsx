import type { ReactNode } from 'react'
import { useDataset } from '../../hooks/useDataset'
import type { Dataset } from '../../types'
import { DatasetEmptyState } from './DatasetEmptyState'
import { ErrorState, LoadingState, NoNumericColumnsState } from './AppStates'

type RequireDatasetProps = {
  children: (dataset: Dataset) => ReactNode
  preferredPath?: string
  description?: string
  requireNumeric?: boolean
  numericMessage?: string
  minNumeric?: number
}

export function RequireDataset({
  children,
  preferredPath,
  description,
  requireNumeric = false,
  numericMessage,
  minNumeric = 1,
}: RequireDatasetProps) {
  const { dataset, status, storageStatus, message } = useDataset()

  if (storageStatus === 'loading') return <LoadingState />
  if (storageStatus === 'error') {
    return <ErrorState title="Something went wrong. Try again." description={message} backTo="/data/upload" />
  }
  if (status === 'empty' || !dataset) {
    return <DatasetEmptyState preferredPath={preferredPath} description={description} />
  }
  if (status === 'invalid') {
    return (
      <ErrorState
        title="This dataset cannot be used for this analysis."
        description={message}
        backTo="/data/upload"
      />
    )
  }
  if (requireNumeric) {
    const numeric = dataset.schema.filter((column) => column.type === 'numeric' && !/_id$/i.test(column.name))
    if (numeric.length < minNumeric) {
      return <NoNumericColumnsState analysis={numericMessage ?? 'this analysis'} />
    }
  }
  return children(dataset)
}
