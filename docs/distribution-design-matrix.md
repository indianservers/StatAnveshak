# Distribution Studio Design Matrix

| Distribution | Existing route | Parameters | Main visualization | Secondary visualization | Unique interaction | Suitable real data | Fitting diagnostics |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Bernoulli | `/distributions/bernoulli` | p | Success/failure outcome blocks | Running success proportion strip | Probability balance slider | Loan approval, churn, pass/fail | Observed success/failure proportions |
| Binomial | `/distributions/binomial` | n, p | Discrete success-count PMF bars | Trial grid and cumulative view | Integer interval selector | Campaign conversions, repeated outcomes | Observed vs expected count bars |
| Geometric | `/distributions/geometric` | p | Descending first-success bars | Failure-to-success sequence | First-success trial selector | Attempts until first response | Observed waiting-count fit |
| Negative Binomial | `/distributions/negative_binomial` | r, p | Failure-count PMF bars | Stop-at-r-successes strip | Overdispersion comparison | Incident/claim counts | Mean/variance and residual bars |
| Hypergeometric | `/distributions/hypergeometric` | N, K, n | Discrete PMF bars | Population container/draw panel | Draw without replacement | Quality inspection, audit samples | Finite-sample observed vs expected |
| Poisson | `/distributions/poisson` | lambda | Event-count PMF bars | Arrival timeline | Observation-rate slider | Calls, defects, accidents | Count-frequency residuals |
| Discrete Uniform | `/distributions/discrete_uniform` | a, b | Equal-height integer bars | Fair spinner/die strip | Integer bound controls | Equally likely integers | Uniformity residual bars |
| Continuous Uniform | `/distributions/continuous_uniform` | a, b | Flat rectangular PDF | Piecewise CDF | Draggable interval area controls | Bounded continuous measurements | Bounded histogram and ECDF |
| Normal | `/distributions/normal` | mu, sigma | Large bell curve with shaded probability | 68-95-99.7 and z ruler | Tail/between/inverse composer | Scores, heights, measurement errors | Histogram, fitted curve, Q-Q, warnings |
| Standard Normal | `/distributions/standard_normal` | fixed | Fixed z bell curve | Z-table/critical-value panel | Raw-to-z converter | Standardized scores | Z-scale compatibility checks |
| Lognormal | `/distributions/lognormal` | mu, sigma | Right-skewed positive density | Log-scale normal view | Original/log scale toggle | Income, transaction values | Original/log histogram and Q-Q |
| Exponential | `/distributions/exponential` | lambda | Decay density | Survival and waiting timeline | Memoryless demo | Waiting/service times | Survival and hazard diagnostics |
| Gamma | `/distributions/gamma` | shape, scale | Positive skewed density | Sum-of-exponentials panel | Shape transformation | Duration, rainfall, severity | Positive histogram, fitted curve, Q-Q |
| Beta | `/distributions/beta` | alpha, beta | Bounded 0-1 density | Bayesian proportion update | Probability gauge | Rates, proportions, satisfaction | Bounded histogram and Beta fit |
| Chi-Square | `/distributions/chi_square` | df | Right-skewed density | Sum of squared z variables | Critical-region marker | GOF, independence, variance tests | Test statistic and tail diagnostics |
| Student's t | `/distributions/student_t` | df | t vs Normal overlay | Confidence interval visualizer | Tail critical selector | Mean inference samples | CI and heavy-tail diagnostics |
| F | `/distributions/f` | df1, df2 | Positive F density | Variance-ratio panel | Right-tail critical marker | ANOVA, variance comparison | Ratio and tail diagnostics |
| Weibull | `/distributions/weibull` | scale, shape | Weibull density | Survival, hazard, failure dashboard | Failure-rate interpretation | Lifetime/failure time | Reliability charts |
| Pareto | `/distributions/pareto` | xm, alpha | Heavy-tail density | Survival/log-log/share charts | Tail-threshold selector | Wealth, losses, demand | Tail and concentration diagnostics |
| Cauchy | `/distributions/cauchy` | x0, gamma | Cauchy vs Normal overlay | Running mean instability | Extreme observation demo | Heavy-tailed errors | Tail warnings; no mean/variance claims |
| Logistic | `/distributions/logistic` | mu, s | Logistic density vs Normal | S-curve CDF | Quantile/tail comparison | Growth/logistic error | Density/CDF fit diagnostics |
| Multinomial | `/distributions/multinomial` | n, p1, p2 | Category probability bars | Composition chart | Category draw simulator | Survey/product/election categories | Observed vs expected composition |
| Dirichlet | `/distributions/dirichlet` | a1, a2, a3 | Ternary simplex | Marginal Beta strips | Movable probability vector | Composition/proportion vectors | Simplex samples and concentration |
| Empirical | `/distributions/empirical` | data-driven | Histogram | ECDF, box, rug, KDE dashboard | Dataset/column/bin controls | Any numeric column | Genuine sample statistics and empirical charts |
