# Distribution-Specific Enhancements

Implemented on `src/pages/DistributionsPage.tsx` as the `DistributionDepthPanel`.

| Distribution | Five implemented depth enhancements |
|---|---|
| Bernoulli | Success/failure balance; rare-event warning; binary-data fit cue; Binomial bridge; multi-class misuse guard |
| Binomial | Fixed-n trial simulator; normal-approximation readiness; exact probability area; p-from-counts fit cue; varying-trials misuse guard |
| Geometric | First-success waiting lab; memoryless cue; retry-tail risk; attempt-count fit cue; multiple-success misuse guard |
| Negative Binomial | Overdispersion variance lab; stopping-rule cue; Poisson contrast; non-negative count fit cue; duration misuse guard |
| Hypergeometric | Without-replacement population lab; finite-population sampling fraction; inspection/audit use cue; Binomial replacement contrast; known-population misuse guard |
| Poisson | Event-rate timeline; mean-variance equidispersion check; capacity tail-risk question; interval-count fit cue; dependence/seasonality misuse guard |
| Discrete Uniform | Equal integer mass fairness lab; closed integer support check; min/max fit cue; flat-count diagnostic; continuous-data misuse guard |
| Continuous Uniform | Rectangle area probability lab; linear CDF quantile cue; endpoint fit cue; flat-density diagnostic; hard-bound misuse guard |
| Normal | Sigma-band guide; loaded-data histogram overlay; z-style probability question; mean/SD fit cue; skew/outlier misuse guard |
| Standard Normal | Fixed z-reference curve; inverse critical-value lab; symmetric tail cue; standardization fit cue; raw-units misuse guard |
| Lognormal | Multiplicative median cue; right-skewed mean/tail lab; positive-log fit cue; log-normality diagnostic; zero-value misuse guard |
| Exponential | Constant-hazard lab; Poisson gap link; survival reliability cue; positive-duration fit cue; aging-effect misuse guard |
| Gamma | Accumulated-waiting shape lab; scale spread cue; positive-skew fit cue; Exponential special-case bridge; negative-value misuse guard |
| Beta | Bounded proportion lab; shape-family cue; Beta-Binomial/Bayes bridge; fractional-data fit cue; percentage-scaling misuse guard |
| Chi-Square | Degrees-of-freedom squared-z lab; GOF/variance inference use; right-tail decision cue; positive-skew fit cue; raw-count misuse guard |
| Student's t | Low-df heavy-tail lab; Normal convergence cue; critical-value lab; symmetric-noisy-data fit cue; skewed-data misuse guard |
| F | Variance-ratio lab; ANOVA/model-comparison bridge; right-tail decision cue; test-statistic fit cue; negative-value misuse guard |
| Weibull | Failure-rate shape lab; survival/hazard mini-chart cue; lifetime-data fit cue; Exponential bridge; event-time misuse guard |
| Pareto | Extreme-concentration tail lab; power-law survival view; threshold/exceedance fit cue; finite-moment guard; whole-body misuse guard |
| Cauchy | Undefined-mean instability lab; Normal contrast; robust-summary cue; median/IQR fit cue; mean/variance reporting misuse guard |
| Logistic | S-shaped CDF lab; Normal contrast; logit-link bridge; symmetric-data fit cue; binary-response misuse guard |
| Multinomial | Probability-vector composition lab; competing-count covariance cue; Binomial marginal bridge; category-count fit cue; probability-sum misuse guard |
| Dirichlet | Simplex probability-vector lab; concentration cue; Multinomial-prior bridge; composition-data fit cue; single-proportion misuse guard |
| Empirical | Data-first distribution lab; sample percentile cue; box/rug outlier view; candidate-curve fit bridge; tail-extrapolation misuse guard |
