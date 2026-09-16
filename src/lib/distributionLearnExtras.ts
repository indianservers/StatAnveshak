import type { DistributionId } from './distributions'

export type DistMisconception = { myth: string; truth: string }
export type DistFaq = { q: string; a: string }

export type DistLearnExtras = {
  misconceptions: DistMisconception[]
  faqs: DistFaq[]
  assumptions: string[]
  misuse: string[]
}

const extras = (partial: DistLearnExtras): DistLearnExtras => partial

export const DISTRIBUTION_LEARN_EXTRAS: Record<DistributionId, DistLearnExtras> = {
  bernoulli: extras({
    assumptions: [
      'Exactly one trial happens, and it has two coded outcomes: 1 (success) and 0 (failure).',
      'The success chance p stays fixed for that trial; nothing in the trial itself changes p mid-way.',
      'The labels “success” and “failure” are just names — they do not have to be desirable events.',
    ],
    misconceptions: [
      { myth: 'Bernoulli is just a coin, so p must be 1/2.', truth: 'A coin is the teaching picture. Any yes/no trial with a fixed p works: a biased sensor, a pass/fail inspection, an email open.' },
      { myth: 'The mean p is “how often it succeeds in this one trial.”', truth: 'One trial is 0 or 1. The mean p is the long-run fraction of 1s if you could repeat the same trial many times.' },
      { myth: 'Variance is largest when the outcome is most predictable.', truth: 'Var(X) = p(1 − p) peaks at p = 0.5 and shrinks toward 0 or 1, where the result is almost certain.' },
      { myth: 'A Bernoulli page is enough whenever I have several yes/no questions.', truth: 'Several independent identical trials become binomial. One trial is Bernoulli; a changing p or dependent trials is something else.' },
    ],
    misuse: [
      'Do not use it for counts (0, 1, 2, …) or for a score that can land off {0, 1}.',
      'Do not treat two dependent yes/no measurements (same student twice) as two Bernoulli(p) draws.',
      'Do not estimate p from a single observation and then act as if that p is known exactly.',
    ],
    faqs: [
      { q: 'When do I use Bernoulli instead of binomial?', a: 'Use Bernoulli for one yes/no trial. Use binomial when you fix n ≥ 2 independent trials and count how many succeed.' },
      { q: 'What does the parameter p mean?', a: 'p is P(X = 1), the chance the coded success occurs. P(X = 0) is 1 − p.' },
      { q: 'What is the support?', a: 'Only {0, 1}. Anything else has probability 0 on this page.' },
      { q: 'How is this different from a fair coin model?', a: 'A fair coin is Bernoulli(1/2). Here p can be any value in (0, 1); the lab default is 0.7.' },
      { q: 'Can I approximate Bernoulli with a normal?', a: 'Not usefully. Two point masses are not a bell. Approximate after you have many trials (binomial → normal).' },
    ],
  }),

  binomial: extras({
    assumptions: [
      'You planned a fixed number n of trials in advance — n is not random.',
      'Each trial is an independent Bernoulli with the same success chance p.',
      'X records the number of successes, so X lives in {0, 1, …, n}.',
    ],
    misconceptions: [
      { myth: 'n is “how many successes I expect.”', truth: 'n is the number of trials. The expected number of successes is np, which is usually not n.' },
      { myth: 'Trials can share information as long as p looks similar.', truth: 'Dependence (sampling without replacement, the same person answering twice) breaks the binomial variance, even if the average p is right.' },
      { myth: 'If I stop when I hit 10 successes, X is still Binomial(n, p).', truth: 'Stopping on a count of successes makes n random. That is a negative-binomial story, not binomial.' },
      { myth: 'P(X = k) is just p^k.', truth: 'You must include the (1 − p)^{n−k} failures and the binomial coefficient that counts which k of the n trials succeeded.' },
      { myth: 'A normal approximation is always safe once n > 30.', truth: 'n large is not enough if p is extreme. A common classroom check is np and n(1 − p) both at least about 10.' },
    ],
    misuse: [
      'Do not use binomial for draws without replacement from a small lot — that is hypergeometric.',
      'Do not use it when p changes trial-to-trial (learning, fatigue, different ads).',
      'Do not treat “number of attempts until the first success” as binomial; that wait is geometric.',
    ],
    faqs: [
      { q: 'When do I use binomial?', a: 'When n independent yes/no trials share one p and you count successes. Quizzes, defect counts, and click-throughs with a fixed send size are the usual stories.' },
      { q: 'What do n and p mean?', a: 'n is the planned trial count. p is the success chance on each trial. Mean is np; variance is np(1 − p).' },
      { q: 'How is this different from Poisson?', a: 'Poisson has no fixed n; it counts events in an interval at rate λ. Binomial → Poisson when n is large, p is small, and np stays near λ.' },
      { q: 'What is the support?', a: 'Integers 0 through n inclusive. You cannot observe n + 1 successes.' },
      { q: 'Can I approximate with a normal?', a: 'Yes when n is large and p is not near 0 or 1. Use continuity correction if you want P(X ≤ k) from the bell.' },
    ],
  }),

  geometric: extras({
    assumptions: [
      'Independent Bernoulli trials share a constant success chance p.',
      'You keep going until the first success; you do not stop at a pre-chosen n.',
      'This catalog records X = trial number of the first success, so X ∈ {1, 2, 3, …}.',
    ],
    misconceptions: [
      { myth: 'Geometric X can be 0 because “zero failures before the first success.”', truth: 'Some textbooks count failures and start at 0. This catalog does not. X is the trial index of the first success, so the smallest value is 1.' },
      { myth: 'After five failures, the next trial is “due” for a success.', truth: 'The geometric is memoryless. P(success on the next trial) is still p, no matter how long you have waited.' },
      { myth: 'The mean wait is p.', truth: 'E[X] = 1/p trials. If p = 0.25 you wait 4 trials on average, not 0.25.' },
      { myth: 'Geometric and exponential are interchangeable.', truth: 'Exponential is the continuous waiting-time cousin. Geometric is discrete trial counts. Do not plug minutes into this PMF.' },
    ],
    misuse: [
      'Do not mix the “trials until first success” formulas with the “failures before first success” formulas without shifting by 1.',
      'Do not use geometric if p changes (a batter who tires, a machine that wears).',
      'Do not use it when you stop at a fixed n regardless of success — that is binomial, and you may observe zero successes.',
    ],
    faqs: [
      { q: 'Does X start at 0 or 1 here?', a: 'At 1. X is the trial number of the first success, with PMF (1 − p)^{x−1} p. Mean 1/p, variance (1 − p)/p².' },
      { q: 'When do I use geometric?', a: 'When you repeat the same yes/no trial until the first success and you care how many trials that took.' },
      { q: 'How is this different from negative binomial?', a: 'Geometric waits for r = 1 success. Negative binomial on this site counts failures before r successes.' },
      { q: 'What is the support?', a: 'Positive integers 1, 2, 3, … There is no upper bound and 0 is impossible.' },
      { q: 'Can I approximate with exponential?', a: 'In a limit of many tiny-probability trials per unit time, yes. For actual trial counts, stay discrete.' },
    ],
  }),

  negative_binomial: extras({
    assumptions: [
      'Independent Bernoulli trials share a constant success chance p.',
      'You stop when you have collected r successes (r is a positive integer).',
      'This catalog’s X is the number of failures before those r successes, so X ∈ {0, 1, 2, …}.',
    ],
    misconceptions: [
      { myth: 'X is the total number of trials until r successes.', truth: 'That is a common alternate convention. Here X counts failures only. Total trials would be X + r.' },
      { myth: 'Negative binomial is just “binomial but n is negative.”', truth: 'The name is historical. You are waiting for r successes; n is not fixed, and the PMF uses C(k + r − 1, k).' },
      { myth: 'If variance exceeds the mean, any overdispersed count is negative binomial.', truth: 'NB is one overdispersed model (and the Poisson is the rare-event limit). Extra zeros may need ZIP/ZINB instead.' },
      { myth: 'r can be a fraction because some software allows it.', truth: 'The waiting-time story needs integer r. A real-valued “size” is a different parameterization used in count regression.' },
    ],
    misuse: [
      'Do not use NB formulas that count trials if this page’s X is failures — the mean r(1 − p)/p will not match.',
      'Do not use it for a planned fixed n of trials; that is binomial.',
      'Do not ignore an excess of exact zeros that a structural-zero process would explain better with ZINB.',
    ],
    faqs: [
      { q: 'What does X count on this page?', a: 'Failures before r successes. Mean r(1 − p)/p; variance r(1 − p)/p². Total trials = X + r.' },
      { q: 'When do I use negative binomial?', a: 'When you wait for r successes, or when counts are overdispersed relative to Poisson (claims, species counts, calls).' },
      { q: 'How is this different from geometric?', a: 'Geometric is the r = 1 waiting-time cousin, but this catalog’s geometric reports trial number (starts at 1), not failures (starts at 0).' },
      { q: 'What do r and p mean?', a: 'r is the success target. p is the per-trial success chance. Larger p means fewer failures before you finish.' },
      { q: 'Can I approximate with Poisson?', a: 'When counts are not overdispersed (variance ≈ mean), Poisson is simpler. If variance ≫ mean, stay with NB.' },
    ],
  }),

  hypergeometric: extras({
    assumptions: [
      'The population is finite: N items, of which K are marked “success.”',
      'You draw a sample of size n without replacement, so each draw changes what remains.',
      'X is the number of marked items in the sample; it cannot exceed min(n, K) or fall below max(0, n − (N − K)).',
    ],
    misconceptions: [
      { myth: 'Hypergeometric is binomial with p = K/N, so the variance matches too.', truth: 'The mean is nK/N, like a binomial, but sampling without replacement reduces the variance by the factor (N − n)/(N − 1).' },
      { myth: 'Without replacement only matters for tiny samples.', truth: 'It matters whenever n is not tiny compared with N. A 10-draw from 50 is already far from with-replacement.' },
      { myth: 'N, K, and n can be any real numbers.', truth: 'They are integer population and sample sizes. This page rounds them and clamps K and n to sit inside N.' },
      { myth: 'You can observe more successes than K.', truth: 'Impossible. The support is cut on both sides: you cannot draw more marked items than exist, or more unmarked than exist.' },
    ],
    misuse: [
      'Do not use hypergeometric for with-replacement draws or for an effectively infinite population — use binomial.',
      'Do not use it when the “population” is a process in time (calls, arrivals). That is Poisson or binomial in trials.',
      'Do not drop the finite-population correction and then quote binomial standard errors for a large sample from a small lot.',
    ],
    faqs: [
      { q: 'When do I use hypergeometric instead of binomial?', a: 'When you sample without replacement from a known finite lot: cards, lot inspection, a class roster. If N is huge relative to n, binomial with p = K/N is close.' },
      { q: 'What do N, K, and n mean?', a: 'N is population size, K is how many marked items are in it, n is how many you draw. Mean nK/N.' },
      { q: 'What is the support?', a: 'Integers from max(0, n − (N − K)) through min(n, K). The PMF is zero outside that range.' },
      { q: 'How is this different from sampling with replacement?', a: 'With replacement, p stays K/N and trials are independent (binomial). Without replacement, dependence shrinks the variance.' },
      { q: 'Can I approximate with binomial or normal?', a: 'Binomial if n/N is small. Normal if the support is wide enough that a bell can sit inside those hard bounds.' },
    ],
  }),

  poisson: extras({
    assumptions: [
      'Events occur independently, and two events do not land at the exact same instant in the ideal model.',
      'The average rate λ is constant across the interval you chose (or you have already rescaled the interval so λ = rate × length).',
      'X is the count of events in that interval, so X ∈ {0, 1, 2, …} and both mean and variance equal λ.',
    ],
    misconceptions: [
      { myth: 'If the sample mean and variance are not equal, Poisson is still “close enough.”', truth: 'Equality of mean and variance is a model property, not a suggestion. Overdispersion (variance ≫ mean) points to NB or a mixture; extra zeros point to ZIP.' },
      { myth: 'Poisson only models rare events.', truth: 'Rarity is a binomial-limit story (large n, small p). A Poisson(40) arrival count is valid if the rate assumptions hold — it is not “too common” for Poisson.' },
      { myth: 'λ is a probability, so it must sit between 0 and 1.', truth: 'λ is a mean count, not a probability. It can be 0.2 or 80. Probabilities come from the PMF at each integer k.' },
      { myth: 'Independence means the counts in two hours are independent of the rate.', truth: 'Non-overlapping intervals are independent in a homogeneous Poisson process. The rate itself must stay constant; a rush hour breaks that.' },
      { myth: 'P(X = k) gets smaller as k grows for every λ.', truth: 'The mode sits near λ. For λ = 4, k = 4 is more likely than k = 0.' },
    ],
    misuse: [
      'Do not use Poisson for counts with a hard upper cap (defects out of n inspected items) — that is binomial.',
      'Do not use it when events cluster (aftershocks, retweets) or the rate drifts through the interval.',
      'Do not force Poisson on data whose variance is several times the mean; the likelihood will overstate precision.',
    ],
    faqs: [
      { q: 'When do I use Poisson?', a: 'To count independent events in a fixed interval or region at a steady average rate: arrivals, typos, rare defects, calls.' },
      { q: 'What does λ mean?', a: 'λ (lambda) is the expected count in the interval you defined. It is also the variance. If the interval doubles and the rate is constant, λ doubles.' },
      { q: 'How is this different from binomial?', a: 'Binomial needs a fixed n of trials. Poisson has no n; it is the large-n, small-p limit with np ≈ λ.' },
      { q: 'What is the support?', a: 'Non-negative integers 0, 1, 2, … with no theoretical upper bound (the chart clips a practical tail).' },
      { q: 'Can I approximate with a normal?', a: 'For large λ the distribution is roughly N(λ, λ). For small λ, stay discrete — the mass near 0 is important.' },
      { q: 'Must events be rare?', a: 'No. They must be independent with a constant rate. “Rare” only describes one way Poisson arises from a binomial.' },
    ],
  }),

  discrete_uniform: extras({
    assumptions: [
      'The possible values are consecutive integers from a through b inclusive.',
      'Every integer in that range has the same probability 1/(b − a + 1).',
      'There is no hidden extra weight on “nice” numbers (no loaded die, no preference for endpoints).',
    ],
    misconceptions: [
      { myth: 'A discrete uniform on {1,…,6} has the same variance as a continuous uniform on [1, 6].', truth: 'Continuous uniform on [1, 6] has variance (5)²/12. The die uses (6² − 1)/12. Same “flat” idea, different support and formula.' },
      { myth: 'a and b can be any reals; the page will just skip the gaps.', truth: 'This family is integer-valued. The catalog rounds a and b. Non-integer data need a continuous uniform or a custom PMF.' },
      { myth: 'The mean is the most likely value.', truth: 'Every face is equally likely. The mean (a + b)/2 is a balance point, not a mode.' },
      { myth: 'If I reject some rolls, the rest are still discrete uniform on the original range.', truth: 'Conditioning changes the support. “Roll a die until it is even” is uniform on {2, 4, 6}, not on {1,…,6}.' },
    ],
    misuse: [
      'Do not use it for ranked data that pile up in the middle (Likert scores are rarely flat).',
      'Do not use it when some integers in [a, b] are impossible (even house numbers only, exam scores that skip values).',
      'Do not confuse it with sampling a real number uniformly from an interval — that is continuous uniform.',
    ],
    faqs: [
      { q: 'When do I use discrete uniform?', a: 'When every integer from a to b is designed to be equally likely: a fair die, a random seat number, a lottery ball in a consecutive range.' },
      { q: 'What do a and b mean?', a: 'Inclusive integer endpoints. There are b − a + 1 faces. The page swaps them if you drag a past b.' },
      { q: 'How is this different from continuous uniform?', a: 'Continuous uniform spreads mass across every real in [a, b]; P(exactly 3) is 0. Here P(X = 3) is 1 over the number of integers.' },
      { q: 'What is the support?', a: 'The integers a, a+1, …, b. Nothing else gets probability.' },
      { q: 'Can I approximate with a continuous uniform?', a: 'For a wide integer range the histogram looks flat like a rectangle, but probabilities for single points still need the discrete formula.' },
    ],
  }),

  zip: extras({
    assumptions: [
      'Some units are structural zeros: they cannot produce events (π is that extra fraction).',
      'The remaining units produce Poisson(λ) counts, including ordinary sampling zeros.',
      'After mixing, P(X = 0) = π + (1 − π)e^{−λ} and the mean is (1 − π)λ, not λ.',
    ],
    misconceptions: [
      { myth: 'A zero in ZIP is the same kind of zero as in Poisson.', truth: 'ZIP mixes two stories: “never at risk” (structural) and “at risk but none occurred” (sampling). The extra spike is π, not e^{−λ}.' },
      { myth: 'π is P(X = 0).', truth: 'P(X = 0) is larger than π because the Poisson piece also contributes zeros. π is only the structural-zero weight.' },
      { myth: 'If I see many zeros I should just lower λ.', truth: 'Lowering λ also shrinks the positive counts. Inflation lets you keep a larger λ for the at-risk group and still explain the extra zeros.' },
      { myth: 'ZIP fixes overdispersion of the whole count distribution.', truth: 'ZIP mainly fixes extra zeros. If the positive counts are still too spread out, you want ZINB, not a bigger π.' },
    ],
    misuse: [
      'Do not use ZIP when zeros are just what a small Poisson(λ) already predicts — extra π will be unidentified junk.',
      'Do not interpret λ as the mean of the observed sample; the mean is (1 − π)λ.',
      'Do not use ZIP for bounded counts (successes out of n). Extra zeros there usually need a different mixture or a hurdle binomial.',
    ],
    faqs: [
      { q: 'When do I use ZIP instead of Poisson?', a: 'When a known subgroup cannot generate events (closed stores, dry traps, customers who never order) and the rest look Poisson.' },
      { q: 'What do λ and π mean?', a: 'λ is the Poisson rate for the at-risk group. π is the structural-zero fraction. Mean (1 − π)λ.' },
      { q: 'How is a structural zero different from a sampling zero?', a: 'Structural: the unit was never in the risk set. Sampling: it could have had events, and the Poisson piece happened to draw 0.' },
      { q: 'How is ZIP different from ZINB?', a: 'ZIP’s count piece is Poisson (mean = variance among the at-risk). ZINB’s count piece is negative binomial, so it allows extra clumpiness.' },
      { q: 'What is the support?', a: 'The same as Poisson: k = 0, 1, 2, … with a taller bar at 0.' },
    ],
  }),

  zinb: extras({
    assumptions: [
      'A fraction π of units are structural zeros and never produce a count.',
      'The remaining units follow this catalog’s negative binomial: failures before r successes, parameters r and p.',
      'You need both extra zeros and overdispersion in the positive counts — not just one of those problems.',
    ],
    misconceptions: [
      { myth: 'ZINB is ZIP with a different Greek letter.', truth: 'The count engine is negative binomial (r, p), not Poisson(λ). That extra flexibility is for variance larger than the mean among at-risk units.' },
      { myth: 'π is the only reason variance exceeds the mean.', truth: 'The NB piece is already overdispersed. π adds still more mass at zero. You can have overdispersion even if π = 0.' },
      { myth: 'r here is a Poisson rate.', truth: 'r is the success target of the NB waiting-time story. p is the success chance. The at-risk mean is r(1 − p)/p.' },
      { myth: 'If ZIP fits the zeros, ZINB is unnecessary complexity.', truth: 'Check the tail and the variance of positive counts. Extra clumpiness after zeros are handled is exactly when ZINB earns its third parameter.' },
    ],
    misuse: [
      'Do not fit ZINB to small samples just because software offers it — three parameters overfit a handful of counts.',
      'Do not treat the displayed NB mean as the overall mean; multiply by (1 − π).',
      'Do not use ZINB for continuous amounts or for a fixed-n binomial experiment.',
    ],
    faqs: [
      { q: 'When do I use ZINB instead of ZIP?', a: 'When extra zeros and overdispersed positive counts show up together: ecology counts, insurance claims, clicks with super-users.' },
      { q: 'What do r, p, and π mean?', a: 'r and p are the NB (failures-before-r-successes) parameters for at-risk units. π is the structural-zero weight. Overall mean (1 − π) r(1 − p)/p.' },
      { q: 'How is this different from plain negative binomial?', a: 'Plain NB can create zeros, but only as sampling zeros. ZINB adds a separate point mass π at 0 for units that were never at risk.' },
      { q: 'What is the support?', a: 'k = 0, 1, 2, … same as NB and ZIP, with an extra spike at zero.' },
      { q: 'Can I start with Poisson and upgrade?', a: 'Yes: Poisson → ZIP if only zeros look wrong; Poisson → NB if only the tail looks wrong; ZINB if both look wrong.' },
    ],
  }),

  continuous_uniform: extras({
    assumptions: [
      'Every real number in the closed interval [a, b] is equally likely in the density sense.',
      'The density is the flat rectangle 1/(b − a); probability equals length of a sub-interval divided by (b − a).',
      'There is no preferred interior point — the mean (a + b)/2 is a center of mass, not a pile-up.',
    ],
    misconceptions: [
      { myth: 'P(X = the midpoint) is the highest probability.', truth: 'For a continuous uniform, every single point has probability 0. Only intervals have positive probability, and equal-length intervals are equal.' },
      { myth: 'The variance is (b − a)/12.', truth: 'It is (b − a)² / 12. Doubling the interval multiplies variance by 4, not 2.' },
      { myth: 'A random number in [0, 1] from a computer is a perfect continuous uniform.', truth: 'Generators are discrete and periodic. For teaching they are treated as Uniform(0, 1); for cryptography you need a designed CSPRNG.' },
      { myth: 'If data look flat, the min and max of the sample are a and b.', truth: 'The sample range underestimates the true [a, b]. Fitting by min/max is a quick visual, not an unbiased estimator of the endpoints.' },
    ],
    misuse: [
      'Do not use a continuous uniform for integer-only outcomes (die, Likert). Use discrete uniform.',
      'Do not use it when values pile near a typical measurement — that needs a unimodal density (normal, beta, …).',
      'Do not assign a positive probability to one exact real value and call it a uniform calculation.',
    ],
    faqs: [
      { q: 'When do I use continuous uniform?', a: 'When any time or position in a window is designed to be equally likely: a random arrival in an hour, a spinner on a continuous dial, a first-cut prior on an interval.' },
      { q: 'What do a and b mean?', a: 'The hard endpoints of the support. Density height is 1/(b − a). Mean is the midpoint.' },
      { q: 'How is this different from discrete uniform?', a: 'Discrete uniform puts equal mass on integers. Continuous uniform spreads a rectangle over all reals in [a, b].' },
      { q: 'What is the support?', a: 'The interval a ≤ x ≤ b. Outside, the density is 0.' },
      { q: 'Can I approximate with a normal?', a: 'No — the shape is a rectangle, not a bell. A normal would invent tails beyond a and b.' },
    ],
  }),

  normal: extras({
    assumptions: [
      'The variable is continuous and can, in the model, go to ±∞ even if real data are roughly bounded.',
      'The density is symmetric about μ; mean, median, and mode coincide.',
      'Spread is fully described by σ: about 68% / 95% / 99.7% of probability lies within 1 / 2 / 3 σ of μ.',
    ],
    misconceptions: [
      { myth: 'Any mound-shaped histogram is normal.', truth: 'Skew, heavy tails, and hard bounds (ages, test scores) can look mound-like and still fail a normal model. Check tails and support, not just “a bump.”' },
      { myth: 'σ is the average absolute error.', truth: 'σ is the root-mean-square deviation from μ. Mean absolute deviation is smaller (about 0.8σ for a normal).' },
      { myth: 'The central limit theorem makes my raw data normal.', truth: 'CLT is about sample means (and sums) of many independent pieces. One person’s income or one waiting time need not become normal.' },
      { myth: 'μ ± 2σ contains exactly 95% because 1.96 ≈ 2.', truth: 'For a normal, 1.96σ is about 95%. Two σ is about 95.4%. For non-normals, neither rule is guaranteed.' },
    ],
    misuse: [
      'Do not force a normal onto strictly positive, right-skewed amounts (income, duration) — try lognormal, gamma, or Weibull.',
      'Do not use normal tails for data with wild outliers that keep arriving; Cauchy or t may be more honest.',
      'Do not treat μ as “typical” when the histogram is bimodal — a mixture of two normals may be the better picture.',
    ],
    faqs: [
      { q: 'When do I use a normal?', a: 'For symmetric measurement error, many biometric traits, and especially for averages of lots of independent contributions.' },
      { q: 'What do μ and σ mean?', a: 'μ is the mean (and center). σ is the standard deviation (spread). Variance is σ². Both are on the same scale as x.' },
      { q: 'How is this different from standard normal?', a: 'Standard normal is the special case μ = 0, σ = 1 used for z-scores. Any N(μ, σ²) value converts with z = (x − μ)/σ.' },
      { q: 'What is the support?', a: 'All real numbers. In practice almost all mass sits within about μ ± 4σ, which is what the chart shows.' },
      { q: 'Can I use it as an approximation to binomial or Poisson?', a: 'Yes when those counts are large enough that a bell fits: binomial with np and n(1 − p) big; Poisson with large λ.' },
    ],
  }),

  standard_normal: extras({
    assumptions: [
      'This page is not a second generic Normal — it is specifically N(0, 1), the z-score scale.',
      'There are no sliders: μ is locked at 0 and σ at 1 so table values and critical values stay comparable.',
      'A value z is “how many standard deviations from the mean” after you standardize some other normal.',
    ],
    misconceptions: [
      { myth: 'This is just another Normal page with μ = 0, σ = 1, so I can ignore it.', truth: 'The whole point is the z-score language: every other normal becomes this curve. Critical values like 1.96 live here, not on an arbitrary N(100, 15²).' },
      { myth: 'A z-score of 2 means the probability is 2%.', truth: 'z is a location on the axis, not a probability. P(|Z| > 2) is about 4.5%; P(Z ≤ 2) is about 97.7%.' },
      { myth: 'Negative z means something went wrong.', truth: 'Negative z is below the mean. Half of a standard normal is negative.' },
      { myth: 'I can add raw scores from different tests and then look up one z.', truth: 'Standardize each scale first (or convert each to z), then combine. Raw SAT + raw height is not a z.' },
    ],
    misuse: [
      'Do not look up a raw x from N(μ, σ²) in a z-table without converting z = (x − μ)/σ first.',
      'Do not treat this page as a place to fit data — there is nothing to fit; go to the Normal page to move μ and σ.',
      'Do not quote “z = 1.96” as a probability. It is a cutoff whose two-sided tail is about 5%.',
    ],
    faqs: [
      { q: 'Why does this page have no parameters?', a: 'N(0, 1) is fully specified. You change the problem by converting your x into z, not by sliding μ here.' },
      { q: 'What is a z-score?', a: 'z = (x − μ)/σ for an original N(μ, σ²) value. It says how many σ x sits from μ. Convert back with x = μ + zσ.' },
      { q: 'How do I read left and right tails?', a: 'Left-tail probability is Φ(z). Right tail is 1 − Φ(z). Two-sided tails beyond ±z add both sides.' },
      { q: 'How is this different from Student’s t?', a: 't has heavier tails and a df parameter because σ was estimated. As df grows, t looks like this curve.' },
      { q: 'What is the support?', a: 'All real z. The sketch focuses on about [−4, 4], where nearly all probability lives.' },
    ],
  }),

  lognormal: extras({
    assumptions: [
      'The variable is strictly positive: support is x > 0.',
      'log(X) is normal, so X itself is right-skewed with a long upper tail.',
      'μ and σ on this page are the mean and sd of log(X), not of X.',
    ],
    misconceptions: [
      { myth: 'μ is the typical income (or size) on the original scale.', truth: 'μ is E[log X]. The mean of X is exp(μ + σ²/2), which sits to the right of the median exp(μ).' },
      { myth: 'A lognormal can produce zeros and negatives after rounding.', truth: 'The model never produces x ≤ 0. Zeros in data need a point mass, a shift, or a different family.' },
      { myth: 'Taking logs “makes it normal, so the mean of X is e^μ.”', truth: 'e^μ is the median of X (and the geometric mean), not the arithmetic mean, unless σ is 0.' },
      { myth: 'σ on the log scale is a percent error I can ignore when it is 0.5.', truth: 'σ = 0.5 is already a large multiplicative spread. Variance on the original scale grows with e^{σ²} − 1.' },
    ],
    misuse: [
      'Do not fit lognormal to data that include zeros or negatives.',
      'Do not report μ as if it were in dollars or seconds; convert with the mean/median formulas.',
      'Do not use lognormal for bounded percentages in (0, 1) unless you have a reason — beta or a logit-normal may fit the bounds better.',
    ],
    faqs: [
      { q: 'When do I use lognormal?', a: 'For positive, right-skewed, multiplicative quantities: incomes, file sizes, concentrations, some latencies.' },
      { q: 'What do μ and σ mean?', a: 'They are the mean and sd of ln(X). Median of X is e^μ. Mean of X is e^{μ+σ²/2}.' },
      { q: 'How is this different from normal?', a: 'Normal is symmetric on the x-scale and can go negative. Lognormal is normal after a log; it stays positive and skews right.' },
      { q: 'What is the support?', a: 'x > 0. The density is 0 at and below 0.' },
      { q: 'Can I approximate with a normal on the original scale?', a: 'Only if σ is tiny, so the skew vanishes. Otherwise work on the log scale or keep the lognormal formulas.' },
    ],
  }),

  exponential: extras({
    assumptions: [
      'Waiting time is continuous and starts at 0; support is x ≥ 0.',
      'The process is memoryless: the remaining wait does not depend on how long you have already waited.',
      'The single parameter λ is a rate (events per unit time). Mean wait is 1/λ, not λ.',
    ],
    misconceptions: [
      { myth: 'λ is the average waiting time.', truth: 'λ is the rate. The average wait is 1/λ. λ = 2 means you wait 0.5 time units on average.' },
      { myth: 'Memoryless means the process has no randomness left.', truth: 'It means P(X > s + t | X > s) = P(X > t). The wait is still random; the past just does not help you predict the leftover time.' },
      { myth: 'Exponential is the same as geometric with a finer grid.', truth: 'They are cousins, but geometric counts trials (and this catalog starts at 1). Exponential measures continuous time.' },
      { myth: 'A decreasing density means short waits are rare.', truth: 'The opposite: the density is highest at 0, so short waits are the most likely; long waits make the thin tail.' },
    ],
    misuse: [
      'Do not use exponential if wear-out or infant failure changes the hazard — that is Weibull with shape ≠ 1.',
      'Do not use it for times that cannot start at 0 (a minimum service time) without a shift.',
      'Do not swap rate and scale parameterizations from another textbook without converting (scale θ = 1/λ).',
    ],
    faqs: [
      { q: 'When do I use exponential?', a: 'For the wait until the next event in a memoryless Poisson process: time to the next call, decay, or arrival.' },
      { q: 'What does λ mean?', a: 'Rate per unit time. Mean 1/λ, variance 1/λ², survival P(X > t) = e^{−λt}.' },
      { q: 'How is this different from gamma?', a: 'Exponential is the wait for one event. Gamma(shape α, scale θ) is the wait for α events when θ = 1/λ.' },
      { q: 'What is the support?', a: 'x ≥ 0. Negative times get density 0.' },
      { q: 'Can I approximate with a normal?', a: 'Not well — the shape is a one-sided ramp, not a bell. Sums of several exponentials (gamma) become more symmetric.' },
    ],
  }),

  gamma: extras({
    assumptions: [
      'The variable is positive (x > 0): waits, rainfall, losses, accumulated Poisson events.',
      'This page uses shape α (key shape) and scale θ (key scale). Mean is αθ, variance αθ².',
      'Independent exponential waits with the same rate add to a gamma; α need not be an integer.',
    ],
    misconceptions: [
      { myth: 'Shape and scale are interchangeable names for the same knob.', truth: 'Shape α changes the family of shapes (from spike-at-zero to mound). Scale θ stretches the x-axis. Mixing them up wrecks the mean.' },
      { myth: 'Gamma always looks like a tall spike at zero.', truth: 'That is small α. As α grows, the density becomes mound-shaped and more symmetric around αθ.' },
      { myth: 'The rate parameterization is what this slider uses.', truth: 'The catalog scale slider is θ. Rate would be 1/θ. Check which one a formula or a software function expects.' },
      { myth: 'Chi-square is unrelated to gamma.', truth: 'χ²(ν) is gamma with shape ν/2 and scale 2. This page can mimic a chi-square by those settings.' },
    ],
    misuse: [
      'Do not use gamma for data that can be zero or negative without a special point mass.',
      'Do not drop in μ, σ from a normal fit and call them shape and scale.',
      'Do not use a single gamma for clearly bimodal positive data; consider a mixture.',
    ],
    faqs: [
      { q: 'When do I use gamma?', a: 'For flexible positive, often right-skewed amounts, or the wait until several Poisson events.' },
      { q: 'What do shape and scale mean?', a: 'shape (α) controls skew vs mound. scale (θ) sets the units. Mean αθ; variance αθ². Exponential is α = 1.' },
      { q: 'How is this different from Weibull?', a: 'Both live on (0, ∞) and can look similar. Weibull is built from a hazard/shape-k story; gamma from adding exponential waits.' },
      { q: 'What is the support?', a: 'x > 0. The chart starts at 0 and runs out a few sd to the right.' },
      { q: 'Can I approximate with a normal?', a: 'For large α, yes, around the mean αθ. For small α, keep the skew.' },
    ],
  }),

  beta: extras({
    assumptions: [
      'The variable lives in (0, 1): a proportion, a probability, a rate already scaled to the unit interval.',
      'Two shape parameters α and β (keys alpha, beta) can make U, J, reverse-J, or unimodal shapes.',
      'The same family is also the conjugate prior for a Bernoulli/binomial p — but that is one use, not the only use.',
    ],
    misconceptions: [
      { myth: 'Beta is only a Bayesian prior, not a data model.', truth: 'It is both. You can model batting averages, machine yields, or click-through rates as Beta(α, β) random variables, with or without a posterior story.' },
      { myth: 'α and β are a mean and a variance.', truth: 'They are shapes. The mean is α/(α + β). Variance shrinks as α + β grows (more concentration).' },
      { myth: 'Beta cannot pile up at 0 and 1.', truth: 'If α < 1 and β < 1 the density is U-shaped and diverges at the ends. That is still a valid beta.' },
      { myth: 'I can drop in percentages like 37 without dividing by 100.', truth: 'This page’s support is (0, 1). Convert 37% to 0.37, or use a stretched beta on [0, 100].' },
    ],
    misuse: [
      'Do not use an unstretched beta for scores on [0, 100] or any interval other than (0, 1).',
      'Do not use beta for unbounded positive amounts (income, time) — those are gamma/lognormal territory.',
      'Do not treat a fitted beta overlay as proof that a process is a true proportion-generating mechanism.',
    ],
    faqs: [
      { q: 'When do I use beta?', a: 'For values in (0, 1): probabilities, proportions, yields. Also as the prior for a binomial p in a conjugate Bayesian update.' },
      { q: 'What do α and β mean?', a: 'Shape knobs. Larger α pulls mass toward 1; larger β toward 0. Mean α/(α + β). Equal and large α, β peak near 1/2.' },
      { q: 'How is this different from a normal squeezed into [0, 1]?', a: 'A truncated normal still thinks in μ, σ and can look wrong near the ends. Beta is born on (0, 1) and changes shape there naturally.' },
      { q: 'What is the support?', a: '0 < x < 1. The endpoints have density that may blow up or drop to 0 depending on the shapes, but X is not 0 or 1 in the continuous model.' },
      { q: 'Can I use it outside Bayesian class?', a: 'Yes. Think of it as “the normal of the unit interval” — a flexible histogram for proportions.' },
    ],
  }),

  chi_square: extras({
    assumptions: [
      'In the classic construction, X is the sum of ν independent squared standard normals.',
      'Support is x ≥ 0. Mean equals df (ν); variance equals 2ν.',
      'Small ν is strongly right-skewed; large ν looks more like a mound sliding to the right.',
    ],
    misconceptions: [
      { myth: 'Chi-square is a test, not a random variable.', truth: 'The test uses a statistic that is (approximately) χ² under a null. This page is the distribution of that kind of non-negative sum-of-squares.' },
      { myth: 'df is a second “scale” you can set independently of the mean.', truth: 'For χ², the mean is the df. You do not get a separate μ slider — larger df slides and fattens the curve together.' },
      { myth: 'A χ² goodness-of-fit p-value being large “proves the model.”', truth: 'Large p means you did not find a discrepancy the test is powered to see. It is not a certificate of truth.' },
      { myth: 'Chi-square requires normality of the original data always.', truth: 'The exact χ²(ν) story starts from normals. Many table uses are large-sample approximations (Pearson GOF) that need expected cell counts, not raw normality.' },
    ],
    misuse: [
      'Do not use a χ² curve as a generic model for any positive measurement — gamma or Weibull are the usual data models.',
      'Do not read a two-sided normal-style “±” interval on a χ² statistic; the density is not symmetric for small df.',
      'Do not compare sample variances with χ² if the draws are not i.i.d. normal.',
    ],
    faqs: [
      { q: 'When do I meet chi-square?', a: 'Sample variances, Pearson goodness-of-fit, and as the engine inside t and F. This page shows the density for a chosen df.' },
      { q: 'What does df mean?', a: 'Degrees of freedom ν. Mean ν, variance 2ν. It is the number of independent squared z’s in the textbook construction.' },
      { q: 'How is this different from gamma?', a: 'χ²(ν) = Gamma(shape = ν/2, scale = 2). Gamma lets you pick shape and scale freely; chi-square ties them.' },
      { q: 'What is the support?', a: 'x ≥ 0. There is no left tail below 0.' },
      { q: 'Can I approximate with a normal?', a: 'For large df, χ² is roughly N(ν, 2ν). For df of 1–5, keep the skew.' },
    ],
  }),

  student_t: extras({
    assumptions: [
      'You are on the standardized scale (like z), but σ was replaced by a sample sd, giving df = ν.',
      'The density is symmetric about 0 and has heavier tails than N(0, 1).',
      'A mean exists only for ν > 1; a variance exists only for ν > 2 (and equals ν/(ν − 2)).',
    ],
    misconceptions: [
      { myth: 't is just “normal with a fudge factor” so z and t critical values are interchangeable.', truth: 'For small ν the extra tail mass is large (ν = 1 is Cauchy). Using 1.96 when you needed a t cutoff makes intervals too short.' },
      { myth: 'df is the sample size n.', truth: 'For a one-sample mean, df = n − 1. Regression and two-sample stories use other recipes. Do not type n into this slider blindly.' },
      { myth: 'The variance is always 1, like a z.', truth: 'Var = ν/(ν − 2) for ν > 2, which is larger than 1. That is the heavier-tail price.' },
      { myth: 't exists to handle skewed data.', truth: 'Classical t still assumes (approximately) normal draws. Heavy tails in t are from estimating σ, not from skew in X.' },
    ],
    misuse: [
      'Do not use a t critical value on a z-table problem where σ is known — that is standard normal.',
      'Do not invoke t to rescue clearly skewed or bimodal samples; transform or use a different model.',
      'Do not quote a mean for t with df = 1; it does not have one (and matches Cauchy).',
    ],
    faqs: [
      { q: 'When do I use Student’s t?', a: 'When inference for a mean replaces σ with s, especially in small samples. Also as a heavier-tailed location model.' },
      { q: 'What does df mean?', a: 'Tail heaviness. Small df → thick tails. As df → ∞ the curve becomes the standard normal.' },
      { q: 'How is this different from standard normal?', a: 'Same center and symmetry, extra probability far out. Critical values are larger in absolute value than z for the same tail probability.' },
      { q: 'What is the support?', a: 'All real t. For df = 1 the tails are so heavy the chart has to zoom out.' },
      { q: 'Can I approximate with a normal?', a: 'For df ≳ 30 many courses switch to z. For published work, using t is still correct and only slightly wider.' },
    ],
  }),

  f: extras({
    assumptions: [
      'In the textbook story, F is a ratio of two independent chi-squares each divided by its df: (χ²₁/df1) / (χ²₂/df2).',
      'Support is x ≥ 0. The curve is right-skewed; a mean exists only when df2 > 2.',
      'ANOVA and extra-sum-of-squares tests use this family for variance ratios, not for a single mean.',
    ],
    misconceptions: [
      { myth: 'F is “the distribution of the test statistic named F,” so any F I compute is F(df1, df2).', truth: 'That holds under a specified null (independent chi-squares, or normal groups with equal variance). A messy design can produce a number called F that is not this curve.' },
      { myth: 'df1 and df2 are interchangeable.', truth: 'Numerator df1 and denominator df2 play different roles. The mean is df2/(df2 − 2), which does not even use df1.' },
      { myth: 'An F near 1 always means “no effect.”', truth: 'Under the null the distribution is centered near 1 for large df2, but you still need the critical value or p-value. Large samples make tiny variance ratios significant.' },
      { myth: 'I can look up a two-sided F the same way I look up z.', truth: 'Standard ANOVA uses a right-tail F. Equality-of-variance tests may use both tails. Know which table your procedure wants.' },
    ],
    misuse: [
      'Do not use F as a model for a generic positive measurement (that is gamma/Weibull).',
      'Do not compare two variances with F if the groups are wildly non-normal or dependent.',
      'Do not quote a mean when df2 ≤ 2; it is undefined.',
    ],
    faqs: [
      { q: 'When do I use F?', a: 'ANOVA, comparing nested linear models, and tests that a variance ratio equals 1. This page is the reference density.' },
      { q: 'What do df1 and df2 mean?', a: 'Numerator and denominator degrees of freedom. Larger df2 concentrates the curve; small df2 makes a long right tail.' },
      { q: 'How is this different from chi-square?', a: 'χ² is a single scaled sum of squares. F divides two of them. t² with matching df is a special F.' },
      { q: 'What is the support?', a: 'x ≥ 0. There is no negative F in this (central) family.' },
      { q: 'Can I approximate with a normal or χ²?', a: 'For large df2, F is closer to a scaled χ²/df1. For huge df on both sides it tightens around 1, not around a useful bell on the whole axis.' },
    ],
  }),

  weibull: extras({
    assumptions: [
      'Lifetimes or positive magnitudes: support x ≥ 0.',
      'Shape k (key shape) decides the hazard: k < 1 decreasing, k = 1 constant (exponential), k > 1 wear-out.',
      'Scale λ (key scale) stretches time; it is not a Poisson rate on this page.',
    ],
    misconceptions: [
      { myth: 'Weibull λ is the same kind of λ as exponential or Poisson.', truth: 'Here λ is a scale (characteristic life). Exponential rate would be 1/λ only in the k = 1 special case, and Poisson λ is a mean count, not a lifetime scale.' },
      { myth: 'Shape k is a probability.', truth: 'k is a positive shape. It is not bounded by 1. k = 1.5 is a mild wear-out; k = 0.7 is infant mortality.' },
      { myth: 'If a Kaplan–Meier curve drops, I must use Weibull.', truth: 'Many lifetime families decline. Weibull earns its keep when the hazard shape (falling/flat/rising) is the story you want to teach or fit.' },
      { myth: 'The mean equals the scale λ.', truth: 'The mean is λ Γ(1 + 1/k), which equals λ only for special k (not in general).' },
    ],
    misuse: [
      'Do not use Weibull for data that can be negative, or for counts.',
      'Do not read λ as “failure rate per hour” the way you read exponential λ without converting through k.',
      'Do not fit Weibull to heavily censored data by pretending censored times were failures.',
    ],
    faqs: [
      { q: 'When do I use Weibull?', a: 'Reliability and survival: time-to-failure, wind speeds, and any positive variable where the hazard may rise or fall.' },
      { q: 'What do scale and shape mean?', a: 'scale (λ) stretches the time axis. shape (k) sets decreasing, constant, or increasing hazard. Exponential is k = 1.' },
      { q: 'How is this different from exponential?', a: 'Exponential is Weibull with k = 1 (memoryless, constant hazard). Other k values add aging or burn-in.' },
      { q: 'What is the support?', a: 'x ≥ 0. The CDF is 1 − exp(−(x/λ)^k).' },
      { q: 'Can I approximate with a normal?', a: 'For large k the density concentrates and looks more mound-like, but lifetimes are still one-sided. Prefer Weibull formulas for tails.' },
    ],
  }),

  pareto: extras({
    assumptions: [
      'Values cannot fall below the minimum xm; support is x ≥ xm.',
      'The tail is a power law: P(X > x) = (xm/x)^α for x ≥ xm.',
      'The mean is finite only for α > 1; the variance only for α > 2.',
    ],
    misconceptions: [
      { myth: 'I can always quote the sample mean as a typical Pareto value.', truth: 'If α ≤ 1 the mean is infinite. Even for α just above 1, rare giants dominate the average, so the sample mean is a shaky “typical.”' },
      { myth: 'xm is a location you can slide like a normal μ through the data.', truth: 'xm is a hard floor. Every observation should sit at or above it. Sliding it below the data changes the whole tail formula.' },
      { myth: 'Smaller α means a thinner, safer tail.', truth: 'Smaller α is a heavier tail — more extreme wealth or losses. α → ∞ piles mass near xm.' },
      { myth: 'Pareto and lognormal are interchangeable heavy-tail models.', truth: 'Lognormal’s tail is thinner than a low-α Pareto. Insurance and security losses often care about that difference.' },
    ],
    misuse: [
      'Do not fit Pareto to data that start at 0 or include values below xm.',
      'Do not report variance when α ≤ 2; the model says it is infinite.',
      'Do not use Pareto for symmetric measurement error — it is one-sided and minimum-bound.',
    ],
    faqs: [
      { q: 'When do I use Pareto?', a: 'For sizes with a floor and a heavy upper tail: wealth above a cutoff, city sizes, large insurance losses.' },
      { q: 'What do xm and α mean?', a: 'xm is the minimum scale. α (shape) controls tail weight. Mean α xm/(α − 1) when α > 1.' },
      { q: 'How is this different from exponential?', a: 'Exponential tails decay as e^{−λx}. Pareto tails decay as a power of x, much slower, so extremes stay likely.' },
      { q: 'What is the support?', a: 'x ≥ xm. Nothing below the minimum is allowed.' },
      { q: 'Can I approximate with a normal?', a: 'No. The whole point is a hard minimum plus a heavy tail, not a bell.' },
    ],
  }),

  cauchy: extras({
    assumptions: [
      'The density is symmetric about location x0 (also the median and mode).',
      'Scale γ is the half-width at half-maximum, not a standard deviation — there is no finite variance.',
      'The mean does not exist. The law of large numbers for the sample average does not apply in the usual way.',
    ],
    misconceptions: [
      { myth: 'The sample mean is a sensible estimate of the Cauchy location.', truth: 'The sample mean is as unstable as a single draw. Use the sample median (or other robust location) for x0.' },
      { myth: 'It looks like a bell, so it is basically a normal with fat errors.', truth: 'The tails are 1/x², far heavier than a normal. Moments do not exist; CLT for the mean fails.' },
      { myth: 'γ is σ, so x0 ± 2γ is a 95% interval.', truth: 'γ is not a standard deviation. The 25% and 75% points sit at x0 ± γ, so the IQR is 2γ — a different language than σ.' },
      { myth: 'If I throw out the wildest outlier, the mean becomes fine.', truth: 'New wild values keep appearing as n grows. Trimming helps in practice, but the theoretical mean is still undefined.' },
    ],
    misuse: [
      'Do not report a mean or variance for Cauchy data — they are undefined in the model.',
      'Do not run a z-interval or ordinary least squares as if errors were light-tailed.',
      'Do not treat a Cauchy overlay on a histogram as “almost normal, close enough for the average.”',
    ],
    faqs: [
      { q: 'When do I use Cauchy?', a: 'As a heavy-tail warning example, for certain ratios of normals, and when you want a location model whose mean is intentionally undefined.' },
      { q: 'What do x0 and γ mean?', a: 'x0 is the center (median). γ > 0 is the scale (half-width at half-height). Neither is a mean or sd.' },
      { q: 'Why is there no mean?', a: 'The integral for E[X] does not converge. Sample averages wander instead of settling. The median is the fair center.' },
      { q: 'How is this different from Student’s t?', a: 't with df = 1 is Cauchy. Larger df gives t a mean (df > 1) and then a variance (df > 2).' },
      { q: 'What is the support?', a: 'All real x. Tails stay important far from x0 — do not crop them in your mind the way you do for a normal.' },
      { q: 'Can I approximate with a normal?', a: 'Visually near the center, maybe. For averages, intervals, and outliers, no.' },
    ],
  }),

  logistic: extras({
    assumptions: [
      'The density is symmetric about location μ, with slightly heavier tails than a normal.',
      'Scale s (key s) is not σ: variance is π² s² / 3, so σ ≈ 1.8138 s.',
      'The CDF is the logistic S-curve 1 / (1 + e^{−(x−μ)/s}), which is why the family shows up in growth and choice models.',
    ],
    misconceptions: [
      { myth: 'Logistic is the distribution of a logistic-regression coefficient.', truth: 'Logistic regression models a probability with that S-curve. This page is a random variable whose CDF is that S-curve — related algebra, different object.' },
      { myth: 's equals the standard deviation.', truth: 's is a scale. Convert with Var = π² s² / 3 if you need σ. Plugging s into a normal table is wrong.' },
      { myth: 'Heavier than normal means Cauchy-like outliers.', truth: 'Logistic tails are a bit heavier than Gaussian, not in Cauchy territory. Moments exist; the mean is μ.' },
      { myth: 'I should use logistic instead of normal whenever data are binary.', truth: 'Binary outcomes are Bernoulli/binomial. Logistic as a latent error is one story for a binary choice model, not a histogram of 0/1 data.' },
    ],
    misuse: [
      'Do not fit logistic to one-sided times or proportions in (0, 1) without a transform — support is the whole line.',
      'Do not treat s and a normal σ as interchangeable in 68% rules.',
      'Do not confuse this density with the logistic function applied to a linear predictor in a GLM write-up.',
    ],
    faqs: [
      { q: 'When do I use logistic?', a: 'When you want a symmetric mound with a closed-form CDF: growth curves, item-response latent scores, a slightly heavy-tailed alternative to normal.' },
      { q: 'What do μ and s mean?', a: 'μ is the mean and median. s > 0 stretches the S-curve. Variance is π² s² / 3.' },
      { q: 'How is this different from normal?', a: 'Similar bell, slightly heavier tails, and a much simpler CDF. For many plots they overlay closely after matching variance.' },
      { q: 'What is the support?', a: 'All real x, like the normal.' },
      { q: 'Can I approximate with a normal?', a: 'Yes for a quick picture if you match mean and variance. Use logistic formulas when you need the exact S-curve CDF.' },
    ],
  }),

  skew_normal: extras({
    assumptions: [
      'Start from a normal mound, then slant it with α (key alpha). α = 0 recovers a normal in location ξ and scale ω.',
      'Location ξ and scale ω are not automatically the mean and sd when α ≠ 0.',
      'The density stays unimodal; it does not become two peaks (that would be a mixture).',
    ],
    misconceptions: [
      { myth: 'ξ is the mean even when the slant is large.', truth: 'Slant shifts the mean away from ξ toward the long tail. Mean, median, and mode split once α ≠ 0.' },
      { myth: 'α is a skewness coefficient between −1 and 1.', truth: 'α is an unbounded slant parameter. Values like ±2 are ordinary. It is not Pearson’s skewness and is not a probability.' },
      { myth: 'A skew-normal can model a hard wall at 0 the way a gamma can.', truth: 'Support is still the whole line. It can lean, but it still puts mass on the short side, including negatives.' },
      { myth: 'If the histogram leans, I should always pick skew-normal over lognormal.', truth: 'If the variable is positive and multiplicative, lognormal or gamma may be more natural than a slanted bell that can go negative.' },
    ],
    misuse: [
      'Do not treat ω as σ of the observed data without converting through α.',
      'Do not use skew-normal for two well-separated clumps — use a mixture of normals.',
      'Do not force it on (0, 1) proportions; beta already lives on that interval.',
    ],
    faqs: [
      { q: 'When do I use skew-normal?', a: 'When data look almost normal except for a consistent one-sided tail, and negatives are conceptually allowed.' },
      { q: 'What do ξ, ω, and α mean?', a: 'ξ is location, ω is scale, α is slant. α = 0 is ordinary normal. Positive α leans right (longer right tail).' },
      { q: 'How is this different from a two-normal mixture?', a: 'Skew-normal is one slanted mound. A mixture can be bimodal when μ1 and μ2 are far apart and they share sd s on this site.' },
      { q: 'What is the support?', a: 'All real x. The slant changes shape, not the unbounded support.' },
      { q: 'Can I approximate with a normal?', a: 'When |α| is small, yes. When |α| is large, the mean shift and extra tail matter.' },
    ],
  }),

  laplace: extras({
    assumptions: [
      'The density has a sharp peak (a corner) at the median μ and exponential tails on both sides.',
      'Scale b (key b) sets the typical absolute deviation; variance is 2b², not b².',
      'The maximum-likelihood location is the sample median, which is why the family appears in robust estimation.',
    ],
    misconceptions: [
      { myth: 'Laplace is a normal with a different σ.', truth: 'The peak is pointed, not rounded, and the tails are exponential, heavier than Gaussian. Matching variance still leaves a different shape.' },
      { myth: 'b is the standard deviation.', truth: 'SD is b√2. If you set b = 1 you do not have σ = 1.' },
      { myth: 'Because tails are exponential, Laplace is one-sided like an exponential wait.', truth: 'It is two-sided (double exponential). Times that cannot go negative need a one-sided family.' },
      { myth: 'Least squares is optimal here.', truth: 'For Laplace errors, least absolute deviations (the median) is the natural fit, not least squares.' },
    ],
    misuse: [
      'Do not use Laplace for strictly positive waits without a shift — the left tail crosses 0.',
      'Do not quote a 68% rule as if σ = b.',
      'Do not treat a pointed histogram peak as proof of Laplace if binning or rounding created the point.',
    ],
    faqs: [
      { q: 'When do I use Laplace?', a: 'For symmetric errors with a sharp center and exponential tails, and when you want the median as the natural location estimate.' },
      { q: 'What do μ and b mean?', a: 'μ is the mean and median (the peak). b > 0 is the scale. Variance 2b².' },
      { q: 'How is this different from normal?', a: 'Pointed peak, heavier exponential tails, and LAD/median fitting instead of least squares.' },
      { q: 'What is the support?', a: 'All real x — a two-sided double exponential, not a one-sided wait.' },
      { q: 'Can I approximate with a normal?', a: 'Only if you only care about a rough center. Outliers and the cusp at μ will not match.' },
    ],
  }),

  gumbel: extras({
    assumptions: [
      'This is an extreme-value model for block maxima (GEV with shape 0), not for typical daily values.',
      'Location μ and scale β (key beta) describe the typical size and spread of those maxima.',
      'The density is slightly right-skewed: a shorter left tail and a longer right tail.',
    ],
    misconceptions: [
      { myth: 'Gumbel models the raw series, so I can fit it to every daily temperature.', truth: 'The story is the maximum in a block (yearly peak flood, hottest day of the year). Feeding the whole series in mixes ordinary days with extremes.' },
      { myth: 'μ is the mean of the Gumbel.', truth: 'The mean is μ + γβ where γ ≈ 0.57721 (Euler’s constant). μ is a location, not the expectation.' },
      { myth: 'Minima use the same sliders with no change.', truth: 'Minima use a reflected Gumbel (or GEV for minima). Leaving the sign as a maxima model will skew the wrong way.' },
      { myth: 'If I have a long tail I should use Gumbel instead of Pareto.', truth: 'Gumbel tails are lighter than Fréchet/Pareto-type extremes. Pick the extreme-value family from the tail, not from the word “extreme.”' },
    ],
    misuse: [
      'Do not fit Gumbel to the original sample if you have not formed block maxima (or another extreme extraction).',
      'Do not treat μ as the expected maximum without adding γβ.',
      'Do not use Gumbel for counts or for (0, 1) proportions.',
    ],
    faqs: [
      { q: 'When do I use Gumbel?', a: 'For the distribution of a block maximum: annual floods, peak gusts, largest claim in a month — the GEV shape-0 case.' },
      { q: 'What do μ and β mean?', a: 'μ is location; β > 0 is scale. Mean μ + 0.57721 β; variance π² β² / 6.' },
      { q: 'How is this different from a normal?', a: 'Gumbel is skewed and aimed at maxima. A normal models symmetric noise, not block extremes.' },
      { q: 'What is the support?', a: 'All real x, though the interesting mass sits from a bit left of μ out a long way right.' },
      { q: 'Can I approximate with a normal?', a: 'Not if you care about the right-tail extremes — that is the part Gumbel is for.' },
    ],
  }),

  inverse_gaussian: extras({
    assumptions: [
      'The variable is positive: first-passage or travel times, x > 0.',
      'μ (key mu) is the mean on the original scale; λ (key lambda) is a shape that tightens the density around μ.',
      'Variance is μ³/λ, so for fixed μ a larger λ means less spread — the opposite of “λ is a rate that shrinks the mean.”',
    ],
    misconceptions: [
      { myth: 'Inverse Gaussian is 1 over a Gaussian random variable.', truth: 'The name is historical (inverse to Brownian motion’s passage-time problem). It is not 1/Z for Z ~ Normal.' },
      { myth: 'λ here is an exponential rate, so the mean is 1/λ.', truth: 'The mean is μ. λ is a concentration/shape. Variance μ³/λ falls as λ grows.' },
      { myth: 'If it is right-skewed and positive, gamma, lognormal, and IG are the same fit.', truth: 'They can look similar in the middle and differ in the tail and in the mean–variance rule. IG’s variance scales as μ³.' },
      { myth: 'μ is a log-mean like the lognormal μ.', truth: 'Here μ is E[X] in the original units, not E[log X].' },
    ],
    misuse: [
      'Do not use IG for data that include zeros or negatives.',
      'Do not import an exponential or Poisson λ into this slider and expect the same meaning.',
      'Do not assume symmetry around μ unless λ is large relative to μ.',
    ],
    faqs: [
      { q: 'When do I use inverse Gaussian?', a: 'For positive, right-skewed times, especially first-passage times of Brownian motion with drift, and as a gamma/lognormal competitor.' },
      { q: 'What do μ and λ mean?', a: 'μ is the mean. λ is the shape/concentration. Variance μ³/λ. Larger λ → tighter around μ.' },
      { q: 'How is this different from gamma?', a: 'Both are positive and skewed. Gamma variance is αθ² (linear in the mean if you fix shape). IG variance grows like μ³ for fixed λ.' },
      { q: 'What is the support?', a: 'x > 0. Inverse Gaussian is a first-passage / positive-time family; negatives are impossible.' },
      { q: 'Can I approximate with a normal?', a: 'When λ is large the density is more symmetric about μ and a normal can be a local picture. Tails still stay one-sided.' },
    ],
  }),

  stretched_beta: extras({
    assumptions: [
      'You want a beta shape, but the measurement lives on a chosen interval [a, b], not (0, 1).',
      'X = a + (b − a)U with U ~ Beta(α, β). Endpoints a and b are hard bounds.',
      'Mean and variance scale with the length (b − a); the shapes α, β still control U vs mound vs J.',
    ],
    misconceptions: [
      { myth: 'This is just a beta, so I can ignore a and b.', truth: 'a and b set the real-world units (scores, temperatures). Forgetting to stretch puts a (0, 1) model on a 0–100 test.' },
      { myth: 'Values can leak a little outside [a, b] like a normal would.', truth: 'The density is exactly 0 outside [a, b]. If real data escape those bounds, the bounds are wrong or the family is wrong.' },
      { myth: 'α and β here are the min and max.', truth: 'Min and max are a and b. α and β are the same shape pair as on the Beta page.' },
      { myth: 'Fitting by setting a = sample min and b = sample max is harmless.', truth: 'That pins the bounds to the data and understates uncertainty in the endpoints. Fine for a sketch; shaky for inference.' },
    ],
    misuse: [
      'Do not use stretched beta for unbounded data; the hard walls will fake a pile-up near a or b.',
      'Do not confuse it with a truncated normal — the shapes available are beta shapes, not μ–σ bells.' ,
      'Do not drop percentages in as 0–100 while leaving α, β as if the variable were still in (0, 1) without stretching.',
    ],
    faqs: [
      { q: 'When do I use stretched beta?', a: 'When a proportion-like shape should live on a real interval: exam scores on [0, 100], a temperature band, a rating scale treated as continuous.' },
      { q: 'What do a, b, α, and β mean?', a: 'a, b are the hard min and max. α, β are beta shapes on the scaled value (x − a)/(b − a).' },
      { q: 'How is this different from ordinary beta?', a: 'Ordinary beta is the special case a = 0, b = 1. Stretching is only a change of units.' },
      { q: 'What is the support?', a: 'a < x < b (the continuous model does not sit on the endpoints).' },
      { q: 'Can I approximate with a normal inside [a, b]?', a: 'If α and β are large and similar, the mound in the middle can look normal — until you get near the walls.' },
    ],
  }),

  mixture_normal: extras({
    assumptions: [
      'Two normal components share one standard deviation s (key s) and have means μ1 and μ2.',
      'π (key pi) is the weight on the first component; the second gets 1 − π.',
      'If |μ1 − μ2| is large compared with s you can see two modes; if not, you get one mound with extra shoulders.',
    ],
    misconceptions: [
      { myth: 'Each component has its own sd, so I should look for σ1 and σ2 sliders.', truth: 'This catalog’s mixture shares one sd s. The formula is π φ(x; μ1, s) + (1 − π) φ(x; μ2, s).' },
      { myth: 'The overall variance is just s².', truth: 'Each piece has variance s², but the mixture also spreads mass between μ1 and μ2. The true variance is larger than s² when the means differ. The header that prints s² is the shared component variance, not the mixture variance.' },
      { myth: 'π is the probability that a point is exactly at μ1.', truth: 'π is the chance a draw comes from component 1 (the whole N(μ1, s²) curve), not a spike at the mean.' },
      { myth: 'Two modes mean I should run two separate t-tests and ignore the mixture.', truth: 'If the labels are unknown, the mixture is the model. Splitting by eye after seeing the histogram double-dips the data.' },
    ],
    misuse: [
      'Do not use a two-normal mixture for one tightly unimodal, light-tailed sample — you will invent a phantom second group.',
      'Do not interpret π as a structural-zero weight; that language belongs to ZIP/ZINB.',
      'Do not expect this page to fit unequal component variances; s is shared by design.',
    ],
    faqs: [
      { q: 'When do I use a two-normal mixture?', a: 'When one histogram may hide two groups (two machines, two teaching tracks) or a contaminated sample with a second bump.' },
      { q: 'What does the shared s mean?', a: 'Both bells have the same standard deviation s. You move the peaks with μ1 and μ2 and the mixing weight with π.' },
      { q: 'How is this different from skew-normal?', a: 'Skew-normal slants one mound. A mixture can be bimodal and is a weighted sum of two bells, not a slant parameter α.' },
      { q: 'What is the support?', a: 'All real x. Each component is a full normal.' },
      { q: 'Can I approximate with a single normal?', a: 'Only if μ1 ≈ μ2 or one weight is tiny. Otherwise a single bell misses the gap or the extra shoulder.' },
    ],
  }),

  multinomial: extras({
    assumptions: [
      'You run n independent trials; each trial falls into one of three categories on this page.',
      'p1 and p2 are sliders; p3 is defined as 1 − p1 − p2 and must stay positive.',
      'The outcome is a count vector (X1, X2, X3) with Xi ≥ 0 and X1 + X2 + X3 = n. The chart shows the X1 marginal, which is Binomial(n, p1).',
    ],
    misconceptions: [
      { myth: 'p1, p2, and p3 can each be set freely like three binomials.', truth: 'They must sum to 1. This page only sliders p1 and p2; p3 = 1 − p1 − p2. Treating the counts as independent binomials ignores the negative covariance.' },
      { myth: 'The categories are independent because the trials are independent.', truth: 'Trials are independent; the counts are not. Extra observations in category 1 must come from 2 or 3, so Cov(Xi, Xj) = −n pi pj.' },
      { myth: 'The chart is the full multinomial distribution.', truth: 'A 3-count lives on a triangle. The page plots the marginal of category 1, which is binomial, as a teaching slice.' },
      { myth: 'n can grow without changing the joint dependence.', truth: 'Variances grow like n, but the counts still sum to n. Percentages concentrate; raw counts stay dependent.' },
    ],
    misuse: [
      'Do not analyze the three counts with three separate binomials and then add the p-values.',
      'Do not enter p1 + p2 ≥ 1; there is no leftover probability for category 3.',
      'Do not use multinomial for sampling without replacement from a finite labeled urn — that is multivariate hypergeometric.',
    ],
    faqs: [
      { q: 'When do I use multinomial?', a: 'When each independent trial has k > 2 faces: a 3-option survey, a die with grouped faces, a classifier’s confusion counts for one n.' },
      { q: 'What happened to p3?', a: 'p3 = 1 − p1 − p2. The catalog does not give it a slider. The mean vector is n(p1, p2, p3).' },
      { q: 'How is this different from binomial?', a: 'Binomial is the two-category case. Multinomial is the same idea with more bins; each single bin is marginally binomial.' },
      { q: 'What is the support?', a: 'Non-negative integer vectors that sum to n. A single chart axis cannot show that simplex, so you see X1’s marginal.' },
      { q: 'Can I approximate with independent normals?', a: 'For large n the percentages look jointly normal, but they still live on the plane p1 + p2 + p3 = 1. Independence is the wrong approximation.' },
    ],
  }),

  dirichlet: extras({
    assumptions: [
      'A draw is a probability vector (x1, x2, x3) with each xi > 0 and x1 + x2 + x3 = 1.',
      'Concentration parameters a1, a2, a3 (keys a1, a2, a3) pull mass toward categories with larger α.',
      'The chart shows the X1 marginal, which is Beta(a1, a2 + a3) — not the full triangle density.',
    ],
    misconceptions: [
      { myth: 'Dirichlet is a distribution on counts, like multinomial.', truth: 'Dirichlet lives on probabilities (the simplex). Multinomial lives on counts that sum to n. Dirichlet is the usual conjugate prior for those multinomial probabilities.' },
      { myth: 'a1, a2, a3 are themselves probabilities and must sum to 1.', truth: 'They are positive concentrations, not probabilities. All αi = 1 is uniform on the simplex; large equal αi peak near the center.' },
      { myth: 'The three coordinates are independent betas.', truth: 'Each single coordinate is beta, but they are dependent because they sum to 1. You cannot simulate three independent betas and call it Dirichlet.' },
      { myth: 'Larger α always means a larger mean for that category.', truth: 'The mean is αi / α0 with α0 = a1+a2+a3. Raising a1 and a2 together can leave x3’s mean smaller even if a3 also moved a little.' },
    ],
    misuse: [
      'Do not use Dirichlet for a single proportion in (0, 1) unless you only care about one margin — that is just beta.',
      'Do not treat the plotted X1 curve as the full joint; two numbers determine the third.',
      'Do not feed raw counts into a1, a2, a3 without a prior story; αi are concentrations, not observed counts (though a posterior adds counts to a prior).',
    ],
    faqs: [
      { q: 'When do I use Dirichlet?', a: 'When the object is a composition or a probability vector: topic weights, market shares, a prior on multinomial p.' },
      { q: 'What do a1, a2, a3 mean?', a: 'Positive concentrations. Mean of category i is αi / (a1+a2+a3). Larger α0 = sum αi means more concentrated draws.' },
      { q: 'How is this different from beta?', a: 'Beta is Dirichlet with two categories. Here three α’s give a draw on the 3-simplex; the X1 marginal is Beta(a1, a2+a3).' },
      { q: 'What is the support?', a: 'x_i > 0 and sum x_i = 1. The page’s 1-D chart is only the first coordinate’s marginal on (0, 1).' },
      { q: 'How does this pair with multinomial?', a: 'Dirichlet is conjugate for multinomial probabilities. Observing counts updates αi → αi + count_i in the Bayesian story.' },
    ],
  }),

  empirical: extras({
    assumptions: [
      'There is no named parametric family; the “model” is the sample itself.',
      'The eCDF puts mass 1/n on each observed value (ties share that mass).',
      'Mean and variance on this page are the sample mean and sample variance once data are loaded — there are no μ, σ sliders.',
    ],
    misconceptions: [
      { myth: 'If a parametric overlay looks close to the eCDF, the named family is proven.', truth: 'An overlay is a comparison, not a proof. Many families can hug the same sample, especially in the middle, while tails disagree.' },
      { myth: 'The empirical curve is the true population CDF.', truth: 'F_n is a random step function. It gets closer to F as n grows (Glivenko–Cantelli), but a small class sample is still just that sample.' },
      { myth: 'I can read a density height off the eCDF the way I read a PDF.', truth: 'The eCDF is a cumulative step. A histogram or kernel density is a different estimator. Jumps tell you about atoms in the sample, not a smooth f(x).' },
      { myth: 'Because there are no parameters, there is nothing to get wrong.', truth: 'You can still over-interpret noise, ignore sampling variability, or treat the preset teaching sample as if it were your dataset.' },
    ],
    misuse: [
      'Do not treat a pretty overlay as a validated fit — use a proper GOF check and look at tails, not just the center.',
      'Do not export the eCDF as if it will match a new sample from a different process.',
      'Do not invent “empirical parameters” by reading μ, σ off this page and then forgetting they are just sample moments.',
    ],
    faqs: [
      { q: 'When do I use the empirical distribution?', a: 'When you want probabilities straight from the sample, or when you need a visual baseline before claiming a named family fits.' },
      { q: 'Why are there no parameters?', a: 'The data are the parameter. F_n(x) = (number of observations ≤ x) / n. Load or pick a sample to move the steps.' },
      { q: 'How is this different from a fitted normal (or other overlay)?', a: 'A fit assumes a formula and estimates μ, σ, λ, …. The eCDF does not. Agreement in a plot is suggestive, not a proof of that formula.' },
      { q: 'What is the support?', a: 'Whatever values appear in the current sample. Nothing outside the observed min and max has empirical mass.' },
      { q: 'Can I approximate the eCDF with a smooth curve?', a: 'You can overlay a parametric CDF or a kernel estimate for teaching. That overlay is extra structure — it is not implied by F_n alone.' },
    ],
  }),
}

export function getDistributionLearnExtras(id: DistributionId): DistLearnExtras {
  return DISTRIBUTION_LEARN_EXTRAS[id]
}