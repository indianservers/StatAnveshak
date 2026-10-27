import type { CltTab } from '../../../lib/samplingDistributionsClt'
import { CltCard, FormulaBlock, Insight, QuizBlock } from '../shared'
import { StandardErrorExplore } from './StandardErrorExplore'

export function StandardErrorLab({ tab }: { tab: CltTab }) {
  if (tab === 'learn') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <CltCard title="Standard error is not standard deviation">
          <p className="text-sm leading-6 text-slate-600">
            σ describes how far a single observation typically sits from μ. SE describes how far a statistic typically
            sits from the parameter it estimates.
          </p>
          <FormulaBlock tex={'SE(\\bar{X})=\\sigma/\\sqrt{n}'} label="Standard error of the mean" />
        </CltCard>
        <CltCard title="The inverse-square-root law">
          <p className="text-sm leading-6 text-slate-600">
            Doubling n multiplies SE by 1/√2 ≈ 0.71, not by 1/2. To cut SE in half you need about four times as many
            observations.
          </p>
          <Insight title="Precision is expensive">
            n = 5, 20, 50, and 200 overlay that curve. The last jump is large in sample size and modest in SE.
          </Insight>
        </CltCard>
      </div>
    )
  }

  if (tab === 'practice' || tab === 'quiz') {
    return (
      <CltCard title={tab === 'quiz' ? 'Check your mastery' : 'Your turn'}>
        <QuizBlock
          prompt="A population has a standard deviation of 15. What is the standard error of the sample mean for a sample of size 100?"
          options={['0.15', '1.5', '5.0', '15']}
          answer={1}
          explanation="SE = 15 / √100 = 1.5."
        />
      </CltCard>
    )
  }

  return <StandardErrorExplore />
}
