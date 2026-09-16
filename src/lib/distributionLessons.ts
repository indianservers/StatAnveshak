import type { DistributionId } from './distributions'

export type DistExample = { title: string; body: string }
export type DistInsight = { title: string; latex: string; note: string; tone: 'indigo' | 'violet' | 'sky' | 'emerald' }
export type DistRelated = { id: DistributionId; title: string; note: string }
export type DistSymbol = { symbol: string; meaning: string }
export type DistPractice = {
  prompt: string
  options: Array<{ label: string; text: string }>
  correct: string
  solution: string
}

export type DistLesson = {
  id: DistributionId
  title: string
  tagline: string
  description: string
  chips: string[]
  heroNote: string
  labBlurb: string
  runLabel: string
  chartKind: 'pmf' | 'pdf' | 'pdfcdf'
  formulaLatex: string
  formulaNote: string
  symbols: DistSymbol[]
  steps: Array<{ title: string; body: string }>
  examples: DistExample[]
  insights: DistInsight[]
  practice: DistPractice
  related: DistRelated[]
}

const L = (partial: DistLesson): DistLesson => partial

export const DISTRIBUTION_LESSONS: Record<DistributionId, DistLesson> = {
  bernoulli: L({
    id: 'bernoulli',
    title: 'Bernoulli Distribution',
    tagline: 'One trial. Two outcomes. Infinite intuition.',
    description: 'The Bernoulli distribution models a single trial with two possible outcomes: success (1) or failure (0), with success probability p.',
    chips: ['Discrete distribution', 'Single trial', 'Two outcomes', 'Foundation for more'],
    heroNote: 'Small model. Big ideas.',
    labBlurb: 'Set the success probability and simulate a single trial.',
    runLabel: 'Run one trial',
    chartKind: 'pmf',
    formulaLatex: 'P(X=x)=p^{x}(1-p)^{1-x},\\quad x\\in\\{0,1\\}',
    formulaNote: 'The probability mass function (PMF) of a Bernoulli random variable X is',
    symbols: [
      { symbol: 'p', meaning: 'Probability of success (0 ≤ p ≤ 1)' },
      { symbol: '1-p', meaning: 'Probability of failure' },
      { symbol: 'X', meaning: 'Bernoulli random variable' },
      { symbol: 'x', meaning: 'Outcome (0 or 1)' },
    ],
    steps: [
      { title: 'Define the trial', body: 'A single yes/no experiment (e.g. a coin flip).' },
      { title: 'Choose p', body: 'Set the probability of success (0 ≤ p ≤ 1).' },
      { title: 'Run one trial', body: 'Simulate and observe the outcome.' },
      { title: 'Observe the result', body: 'See either success (1) or failure (0).' },
    ],
    examples: [
      { title: 'Coin toss', body: 'Heads (1) or Tails (0)' },
      { title: 'Email opened', body: 'Opened (1) or Not opened (0)' },
      { title: 'Product quality', body: 'Pass (1) or Fail (0)' },
      { title: 'Student attendance', body: 'Present (1) or Absent (0)' },
    ],
    insights: [
      { title: 'Mean', latex: 'E[X]=p', note: 'The expected value equals the success probability.', tone: 'indigo' },
      { title: 'Variance', latex: 'Var(X)=p(1-p)', note: 'Largest at p = 0.5, smallest at 0 or 1.', tone: 'violet' },
      { title: 'Support', latex: 'X\\in\\{0,1\\}', note: 'Only two possible outcomes.', tone: 'sky' },
    ],
    practice: {
      prompt: 'If X ~ Bernoulli(0.7), what is P(X = 0)?',
      options: [
        { label: 'A', text: '0.3' },
        { label: 'B', text: '0.7' },
        { label: 'C', text: '0.5' },
        { label: 'D', text: '0.14' },
      ],
      correct: 'A',
      solution: 'P(X=0)=1-p=0.3',
    },
    related: [
      { id: 'binomial', title: 'Binomial distribution', note: 'n independent Bernoulli trials' },
      { id: 'geometric', title: 'Geometric distribution', note: 'Trials until first success' },
      { id: 'negative_binomial', title: 'Negative binomial', note: 'Trials until r successes' },
    ],
  }),
  binomial: L({
    id: 'binomial',
    title: 'Binomial Distribution',
    tagline: 'Many trials. One probability. Count the sucesses.',
    description: 'The binomial distribution models the number of successes in n independent Bernoulli trials, each with probability p of success.',
    chips: ['Discrete distribution', 'n trials', 'Independent trials', 'Counts successes'],
    heroNote: 'From trials to a distribution.',
    labBlurb: 'Set the parameters and simulate the binomial distribution.',
    runLabel: 'Run simulation',
    chartKind: 'pmf',
    formulaLatex: 'P(X=x)=\\binom{n}{x}p^{x}(1-p)^{n-x},\\quad x\\in\\{0,1,\\ldots,n\\}',
    formulaNote: 'The probability mass function (PMF) of a Binomial random variable X is',
    symbols: [
      { symbol: 'n', meaning: 'Number of independent trials (n ≥ 1)' },
      { symbol: 'x', meaning: 'Number of successes (0 ≤ x ≤ n)' },
      { symbol: 'p', meaning: 'Success probability (0 ≤ p ≤ 1)' },
      { symbol: 'X', meaning: 'Binomial random variable (successes in n trials)' },
    ],
    steps: [
      { title: 'Repeat trials', body: 'Perform n independent Bernoulli trials (same probability p).' },
      { title: 'Count successes', body: 'Let X be the number of successful trials (from 0 to n).' },
      { title: 'Find the probability', body: 'Use P(X=x)=C(n,x) p^x (1-p)^{n-x}.' },
      { title: 'Explore the distribution', body: 'See how probabilities change with n and p using simulation.' },
    ],
    examples: [
      { title: 'Quality control', body: 'Number of defective items in a batch (n trials)' },
      { title: 'Quiz scoring', body: 'Correct answers on a multiple-choice test' },
      { title: 'Ads clicked', body: 'Number of users who click an ad out of n shown' },
      { title: 'Basketball free throws', body: 'Number of successful free throws in n attempts' },
    ],
    insights: [
      { title: 'Mean', latex: 'E[X]=np', note: 'The expected number of successes.', tone: 'indigo' },
      { title: 'Variance', latex: 'Var(X)=np(1-p)', note: 'The variability in the number of successes.', tone: 'violet' },
      { title: 'Support', latex: 'X\\in\\{0,1,\\ldots,n\\}', note: 'Only integer values from 0 to n are possible.', tone: 'sky' },
    ],
    practice: {
      prompt: 'If X ~ Binomial(n = 10, p = 0.70), what is P(X = 7)?',
      options: [
        { label: 'A', text: '0.267' },
        { label: 'B', text: '0.233' },
        { label: 'C', text: '0.121' },
        { label: 'D', text: '0.036' },
      ],
      correct: 'A',
      solution: 'P(X=7)=C(10,7) 0.7^7 0.3^3 ≈ 0.267',
    },
    related: [
      { id: 'bernoulli', title: 'Bernoulli distribution', note: 'A single trial with two outcomes / failure' },
      { id: 'poisson', title: 'Poisson distribution', note: 'Event counts in a fixed interval. Approaches Poisson when n is large, p is small.' },
      { id: 'normal', title: 'Normal approximation', note: 'Binomial ≈ Normal when n is large and n(1-p) ≥ 10.' },
    ],
  }),
  geometric: L({
    id: 'geometric',
    title: 'Geometric Distribution',
    tagline: 'Wait for the first success.',
    description: 'The geometric distribution models the number of trials needed until the first success for independent Bernoulli trials with success probability p.',
    chips: ['Discrete distribution', 'First success', 'Memoryless', 'Independent trials'],
    heroNote: 'Higher chance earlier, then decreases.',
    labBlurb: 'Simulate the geometric distribution and see the first success.',
    runLabel: 'Run trials',
    chartKind: 'pmf',
    formulaLatex: 'P(X=x)=(1-p)^{x-1}p,\\quad x=1,2,3,\\ldots\\; 0<p<1',
    formulaNote: 'The probability mass function (PMF) of a Geometric random variable X is',
    symbols: [
      { symbol: 'p', meaning: 'Probability of success (0 < p < 1)' },
      { symbol: 'X', meaning: 'Geometric random variable' },
      { symbol: 'x', meaning: 'Number of trials until first success (x = 1, 2, 3, …)' },
    ],
    steps: [
      { title: 'Independent trials', body: 'Perform Bernoulli trials with success probability p, independently.' },
      { title: 'Look for first success', body: 'Keep trying until the first success occurs.' },
      { title: 'Count the trials', body: 'The random variable X is the number of trials needed.' },
      { title: 'Repeat and observe', body: 'Simulate many times to see the geometric distribution.' },
    ],
    examples: [
      { title: 'First customer response', body: 'Number of emails until the first reply' },
      { title: 'First made basket', body: 'Number of shots until the first successful basket' },
      { title: 'First call answered', body: 'Number of calls until someone answers' },
      { title: 'First defective item found', body: 'Number of items inspected until the first defective one' },
    ],
    insights: [
      { title: 'Mean', latex: 'E[X]=1/p', note: 'The expected number of trials until first success.', tone: 'indigo' },
      { title: 'Variance', latex: 'Var(X)=(1-p)/p^{2}', note: 'Variance of the number of trials.', tone: 'violet' },
      { title: 'Support', latex: 'X\\in\\{1,2,3,\\ldots\\}', note: 'Only positive integers starting from 1.', tone: 'sky' },
    ],
    practice: {
      prompt: 'If X ~ Geometric(0.25), what is P(X = 3)?',
      options: [
        { label: 'A', text: '0.141' },
        { label: 'B', text: '0.188' },
        { label: 'C', text: '0.250' },
        { label: 'D', text: '0.094' },
      ],
      correct: 'A',
      solution: 'P(X=3)=(1-0.25)^2 * 0.25 = 0.140625',
    },
    related: [
      { id: 'bernoulli', title: 'Bernoulli distribution', note: 'Single trial with two outcomes' },
      { id: 'negative_binomial', title: 'Negative binomial', note: 'Number of trials until r successes' },
      { id: 'exponential', title: 'Exponential distribution', note: 'Continuous analogue of the geometric distribution' },
    ],
  }),
  poisson: L({
    id: 'poisson',
    title: 'Poisson Distribution',
    tagline: 'Count random events in a fixed interval.',
    description: 'The Poisson distribution models how many events happen in a fixed interval when they occur independently at an average rate λ.',
    chips: ['Discrete distribution', 'Event counts', 'Rate λ', 'Fixed interval'],
    heroNote: 'Random events. Real insights.',
    labBlurb: 'Set the event rate and interval length, then simulate arrivals.',
    runLabel: 'Run arrivals',
    chartKind: 'pmf',
    formulaLatex: 'P(X=x)=e^{-\\lambda}\\frac{\\lambda^{x}}{x!},\\quad x=0,1,2,\\ldots',
    formulaNote: 'The probability mass function (PMF) of a Poisson random variable X is',
    symbols: [
      { symbol: '\\lambda', meaning: 'Average rate of events (λ > 0)' },
      { symbol: 'x', meaning: 'Number of events (0, 1, 2, …)' },
      { symbol: 'e', meaning: "Euler's number (≈ 2.718)" },
      { symbol: 'X', meaning: 'Poisson random variable' },
    ],
    steps: [
      { title: 'Set the rate', body: 'Choose the average rate λ and interval length t.' },
      { title: 'Simulate arrivals', body: 'Generate random event counts for the interval.' },
      { title: 'See the distribution', body: 'View how often each count occurs.' },
      { title: 'Compare with theory', body: 'The results follow Poisson(λt).' },
    ],
    examples: [
      { title: 'Customer arrivals', body: 'People entering a store (λ = 5 per hour)' },
      { title: 'Call-center calls', body: 'Calls received per minute (λ = 3)' },
      { title: 'Typing mistakes', body: 'Typos per page (λ = 0.5)' },
      { title: 'Website hits', body: 'Page views per minute (λ = 20)' },
    ],
    insights: [
      { title: 'Mean', latex: 'E[X]=\\lambda', note: 'The expected number of events equals the rate.', tone: 'emerald' },
      { title: 'Variance', latex: 'Var(X)=\\lambda', note: 'The variance also equals the rate.', tone: 'violet' },
      { title: 'Support', latex: 'X\\in\\{0,1,2,\\ldots\\}', note: 'Counts can be any non-negative integer.', tone: 'sky' },
    ],
    practice: {
      prompt: 'If X ~ Poisson(3), what is P(X = 2)?',
      options: [
        { label: 'A', text: '0.224' },
        { label: 'B', text: '0.149' },
        { label: 'C', text: '0.336' },
        { label: 'D', text: '0.050' },
      ],
      correct: 'A',
      solution: 'P(X=2)=e^{-3} 3^2 / 2! ≈ 0.224',
    },
    related: [
      { id: 'binomial', title: 'Binomial distribution', note: 'Approaches Poisson when n is large and p is small' },
      { id: 'exponential', title: 'Exponential distribution', note: 'Time between events in a Poisson process' },
      { id: 'normal', title: 'Normal approximation', note: 'Poisson ≈ Normal(λ, λ) for large λ' },
    ],
  }),
  hypergeometric: L({
    id: 'hypergeometric',
    title: 'Hypergeometric Distribution',
    tagline: 'Sample without replacement.',
    description: 'The hypergeometric distribution models the number of successes in a sample of size n drawn without replacement from a finite population containing K successes out of N items.',
    chips: ['Discrete distribution', 'Without replacement', 'Finite population', 'Sampling'],
    heroNote: 'Finite population. Real outcomes. No replacement.',
    labBlurb: 'Set the population and sample parameters and draw a sample.',
    runLabel: 'Draw sample',
    chartKind: 'pmf',
    formulaLatex: 'P(X=x)=\\frac{\\binom{K}{x}\\binom{N-K}{n-x}}{\\binom{N}{n}}',
    formulaNote: 'The probability mass function (PMF) of a hypergeometric random variable X is',
    symbols: [
      { symbol: 'N', meaning: 'Population size (total items)' },
      { symbol: 'K', meaning: 'Number of success states in the population' },
      { symbol: 'n', meaning: 'Sample size (draws without replacement)' },
      { symbol: 'C(a,b)', meaning: 'Binomial coefficient “a choose b”' },
    ],
    steps: [
      { title: 'Set the population', body: 'Specify N total items and K success states in the population.' },
      { title: 'Choose sample size', body: 'Select sample size n (without replacement).' },
      { title: 'Draw the sample', body: 'Randomly draw n items without replacement from the population.' },
      { title: 'Count successes', body: 'Observe the number of successes X in the sample.' },
    ],
    examples: [
      { title: 'Defective items in a batch', body: 'Number of defective items in a sample from a finite batch' },
      { title: 'Red cards drawn', body: 'Number of red cards in a hand drawn from a standard deck (without replacement)' },
      { title: 'Sampled students with a trait', body: 'Number of students with a certain trait in a sample from a class or school' },
      { title: 'Lot inspection', body: 'Number of non-defective items in a sample during quality control' },
    ],
    insights: [
      { title: 'Mean', latex: 'E[X]=n\\frac{K}{N}', note: 'The expected number of successes in the sample.', tone: 'indigo' },
      { title: 'Variance', latex: 'Var(X)=n\\frac{K}{N}(1-\\frac{K}{N})\\frac{N-n}{N-1}', note: 'Variation is reduced due to sampling without replacement.', tone: 'violet' },
      { title: 'Support', latex: 'X\\in[\\max(0,n-(N-K)),\\min(n,K)]', note: 'Successes cannot exceed the sample size or the number of successes.', tone: 'sky' },
    ],
    practice: {
      prompt: 'From a population of 20 items, 7 are defective. A sample of 5 items is drawn. What is P(X = 2)?',
      options: [
        { label: 'A', text: '0.302' },
        { label: 'B', text: '0.346' },
        { label: 'C', text: '0.192' },
        { label: 'D', text: '0.161' },
      ],
      correct: 'A',
      solution: 'P(X=2)=C(7,2)C(13,3)/C(20,5) ≈ 0.302',
    },
    related: [
      { id: 'binomial', title: 'Binomial distribution', note: 'Good approximation when N is large and sampling with replacement' },
      { id: 'multinomial', title: 'Multinomial distribution', note: 'Generalization to multiple categories without replacement' },
      { id: 'f', title: "Fisher's exact test", note: 'Uses the hypergeometric distribution for 2 × 2 tables (contingency tables)' },
    ],
  }),
  negative_binomial: L({
    id: 'negative_binomial',
    title: 'Negative Binomial Distribution',
    tagline: 'Failures before the r-th success.',
    description: 'The negative binomial distribution counts the number of failures before a target of r independent Bernoulli successes, each with probability p.',
    chips: ['Discrete distribution', 'r successes', 'Overdispersion', 'Independent trials'],
    heroNote: 'Keep going until r wins.',
    labBlurb: 'Set r and p, then simulate trials until the target is reached.',
    runLabel: 'Run until r successes',
    chartKind: 'pmf',
    formulaLatex: 'P(X=k)=\\binom{k+r-1}{k}(1-p)^{k}p^{r}',
    formulaNote: 'PMF for the number of failures k before r successes',
    symbols: [
      { symbol: 'r', meaning: 'Target number of successes' },
      { symbol: 'p', meaning: 'Success probability on each trial' },
      { symbol: 'k', meaning: 'Number of failures before r successes' },
    ],
    steps: [
      { title: 'Choose a target', body: 'Decide how many successes r you need.' },
      { title: 'Repeat trials', body: 'Each independent trial succeeds with probability p.' },
      { title: 'Stop at r', body: 'Count failures along the way.' },
      { title: 'See extra spread', body: 'Variance exceeds the mean when counts cluster.' },
    ],
    examples: [
      { title: 'Sales calls', body: 'Calls until r conversions' },
      { title: 'QA retests', body: 'Failed inspections before r passes' },
      { title: 'Claim counts', body: 'Overdispersed incident counts' },
      { title: 'Game streaks', body: 'Losses before r wins' },
    ],
    insights: [
      { title: 'Mean', latex: 'E[X]=r(1-p)/p', note: 'Expected failures before r successes.', tone: 'indigo' },
      { title: 'Variance', latex: 'Var(X)=r(1-p)/p^{2}', note: 'Larger than Poisson when counts clump.', tone: 'violet' },
      { title: 'Support', latex: 'k=0,1,2,\\ldots', note: 'Non-negative integers.', tone: 'sky' },
    ],
    practice: {
      prompt: 'If r = 3 and p = 0.5, what is E[X] (failures before 3 successes)?',
      options: [
        { label: 'A', text: '3' },
        { label: 'B', text: '1.5' },
        { label: 'C', text: '6' },
        { label: 'D', text: '0.5' },
      ],
      correct: 'A',
      solution: 'E[X]=r(1-p)/p=3(0.5)/0.5=3',
    },
    related: [
      { id: 'geometric', title: 'Geometric', note: 'The r = 1 special case (trial count until first success)' },
      { id: 'binomial', title: 'Binomial', note: 'Fixed n instead of a stopping rule' },
      { id: 'poisson', title: 'Poisson', note: 'Less spread when events are rare and independent' },
    ],
  }),
  discrete_uniform: L({
    id: 'discrete_uniform',
    title: 'Discrete Uniform Distribution',
    tagline: 'Every integer in the range is equally likely.',
    description: 'The discrete uniform distribution puts equal probability on each integer from a to b, like a fair die.',
    chips: ['Discrete distribution', 'Equal probability', 'Finite support', 'Fair outcomes'],
    heroNote: 'A simple model. Wide applications.',
    labBlurb: 'Set the integer interval and generate samples.',
    runLabel: 'Roll values',
    chartKind: 'pmf',
    formulaLatex: 'P(X=k)=\\frac{1}{b-a+1},\\quad k=a,a+1,\\ldots,b',
    formulaNote: 'Each integer in [a, b] has the same probability',
    symbols: [
      { symbol: 'a', meaning: 'Smallest integer' },
      { symbol: 'b', meaning: 'Largest integer' },
      { symbol: 'k', meaning: 'A possible outcome' },
    ],
    steps: [
      { title: 'Define the range', body: 'Choose integers a and b with b ≥ a.' },
      { title: 'Equal weights', body: 'Each integer gets probability 1/(b−a+1).' },
      { title: 'Sample', body: 'Draw uniformly from the finite set.' },
      { title: 'Check the mean', body: 'The centre sits at (a+b)/2.' },
    ],
    examples: [
      { title: 'Fair die', body: 'Faces 1 through 6' },
      { title: 'Lottery ball', body: 'Numbered tickets in an urn' },
      { title: 'Random seat', body: 'Equally likely seats in a row' },
      { title: 'Board game spinner', body: 'Equal slices mapped to integers' },
    ],
    insights: [
      { title: 'Mean', latex: 'E[X]=(a+b)/2', note: 'Midpoint of the integer interval.', tone: 'indigo' },
      { title: 'Variance', latex: 'Var(X)=((b-a+1)^{2}-1)/12', note: 'Grows with the length of the range.', tone: 'violet' },
      { title: 'Support', latex: '\\{a,\\ldots,b\\}', note: 'Only those integers.', tone: 'sky' },
    ],
    practice: {
      prompt: 'A fair six-sided die. What is P(X = 4)?',
      options: [
        { label: 'A', text: '1/6' },
        { label: 'B', text: '1/4' },
        { label: 'C', text: '1/2' },
        { label: 'D', text: '1/3' },
      ],
      correct: 'A',
      solution: 'P(X=4)=1/(6-1+1)=1/6',
    },
    related: [
      { id: 'continuous_uniform', title: 'Continuous uniform', note: 'Equal density on an interval of real numbers' },
      { id: 'bernoulli', title: 'Bernoulli', note: 'Two equally likely outcomes when p = 0.5' },
      { id: 'multinomial', title: 'Multinomial', note: 'Several categories, not necessarily equal' },
    ],
  }),
  continuous_uniform: L({
    id: 'continuous_uniform',
    title: 'Uniform Distribution',
    tagline: 'Every value in the interval is equally likely.',
    description: 'The uniform distribution models a continuous variable that is equally likely to take any value between a and b.',
    chips: ['Continuous distribution', 'Flat density', 'Interval [a, b]', 'Equal likelihood'],
    heroNote: 'A simple model. Wide applications.',
    labBlurb: 'Set the interval [a, b] and explore the uniform distribution.',
    runLabel: 'Generate samples',
    chartKind: 'pdf',
    formulaLatex: 'f(x)=\\begin{cases}1/(b-a) & a\\le x\\le b\\\\ 0 & \\text{otherwise}\\end{cases}',
    formulaNote: 'The probability density function (PDF) of a continuous uniform distribution is',
    symbols: [
      { symbol: 'a', meaning: 'Lower bound of the interval' },
      { symbol: 'b', meaning: 'Upper bound of the interval (b > a)' },
      { symbol: 'X', meaning: 'Continuous uniform random variable' },
      { symbol: 'x', meaning: 'A possible value of X' },
    ],
    steps: [
      { title: 'Define the interval', body: 'Choose lower and upper bounds a and b with b > a.' },
      { title: 'Flat density', body: 'The probability density is constant 1/(b−a).' },
      { title: 'Any value is possible', body: 'Every value in [a, b] is equally likely.' },
      { title: 'Compute probabilities', body: 'Use interval length: P(c ≤ X ≤ d)=(d−c)/(b−a).' },
    ],
    examples: [
      { title: 'Random number generators', body: 'Numbers from a uniform distribution' },
      { title: 'Spinner angle', body: 'An angle equally likely between 0 and 360°' },
      { title: 'Waiting time', body: 'Arrival time equally likely within a known window' },
      { title: 'Point on a line segment', body: 'A point chosen uniformly along [a, b]' },
    ],
    insights: [
      { title: 'Mean', latex: 'E[X]=(a+b)/2', note: 'The expected value is the midpoint of the interval.', tone: 'indigo' },
      { title: 'Variance', latex: 'Var(X)=(b-a)^{2}/12', note: 'The variance depends on the length of the interval.', tone: 'violet' },
      { title: 'Support', latex: 'X\\in[a,b]', note: 'Only values between a and b are possible.', tone: 'sky' },
    ],
    practice: {
      prompt: 'If X ~ Uniform(2, 8), what is P(3 ≤ X ≤ 6)?',
      options: [
        { label: 'A', text: '0.25' },
        { label: 'B', text: '0.40' },
        { label: 'C', text: '0.50' },
        { label: 'D', text: '0.75' },
      ],
      correct: 'C',
      solution: 'P(3≤X≤6)=(6-3)/(8-2)=0.50',
    },
    related: [
      { id: 'discrete_uniform', title: 'Discrete Uniform', note: 'Uniform over a finite set of values' },
      { id: 'beta', title: 'Beta distribution', note: 'A flexible distribution on [0, 1]' },
      { id: 'normal', title: 'Triangular / Normal', note: 'A triangle alternative with a peak; Normal for sums' },
    ],
  }),
  normal: L({
    id: 'normal',
    title: 'Normal Distribution',
    tagline: 'The bell curve behind countless phenomena.',
    description: 'The Normal distribution models continuous data that is symmetrically distributed around a mean μ, with spread determined by the standard deviation σ.',
    chips: ['Continuous distribution', 'Bell curve', 'Mean μ', 'Standard deviation σ'],
    heroNote: 'Real data. Real insights. Normal everywhere.',
    labBlurb: 'Adjust the parameters and visualize probabilities.',
    runLabel: 'Visualize area',
    chartKind: 'pdf',
    formulaLatex: 'f(x)=\\frac{1}{\\sigma\\sqrt{2\\pi}}\\exp\\!\\left(-\\frac{(x-\\mu)^{2}}{2\\sigma^{2}}\\right)',
    formulaNote: 'The probability density function (PDF) of a normal distribution with mean and standard deviation σ is',
    symbols: [
      { symbol: 'x', meaning: 'Random variable (continuous)' },
      { symbol: '\\mu', meaning: 'Mean (center of the distribution)' },
      { symbol: '\\sigma', meaning: 'Standard deviation (spread)' },
      { symbol: 'f(x)', meaning: 'Probability density at x' },
      { symbol: '\\pi', meaning: 'Mathematical constant (≈ 3.1416)' },
      { symbol: 'e', meaning: 'Base of natural logarithm (≈ 2.7183)' },
    ],
    steps: [
      { title: 'Set parameters', body: 'Choose the mean μ and standard deviation σ.' },
      { title: 'Observe the curve', body: 'A symmetric bell curve centred at μ.' },
      { title: 'Select a range', body: 'Choose a range of values to shade (probability).' },
      { title: 'Read the result', body: 'The area under the curve gives the probability.' },
    ],
    examples: [
      { title: 'Human heights', body: 'Adult heights are approximately normally distributed' },
      { title: 'Measurement errors', body: 'Random errors in instruments often follow a normal distribution' },
      { title: 'Test scores', body: 'Standardized test scores are approximately normally distributed' },
      { title: 'Blood pressure', body: 'Systolic blood pressure in a population tends to be normal distributed' },
    ],
    insights: [
      { title: 'Mean (μ)', latex: '\\mu', note: 'The center of the distribution. For a normal distribution, mean = median = mode.', tone: 'indigo' },
      { title: 'Variance (σ²)', latex: 'Var(X)=\\sigma^{2}', note: 'Controls the spread of the distribution.', tone: 'violet' },
      { title: 'Symmetry', latex: '', note: 'The normal distribution is perfectly symmetric around μ.', tone: 'sky' },
      { title: '68-95-99.7 Rule', latex: '', note: '68% within ±1σ, 95% within ±2σ, 99.7% within ±3σ.', tone: 'emerald' },
    ],
    practice: {
      prompt: 'If X ~ N(100, 15), what is the probability that X is between 85 and 115?',
      options: [
        { label: 'A', text: '0.6827' },
        { label: 'B', text: '0.9545' },
        { label: 'C', text: '0.9973' },
        { label: 'D', text: '0.3413' },
      ],
      correct: 'A',
      solution: '85 and 115 are μ±σ, so the probability is about 0.6827',
    },
    related: [
      { id: 'standard_normal', title: 'Standard Normal', note: 'N(0, 1) with mean 0 and standard deviation 1' },
      { id: 'student_t', title: 't Distribution', note: 'Used when sample size is small and σ is unknown' },
      { id: 'chi_square', title: 'Chi-square', note: 'Arises in variance estimation and goodness-of-fit tests' },
    ],
  }),
  standard_normal: L({
    id: 'standard_normal',
    title: 'Standard Normal Distribution',
    tagline: 'The z-score reference curve.',
    description: 'The standard normal is N(0, 1): mean 0 and standard deviation 1. Any normal value converts to a z-score z = (x − μ)/σ.',
    chips: ['Continuous distribution', 'z-scores', 'Mean 0', 'SD 1'],
    heroNote: 'Compare everything on one scale.',
    labBlurb: 'Shade z-regions and read table-style probabilities.',
    runLabel: 'Visualize z area',
    chartKind: 'pdf',
    formulaLatex: '\\phi(z)=\\frac{1}{\\sqrt{2\\pi}}e^{-z^{2}/2}',
    formulaNote: 'PDF of Z ~ N(0, 1)',
    symbols: [
      { symbol: 'z', meaning: 'Standardized value (x − μ)/σ' },
      { symbol: '\\phi(z)', meaning: 'Standard normal density' },
      { symbol: '\\Phi(z)', meaning: 'Standard normal CDF' },
    ],
    steps: [
      { title: 'Standardize', body: 'Convert x to z = (x − μ)/σ.' },
      { title: 'Read Φ(z)', body: 'The CDF gives left-tail probability.' },
      { title: 'Use symmetry', body: 'P(Z > z) = 1 − Φ(z) and P(|Z| > z) = 2(1 − Φ(z)).' },
      { title: 'Map back', body: 'x = μ + zσ returns to the original units.' },
    ],
    examples: [
      { title: 'Exam percentiles', body: 'z-tables for standardized tests' },
      { title: 'Process control', body: 'How many σ a measurement sits from target' },
      { title: 'Hypothesis tests', body: 'Critical z values at 5% and 1%' },
      { title: 'Effect sizes', body: 'Cohen-style standardized differences' },
    ],
    insights: [
      { title: 'Mean', latex: 'E[Z]=0', note: 'Centred at zero.', tone: 'indigo' },
      { title: 'Variance', latex: 'Var(Z)=1', note: 'Unit spread.', tone: 'violet' },
      { title: '68-95-99.7', latex: '', note: 'Same empirical rule as any normal, in z units.', tone: 'emerald' },
    ],
    practice: {
      prompt: 'P(−1 ≤ Z ≤ 1) for Z ~ N(0,1) is about',
      options: [
        { label: 'A', text: '0.6827' },
        { label: 'B', text: '0.5000' },
        { label: 'C', text: '0.9545' },
        { label: 'D', text: '0.3173' },
      ],
      correct: 'A',
      solution: 'This is the ±1σ interval, probability ≈ 0.6827',
    },
    related: [
      { id: 'normal', title: 'Normal', note: 'Shift and scale with μ and σ' },
      { id: 'student_t', title: "Student's t", note: 'Heavier tails when σ is estimated' },
      { id: 'lognormal', title: 'Lognormal', note: 'Normal on the log scale' },
    ],
  }),
  exponential: L({
    id: 'exponential',
    title: 'Exponential Distribution',
    tagline: 'How long until the next event?',
    description: 'The exponential distribution models waiting times between independent random events occurring at an average rate λ.',
    chips: ['Continuous distribution', 'Waiting time', 'Rate λ', 'Memoryless'],
    heroNote: 'The longer you wait, the less likely the next event… unless memoryless resets the clock.',
    labBlurb: 'Set the rate and simulate waiting times from an exponential distribution.',
    runLabel: 'Simulate waiting times',
    chartKind: 'pdfcdf',
    formulaLatex: 'f(x)=\\lambda e^{-\\lambda x},\\quad x\\ge 0',
    formulaNote: 'The exponential distribution models the waiting time until the next event in a Poisson process.',
    symbols: [
      { symbol: '\\lambda', meaning: 'Rate parameter (λ > 0)' },
      { symbol: 'x', meaning: 'Waiting time (continuous, x ≥ 0)' },
      { symbol: 'f(x)', meaning: 'Probability density function (PDF)' },
      { symbol: 'F(x)', meaning: 'Cumulative distribution function (CDF)' },
    ],
    steps: [
      { title: 'Events occur', body: 'Independent events happen at a constant average rate λ.' },
      { title: 'Measure waiting time', body: 'Let X be the time until the next event occurs.' },
      { title: 'Simulate and explore', body: 'Generate several waiting times from the exponential model.' },
      { title: 'Observe the pattern', body: 'Smaller waiting times are more likely, with a decaying probability.' },
    ],
    examples: [
      { title: 'Time until next customer', body: 'Waiting time between customers at a store (λ = average rate)' },
      { title: 'Time until failure', body: 'Waiting time until a machine or component fails (λ = failure rate)' },
      { title: 'Time between web requests', body: 'Waiting time between requests on a server (λ = request rate)' },
      { title: 'Waiting for a bus', body: 'Time until the next bus arrives (modelled as a Poisson process)' },
    ],
    insights: [
      { title: 'Mean', latex: 'E[X]=1/\\lambda', note: 'The average waiting time is the reciprocal of the rate.', tone: 'indigo' },
      { title: 'Variance', latex: 'Var(X)=1/\\lambda^{2}', note: 'The average waiting time variance equals 1 over λ squared.', tone: 'violet' },
      { title: 'Support', latex: 'X\\ge 0', note: 'Only non-negative values are possible (waiting times).', tone: 'sky' },
      { title: 'Memoryless', latex: 'P(X>s+t\\mid X>s)=P(X>t)', note: 'The future is independent of the past.', tone: 'emerald' },
    ],
    practice: {
      prompt: 'If X ~ Exponential(λ = 0.5), what is P(X > 2)?',
      options: [
        { label: 'A', text: '0.1353' },
        { label: 'B', text: '0.3679' },
        { label: 'C', text: '0.5000' },
        { label: 'D', text: '0.6321' },
      ],
      correct: 'B',
      solution: 'P(X>2)=e^{-λ·2}=e^{-1}≈0.3679',
    },
    related: [
      { id: 'poisson', title: 'Poisson distribution', note: 'Counts the number of events in a fixed interval' },
      { id: 'gamma', title: 'Gamma distribution', note: 'Waiting time until several events (sum of waiting times)' },
      { id: 'geometric', title: 'Geometric distribution', note: 'Discrete analogue (counting number of trials)' },
    ],
  }),
  beta: L({
    id: 'beta',
    title: 'Beta Distribution',
    tagline: 'A flexible model for probabilities.',
    description: 'The Beta distribution models uncertainty about a probability on the interval [0, 1], and is often used as a Bayesian prior or posterior distribution.',
    chips: ['Continuous distribution', 'Probability model', 'Parameters α, β', 'Bayesian prior'],
    heroNote: 'Update with data → greater certainty.',
    labBlurb: 'Adjust the parameters and explore the Beta distribution.',
    runLabel: 'Shape the curve',
    chartKind: 'pdf',
    formulaLatex: 'f(x;\\alpha,\\beta)=\\frac{1}{B(\\alpha,\\beta)}x^{\\alpha-1}(1-x)^{\\beta-1},\\quad 0\\le x\\le 1,\\;\\alpha>0,\\;\\beta>0',
    formulaNote: 'The probability density function (PDF) of a Beta distribution with parameters α > 0 and β > 0 is',
    symbols: [
      { symbol: 'B(\\alpha,\\beta)', meaning: 'Beta function: B(α,β)=Γ(α)Γ(β)/Γ(α+β)' },
      { symbol: '\\alpha', meaning: 'Shape parameter (α > 0)' },
      { symbol: '\\beta', meaning: 'Shape parameter (β > 0)' },
      { symbol: 'x', meaning: 'Random variable, 0 ≤ x ≤ 1' },
      { symbol: 'f(x)', meaning: 'Probability density function' },
    ],
    steps: [
      { title: 'Choose parameters', body: 'Set α and β to represent your prior belief about a probability.' },
      { title: 'Observe data', body: 'See how the distribution updates with successes and failures.' },
      { title: 'Update belief', body: 'The posterior is Beta(α + s, β + f).' },
      { title: 'Interpret', body: 'Use the distribution to quantify uncertainty about the probability.' },
    ],
    examples: [
      { title: 'Click-through rate', body: 'Model the probability a user clicks an ad (Beta prior)' },
      { title: 'Conversion probability', body: 'Estimate the true conversion rate from early data' },
      { title: 'Coin-bias belief', body: 'Model uncertainty of a coin’s probability of heads' },
      { title: 'Reliability probability', body: 'Model the probability of component success based on limited test data' },
    ],
    insights: [
      { title: 'Mean', latex: '\\mu=E[X]=\\alpha/(\\alpha+\\beta)', note: 'The expected value of X is α / (α + β).', tone: 'indigo' },
      { title: 'Variance', latex: '\\sigma^{2}=\\alpha\\beta/[(\\alpha+\\beta)^{2}(\\alpha+\\beta+1)]', note: 'The variance measures uncertainty about the probability.', tone: 'violet' },
      { title: 'Support', latex: 'X\\in[0,1]', note: 'The distribution is defined on the interval [0,1].', tone: 'sky' },
    ],
    practice: {
      prompt: 'If X ~ Beta(2, 5), what is the expected value E[X]?',
      options: [
        { label: 'A', text: '0.20' },
        { label: 'B', text: '0.29' },
        { label: 'C', text: '0.50' },
        { label: 'D', text: '0.71' },
      ],
      correct: 'B',
      solution: 'E[X]=2/(2+5)=2/7≈0.29',
    },
    related: [
      { id: 'bernoulli', title: 'Bernoulli', note: 'A single trial with success probability p' },
      { id: 'binomial', title: 'Binomial', note: 'Counts successes in n independent trials' },
      { id: 'dirichlet', title: 'Dirichlet', note: 'A multivariate generalization of Beta' },
    ],
  }),
  student_t: L({
    id: 'student_t',
    title: "Student's t Distribution",
    tagline: 'Bell-shaped, but with heavier tails.',
    description: "The Student's t distribution is used when estimating means with limited sample size and unknown population variance.",
    chips: ['Continuous distribution', 'Heavy tails', 'Degrees of freedom', 'Inference'],
    heroNote: 'Small samples. Bigger insights.',
    labBlurb: 'Explore the t distribution and tail probabilities.',
    runLabel: 'Compare with normal',
    chartKind: 'pdf',
    formulaLatex: 'f(x;\\nu)=\\frac{\\Gamma\\!\\left(\\frac{\\nu+1}{2}\\right)}{\\sqrt{\\nu\\pi}\\,\\Gamma(\\nu/2)}\\left(1+\\frac{x^{2}}{\\nu}\\right)^{-(\\nu+1)/2}',
    formulaNote: "The probability density function (PDF) of a Student's t distribution with ν degrees of freedom is",
    symbols: [
      { symbol: 'x', meaning: 'Value of the random variable (x ∈ ℝ)' },
      { symbol: '\\nu', meaning: 'Degrees of freedom (ν > 0)' },
      { symbol: '\\Gamma(\\cdot)', meaning: 'Gamma function' },
      { symbol: 'f(x;\\nu)', meaning: 'Probability density function' },
    ],
    steps: [
      { title: 'Start with data', body: 'A random sample of size n from a normal population.' },
      { title: 'Compute t statistic', body: 't = (x̄ − μ) / (s/√n). Use sample standard deviation S.' },
      { title: 'Follow a t distribution', body: 'The statistic follows a t distribution with n − 1 degrees of freedom.' },
      { title: 'Make inferences', body: 'Use it for confidence intervals and hypothesis tests.' },
    ],
    examples: [
      { title: 'Small-sample mean inference', body: 'Estimate a population mean with limited sample size' },
      { title: 'Confidence intervals', body: 'Construct confidence intervals for μ when σ is unknown' },
      { title: 'A/B tests with small samples', body: 'Compare two means when sample sizes are small' },
      { title: 'Laboratory experiments', body: 'Analyze measurement data with limited replicates' },
    ],
    insights: [
      { title: 'Center at 0', latex: '', note: 'The distribution is symmetric and centred at 0.', tone: 'indigo' },
      { title: 'Heavier tails', latex: '', note: 'Heavier tails than the normal distribution.', tone: 'violet' },
      { title: 'Converges to normal', latex: '', note: 'As ν increases, t approaches the normal distribution.', tone: 'sky' },
      { title: 'Variance depends on ν', latex: 'Var(T)=\\nu/(\\nu-2)', note: 'for ν > 2 (undefined for ν ≤ 2).', tone: 'emerald' },
    ],
    practice: {
      prompt: 'For a t distribution with ν = 10, what is the approximate critical value such that P(|T| > t) = 0.05?',
      options: [
        { label: 'A', text: '1.812' },
        { label: 'B', text: '2.228' },
        { label: 'C', text: '2.571' },
        { label: 'D', text: '3.169' },
      ],
      correct: 'B',
      solution: 'Two-tailed 5% critical value for df=10 is about 2.228',
    },
    related: [
      { id: 'normal', title: 'Normal distribution', note: 'The limiting distribution as ν → ∞' },
      { id: 'chi_square', title: 'Chi-square', note: 'Connected to the distribution of sample variance' },
      { id: 'f', title: 'F Distribution', note: 'Ratio of two scaled chi-square variables' },
    ],
  }),
  gamma: genericContinuous('gamma', 'Gamma Distribution', 'Waiting time until several events.', 'A flexible positive distribution for waiting times, rainfall, and accumulated amounts.', 'f(x)=\\frac{x^{\\alpha-1}e^{-x/\\theta}}{\\Gamma(\\alpha)\\theta^{\\alpha}}', 'shape α and scale θ'),
  chi_square: genericContinuous('chi_square', 'Chi-Square Distribution', 'Sum of squared standard normals.', 'The distribution of the sum of ν independent squared standard normal random variables.', 'f(x)=\\frac{x^{\\nu/2-1}e^{-x/2}}{2^{\\nu/2}\\Gamma(\\nu/2)}', 'degrees of freedom ν'),
  f: genericContinuous('f', 'F Distribution', 'A ratio of two variances.', 'The F distribution compares two scaled chi-square variables and appears in ANOVA and regression.', 'F=\\frac{(U/\\nu_1)}{(V/\\nu_2)}', 'numerator and denominator degrees of freedom'),
  lognormal: genericContinuous('lognormal', 'Lognormal Distribution', 'Positive values from multiplicative growth.', 'If ln X is normal, then X is lognormal: right-skewed, always positive.', 'f(x)=\\frac{1}{x\\sigma\\sqrt{2\\pi}}\\exp\\!\\left(-\\frac{(\\ln x-\\mu)^{2}}{2\\sigma^{2}}\\right)', 'log-mean μ and log-sd σ'),
  weibull: genericContinuous('weibull', 'Weibull Distribution', 'Reliability with a flexible hazard.', 'A lifetime model whose shape k produces decreasing, constant, or increasing hazard.', 'f(x)=\\frac{k}{\\lambda}\\left(\\frac{x}{\\lambda}\\right)^{k-1}e^{-(x/\\lambda)^{k}}', 'scale λ and shape k'),
  pareto: genericContinuous('pareto', 'Pareto Distribution', 'Heavy tails and concentration.', 'A power-law model for wealth, losses, and sizes where a few large values dominate.', 'f(x)=\\alpha x_m^{\\alpha}/x^{\\alpha+1}', 'minimum x_m and shape α'),
  cauchy: genericContinuous('cauchy', 'Cauchy Distribution', 'A bell with no mean.', 'A symmetric heavy-tailed density whose mean and variance do not exist.', 'f(x)=\\frac{1}{\\pi\\gamma\\bigl(1+((x-x_0)/\\gamma)^{2}\\bigr)}', 'location x₀ and scale γ'),
  logistic: genericContinuous('logistic', 'Logistic Distribution', 'A bell with an S-shaped CDF.', 'A symmetric distribution whose CDF is the logistic function used in growth models.', 'F(x)=\\bigl(1+e^{-(x-\\mu)/s}\\bigr)^{-1}', 'location μ and scale s'),
  skew_normal: genericContinuous('skew_normal', 'Skew-Normal Distribution', 'A bell that leans.', 'Adds a slant parameter α to the normal so the density can lean left or right.', 'f(x)=\\frac{2}{\\omega}\\phi(z)\\Phi(\\alpha z)', 'location ξ, scale ω, slant α'),
  laplace: genericContinuous('laplace', 'Laplace Distribution', 'A peak with exponential tails.', 'Double-exponential tails around a median; the MLE location is the sample median.', 'f(x)=\\frac{1}{2b}\\exp(-|x-\\mu|/b)', 'location μ and scale b'),
  gumbel: genericContinuous('gumbel', 'Gumbel Distribution', 'The classic model for maxima.', 'An extreme-value distribution for block maxima (GEV with shape 0).', 'F(x)=\\exp\\!\\bigl(-e^{-(x-\\mu)/\\beta}\\bigr)', 'location μ and scale β'),
  inverse_gaussian: genericContinuous('inverse_gaussian', 'Inverse Gaussian Distribution', 'First passage of Brownian motion.', 'A right-skewed positive model (Wald) with mean μ and shape λ.', 'f(x)=\\sqrt{\\lambda/(2\\pi x^{3})}\\,e^{-\\lambda(x-\\mu)^{2}/(2\\mu^{2}x)}', 'mean μ and shape λ'),
  stretched_beta: genericContinuous('stretched_beta', 'Stretched Beta Distribution', 'Beta on a custom interval.', 'A Beta random variable scaled from [0, 1] onto [a, b].', 'Y=a+(b-a)X,\\quad X\\sim\\mathrm{Beta}(\\alpha,\\beta)', 'shapes α, β and bounds a, b'),
  mixture_normal: genericContinuous('mixture_normal', 'Mixture of Normals', 'Two bells, one density.', 'A two-component normal mixture can be bimodal or heavy-tailed depending on weights and means.', 'f(x)=w\\,\\phi(x;\\mu_1,\\sigma_1)+(1-w)\\,\\phi(x;\\mu_2,\\sigma_2)', 'weights and component parameters'),
  zip: genericDiscrete('zip', 'Zero-Inflated Poisson', 'Extra zeros plus Poisson counts.', 'A mixture that adds a point mass at zero to a Poisson, useful for excess zeros.', 'P(X=0)=\\pi+(1-\\pi)e^{-\\lambda}', 'zero inflation π and rate λ'),
  zinb: genericDiscrete('zinb', 'Zero-Inflated Negative Binomial', 'Extra zeros with overdispersion.', 'Combines a zero spike with a negative binomial count model.', 'P(X=0)=\\pi+(1-\\pi)p_r(0)', 'zero inflation π plus NB parameters'),
  multinomial: genericDiscrete('multinomial', 'Multinomial Distribution', 'Counts across several categories.', 'Generalizes the binomial from two outcomes to k categories with probabilities that sum to 1.', 'P(X=\\mathbf{x})=\\frac{n!}{x_1!\\cdots x_k!}p_1^{x_1}\\cdots p_k^{x_k}', 'n trials and category probabilities'),
  dirichlet: genericContinuous('dirichlet', 'Dirichlet Distribution', 'A distribution over probability vectors.', 'The multivariate Beta: random compositions (p1,…,pk) that sum to 1.', 'f(\\mathbf{p})\\propto \\prod p_i^{\\alpha_i-1}', 'concentration parameters α_i'),
  empirical: genericContinuous('empirical', 'Empirical Distribution', 'Let the data define the curve.', 'The empirical distribution uses observed values themselves—no parametric family is assumed.', 'F_n(x)=\\frac{1}{n}\\sum I(x_i\\le x)', 'the sample {x_i}'),
}

function genericContinuous(
  id: DistributionId,
  title: string,
  tagline: string,
  description: string,
  formulaLatex: string,
  paramNote: string,
): DistLesson {
  return {
    id,
    title,
    tagline,
    description,
    chips: ['Continuous distribution', paramNote],
    heroNote: 'Interactive parameters. Real mathematics.',
    labBlurb: 'Adjust parameters and watch the density respond.',
    runLabel: 'Draw samples',
    chartKind: 'pdf',
    formulaLatex,
    formulaNote: `The density uses ${paramNote}.`,
    symbols: [
      { symbol: 'x', meaning: 'Value of the random variable' },
      { symbol: 'f(x)', meaning: 'Probability density' },
    ],
    steps: [
      { title: 'Set parameters', body: `Choose ${paramNote}.` },
      { title: 'See the density', body: 'The curve updates immediately.' },
      { title: 'Shade a region', body: 'Read probability as area.' },
      { title: 'Connect to data', body: 'Simulate draws or fit when a column is loaded.' },
    ],
    examples: [
      { title: 'Teaching demo', body: 'Explore shape as parameters move' },
      { title: 'Applied modelling', body: 'Match support to the scientific story' },
      { title: 'Simulation', body: 'Generate Monte Carlo draws in the lab' },
      { title: 'Comparison', body: 'Relate this family to nearby distributions' },
    ],
    insights: [
      { title: 'Mean', latex: 'E[X]', note: 'Shown live from the catalog formula.', tone: 'indigo' },
      { title: 'Variance', latex: 'Var(X)', note: 'Shown live from the catalog formula.', tone: 'violet' },
      { title: 'Support', latex: '', note: 'Respect the distribution’s domain.', tone: 'sky' },
    ],
    practice: {
      prompt: `Which statement about the ${title.replace(' Distribution', '')} family is true?`,
      options: [
        { label: 'A', text: 'Parameters must keep the density valid on its support' },
        { label: 'B', text: 'Any negative variance is allowed' },
        { label: 'C', text: 'The PDF can be negative' },
        { label: 'D', text: 'The CDF can exceed 1' },
      ],
      correct: 'A',
      solution: 'A valid density is non-negative and integrates to 1 on its support.',
    },
    related: [
      { id: 'normal', title: 'Normal', note: 'A common comparison curve' },
      { id: 'empirical', title: 'Empirical', note: 'Use real data without a parametric assumption' },
      { id: 'gamma', title: 'Gamma', note: 'A flexible positive family' },
    ],
  }
}

function genericDiscrete(
  id: DistributionId,
  title: string,
  tagline: string,
  description: string,
  formulaLatex: string,
  paramNote: string,
): DistLesson {
  return {
    ...genericContinuous(id, title, tagline, description, formulaLatex, paramNote),
    chips: ['Discrete distribution', paramNote],
    chartKind: 'pmf',
    formulaNote: `The probability mass function uses ${paramNote}.`,
  }
}

export function getDistributionLesson(id: DistributionId): DistLesson {
  return DISTRIBUTION_LESSONS[id]
}
