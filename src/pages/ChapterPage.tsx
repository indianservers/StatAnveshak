import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BayesTreeLab } from '../components/visual/BayesTreeLab'
import { BetaPosteriorLab } from '../components/visual/BetaPosteriorLab'
import { ChanceCoinsLab } from '../components/visual/ChanceCoinsLab'
import { CltMeansLab } from '../components/visual/CltMeansLab'
import { CoverageLab } from '../components/visual/CoverageLab'
import { OlsSquaresLab } from '../components/visual/OlsSquaresLab'
import { PracticeGate } from '../components/visual/PracticeGate'
import { useReducedMotion } from '../components/visual/useReducedMotion'
import { getPracticeItem, paramsFromSearch } from '../lib/classroom'
import { sampleToDataset } from '../lib/dataset'
import { getLearnChapter } from '../lib/learnChapters'
import { findSampleById } from '../lib/sampleLibrary'
import { saveDataset } from '../lib/storage'
import { useStore } from '../store/useStore'

export function ChapterPage() {
  const { chapterId } = useParams()
  const [search] = useSearchParams()
  const chapter = getLearnChapter(chapterId)
  const colorblindPalette = useStore((state) => state.colorblindPalette)
  const reducedMotion = useReducedMotion()
  const { activeDataset, addDataset, setActiveDataset } = useStore()
  const practice = getPracticeItem(search.get('practice'))
  const [revealed, setRevealed] = useState(!practice)

  useEffect(() => {
    const datasetId = search.get('dataset')
    if (!datasetId || activeDataset?.id === datasetId || activeDataset?.id === `sample_${datasetId}`) return
    const sample = findSampleById(datasetId)
    if (!sample) return
    const next = sampleToDataset(sample)
    addDataset(next)
    setActiveDataset(next)
    void saveDataset(next)
  }, [search, activeDataset?.id, addDataset, setActiveDataset])

  useEffect(() => {
    setRevealed(!practice)
  }, [practice])

  if (!chapter) return <Navigate to="/" replace />

  const params = paramsFromSearch(chapter.id, search)
  const lab = {
    chance: <ChanceCoinsLab chapter={chapter} reducedMotion={reducedMotion} params={params} />,
    compound: <BayesTreeLab chapter={chapter} reducedMotion={reducedMotion} params={params} />,
    distributions: <CltMeansLab chapter={chapter} reducedMotion={reducedMotion} params={params} />,
    frequentist: <CoverageLab chapter={chapter} reducedMotion={reducedMotion} params={params} />,
    bayesian: <BetaPosteriorLab chapter={chapter} reducedMotion={reducedMotion} params={params} />,
    regression: <OlsSquaresLab chapter={chapter} reducedMotion={reducedMotion} params={params} />,
  }[chapter.id]

  return (
    <div className={colorblindPalette ? 'palette-cb' : undefined}>
      {practice && (
        <div className="mx-auto max-w-[1400px] px-3 pt-4 sm:px-5">
          <PracticeGate item={practice} revealed={revealed} onReveal={() => setRevealed(true)} />
        </div>
      )}
      {revealed ? <div key={search.toString()}>{lab}</div> : (
        <p className="mx-auto max-w-[1400px] px-3 py-8 text-sm text-slate-500 sm:px-5">
          Answer first. The stage stays empty until you reveal the picture.
        </p>
      )}
    </div>
  )
}
