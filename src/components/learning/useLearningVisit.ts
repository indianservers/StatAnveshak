import { useEffect } from 'react'
import { recordLearningVisit } from '../../lib/learningProgress'

export function useLearningVisit(path: string | undefined, title: string | undefined) {
  useEffect(() => {
    if (!path || !title) return
    recordLearningVisit(path, title)
  }, [path, title])
}
