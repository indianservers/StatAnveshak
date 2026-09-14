import type { AnalysisOptions, AnalysisResult } from '../../types'
import { buildDesign } from './design'
import { pTailChi, pTailF, pTailT, qnorm, qt } from './dists'
import { glmCov } from './glm'
import { inverse, lm, multiply, multiplyVec, transpose } from './linalg'
import { asFiniteNumber, round } from './numeric'

function empty(message: string): AnalysisResult {
  return { analysisId: 'regression.linear', title: 'Linear Regression', interpretation: message, assumptions: [], footnotes: [], tables: [], plots: [] }
}

export function runLinearRegression(rows: Record<string, unknown>[], options: AnalysisOptions): AnalysisResult {
  const dependent = String(options.dependent ?? '')
  const covariates = Array.isArray(options.covariates) ? options.covariates.map(String) : []
  const factors = Array.isArray(options.factors) ? options.factors.map(String) : []
  const interact = Boolean(options.interact)
  const ci = Number(options.ciLevel ?? 0.95)
  if (!dependent) return empty('Assign a numeric dependent variable.')
  if (!covariates.length && !factors.length) return empty('Assign at least one covariate or factor.')

  const design = buildDesign(rows, covariates, factors, interact)
  const y = design.keep.map((row) => asFiniteNumber(row[dependent]))
  if (y.some((v) => v === null)) return empty('Dependent variable must be numeric on the same complete cases as the predictors.')
  const yy = y as number[]
  if (yy.length < design.X[0].length + 2) return empty('Not enough complete cases for this design.')
  const fit = lm(yy, design.X)
  if (!fit) return empty('Design matrix is rank-deficient. Drop collinear predictors.')
  const n = yy.length
  const p = design.names.length
  const mse = fit.sse / fit.dfResidual
  const ybar = yy.reduce((s, yi) => s + yi, 0) / n
  const sst = yy.reduce((s, yi) => s + (yi - ybar) ** 2, 0)
  const r2 = 1 - fit.sse / sst
  const adjR2 = 1 - (1 - r2) * (n - 1) / fit.dfResidual
  const f = ((sst - fit.sse) / Math.max(1, p - 1)) / mse
  const cov = glmCov(design.X, fit.fitted, 'gaussian', mse, 1)
  if (!cov) return empty('Could not invert the information matrix.')
  const se = cov.map((row, i) => Math.sqrt(Math.max(row[i], 0)))
  const crit = qt(1 - (1 - ci) / 2, fit.dfResidual)
  const resid = yy.map((yi, i) => yi - fit.fitted[i])
  const ll = -n / 2 * Math.log(2 * Math.PI * mse) - fit.sse / (2 * mse)
  const aic = -2 * ll + 2 * (p + 1)
  const bic = -2 * ll + Math.log(n) * (p + 1)

  const xtxInv = inverse(multiply(transpose(design.X), design.X))
  const hat = xtxInv
    ? design.X.map((row) => {
      const v = multiplyVec(xtxInv, row)
      return row.reduce((s, x, j) => s + x * v[j], 0)
    })
    : resid.map(() => p / n)
  const cooks = resid.map((e, i) => {
    const h = Math.min(0.999, hat[i])
    return (e * e / (p * mse)) * (h / (1 - h) ** 2)
  })
  const stdRes = resid.map((e, i) => e / Math.sqrt(mse * Math.max(1e-8, 1 - hat[i])))

  const vifRows: Array<Array<string | number>> = []
  for (let j = 1; j < p; j++) {
    const yj = design.X.map((row) => row[j])
    const Xj = design.X.map((row) => row.filter((_, k) => k !== j))
    const aux = lm(yj, Xj)
    const mj = yj.reduce((s, v) => s + v, 0) / n
    const sstj = yj.reduce((s, v) => s + (v - mj) ** 2, 0)
    const r2j = aux && sstj > 0 ? 1 - aux.sse / sstj : 0
    vifRows.push([design.names[j], round(r2j >= 0.999999 ? Number.POSITIVE_INFINITY : 1 / (1 - r2j))])
  }

  let dw = Number.NaN
  if (resid.length > 2) {
    let num = 0
    for (let i = 1; i < resid.length; i++) num += (resid[i] - resid[i - 1]) ** 2
    dw = num / resid.reduce((s, e) => s + e * e, 0)
  }

  const e2 = resid.map((e) => e * e)
  const bp = lm(e2, design.X)
  const me2 = e2.reduce((s, v) => s + v, 0) / n
  const sstE = e2.reduce((s, v) => s + (v - me2) ** 2, 0)
  const bpR2 = bp && sstE > 0 ? 1 - bp.sse / sstE : 0
  const bpStat = n * bpR2
  const bpP = pTailChi(bpStat, Math.max(1, p - 1))

  const Xreset = design.X.map((row, i) => [...row, fit.fitted[i] ** 2])
  const reset = lm(yy, Xreset)
  const resetF = reset ? ((fit.sse - reset.sse) / 1) / (reset.sse / reset.dfResidual) : Number.NaN
  const resetP = Number.isFinite(resetF) && reset ? pTailF(resetF, 1, reset.dfResidual) : Number.NaN

  const sortedStd = [...stdRes].sort((a, b) => a - b)
  const qqTheor = sortedStd.map((_, i) => qnorm((i + 0.5) / n))

  return {
    analysisId: 'regression.linear',
    title: 'Linear Regression',
    interpretation: `${dependent} ~ predictors, n = ${n}. R² = ${round(r2)}, adjusted R² = ${round(adjR2)}, F(${p - 1}, ${fit.dfResidual}) = ${round(f)}, p = ${round(pTailF(f, p - 1, fit.dfResidual))}.`,
    assumptions: [
      `Breusch–Pagan χ²(${p - 1}) = ${round(bpStat)}, p = ${round(bpP)} (heteroscedasticity).`,
      `Durbin–Watson = ${round(dw)} (values near 2 suggest uncorrelated residuals in row order).`,
      `RESET F = ${round(resetF)}, p = ${round(resetP)} (functional form).`,
    ],
    footnotes: [
      'Coefficient tests are t with residual df. Covariances use σ² (X′X)⁻¹.',
      'VIF is 1/(1−R²) from each predictor on the rest. Intercept is omitted.',
      'Bayesian linear regression arrives in Phase 4.',
    ],
    tables: [
      {
        id: 'model',
        title: 'Model fit',
        columns: ['n', 'R²', 'Adj. R²', 'σ', 'AIC', 'BIC', 'F', 'p'],
        rows: [[n, round(r2), round(adjR2), round(Math.sqrt(mse)), round(aic), round(bic), round(f), round(pTailF(f, p - 1, fit.dfResidual))]],
      },
      {
        id: 'coef',
        title: 'Coefficients',
        columns: ['Term', 'Estimate', 'SE', 't', 'p', 'CI low', 'CI high'],
        rows: fit.beta.map((b, i) => {
          const t = se[i] === 0 ? Number.NaN : b / se[i]
          return [design.names[i], round(b), round(se[i]), round(t), round(pTailT(t, fit.dfResidual, 'two-sided')), round(b - crit * se[i]), round(b + crit * se[i])]
        }),
      },
      { id: 'vif', title: 'Variance inflation', columns: ['Term', 'VIF'], rows: vifRows },
      {
        id: 'influence',
        title: 'High-influence cases (top Cook’s D)',
        columns: ['Row', 'Residual', 'Leverage', 'Cook’s D'],
        rows: cooks.map((d, i) => ({ d, i })).sort((a, b) => b.d - a.d).slice(0, 8).map(({ d, i }) => [i + 1, round(resid[i]), round(hat[i]), round(d)]),
      },
    ],
    plots: [
      {
        id: 'fit',
        title: 'Observed vs fitted',
        data: [{ type: 'scatter', mode: 'markers', x: fit.fitted, y: yy, name: 'cases' }],
        layout: { xaxis: { title: 'Fitted' }, yaxis: { title: dependent }, margin: { t: 40, r: 20, b: 48, l: 56 } },
      },
      {
        id: 'resid',
        title: 'Residuals vs fitted',
        data: [{ type: 'scatter', mode: 'markers', x: fit.fitted, y: resid }],
        layout: { xaxis: { title: 'Fitted' }, yaxis: { title: 'Residual' }, margin: { t: 40, r: 20, b: 48, l: 56 } },
      },
      {
        id: 'qq',
        title: 'Normal QQ of standardized residuals',
        data: [{ type: 'scatter', mode: 'markers', x: qqTheor, y: sortedStd }],
        layout: { xaxis: { title: 'Theoretical quantile' }, yaxis: { title: 'Observed' }, margin: { t: 40, r: 20, b: 48, l: 56 } },
      },
      {
        id: 'scale',
        title: 'Scale–location',
        data: [{ type: 'scatter', mode: 'markers', x: fit.fitted, y: stdRes.map((e) => Math.sqrt(Math.abs(e))) }],
        layout: { xaxis: { title: 'Fitted' }, yaxis: { title: '√|std. residual|' }, margin: { t: 40, r: 20, b: 48, l: 56 } },
      },
    ],
  }
}
