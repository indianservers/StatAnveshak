import { LEARN_CHAPTERS, type LearnChapter, type LearnChapterId } from './learnChapters'

export type CoreLabId =
  | 'bayes'
  | 'clt'
  | 'lln'
  | 'sampling'
  | 'errors'
  | 'ci'
  | 'bootstrap'
  | 'permutation'
  | 'anova'
  | 'mle'
  | 'bayesian'
  | 'regression'

export type CoreLabSpec = {
  id: CoreLabId
  title: string
  chapterId: LearnChapterId
  intuition: string
  formula: string
  misuse: string
}

export const CORE_LABS: CoreLabSpec[] = [
  {
    id: 'bayes',
    title: 'Bayes',
    chapterId: 'compound',
    intuition: 'Base rate is most of the picture. A hit is a thin slice of that strip.',
    formula: 'P(A\\mid B) = \\frac{P(B\\mid A)P(A)}{P(B)}',
    misuse: 'A sensitive test is not a diagnosis.',
  },
  {
    id: 'clt',
    title: 'Central limit theorem',
    chapterId: 'distributions',
    intuition: 'Averages of samples grow a new, tighter shape.',
    formula: '\\bar{X}_n \\xrightarrow{d} N(\\mu,\\,\\sigma^2/n)',
    misuse: 'The CLT is about the mean of samples, not “the data become normal.”',
  },
  {
    id: 'lln',
    title: 'Law of large numbers',
    chapterId: 'chance',
    intuition: 'The running mean walks toward μ. One extra point barely moves it once n is large.',
    formula: '\\bar{X}_n \\xrightarrow{p} \\mu',
    misuse: 'LLN does not say the next draw will cancel a streak.',
  },
  {
    id: 'sampling',
    title: 'Sampling',
    chapterId: 'distributions',
    intuition: 'A sample is a window on the population. Which dots enter the window is the whole story.',
    formula: '\\hat{\\theta} = T(X_1,\\ldots,X_n)',
    misuse: 'A sample is not a smaller copy of every feature of the population.',
  },
  {
    id: 'errors',
    title: 'Type I / Type II',
    chapterId: 'frequentist',
    intuition: 'α is the H0 tail you shade. Power is how much of H1 sits past that fence.',
    formula: '\\alpha = P(\\text{reject}\\mid H_0)\\quad \\beta = P(\\text{miss}\\mid H_1)',
    misuse: 'Failing to reject H0 is not proof that H0 is true.',
  },
  {
    id: 'ci',
    title: 'Confidence intervals',
    chapterId: 'frequentist',
    intuition: 'Many nets, one fixed μ. Coverage is how often the net catches it.',
    formula: '\\hat{\\theta} \\pm z_{1-\\alpha/2}\\,\\mathrm{SE}',
    misuse: 'After you compute one interval, it is not “95% chance μ is inside.”',
  },
  {
    id: 'bootstrap',
    title: 'Bootstrap',
    chapterId: 'frequentist',
    intuition: 'Treat the sample as the population. Resample with replacement to see the statistic wiggle.',
    formula: '\\hat{\\theta}^* = T(X_1^*,\\ldots,X_n^*)',
    misuse: 'Bootstrap cannot invent variation that the original sample never had.',
  },
  {
    id: 'permutation',
    title: 'Permutation',
    chapterId: 'frequentist',
    intuition: 'Shuffle the labels. The observed gap sits on a histogram of “no real group.”',
    formula: 'p = \\frac{\\#\{|T^*| \\ge |T_{\\mathrm{obs}}|\\}}{B}',
    misuse: 'A permutation test does not create a treatment. It only asks whether labels look random.',
  },
  {
    id: 'anova',
    title: 'ANOVA',
    chapterId: 'frequentist',
    intuition: 'Between is how far group means sit from the grand mean. Within is the leftover scatter.',
    formula: 'F = \\frac{\\mathrm{MS}_\\mathrm{between}}{\\mathrm{MS}_\\mathrm{within}}',
    misuse: 'A large F is not which groups differ. That needs a follow-up on the same picture.',
  },
  {
    id: 'mle',
    title: 'Maximum likelihood',
    chapterId: 'bayesian',
    intuition: 'The likelihood is a hill over the parameter. The MLE is the peak given these points.',
    formula: '\\hat{\\theta} = \\arg\\max_\\theta \\, L(\\theta\\mid x)',
    misuse: 'A peak is not a probability that θ is true. Likelihood is not a posterior.',
  },
  {
    id: 'bayesian',
    title: 'Prior → posterior',
    chapterId: 'bayesian',
    intuition: 'The prior is a curve of belief. Data reweights it.',
    formula: 'p(\\theta\\mid y) \\propto p(y\\mid\\theta)\\,p(\\theta)',
    misuse: 'A peaked posterior is not proof if the prior was already a spike.',
  },
  {
    id: 'regression',
    title: 'OLS residuals',
    chapterId: 'regression',
    intuition: 'The fitted line shrinks the residual squares.',
    formula: '\\hat{\\beta} = \\arg\\min_\\beta \\sum (y_i - x_i^\\top\\beta)^2',
    misuse: 'A small residual does not mean x caused y.',
  },
]

export function getCoreLab(id: string | undefined): CoreLabSpec {
  return CORE_LABS.find((lab) => lab.id === id) ?? CORE_LABS[1]!
}

export function coreLabChapter(spec: CoreLabSpec): LearnChapter {
  const base = LEARN_CHAPTERS.find((chapter) => chapter.id === spec.chapterId) ?? LEARN_CHAPTERS[0]!
  return {
    ...base,
    title: spec.title,
    intuition: spec.intuition,
    formula: spec.formula,
    misuse: spec.misuse,
  }
}
