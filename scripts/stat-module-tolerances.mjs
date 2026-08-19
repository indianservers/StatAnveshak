export const referenceTolerances = {
  exact: 0,
  strict: 1e-6,
  standard: 1e-4,
  approximate: 5e-3,
  simulation: 1e-2,
}

export const toleranceByMethod = {
  regression: referenceTolerances.standard,
  correlation: referenceTolerances.standard,
  anova: referenceTolerances.approximate,
  chiSquare: referenceTolerances.approximate,
  tTest: referenceTolerances.approximate,
  pca: referenceTolerances.strict,
  classification: referenceTolerances.exact,
  bootstrap: referenceTolerances.strict,
  permutation: referenceTolerances.strict,
  gof: referenceTolerances.approximate,
  logistic: referenceTolerances.simulation,
}
