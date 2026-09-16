export type GlossaryCategory =
  | 'Descriptive'
  | 'Probability'
  | 'Random Variables'
  | 'Distributions'
  | 'Sampling'
  | 'Estimation'
  | 'Hypothesis Testing'
  | 'Regression'
  | 'Association'
  | 'ANOVA'
  | 'Bayesian'
  | 'Time Series'
  | 'Nonparametric'
  | 'Survival'
  | 'Design'
  | 'Quality'
  | 'Machine Learning'

export type GlossaryTerm = {
  term: string
  slug: string
  category: GlossaryCategory
  alsoCalled?: string[]
  definition: string
  example: string
}

export function glossarySlug(term: string): string {
  return term
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function entry(
  term: string,
  category: GlossaryCategory,
  definition: string,
  example: string,
  alsoCalled?: string[],
): GlossaryTerm {
  return { term, slug: glossarySlug(term), category, definition, example, alsoCalled }
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  entry('Mean', 'Descriptive', 'The average: add the numbers and divide by how many there are. Extreme values can pull it.', 'Scores 70, 80, 90 have mean (70+80+90)/3 = 80.'),
  entry('Median', 'Descriptive', 'The middle value after sorting. One huge or tiny number usually does not move it much.', 'Incomes 20, 22, 25, 28, 400 have median 25, not the mean 99.'),
  entry('Mode', 'Descriptive', 'The most common value. A set can have one mode, several modes, or none.', 'In 2, 2, 3, 5, 5, 5, 9 the mode is 5.'),
  entry('Range', 'Descriptive', 'Largest value minus smallest value. It uses only two points, so one outlier can stretch it.', 'Ages 12, 14, 15, 31 have range 31 − 12 = 19.'),
  entry('Variance', 'Descriptive', 'Average of squared distances from the mean. Sample variance divides by n − 1.', 'Values 2, 4, 6 have sample variance 4.'),
  entry('Standard Deviation', 'Descriptive', 'Typical distance from the mean, in the original units. It is the square root of variance.', 'If heights have SD 6 cm, most people sit a few centimeters from the average height.'),
  entry('Interquartile Range', 'Descriptive', 'Spread of the middle 50% of the data: Q3 minus Q1. Less sensitive to outliers than the range.', 'If Q1 = 12 and Q3 = 20, IQR = 8.', ['IQR']),
  entry('Quartile', 'Descriptive', 'A value that splits ordered data into four equal-count parts: Q1, Q2 (median), and Q3.', 'On a 20-student test, Q1 is the score that about 25% of students sit at or below.'),
  entry('Percentile', 'Descriptive', 'A value below which a given percent of the observations fall.', 'The 90th percentile of wait times is 18 minutes if 90% of customers waited 18 minutes or less.'),
  entry('Quantile', 'Descriptive', 'A cut that splits ordered data by a probability p. Quartiles and percentiles are special quantiles.', 'The 0.25 quantile is Q1. StatAnveshak uses the R type-7 quantile method.'),
  entry('Five-Number Summary', 'Descriptive', 'Minimum, Q1, median, Q3, and maximum. It is the skeleton of a box plot.', 'Exam scores: min 41, Q1 62, median 74, Q3 85, max 99.'),
  entry('Outlier', 'Descriptive', 'A point that sits far from the rest. Tukey fences flag values below Q1 − 1.5 IQR or above Q3 + 1.5 IQR.', 'If Q1 = 10, Q3 = 20, then 40 is above 20 + 1.5×10 = 35, so it is an outlier.'),
  entry('Skewness', 'Descriptive', 'How lopsided a distribution is. Positive skew has a long right tail; negative skew has a long left tail.', 'Income is usually right-skewed: many typical earners and a few very high incomes.'),
  entry('Kurtosis', 'Descriptive', 'How heavy the tails are compared with a normal curve. High kurtosis means more extreme values.', 'Daily stock returns often have heavier tails than a normal model predicts.'),
  entry('Histogram', 'Descriptive', 'A bar chart of how many observations fall in each bin. Bin width changes how the shape looks.', 'A histogram of 200 reaction times may show a pile around 0.3 s and a long right tail.'),
  entry('Box Plot', 'Descriptive', 'A picture of the five-number summary. The box is Q1 to Q3; whiskers reach the last points inside the Tukey fences.', 'Comparing two classes, the box for Class B sits higher, so its typical scores are larger.'),
  entry('Stem-and-Leaf Plot', 'Descriptive', 'A compact list that keeps the actual digits while showing shape, like a sideways histogram.', 'Stems 6 | 2 5 8 means the values 62, 65, and 68.'),
  entry('Empirical CDF', 'Descriptive', 'The sample cumulative distribution: the fraction of observations less than or equal to x.', 'If 7 of 20 times are ≤ 5 minutes, Fn(5) = 7/20 = 0.35.', ['ECDF']),
  entry('Frequency', 'Descriptive', 'How many times a value or category appears.', 'In a class of 30, “left-handed” has frequency 4.'),
  entry('Relative Frequency', 'Descriptive', 'Frequency divided by the sample size. It is the sample proportion of a category.', '4 left-handed students out of 30 is 4/30 ≈ 0.133.'),
  entry('Cumulative Frequency', 'Descriptive', 'Running total of frequencies up through a value or class.', 'If bins 1–10, 11–20, 21–30 have 3, 8, 5 people, the cumulative at 20 is 11.'),
  entry('Population', 'Descriptive', 'The whole group you want to describe. Usually too large to measure completely.', 'All registered voters in a city, not just the 400 people you called.'),
  entry('Sample', 'Descriptive', 'The observations you actually collected from the population.', 'A random draw of 80 patients from last year’s hospital records.'),
  entry('Parameter', 'Descriptive', 'A number that describes a population, such as μ or p. It is usually unknown.', 'The true mean cholesterol of all adults in a country is a parameter.'),
  entry('Statistic', 'Descriptive', 'A number computed from a sample, such as x̄ or p̂. It estimates a parameter.', 'The mean cholesterol in your 200-person sample is a statistic.'),
  entry('Variable', 'Descriptive', 'A measured attribute that can take different values across people or units.', 'Height, city, and “passed the exam” are variables.'),
  entry('Observation', 'Descriptive', 'One row or unit in the dataset.', 'One student, one day of sales, or one machine cycle.'),
  entry('Dataset', 'Descriptive', 'A collection of observations and variables stored together for analysis.', 'A spreadsheet with 1,200 rows of daily temperatures and rainfall.'),
  entry('Categorical Variable', 'Descriptive', 'A variable whose values are labels or groups, not amounts.', 'Blood type: A, B, AB, O.'),
  entry('Numerical Variable', 'Descriptive', 'A variable measured as a number you can add and average.', 'Reaction time in milliseconds.'),
  entry('Discrete Variable', 'Descriptive', 'A numerical variable that takes isolated values, often counts.', 'Number of pets: 0, 1, 2, 3, …'),
  entry('Continuous Variable', 'Descriptive', 'A numerical variable that can take any value in an interval, at least in theory.', 'Weight in kilograms, even if a scale only shows one decimal.'),
  entry('Ordinal Variable', 'Descriptive', 'A categorical variable with a natural order but unequal steps.', 'Pain rated none, mild, moderate, severe.'),
  entry('Nominal Variable', 'Descriptive', 'A categorical variable with names only and no ranked order.', 'Favorite sport: cricket, football, tennis.'),
  entry('Dummy Variable', 'Descriptive', 'A 0/1 stand-in for a category, used in regression.', 'Female = 1 if the person is female, otherwise 0.'),
  entry('Missing Data', 'Descriptive', 'An empty or unknown value. How it is missing matters more than just filling it in.', 'A survey skips income for people who refused the question.'),
  entry('Winsorizing', 'Descriptive', 'Replacing extreme values with a less extreme cutoff instead of deleting them.', 'Cap the top 1% of incomes at the 99th percentile before averaging.'),
  entry('Z-Score', 'Descriptive', 'How many standard deviations a value sits from the mean: (x − mean) / SD.', 'A test score 2 SDs above the mean has z = 2.'),
  entry('Standardized Score', 'Descriptive', 'A rescaled value so different measures share a common center and spread.', 'Turning height and weight into z-scores before combining them.'),
  entry('Coefficient of Variation', 'Descriptive', 'SD divided by the mean. Useful for comparing relative spread in different units.', 'SD 8 on a mean of 40 is CV = 0.20, or 20%.'),
  entry('Trimmed Mean', 'Descriptive', 'The mean after dropping a fraction of the lowest and highest values.', 'A 10% trimmed mean of 10 scores drops the lowest and highest one, then averages the rest.'),
  entry('Mean Absolute Deviation', 'Descriptive', 'Average of absolute distances from the mean or median. Less sensitive than variance to huge errors.', 'Values 3, 5, 7 around mean 5 have MAD 4/3 ≈ 1.33.'),

  entry('Probability', 'Probability', 'A number from 0 to 1 that says how likely an event is under a model or long-run frequency.', 'A fair six-sided die has P(6) = 1/6.'),
  entry('Sample Space', 'Probability', 'The set of all possible outcomes of a random experiment.', 'For one coin flip, S = {heads, tails}.'),
  entry('Event', 'Probability', 'A subset of the sample space: a collection of outcomes you care about.', '“Even number” on a die is {2, 4, 6}.'),
  entry('Outcome', 'Probability', 'A single result of one run of the experiment.', 'Rolling a 4 is one outcome.'),
  entry('Complement', 'Probability', 'Everything in the sample space that is not in the event. P(Aᶜ) = 1 − P(A).', 'If P(rain) = 0.3, then P(no rain) = 0.7.'),
  entry('Union', 'Probability', 'Outcomes in A or B or both, written A ∪ B.', '“Ace or heart” includes the ace of hearts only once.'),
  entry('Intersection', 'Probability', 'Outcomes in both A and B, written A ∩ B.', '“Even and greater than 3” on a die is {4, 6}.'),
  entry('Mutually Exclusive', 'Probability', 'Events that cannot happen together. Their intersection is empty, so P(A ∪ B) = P(A) + P(B).', 'Drawing a heart and drawing a club on one card.'),
  entry('Independent Events', 'Probability', 'Knowing one event happened does not change the probability of the other. Then P(A ∩ B) = P(A)P(B).', 'Two separate coin flips. First heads does not change P(second heads).'),
  entry('Dependent Events', 'Probability', 'Events where one changes the chance of the other.', 'Drawing two cards without replacement: the first ace changes P(second ace).'),
  entry('Conditional Probability', 'Probability', 'The chance of A given that B happened: P(A|B) = P(A ∩ B) / P(B).', 'P(ace | red card) = 2/26 = 1/13 in a standard deck.'),
  entry("Bayes' Theorem", 'Probability', 'Updates a prior probability after new evidence: P(H|D) = P(D|H)P(H) / P(D).', 'A rare disease test that is 99% accurate can still leave a modest posterior if the disease is very rare.'),
  entry('Law of Total Probability', 'Probability', 'Split the sample space into pieces and add P(A|Bi)P(Bi).', 'P(late) = P(late|rain)P(rain) + P(late|clear)P(clear).'),
  entry('Addition Rule', 'Probability', 'P(A ∪ B) = P(A) + P(B) − P(A ∩ B). Drop the last term only if A and B cannot both happen.', 'P(ace or heart) = 4/52 + 13/52 − 1/52 = 16/52.'),
  entry('Multiplication Rule', 'Probability', 'P(A ∩ B) = P(A)P(B|A). If independent, this is just P(A)P(B).', 'P(two aces in a row without replacement) = (4/52)×(3/51).'),
  entry('Permutation', 'Probability', 'An ordered arrangement. Order matters.', 'The number of ways to award gold, silver, bronze to 8 runners is 8×7×6 = 336.'),
  entry('Combination', 'Probability', 'A selection where order does not matter.', 'Choosing 3 books from 8 is C(8,3) = 56.'),
  entry('Factorial', 'Probability', 'n! = n × (n−1) × … × 1, with 0! = 1. Counts ordered lists of n distinct items.', '5! = 120 ways to line up 5 people.'),
  entry('Odds', 'Probability', 'The ratio P / (1 − P), not the same as a probability.', 'If P(win) = 0.25, odds are 1 to 3, or 0.25/0.75 = 1/3.'),
  entry('Odds Ratio', 'Probability', 'A ratio of two odds, often used to compare groups in a 2×2 table.', 'If treatment odds of recovery are 3 and control odds are 1, the odds ratio is 3.'),
  entry('Expected Value', 'Probability', 'The long-run average of a random variable: sum of value × probability, or an integral for continuous X.', 'A game that pays $10 with chance 0.2 and $0 otherwise has E[X] = 2.'),
  entry('Random Experiment', 'Probability', 'A repeatable process with an uncertain outcome.', 'Tossing a coin, drawing a card, or measuring tomorrow’s rainfall.'),
  entry('Equally Likely', 'Probability', 'Outcomes that share the same probability. Then P(event) = (favorable count) / (total count).', 'A fair die treats 1 through 6 as equally likely.'),
  entry('Subjective Probability', 'Probability', 'A personal degree of belief, not a long-run frequency.', 'A coach’s 70% chance that a player starts Saturday.'),
  entry('Frequentist Probability', 'Probability', 'The long-run relative frequency of an event in repeated identical trials.', 'About 1/6 of many fair die rolls land on 4.'),
  entry('Joint Probability', 'Probability', 'The probability that two events happen together, P(A ∩ B).', 'P(rain and late) might be 0.12.'),
  entry('Marginal Probability', 'Probability', 'The probability of one variable after adding over the other variable.', 'From a joint table of weather and lateness, P(rain) is the rain row total.'),
  entry('Tree Diagram', 'Probability', 'A branching picture of sequential events and their conditional probabilities.', 'First branch: rain or not. Second branch: late or on time given the weather.'),
  entry('Venn Diagram', 'Probability', 'Overlapping circles that show unions, intersections, and complements.', 'Two overlapping circles for “likes tea” and “likes coffee”.'),
  entry('Counting Principle', 'Probability', 'If one stage has a ways and the next has b ways, together there are a × b sequences.', '3 shirts and 4 trousers give 12 outfits.'),

  entry('Random Variable', 'Random Variables', 'A numerical summary of a random outcome, usually written X.', 'X = number of heads in 10 coin flips.'),
  entry('Discrete Random Variable', 'Random Variables', 'A random variable with a countable list of possible values.', 'X = number of defective chips in a box of 20.'),
  entry('Continuous Random Variable', 'Random Variables', 'A random variable that can take any value in an interval. Probabilities come from areas under a curve.', 'X = time until the next bus, in minutes.'),
  entry('Probability Mass Function', 'Random Variables', 'For a discrete X, p(x) = P(X = x). The masses add to 1.', 'A fair die has p(x) = 1/6 for x = 1,…,6.', ['PMF']),
  entry('Probability Density Function', 'Random Variables', 'For a continuous X, a curve f(x) whose area between a and b is P(a ≤ X ≤ b). f(x) itself is not a probability.', 'A standard normal density is highest at 0 and nearly flat in the far tails.', ['PDF']),
  entry('Cumulative Distribution Function', 'Random Variables', 'F(x) = P(X ≤ x). It jumps for discrete X and rises smoothly for continuous X.', 'If F(2) = 0.8, then 80% of the probability sits at 2 or below.', ['CDF']),
  entry('Survival Function', 'Random Variables', 'S(x) = P(X > x) = 1 − F(x). Common in reliability and survival analysis.', 'If S(5) = 0.4, 40% of devices last more than 5 years.'),
  entry('Quantile Function', 'Random Variables', 'The inverse CDF: the smallest x with F(x) ≥ p. It turns a probability into a cutoff.', 'The 0.975 quantile of N(0,1) is about 1.96.'),
  entry('Moment', 'Random Variables', 'An expected power of X. The first moment is the mean; the second central moment is the variance.', 'E[X²] is needed to compute Var(X) = E[X²] − (E[X])².'),
  entry('Moment-Generating Function', 'Random Variables', 'M(t) = E[e^{tX}]. Derivatives at 0 recover moments when the function exists.', 'For a Poisson(λ) variable, M(t) = exp(λ(e^t − 1)).'),
  entry('Support', 'Random Variables', 'The set of values where the PMF or PDF is positive.', 'A Uniform(0, 1) random variable has support (0, 1).'),
  entry('Independence of Random Variables', 'Random Variables', 'X and Y are independent if their joint distribution factors as the product of the margins.', 'Two separate die rolls: knowing the first does not change the second.'),
  entry('Covariance of Random Variables', 'Random Variables', 'E[(X − μX)(Y − μY)]. Positive means they tend to move together.', 'Study hours and exam score often have positive covariance.'),
  entry('Correlation of Random Variables', 'Random Variables', 'Covariance scaled to [−1, 1]. It measures linear association only.', 'Corr(X, 2X + 3) = 1 for a non-constant X.'),
  entry('Transformation', 'Random Variables', 'A new variable Y = g(X). The distribution of Y is not the same as the distribution of X.', 'If X is time in hours, Y = 60X is time in minutes.'),
  entry('Law of the Unconscious Statistician', 'Random Variables', 'E[g(X)] is computed from the distribution of X, not by first finding the law of g(X).', 'E[X²] for a die is (1²+…+6²)/6, without naming a new variable first.'),

  entry('Normal Distribution', 'Distributions', 'The bell curve. Shape is set by mean μ and SD σ. Many sums of independent pieces look roughly normal.', 'Adult heights in a large group often look approximately normal around the mean.'),
  entry('Standard Normal', 'Distributions', 'The normal with mean 0 and SD 1. Tables and z-scores live here.', 'P(Z > 1.96) ≈ 0.025 for a standard normal Z.'),
  entry('Binomial Distribution', 'Distributions', 'Count of successes in n independent Bernoulli trials with the same success chance p.', 'Number of sixes in 20 fair die rolls is Binomial(20, 1/6).'),
  entry('Bernoulli Distribution', 'Distributions', 'A single yes/no trial. X is 1 with probability p and 0 with probability 1 − p.', 'One coin flip: X = 1 for heads.'),
  entry('Poisson Distribution', 'Distributions', 'A count of rare events in a fixed interval when events occur independently at a constant rate λ.', 'Number of emails in the next hour if they arrive at about 4 per hour.'),
  entry('Exponential Distribution', 'Distributions', 'Waiting time until the next Poisson event. It is memoryless.', 'If buses average every 10 minutes, waiting time is Exponential with mean 10.'),
  entry('Uniform Distribution', 'Distributions', 'Every interval of the same length inside the range has the same probability.', 'A random number from 0 to 1 on a fair spinner.'),
  entry('Geometric Distribution', 'Distributions', 'Number of trials until the first success, or sometimes the number of failures before it. Check the convention.', 'Flips until the first heads, with P(X = 3) = (1/2)³ if X counts trials.'),
  entry('Negative Binomial Distribution', 'Distributions', 'Number of trials until r successes, a generalization of the geometric.', 'Trials until the 5th defective item on a line with p = 0.02.'),
  entry('Hypergeometric Distribution', 'Distributions', 'Number of successes in a draw without replacement from a finite population.', 'Red cards in a 5-card hand from a 52-card deck.'),
  entry("Student's t Distribution", 'Distributions', 'A bell curve with heavier tails than the normal. It appears when σ is estimated from the sample.', 'A one-sample t interval uses t with df = n − 1.'),
  entry('Chi-Square Distribution', 'Distributions', 'The distribution of a sum of squared standard normals. Used for variance intervals and many tests.', 'A 95% CI for σ² uses χ² quantiles with n − 1 degrees of freedom.'),
  entry('F Distribution', 'Distributions', 'A ratio of two scaled chi-square variables. Used in ANOVA and variance comparisons.', 'The ANOVA F statistic compares between-group MS to within-group MS.'),
  entry('Gamma Distribution', 'Distributions', 'A flexible positive continuous family. The exponential is Gamma with shape 1 (shape–rate form).', 'Total waiting time for 3 independent Exponential(λ) events is Gamma(3, λ).'),
  entry('Beta Distribution', 'Distributions', 'A continuous distribution on (0, 1), often used as a prior for a proportion.', 'Beta(2, 8) piles most of its mass on small proportions.'),
  entry('Log-Normal Distribution', 'Distributions', 'A variable whose logarithm is normal. Values are positive and right-skewed.', 'Some income and particle-size datasets look log-normal.'),
  entry('Multinomial Distribution', 'Distributions', 'Counts across k categories in n independent trials. The binomial is the k = 2 case.', 'In 100 dice rolls, the six face counts together are multinomial.'),
  entry('Multivariate Normal', 'Distributions', 'A joint normal for several variables, described by a mean vector and a covariance matrix.', 'Height and weight together can be modeled as bivariate normal.'),
  entry('Central Limit Theorem', 'Distributions', 'For many independent draws with finite variance, the sample mean becomes approximately normal as n grows. It is not the law of large numbers.', 'Means of 40 die rolls look much more bell-shaped than a single roll.'),
  entry('Law of Large Numbers', 'Distributions', 'The sample average settles near the expected value as n grows. That is stability, not a bell curve.', 'The proportion of heads in 10,000 flips is usually very close to 1/2.'),
  entry('Heavy Tails', 'Distributions', 'Tails that put more probability on extreme values than a normal curve does.', 'A t distribution with 3 degrees of freedom has much heavier tails than N(0,1).'),
  entry('Memoryless Property', 'Distributions', 'The remaining wait does not depend on how long you have already waited. Exponential and geometric have this.', 'If a part is exponential, surviving 3 years does not change the chance it lasts 3 more.'),
  entry('68-95-99.7 Rule', 'Distributions', 'In a normal distribution, about 68%, 95%, and 99.7% of values lie within 1, 2, and 3 SDs of the mean.', 'IQ with mean 100 and SD 15: about 95% of people fall between 70 and 130.'),

  entry('Simple Random Sampling', 'Sampling', 'Every subset of size n from the population has the same chance of being chosen.', 'Drawing 50 student IDs from a hat that holds every ID once.'),
  entry('Stratified Sampling', 'Sampling', 'Split the population into strata, then sample inside each stratum, often in proportion to size.', 'Sample 60% urban and 40% rural if the city is 60% urban.'),
  entry('Cluster Sampling', 'Sampling', 'Draw whole clusters first, then measure units inside the chosen clusters.', 'Randomly pick 12 schools, then survey every student in those schools.'),
  entry('Systematic Sampling', 'Sampling', 'Take every kth unit after a random start, where k ≈ N/n.', 'From a list of 1,000, start at 7 and take every 10th name.'),
  entry('Convenience Sampling', 'Sampling', 'Take whoever is easy to reach. Fast, but often biased.', 'Interviewing only people who walk past your stall at noon.'),
  entry('Sampling Bias', 'Sampling', 'A systematic tendency for some units to be over- or under-represented.', 'A phone poll that only calls landlines misses many younger adults.'),
  entry('Sampling Error', 'Sampling', 'The random gap between a sample statistic and the population parameter, even with a good design.', 'One random sample mean is 51.2 while the population mean is 50.'),
  entry('Nonsampling Error', 'Sampling', 'Error from measurement, nonresponse, processing, or a bad frame — not from random sampling itself.', 'People under-report junk-food intake on a food diary.'),
  entry('Sampling Frame', 'Sampling', 'The list or mechanism you actually draw from. If it misses the population, estimates can be biased.', 'A voter list that is two years old is an incomplete frame.'),
  entry('Sampling Distribution', 'Sampling', 'The distribution of a statistic across repeated samples of the same size from the same population.', 'The histogram of 1,000 sample means, each from n = 25.'),
  entry('Standard Error', 'Sampling', 'The standard deviation of a statistic’s sampling distribution. For a mean it is often σ/√n.', 'If σ = 10 and n = 25, SE of the mean is 2.'),
  entry('Finite Population Correction', 'Sampling', 'A shrinkage of the SE when you sample a large share of a finite population without replacement.', 'Sampling 80 of 100 items has a much smaller SE than sampling 80 from millions.'),
  entry('Bootstrap', 'Sampling', 'Resample the observed data with replacement to approximate the sampling distribution.', 'From 30 reaction times, draw 30 with replacement, recompute the mean, repeat 2,000 times.'),
  entry('Jackknife', 'Sampling', 'Leave one observation out at a time to estimate bias and variance of a statistic.', 'Recompute a correlation 40 times, each time dropping a different row.'),
  entry('Resampling', 'Sampling', 'Building new samples from the data you already have, as in bootstrap or permutation tests.', 'Shuffle treatment labels 5,000 times to see how unusual the observed difference is.'),
  entry('Sampling Fraction', 'Sampling', 'n/N, the share of the population that is in the sample.', '80 people from a club of 400 is a sampling fraction of 0.20.'),

  entry('Point Estimate', 'Estimation', 'A single-number guess for a parameter, such as x̄ for μ or p̂ for p.', 'x̄ = 101.3 is a point estimate of the population mean test score.'),
  entry('Estimator', 'Estimation', 'The rule or formula that turns a sample into a guess. It is a random variable before you see the data.', 'The sample mean X̄ is an estimator of μ.'),
  entry('Estimate', 'Estimation', 'The number the estimator produces on the sample you have.', 'On this sample the estimate is 78.6.'),
  entry('Bias of an Estimator', 'Estimation', 'E[θ̂] − θ. Zero bias means the estimator is right on average, not in every sample.', 'The sample variance that divides by n is biased downward for σ².'),
  entry('Unbiased Estimator', 'Estimation', 'An estimator whose expected value equals the parameter.', 'The sample mean is unbiased for μ under random sampling with finite mean.'),
  entry('Consistency', 'Estimation', 'The estimator gets arbitrarily close to the parameter, in probability, as n grows.', 'X̄ is consistent for μ when the variance is finite.'),
  entry('Efficiency', 'Estimation', 'Among unbiased estimators, the more efficient one has smaller variance.', 'For a normal population, the sample mean is more efficient than the sample median.'),
  entry('Mean Squared Error', 'Estimation', 'E[(θ̂ − θ)²] = bias² + variance. A good estimator keeps MSE small.', 'Bias 2 and variance 9 give MSE 13.', ['MSE']),
  entry('Confidence Interval', 'Estimation', 'A range computed from the sample. A 95% interval is built so that 95% of repeated samples would cover the parameter.', 'A 95% CI for mean score of (88.9, 113.7) does not say there is a 95% chance μ is inside this one interval.'),
  entry('Confidence Level', 'Estimation', 'The long-run coverage of the interval method, such as 90%, 95%, or 99%. Higher level means a wider interval.', 'Switching from 95% to 99% stretches the same data into a wider interval.'),
  entry('Margin of Error', 'Estimation', 'The half-width of a symmetric interval: estimate ± ME. It is not a chance that the estimate is wrong.', 'p̂ = 0.56 and ME = 0.049 give the interval 0.511 to 0.609.'),
  entry('Critical Value', 'Estimation', 'The quantile of the reference distribution used to build a test or interval, such as z* or t*.', 'For a 95% z interval, z* ≈ 1.96.'),
  entry('Degrees of Freedom', 'Estimation', 'The amount of independent information left after estimating parameters. It sets the t, χ², or F reference curve.', 'A one-sample t interval uses df = n − 1. For n = 30, df = 29.'),
  entry('t Interval', 'Estimation', 'A CI for a mean that uses the sample SD and a t critical value. Use it when σ is unknown.', 'x̄ ± t* s/√n with t* from df = n − 1.'),
  entry('z Interval', 'Estimation', 'A CI that uses a normal critical value, typically when σ is known or n is large enough for an approximation.', 'x̄ ± 1.96 σ/√n when σ is treated as known.'),
  entry('Wald Interval', 'Estimation', 'The simple p̂ ± z* √(p̂(1 − p̂)/n) interval. It can be poor when n is small or p̂ is near 0 or 1.', '12 successes in 15 trials give a Wald interval that is too optimistic. A Wilson interval is safer.'),
  entry('Sample Size Determination', 'Estimation', 'Working backwards from a target margin of error and confidence level to the n you need.', 'For a mean, n = (z* σ / E)². With z* = 1.96, σ = 12, E = 3, n rounds up to 62.'),
  entry('Precision', 'Estimation', 'How tight an estimate is. Smaller SE or smaller ME means more precision, not automatically less bias.', 'n = 1,000 gives a much smaller ME than n = 100 at the same confidence level.'),
  entry('Coverage Probability', 'Estimation', 'The long-run fraction of intervals that contain the true parameter. It should match the claimed confidence level.', 'In 10,000 simulated 95% intervals, about 9,500 should cover μ if the method is calibrated.'),
  entry('Pooled Variance', 'Estimation', 'A combined variance estimate from two groups when you assume they share σ².', 's_p² = ((n1−1)s1² + (n2−1)s2²) / (n1+n2−2).'),
  entry('Standard Error of the Mean', 'Estimation', 'σ/√n, or s/√n when σ is unknown. It shrinks like 1/√n, not 1/n.', 'Quadrupling n halves the SE of the mean.'),
  entry('Unbiased Sample Variance', 'Estimation', 's² = Σ(xi − x̄)² / (n − 1). Dividing by n − 1 corrects the bias from using the sample mean.', 'For 2, 4, 6, s² = 4, while the n-denominator version is 8/3.'),

  entry('Null Hypothesis', 'Hypothesis Testing', 'The default claim you test, written H0. You reject it only if the data are unusual under that claim.', 'H0: the new drug has the same mean recovery time as the old one.'),
  entry('Alternative Hypothesis', 'Hypothesis Testing', 'The claim you entertain if H0 looks implausible, written Ha or H1. It can be one-sided or two-sided.', 'Ha: the new drug has a shorter mean recovery time.'),
  entry('Test Statistic', 'Hypothesis Testing', 'A number that measures how far the data sit from H0, in SE units or another reference scale.', 't = (x̄ − μ0) / (s/√n).'),
  entry('P-Value', 'Hypothesis Testing', 'The probability, computed under H0, of a result at least as extreme as the one you saw. It is not P(H0 is true).', 'p = 0.03 means such a large |t| happens about 3% of the time if H0 is true.'),
  entry('Significance Level', 'Hypothesis Testing', 'The planned Type I error rate α. Common choices are 0.05 and 0.01. It is chosen before seeing the p-value.', 'If α = 0.05 and p = 0.03, you reject H0.'),
  entry('Type I Error', 'Hypothesis Testing', 'Rejecting H0 when H0 is true. Its planned rate is α.', 'Declaring a fair coin biased because one sample of 20 flips looked lopsided.'),
  entry('Type II Error', 'Hypothesis Testing', 'Failing to reject H0 when Ha is true. Its rate is β. Power is 1 − β.', 'A small study misses a real 4-point improvement because the interval still covers 0.'),
  entry('Statistical Power', 'Hypothesis Testing', 'P(reject H0 | Ha is true). Larger n, larger effects, and larger α raise power.', 'A study planned for 80% power has an 80% chance to detect the effect it was designed for.'),
  entry('One-Sided Test', 'Hypothesis Testing', 'Ha points only one direction, such as μ > μ0. Use it only when the other direction is not of interest.', 'Testing whether a machine fills more than 500 ml, not less.'),
  entry('Two-Sided Test', 'Hypothesis Testing', 'Ha says the parameter is different, in either direction.', 'H0: μ = 100 versus Ha: μ ≠ 100.'),
  entry('Rejection Region', 'Hypothesis Testing', 'The set of test-statistic values that lead to rejecting H0 at the chosen α.', 'For a two-sided z test at α = 0.05, reject if |z| ≥ 1.96.'),
  entry('Critical Region', 'Hypothesis Testing', 'Another name for the rejection region.', 'The tails beyond ±t* on a t curve.'),
  entry('z-Test', 'Hypothesis Testing', 'A test that compares a statistic to a normal reference, typically when σ is known or n is large.', 'H0: p = 0.5 with n = 400 uses a z statistic for the sample proportion.'),
  entry('One-Sample t-Test', 'Hypothesis Testing', 'Tests a mean against a hypothesized value when σ is unknown.', 'H0: μ = 98.6°F using 25 temperature readings and their sample SD.'),
  entry('Two-Sample t-Test', 'Hypothesis Testing', 'Compares means of two independent groups. Pooled t assumes equal variances; Welch does not.', 'Mean score of 30 students using Method A versus 28 using Method B.'),
  entry('Paired t-Test', 'Hypothesis Testing', 'A one-sample t-test on differences from matched pairs, such as before and after.', 'Weight of 18 people before and after an 8-week program.'),
  entry("Welch's t-Test", 'Hypothesis Testing', 'A two-sample t-test that does not assume equal group variances. Degrees of freedom are fractional.', 'Comparing reaction times when one group is much more variable than the other.'),
  entry('Chi-Square Test', 'Hypothesis Testing', 'A family of tests that compare observed counts with expected counts under H0.', 'A 3×2 table of treatment by recovery uses χ² for independence.'),
  entry('Goodness-of-Fit Test', 'Hypothesis Testing', 'Checks whether sample frequencies match a claimed distribution.', 'Testing whether a die’s six faces are equally likely.'),
  entry('Test of Independence', 'Hypothesis Testing', 'Checks whether two categorical variables are associated in a contingency table.', 'Is political party independent of news source in a survey table?'),
  entry('F-Test', 'Hypothesis Testing', 'A test using an F statistic, often for equal variances or for ANOVA.', 'ANOVA asks whether at least one group mean differs.'),
  entry('Effect Size', 'Hypothesis Testing', 'A measure of how large a difference or association is, not just whether p < α.', 'Cohen’s d = 0.8 is a large standardized mean difference.'),
  entry("Cohen's d", 'Hypothesis Testing', 'A standardized mean difference: (μ1 − μ2) / σ, estimated from sample means and an SD.', 'A 6-point gap with SD 12 is d = 0.5.'),
  entry('Multiple Testing', 'Hypothesis Testing', 'Running many tests raises the chance of some false positives. Adjust α or use FDR control.', '20 independent tests at α = 0.05 expect about one false rejection if all H0 are true.'),
  entry('Bonferroni Correction', 'Hypothesis Testing', 'A simple multiple-testing fix: use α/m for m tests. It is conservative.', 'Five tests at family α = 0.05 each use 0.01.'),
  entry('Family-Wise Error Rate', 'Hypothesis Testing', 'The probability of at least one Type I error among a family of tests.', 'Bonferroni aims to keep FWER ≤ α.'),
  entry('False Discovery Rate', 'Hypothesis Testing', 'The expected fraction of rejected tests that are false discoveries. Less conservative than FWER control.', 'Benjamini–Hochberg controls FDR when many genes are screened.'),
  entry('Statistical Significance', 'Hypothesis Testing', 'A result with p ≤ α under the chosen test. It is not the same as “important” or “large.”', 'A tiny difference can be significant with n = 100,000.'),
  entry('Practical Significance', 'Hypothesis Testing', 'Whether the effect is large enough to matter in the real setting.', 'A 0.1-point exam gain may be significant but not worth a new curriculum.'),
  entry('Likelihood Ratio Test', 'Hypothesis Testing', 'Compares how well two nested models explain the data using the ratio of their maximized likelihoods.', 'Testing whether a regression slope can be dropped.'),

  entry('Correlation', 'Association', 'A unit-free measure of how two numerical variables move together. Pearson measures linear association.', 'r = 0.8 between study hours and score is a strong positive linear link.'),
  entry('Pearson Correlation', 'Association', 'r = Cov(X,Y) / (sX sY). It is undefined if a variable has zero variance. Outliers can swing it.', 'Heights and weights of adults often have r around 0.4 to 0.6.'),
  entry('Spearman Correlation', 'Association', 'Pearson correlation of the ranks. It captures monotone association, not just straight lines.', 'If Y = X³, Spearman can be near 1 while Pearson is smaller.'),
  entry("Kendall's Tau", 'Association', 'A rank correlation based on concordant versus discordant pairs. τ-b adjusts for ties.', 'If most pairs of students keep the same order on two tests, τ is positive.'),
  entry('Covariance', 'Association', 'Average product of deviations from the two means. Its units are the product of the two variable units.', 'If X is hours and Y is points, covariance is in hour-points, not in [−1, 1].'),
  entry('Partial Correlation', 'Association', 'Correlation between two variables after removing linear effects of other variables.', 'The link between ice cream sales and drowning after controlling for temperature may vanish.'),
  entry('Scatter Plot', 'Association', 'A graph of paired (x, y) points. Always look at it before trusting a correlation number.', 'A fan shape or a curve can make r misleading.'),
  entry('Spurious Correlation', 'Association', 'A correlation that is real in the numbers but driven by a third factor or by chance.', 'Ice cream sales and drowning both rise in summer.'),
  entry('Association vs Causation', 'Association', 'Association says variables move together. Causation says changing one produces a change in the other.', 'People with lighters in their pocket get cancer more often because they smoke, not because of the lighter.'),

  entry('Linear Regression', 'Regression', 'A model for a mean that is a straight line: Y ≈ β0 + β1 X + error.', 'Score ≈ 40 + 8 × hours studied.'),
  entry('Slope', 'Regression', 'The change in the fitted mean of Y for a one-unit increase in X.', 'Slope 8 means +8 points per extra hour.'),
  entry('Intercept', 'Regression', 'The fitted mean of Y when all predictors are 0. It may be outside the data range.', 'Intercept 40 is the fitted score at 0 hours, which may not be realistic.'),
  entry('Residual', 'Regression', 'Observed Y minus fitted Y. Residuals should look patternless if the model is adequate.', 'A student scored 86 while the line predicted 80, so the residual is +6.'),
  entry('Least Squares', 'Regression', 'Choosing coefficients to minimize the sum of squared residuals.', 'The OLS line is the unique line that makes Σ ei² as small as possible.'),
  entry('R-Squared', 'Regression', 'The fraction of sample variance in Y explained by the model. It always rises when you add predictors.', 'R² = 0.64 means the line accounts for 64% of the variance in scores.'),
  entry('Adjusted R-Squared', 'Regression', 'R² with a penalty for extra predictors, so it can fall when a useless variable is added.', 'Adding a random noise column usually drops adjusted R².'),
  entry('Multicollinearity', 'Regression', 'Predictors that are strongly linear combinations of each other. Coefficients become unstable.', 'Height in cm and height in inches in the same model.'),
  entry('Heteroscedasticity', 'Regression', 'Residual spread that changes with X or with the fitted values. Ordinary SEs can be wrong.', 'A fan-shaped residual plot: bigger predictions, bigger scatter.'),
  entry('Homoscedasticity', 'Regression', 'Constant residual variance. Many textbook SEs and tests assume it.', 'A residual plot that is a level band, not a fan or a curve.'),
  entry('Logistic Regression', 'Regression', 'A model for a binary outcome using log-odds, not a straight line through 0–1 probabilities.', 'P(pass) rises with hours studied, but fitted probabilities stay between 0 and 1.'),
  entry('Log Odds', 'Regression', 'log(p / (1 − p)). Logistic regression is linear in the log-odds.', 'p = 0.75 has log-odds log(3) ≈ 1.10.'),
  entry('Dummy Coding', 'Regression', 'Turning a categorical predictor into 0/1 columns, leaving one baseline level out.', 'Regions East, West, South with South as the reference.'),
  entry('Interaction', 'Regression', 'An effect of X that depends on the level of another variable.', 'The study-hours slope is steeper for students who also slept 8 hours.'),
  entry('Prediction Interval', 'Regression', 'An interval for a new Y. It is wider than a confidence interval for the mean of Y.', 'A CI for average score at 5 hours is narrower than a PI for one new student who studied 5 hours.'),
  entry('Leverage', 'Regression', 'How far an x-value sits from the center of the predictors. High leverage can tilt the line.', 'One person with 40 hours of study when everyone else has 2–8 hours.'),
  entry('Influential Point', 'Regression', 'A point that changes the fitted model a lot if it is removed. High leverage plus a large residual is a warning.', 'Cook’s distance flags points that move coefficients.'),
  entry('Root Mean Squared Error', 'Regression', '√(mean of squared residuals). Same units as Y. It is not R².', 'RMSE = 4.2 points means typical prediction misses are a few points.', ['RMSE']),
  entry('Mean Absolute Error', 'Regression', 'Average of |residual|. Easier to interpret than RMSE, less sensitive to huge misses.', 'MAE = 3 points: the typical absolute miss is 3 points.', ['MAE']),
  entry('Polynomial Regression', 'Regression', 'A linear model that includes powers of X, such as X², to fit a curve.', 'Yield ≈ β0 + β1 temp + β2 temp².'),
  entry('Multiple Regression', 'Regression', 'A linear model with more than one predictor.', 'Score ≈ β0 + β1 hours + β2 sleep + β3 coffee.'),
  entry('Collinearity', 'Regression', 'A near-linear relationship among predictors. Variance inflation factors diagnose it.', 'VIF above 10 is a common warning that coefficients are hard to interpret.'),

  entry('ANOVA', 'ANOVA', 'Analysis of variance: split total variation into pieces explained by groups or factors, then compare them with F.', 'Do three teaching methods produce different mean scores?'),
  entry('One-Way ANOVA', 'ANOVA', 'ANOVA with a single factor. H0 says all group means are equal.', 'Comparing mean yield across 4 fertilizer types.'),
  entry('Two-Way ANOVA', 'ANOVA', 'ANOVA with two factors, and usually their interaction.', 'Method and class size together, plus whether method works differently in large classes.'),
  entry('Factor', 'ANOVA', 'A categorical explanatory variable in an experiment or ANOVA model.', 'Dose: low, medium, high.'),
  entry('Interaction Effect', 'ANOVA', 'A combined effect that is not just the sum of the main effects.', 'A drug helps men more than women, even after averaging each factor alone.'),
  entry('Sum of Squares', 'ANOVA', 'A chunk of total squared deviation, such as SSA or SSE. ANOVA tables are built from these.', 'SST = SSA + SSE in one-way ANOVA.'),
  entry('Mean Square', 'ANOVA', 'A sum of squares divided by its degrees of freedom. The F ratio is MSA / MSE.', 'If MSA = 40 and MSE = 10, F = 4.'),
  entry('Post-hoc Test', 'ANOVA', 'A follow-up comparison after ANOVA rejects H0, with some control of extra false positives.', 'Tukey pairwise intervals after a significant one-way ANOVA.'),
  entry("Tukey's HSD", 'ANOVA', 'A pairwise comparison method using the studentized range. Do not label a Bonferroni or Holm procedure as Tukey.', 'After 4 groups, Tukey intervals show which pairs differ.'),
  entry('Repeated Measures ANOVA', 'ANOVA', 'ANOVA for the same units measured under several conditions. The subject is the blocking factor.', 'Each person is tested at 8 a.m., noon, and 8 p.m.'),
  entry('Eta Squared', 'ANOVA', 'SSA / SST, an effect-size measure for how much variance a factor explains.', 'η² = 0.12 means the factor accounts for 12% of the total variation.'),

  entry('Prior', 'Bayesian', 'A probability distribution for a parameter before seeing the current data.', 'Beta(2, 2) as a gentle prior that a coin is near fair.'),
  entry('Likelihood', 'Bayesian', 'How well a parameter value explains the observed data. It is not a probability distribution over the parameter by itself.', 'For 7 heads in 10 flips, values of p near 0.7 have higher likelihood.'),
  entry('Posterior', 'Bayesian', 'The updated distribution of the parameter after combining prior and likelihood.', 'Beta(2, 2) plus 7 heads and 3 tails becomes Beta(9, 5).'),
  entry('Bayes Factor', 'Bayesian', 'The relative support the data give to one model versus another. It is not a p-value.', 'BF10 = 8 means the data are 8 times more likely under H1 than under H0.'),
  entry('Credible Interval', 'Bayesian', 'An interval from the posterior. A 95% credible interval contains 95% of the posterior probability.', 'After seeing the data, P(0.42 < p < 0.71 | data) = 0.95 for that interval.'),
  entry('Conjugate Prior', 'Bayesian', 'A prior family that stays in the same family after updating.', 'Beta prior with binomial data stays Beta. Gamma prior with Poisson data stays Gamma in the shape–rate form.'),
  entry('MAP Estimate', 'Bayesian', 'The parameter value that maximizes the posterior. It is a Bayesian mode, not the same as the posterior mean.', 'For a peaked posterior, MAP, mean, and median nearly agree.'),
  entry('MCMC', 'Bayesian', 'Markov chain Monte Carlo: simulate draws from a posterior when the math has no closed form.', 'Metropolis–Hastings walks through parameter space and keeps plausible draws.'),
  entry('Posterior Predictive', 'Bayesian', 'The distribution of a new observation after integrating over posterior uncertainty in the parameter.', 'Draw θ from the posterior, then draw x_new | θ. Repeat to get the predictive cloud.'),
  entry('Hyperparameter', 'Bayesian', 'A number that shapes the prior, not the data model itself.', 'α and β in a Beta(α, β) prior for a proportion.'),
  entry('Informative Prior', 'Bayesian', 'A prior that puts real weight on some parameter values from earlier knowledge.', 'A vaccine trial that starts with a prior centered on last year’s efficacy.'),
  entry('Noninformative Prior', 'Bayesian', 'A prior meant to let the data dominate, such as a very flat Beta(1, 1). “Noninformative” is still a choice.', 'Uniform(0, 1) for an unknown proportion.'),
  entry('Likelihood Principle', 'Bayesian', 'The idea that two experiments with proportional likelihoods should give the same inference for the parameter.', 'Stopping a coin-flip study at 10 heads versus at 20 flips can change a p-value but not the likelihood for p.'),

  entry('Time Series', 'Time Series', 'Data recorded in time order. The order is information; shuffling the same numbers hides the story.', 'Monthly airline passengers from 1949 to 1960.'),
  entry('Trend', 'Time Series', 'The slow, long-run direction of a series, not the month-to-month wiggles.', 'A steadily rising passenger series under seasonal ups and downs.'),
  entry('Seasonality', 'Time Series', 'A repeating pattern at a fixed period, such as 12 months.', 'Retail sales that jump every December.'),
  entry('Stationarity', 'Time Series', 'Mean and variance (and lag dependence) stay put over time. Many ARMA models assume it.', 'First-differencing a random walk often produces a more stationary series.'),
  entry('Autocorrelation', 'Time Series', 'Correlation of a series with a lagged copy of itself.', 'Monthly passengers often have a large autocorrelation at lag 12.'),
  entry('ACF', 'Time Series', 'The autocorrelation function: sample correlation at lags 0, 1, 2, …. Lag 0 is 1 when variance is positive.', 'An MA(1) process typically has ACF that cuts off after lag 1.'),
  entry('PACF', 'Time Series', 'Partial autocorrelation: extra correlation at lag k after shorter lags are removed.', 'An AR(1) process typically has PACF that cuts off after lag 1.'),
  entry('White Noise', 'Time Series', 'Uncorrelated, mean-zero shocks with constant variance. Unpredictable at every step.', 'εt ~ N(0, σ²) independent over time.'),
  entry('Random Walk', 'Time Series', 'A running sum of shocks: Yt = Yt−1 + εt. Variance grows and shocks last forever.', 'A no-drift random walk wanders and is not stationary.'),
  entry('ARIMA', 'Time Series', 'A model with autoregressive terms, differencing, and moving-average errors: ARIMA(p, d, q).', 'ARIMA(1, 1, 1) differences once, then uses one AR and one MA term.'),
  entry('Moving Average Smoother', 'Time Series', 'A local average of k neighboring points. It is not the same object as an MA(q) error model.', 'A 12-month moving average of sales highlights the trend and hides month-to-month noise.'),
  entry('Differencing', 'Time Series', 'Δyt = yt − yt−1. It removes a stochastic trend. Extra differencing can over-difference a stationary series.', 'Prices may look non-stationary; returns (differences of logs) often look closer to stationary.'),
  entry('Autoregression', 'Time Series', 'A model that uses past values of the series to explain the present: yt = c + φ yt−1 + εt for AR(1).', 'φ = 0.7 means a shock fades as 0.7, 0.49, 0.34, …'),

  entry('Sign Test', 'Nonparametric', 'A test that uses only whether each difference is positive or negative, not how large it is.', '12 of 16 patients improved. The sign test asks if 12 positives is unusual if plus and minus are equally likely.'),
  entry('Wilcoxon Signed-Rank', 'Nonparametric', 'A paired test that uses both the sign and the rank of the absolute difference.', 'Before/after blood pressure with ranks of the 18 differences.'),
  entry('Mann–Whitney U', 'Nonparametric', 'A two-group rank test. It compares whether one group tends to have larger values, not necessarily a mean shift.', 'Pain scores of 20 treated versus 20 control patients.'),
  entry('Kruskal–Wallis', 'Nonparametric', 'A rank-based analog of one-way ANOVA for three or more groups.', 'Comparing ranks of reaction times across three devices.'),
  entry('Permutation Test', 'Nonparametric', 'Shuffle labels (or signs) to build the null distribution from the data themselves.', 'Swap group labels 5,000 times and see how rare the observed mean difference is.'),
  entry('Rank', 'Nonparametric', 'The position of a value in the ordered list. Ties share average ranks.', 'In 3, 5, 5, 9 the ranks are 1, 2.5, 2.5, 4.'),
  entry('Distribution-Free Method', 'Nonparametric', 'A procedure whose Type I error does not require a normal (or other named) shape, though it still has assumptions.', 'A permutation test of a mean difference does not need normality of the raw scores.'),
  entry('Robust Statistic', 'Nonparametric', 'A statistic that is not ruined by a few extreme values.', 'The median and IQR are more robust than the mean and SD.'),

  entry('Kaplan–Meier Estimator', 'Survival', 'A step-function estimate of the survival curve that accounts for censoring.', 'After 12 months, Ŝ(12) = 0.72 means an estimated 72% have not had the event yet.'),
  entry('Hazard Rate', 'Survival', 'The instantaneous event rate among those still at risk.', 'A high hazard in the first week after surgery means early risk is concentrated there.'),
  entry('Censoring', 'Survival', 'The event has not been observed by the end of follow-up. You know the person lasted at least that long.', 'A patient still alive at study close is right-censored.'),
  entry('Right Censoring', 'Survival', 'Follow-up ends before the event. Most common form of censoring in clinical studies.', 'Lost to follow-up at month 8, with no event recorded.'),
  entry('Log-Rank Test', 'Survival', 'A test comparing survival curves of two or more groups.', 'Does treatment A delay relapse compared with treatment B?'),
  entry('Median Survival', 'Survival', 'The time at which the estimated survival curve crosses 0.5.', 'If Ŝ(18) first drops to 0.5 at 18 months, median survival is 18 months.'),

  entry('Randomized Experiment', 'Design', 'Units are assigned to treatments by a random mechanism. This supports causal claims more strongly than an observational study.', 'A coin flip decides who gets the new app versus the old app.'),
  entry('Observational Study', 'Design', 'You record what happened without assigning treatments. Confounding is the main threat.', 'Comparing people who chose to drink coffee with those who did not.'),
  entry('Confounding', 'Design', 'A third variable associated with both the exposure and the outcome, mixing up the comparison.', 'Age confounds coffee and heart disease if older people drink more coffee and have more disease.'),
  entry('Blocking', 'Design', 'Grouping similar units and randomizing inside blocks to reduce noise.', 'Pair students by last year’s score, then randomize methods inside each pair.'),
  entry('Placebo', 'Design', 'An inactive treatment that looks like the real one, used to separate belief effects from treatment effects.', 'A sugar pill that matches the real pill’s size and color.'),
  entry('Blinding', 'Design', 'Keeping patients, assessors, or both unaware of the assigned treatment.', 'Double-blind: neither the patient nor the doctor knows who got the drug.'),
  entry('Control Group', 'Design', 'The group that does not receive the new treatment, used as a comparison.', 'Standard care versus the new protocol.'),
  entry('Treatment Group', 'Design', 'The group that receives the intervention being studied.', 'Patients assigned to the new drug.'),
  entry('Replication', 'Design', 'Repeating the treatment on more than one unit so you can estimate error.', '20 plants per fertilizer, not one plant per fertilizer.'),
  entry('Factorial Design', 'Design', 'An experiment that crosses two or more factors so you can see main effects and interactions.', 'Drug (yes/no) × dose (low/high) in all four combinations.'),
  entry('Random Assignment', 'Design', 'Using chance to put units into treatments. It is not the same as random sampling from a population.', 'You can randomly assign 40 volunteers without them being a random sample of the country.'),

  entry('Control Chart', 'Quality', 'A time plot with limits used to see whether a process is stable or has special-cause signals.', 'An X-bar chart flags a point beyond 3 SE of the process mean.'),
  entry('Process Capability', 'Quality', 'How the process spread compares with specification limits, using indexes such as Cp and Cpk.', 'Cpk < 1 means the process does not comfortably fit inside the specs.'),
  entry('Specification Limits', 'Quality', 'The customer or engineering limits LSL and USL. They are not the same as control limits.', 'A shaft diameter must stay between 9.98 and 10.02 mm.'),
  entry('Control Limits', 'Quality', 'Limits computed from the process itself, often mean ± 3 SE. Crossing them suggests the process changed.', 'A stable filling machine stays inside its own control limits even if specs are wider.'),
  entry('Special Cause', 'Quality', 'A signal that something unusual happened, not just common-cause noise.', 'A sudden spike after a new batch of raw material arrives.'),
  entry('Common Cause', 'Quality', 'The everyday variation a stable process already has.', 'Small fill-weight wiggles that stay inside the control limits.'),
  entry('Acceptance Sampling', 'Quality', 'Inspecting a sample from a lot to decide whether to accept or reject the whole lot.', 'Accept the lot if 2 or fewer defectives appear in 80 items.'),

  entry('Training Set', 'Machine Learning', 'The data used to fit a model. Performance here is usually too optimistic.', 'Fit a classifier on 70% of the emails.'),
  entry('Test Set', 'Machine Learning', 'Data held out to estimate performance on new cases. Do not tune on it.', 'The remaining 30% of emails used once at the end.'),
  entry('Cross-Validation', 'Machine Learning', 'Rotate which fold is held out so every case is predicted once out of sample.', '5-fold CV fits five times, each time testing on a different fifth of the data.'),
  entry('Overfitting', 'Machine Learning', 'Fitting noise as if it were signal. Training error looks great; new data look worse.', 'A tree that memorizes 200 quirks of the training file and fails on next month’s file.'),
  entry('Underfitting', 'Machine Learning', 'A model too simple to capture the pattern that is actually there.', 'A straight line through a clearly curved dose–response.'),
  entry('Confusion Matrix', 'Machine Learning', 'A table of predicted versus actual classes: true positives, false positives, and the rest.', '90 true positives, 10 false negatives, 5 false positives, 95 true negatives.'),
  entry('Precision (classification)', 'Machine Learning', 'Among cases called positive, the fraction that truly are positive: TP / (TP + FP).', 'If 8 of 10 spam flags are really spam, precision is 0.80.'),
  entry('Recall', 'Machine Learning', 'Among true positives, the fraction you found: TP / (TP + FN). Also called sensitivity.', 'Finding 90 of 100 fraud cases is recall 0.90.'),
  entry('F1 Score', 'Machine Learning', 'The harmonic mean of precision and recall. It is low if either one is low.', 'Precision 1.0 and recall 0.1 give a poor F1, not a “pretty good” score.'),
  entry('ROC Curve', 'Machine Learning', 'A plot of true-positive rate versus false-positive rate as the threshold moves.', 'AUC 0.5 is chance; AUC 1.0 is a perfect ranking.'),
  entry('Principal Component Analysis', 'Machine Learning', 'A rotation that finds uncorrelated directions of largest variance. It is not a causal model.', 'The first PC of test scores may look like a general “ability” direction.', ['PCA']),
  entry('Loading', 'Machine Learning', 'How much a variable contributes to a principal component.', 'Math and physics both load heavily on PC1.'),
  entry('Explained Variance', 'Machine Learning', 'The share of total variance a component (or model) accounts for.', 'PC1 explains 61% of the variance in four test scores.'),
  entry('Regularization', 'Machine Learning', 'A penalty that shrinks coefficients to reduce overfitting, as in ridge or lasso.', 'Lasso can set some coefficients exactly to 0, which is a form of variable selection.'),
  entry('Bias-Variance Tradeoff', 'Machine Learning', 'More flexible models cut bias but can raise variance. MSE is the sum of both plus irreducible noise.', 'A tiny k in KNN has low bias and high variance.'),
]

export const GLOSSARY_CATEGORIES: GlossaryCategory[] = [
  'Descriptive',
  'Probability',
  'Random Variables',
  'Distributions',
  'Sampling',
  'Estimation',
  'Hypothesis Testing',
  'Association',
  'Regression',
  'ANOVA',
  'Bayesian',
  'Time Series',
  'Nonparametric',
  'Survival',
  'Design',
  'Quality',
  'Machine Learning',
]

export const GLOSSARY_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function glossaryPath(slug?: string): string {
  return slug ? `/glossary#${slug}` : '/glossary'
}

export function findGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return GLOSSARY_TERMS.find((item) => item.slug === slug)
}

export function searchGlossary(query: string, category?: GlossaryCategory | 'All'): GlossaryTerm[] {
  const needle = query.trim().toLowerCase()
  return GLOSSARY_TERMS.filter((item) => {
    if (category && category !== 'All' && item.category !== category) return false
    if (!needle) return true
    const hay = [item.term, item.definition, item.example, ...(item.alsoCalled ?? [])].join(' ').toLowerCase()
    return hay.includes(needle)
  })
}
