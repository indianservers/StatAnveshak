export type LearnChapterId =
  | 'chance'
  | 'compound'
  | 'distributions'
  | 'frequentist'
  | 'bayesian'
  | 'regression'

export type LearnChapter = {
  id: LearnChapterId
  number: number
  title: string
  shortTitle: string
  intuition: string
  formula: string
  misuse: string
  hero: string
  href: string
  preview: 'coins' | 'sets' | 'clt' | 'ci' | 'beta' | 'ols'
}

export const LEARN_CHAPTERS: LearnChapter[] = [
  {
    id: 'chance',
    number: 1,
    title: 'Chance',
    shortTitle: 'Coins & expectation',
    intuition: 'A single trial is noisy. The long-run picture is a rate, not a promise.',
    formula: 'E[X] = \\sum x\\,P(X=x)',
    misuse: 'This is not “luck evens out on the next flip.” Independence does not repay a streak.',
    hero: 'Flip coins and watch the running rate settle.',
    href: '/learn/chance',
    preview: 'coins',
  },
  {
    id: 'compound',
    number: 2,
    title: 'Compound probability',
    shortTitle: 'Sets & Bayes',
    intuition: 'Joint events live in overlapping area. Bayes is reweighting that area after you see evidence.',
    formula: 'P(A\\mid B) = \\frac{P(B\\mid A)P(A)}{P(B)}',
    misuse: 'A sensitive test is not a diagnosis. Base rate still occupies most of the picture.',
    hero: 'See how evidence carves the sample space.',
    href: '/learn/compound',
    preview: 'sets',
  },
  {
    id: 'distributions',
    number: 3,
    title: 'Distributions',
    shortTitle: 'Shape, families, CLT',
    intuition: 'A distribution is a shape of chance. Averages of samples grow a new, tighter shape.',
    formula: '\\bar{X}_n \\xrightarrow{d} N(\\mu,\\,\\sigma^2/n)',
    misuse: 'The CLT is about the mean of samples, not “the data become normal.”',
    hero: 'Watch sample means pile into a bell.',
    href: '/learn/distributions',
    preview: 'clt',
  },
  {
    id: 'frequentist',
    number: 4,
    title: 'Frequentist inference',
    shortTitle: 'Sampling, intervals, bootstrap',
    intuition: 'A statistic is a moving target. An interval is a net thrown at a fixed unknown.',
    formula: '\\hat{\\theta} \\pm z_{1-\\alpha/2}\\,\\mathrm{SE}',
    misuse: 'A 95% CI is not “95% chance the parameter is in this interval” after you computed it.',
    hero: 'See coverage: many samples, one truth.',
    href: '/learn/frequentist',
    preview: 'ci',
  },
  {
    id: 'bayesian',
    number: 5,
    title: 'Bayesian inference',
    shortTitle: 'Prior → posterior',
    intuition: 'The prior is a curve of belief. Data reweights it. The posterior is the new shape.',
    formula: 'p(\\theta\\mid y) \\propto p(y\\mid\\theta)\\,p(\\theta)',
    misuse: 'A peaked posterior is not proof if the prior was already a spike in the same place.',
    hero: 'Drag a prior and watch the posterior move.',
    href: '/learn/bayesian',
    preview: 'beta',
  },
  {
    id: 'regression',
    number: 6,
    title: 'Regression',
    shortTitle: 'Scatter, residuals, OLS',
    intuition: 'The fitted line is the one that shrinks the residual squares. Correlation is not a cause.',
    formula: '\\hat{\\beta} = \\arg\\min_\\beta \\sum (y_i - x_i^\\top\\beta)^2',
    misuse: 'A small residual does not mean x caused y. Omitted variables still sit off-stage.',
    hero: 'Drag a line and watch residual squares shrink.',
    href: '/learn/regression',
    preview: 'ols',
  },
]

export const DEFAULT_LEARN_CHAPTER: LearnChapterId = 'chance'

export function getLearnChapter(id: string | undefined): LearnChapter | undefined {
  return LEARN_CHAPTERS.find((chapter) => chapter.id === id)
}

export const GUIDED_QUESTIONS: Array<{
  question: string
  chapterId: LearnChapterId
  visual: string
}> = [
  { question: 'How often should this happen?', chapterId: 'chance', visual: 'A rate emerging from flips' },
  { question: 'How should a new fact change a belief?', chapterId: 'compound', visual: 'A tree that reweights branches' },
  { question: 'What does a typical sample look like?', chapterId: 'distributions', visual: 'A cloud tightening with n' },
  { question: 'Is this difference just noise?', chapterId: 'frequentist', visual: 'Intervals catching a fixed truth' },
]
