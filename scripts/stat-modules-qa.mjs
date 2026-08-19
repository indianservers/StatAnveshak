import { createServer } from 'vite'
import { referenceTolerances as tolerance, toleranceByMethod } from './stat-module-tolerances.mjs'
import { mkdirSync, writeFileSync } from 'node:fs'

const tests = []

function test(name, fn) {
  tests.push({ name, fn })
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function near(actual, expected, tol = tolerance.standard) {
  assert(Number.isFinite(actual), `Expected finite value near ${expected}, got ${actual}`)
  assert(Math.abs(actual - expected) <= tol, `Expected ${actual} to be within ${tol} of ${expected}`)
}

function metric(result, label) {
  const found = result.metrics.find((item) => item.label === label)
  assert(found, `Missing metric "${label}" in ${result.title}`)
  return Number(found.value)
}

function metricText(result, label) {
  const found = result.metrics.find((item) => item.label === label)
  assert(found, `Missing metric "${label}" in ${result.title}`)
  return String(found.value)
}

function interval(result, label) {
  const text = metricText(result, label)
  const match = text.match(/\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]/)
  assert(match, `Metric "${label}" is not interval-shaped: ${text}`)
  return [Number(match[1]), Number(match[2])]
}

function hasWarning(result, pattern) {
  return (result.notes ?? []).some((note) => pattern.test(note))
}

function assertNoNonFiniteNumericMetrics(result) {
  for (const item of result.metrics ?? []) {
    assert(typeof item.value !== 'number' || Number.isFinite(item.value), `${result.title} returned non-finite metric ${item.label}=${item.value}`)
  }
}

function tableRow(result, predicate, label) {
  const found = (result.table ?? []).find(predicate)
  assert(found, `Missing table row for ${label} in ${result.title}`)
  return found
}

function finiteTableNumbers(result) {
  for (const row of result.table ?? []) {
    for (const [key, value] of Object.entries(row)) {
      assert(typeof value !== 'number' || Number.isFinite(value), `${result.title} returned non-finite table value ${key}=${value}`)
    }
  }
}

const server = await createServer({
  configFile: false,
  root: process.cwd(),
  logLevel: 'silent',
  server: { middlewareMode: true },
})

try {
  const { runStatModule, STAT_MODULES } = await server.ssrLoadModule('/src/lib/statModules.ts')

  const regressionData = [
    { x: 1, y: 2, group: 'A', target: 0 },
    { x: 2, y: 4, group: 'A', target: 0 },
    { x: 3, y: 5, group: 'B', target: 1 },
    { x: 4, y: 4, group: 'B', target: 1 },
    { x: 5, y: 5, group: 'B', target: 1 },
  ]

  const anovaData = [
    ...[4, 5, 6].map((score) => ({ group: 'A', score })),
    ...[7, 8, 9].map((score) => ({ group: 'B', score })),
    ...[5, 6, 7].map((score) => ({ group: 'C', score })),
  ]

  const chiData = [
    ...Array.from({ length: 10 }, () => ({ a: 'R1', b: 'C1' })),
    ...Array.from({ length: 20 }, () => ({ a: 'R1', b: 'C2' })),
    ...Array.from({ length: 30 }, () => ({ a: 'R2', b: 'C1' })),
    ...Array.from({ length: 40 }, () => ({ a: 'R2', b: 'C2' })),
  ]

  test('golden simple regression matches reference coefficients', () => {
    const result = runStatModule('simple_regression', regressionData, { num1: 'x', num2: 'y', alpha: 0.05 })
    near(metric(result, 'intercept'), 2.2)
    near(metric(result, 'slope'), 0.6)
    near(metric(result, 'R2'), 0.6)
  })

  test('golden correlation matches Pearson/Spearman/Kendall references', () => {
    const result = runStatModule('correlation_testing', regressionData, { num1: 'x', num2: 'y', alpha: 0.05 })
    near(metric(result, 'Pearson r'), 0.774597)
    near(metric(result, 'Spearman rho'), 0.737865)
    near(metric(result, 'Kendall tau'), 0.6)
  })

  test('golden ANOVA matches reference F, p-value, and eta squared', () => {
    const result = runStatModule('anova', anovaData, { num1: 'score', cat1: 'group', alpha: 0.05 })
    near(metric(result, 'F'), 7)
    near(metric(result, 'p-value'), 0.026192, tolerance.approximate)
    near(metric(result, 'eta squared'), 0.7)
  })

  test('golden chi-square independence matches reference statistic', () => {
    const result = runStatModule('chi_square', chiData, { cat1: 'a', cat2: 'b', alpha: 0.05 })
    near(metric(result, 'chi-square'), 0.793651)
    near(metric(result, 'df'), 1, tolerance.exact)
    near(metric(result, 'p-value'), 0.372998, tolerance.approximate)
  })

  test('golden confidence interval mean CI is stable', () => {
    const result = runStatModule('confidence_interval', regressionData, { num1: 'x', num2: 'y', alpha: 0.05 })
    const [low, high] = interval(result, 'Mean CI')
    near(low, 1.036757, tolerance.approximate)
    near(high, 4.963243, tolerance.approximate)
  })

  test('golden one-sample t-test is deterministic', () => {
    const result = runStatModule('one_sample_tests', regressionData, { num1: 'x', alpha: 0.05 })
    near(metric(result, 't test p'), 0.013236, tolerance.approximate)
  })

  test('golden two-sample Welch and paired t-tests match references', () => {
    const data = [{ a: 2, b: 1 }, { a: 4, b: 2 }, { a: 6, b: 3 }, { a: 8, b: 4 }, { a: 10, b: 5 }]
    const result = runStatModule('two_sample_tests', data, { num1: 'a', num2: 'b', alpha: 0.05 })
    near(metric(result, 'Welch t'), 1.897367)
    near(metric(result, 'Welch p'), 0.107531, tolerance.approximate)
    near(metric(result, 'Paired t p'), 0.013236, tolerance.approximate)
    assert(metricText(result, 'Two-prop z p') === 'not estimable', 'Expected saturated two-proportion test to be labelled not estimable')
  })

  test('golden PCA explains perfectly collinear two-variable data', () => {
    const data = [1, 2, 3, 4].map((x) => ({ x, y: 2 * x }))
    const result = runStatModule('pca', data, { num1: 'x', num2: 'y' })
    near(metric(result, 'PC1 explained'), 1, tolerance.strict)
    near(metric(result, 'PC2 explained'), 0, tolerance.strict)
  })

  test('golden multiple regression matches closed-form OLS reference', () => {
    const data = Array.from({ length: 8 }, (_, i) => {
      const x1 = i + 1
      const x2 = (i % 4) + 1
      const x3 = Math.floor(i / 2) + 1
      return { x1, x2, x3, y: 3 + 2 * x1 - x2 + 0.5 * x3 }
    })
    const result = runStatModule('multiple_regression', data, { target: 'y', num1: 'x1', num2: 'x2', num3: 'x3' })
    near(metric(result, 'R2'), 1, tolerance.strict)
    near(Number(tableRow(result, (row) => row.term === 'Intercept', 'intercept').estimate), 3, tolerance.standard)
    near(Number(tableRow(result, (row) => row.term === 'x1', 'x1 coefficient').estimate), 2, tolerance.standard)
    near(Number(tableRow(result, (row) => row.term === 'x2', 'x2 coefficient').estimate), -1, tolerance.standard)
    near(Number(tableRow(result, (row) => row.term === 'x3', 'x3 coefficient').estimate), 0.5, tolerance.standard)
  })

  test('golden regression diagnostics return leverage, Cook distance, and VIF', () => {
    const data = Array.from({ length: 10 }, (_, i) => {
      const x1 = i + 1
      const x2 = 10 - i
      const x3 = (i % 3) + 1
      return { x1, x2, x3, y: 2 + 0.4 * x1 - 0.2 * x2 + 0.8 * x3 + (i % 2 ? 0.1 : -0.1) }
    })
    const result = runStatModule('regression_diagnostics', data, { target: 'y', num1: 'x1', num2: 'x2', num3: 'x3' })
    assert(metric(result, 'max leverage') > 0, 'Expected positive leverage')
    assert(metric(result, 'max Cook distance') >= 0, 'Expected non-negative Cook distance')
    assert((result.table ?? []).length === 3, 'Expected three VIF rows')
    finiteTableNumbers(result)
  })

  test('golden logistic regression is deterministic on nonseparable binary data', () => {
    const data = [
      { x1: -3, x2: 0, target: 0 },
      { x1: -2, x2: 1, target: 0 },
      { x1: -1, x2: 0, target: 1 },
      { x1: 0, x2: 1, target: 0 },
      { x1: 1, x2: 0, target: 1 },
      { x1: 2, x2: 1, target: 1 },
      { x1: 3, x2: 0, target: 0 },
      { x1: 4, x2: 1, target: 1 },
    ]
    const first = runStatModule('logistic_regression', data, { target: 'target', num1: 'x1', num2: 'x2' })
    const second = runStatModule('logistic_regression', data, { target: 'target', num1: 'x1', num2: 'x2' })
    near(metric(first, 'accuracy @ .5'), 0.75, toleranceByMethod.logistic)
    finiteTableNumbers(first)
    assert(JSON.stringify(first.metrics) === JSON.stringify(second.metrics), 'Expected logistic regression metrics to repeat exactly')
  })

  test('golden goodness-of-fit ranks normal data as a tested candidate', () => {
    const data = [-2, -1, -0.5, 0, 0.5, 1, 2].map((x) => ({ x }))
    const result = runStatModule('gof_distribution', data, { num1: 'x' })
    assert(metric(result, 'tested') > 0, 'Expected at least one tested distribution')
    assert((result.table ?? []).some((row) => row.distribution === 'Normal'), 'Expected Normal in GOF comparison table')
    finiteTableNumbers(result)
  })

  test('golden classification metrics are deterministic', () => {
    const data = [
      { score: 0.1, target: 0 },
      { score: 0.4, target: 0 },
      { score: 0.6, target: 1 },
      { score: 0.8, target: 1 },
    ]
    const result = runStatModule('classification_metrics', data, { num1: 'score', target: 'target' })
    near(metric(result, 'accuracy'), 1, tolerance.exact)
    near(metric(result, 'precision'), 1, tolerance.exact)
    near(metric(result, 'recall'), 1, tolerance.exact)
    near(metric(result, 'F1'), 1, tolerance.exact)
  })

  test('golden bootstrap CI is seeded and reproducible', () => {
    const data = [1, 2, 3, 4, 5, 6].map((x) => ({ x }))
    const first = runStatModule('bootstrap_ci', data, { num1: 'x' })
    const second = runStatModule('bootstrap_ci', data, { num1: 'x' })
    near(metric(first, 'mean'), 3.5, tolerance.exact)
    near(metric(first, '2.5%'), 2.333333, tolerance.strict)
    near(metric(first, '97.5%'), 4.666667, tolerance.strict)
    assert(JSON.stringify(first.metrics) === JSON.stringify(second.metrics), 'Expected seeded bootstrap metrics to repeat exactly')
  })

  test('golden permutation test is seeded and reproducible', () => {
    const data = [1, 2, 3, 4].map((score) => ({ group: 'A', score })).concat([5, 6, 7, 8].map((score) => ({ group: 'B', score })))
    const first = runStatModule('permutation_tests', data, { num1: 'score', cat1: 'group' })
    const second = runStatModule('permutation_tests', data, { num1: 'score', cat1: 'group' })
    near(metric(first, 'p-value'), 0.045, tolerance.strict)
    near(metric(first, 'iterations'), 400, tolerance.exact)
    assert(JSON.stringify(first.metrics) === JSON.stringify(second.metrics), 'Expected seeded permutation metrics to repeat exactly')
  })

  test('edge empty data returns warnings instead of throwing', () => {
    const result = runStatModule('simple_regression', [], { num1: 'x', num2: 'y' })
    assert(hasWarning(result, /not enough valid rows/i), 'Expected not-enough-rows warning')
  })

  test('edge constant columns produce explicit warning metadata', () => {
    const data = Array.from({ length: 6 }, (_, i) => ({ x: 1, y: i + 1 }))
    const result = runStatModule('correlation_testing', data, { num1: 'x', num2: 'y' })
    assert(hasWarning(result, /constant/i), 'Expected constant-column warning')
  })

  test('edge missing values are filtered and reported', () => {
    const data = [{ x: 1, y: 2 }, { x: '', y: 3 }, { x: 3, y: null }, { x: 4, y: 5 }]
    const result = runStatModule('simple_regression', data, { num1: 'x', num2: 'y' })
    assert(hasWarning(result, /missing|filtered|valid rows/i), 'Expected missing/filtering warning')
  })

  test('edge high-cardinality categories warn for chi-square', () => {
    const data = Array.from({ length: 40 }, (_, i) => ({ idcat: `id-${i}`, group: i % 2 ? 'A' : 'B' }))
    const result = runStatModule('chi_square', data, { cat1: 'idcat', cat2: 'group' })
    assert(hasWarning(result, /high-cardinality|sparse/i), 'Expected sparse/high-cardinality warning')
  })

  test('edge tiny samples return instability warning', () => {
    const result = runStatModule('confidence_interval', [{ x: 1 }, { x: 2 }], { num1: 'x' })
    assert(hasWarning(result, /small sample/i), 'Expected tiny-sample warning')
  })

  test('edge saturated two-proportion test does not emit NaN', () => {
    const result = runStatModule('two_sample_tests', [{ a: 1, b: 1 }, { a: 2, b: 2 }, { a: 3, b: 3 }], { num1: 'a', num2: 'b' })
    assert(metricText(result, 'Two-prop z p') === 'not estimable', 'Expected saturated two-proportion p-value to be not estimable')
    assert(hasWarning(result, /not estimable|pooled binary/i), 'Expected not-estimable warning')
    assertNoNonFiniteNumericMetrics(result)
  })

  test('edge logistic perfect separation does not emit non-finite outputs and warns', () => {
    const data = [
      { x1: -3, x2: 0, target: 0 },
      { x1: -2, x2: 0, target: 0 },
      { x1: -1, x2: 1, target: 0 },
      { x1: 1, x2: 0, target: 1 },
      { x1: 2, x2: 1, target: 1 },
      { x1: 3, x2: 1, target: 1 },
    ]
    const result = runStatModule('logistic_regression', data, { target: 'target', num1: 'x1', num2: 'x2' })
    assertNoNonFiniteNumericMetrics(result)
    finiteTableNumbers(result)
    assert(hasWarning(result, /separation|unstable|numerical/i), 'Expected logistic instability warning')
  })

  test('approximate modules expose numerical warning notes', () => {
    const result = runStatModule('shapiro_wilk', regressionData, { num1: 'x' })
    assert(hasWarning(result, /approx|teaching/i), 'Expected approximation warning')
  })

  test('all stat modules avoid non-finite numeric metrics on representative data', () => {
    const data = Array.from({ length: 48 }, (_, i) => ({
      n1: i + 1,
      n2: 2 * (i + 1) + (i % 5),
      n3: Math.sin(i / 3) * 10 + 20,
      target: 3 + 0.5 * (i + 1) + 1.2 * (i % 4) + ((i % 3) - 1),
      binary: i % 3 === 0 ? 1 : 0,
      cat1: ['A', 'B', 'C'][i % 3],
      cat2: ['X', 'Y'][i % 2],
      time: i + 1,
      event: i % 4 === 0 ? 1 : 0,
    }))
    for (const module of STAT_MODULES) {
      const selection = { num1: 'n1', num2: 'n2', num3: 'n3', target: 'target', cat1: 'cat1', cat2: 'cat2', alpha: 0.05 }
      if (/classification|logistic|roc_auc/.test(module.key)) selection.target = 'binary'
      if (module.key === 'survival_analysis') {
        selection.num1 = 'time'
        selection.num2 = 'event'
      }
      assertNoNonFiniteNumericMetrics(runStatModule(module.key, data, selection))
    }
  })

  let failed = 0
  const results = []
  for (const item of tests) {
    try {
      await item.fn()
      console.log(`ok - ${item.name}`)
      results.push({ name: item.name, status: 'passed' })
    } catch (error) {
      failed += 1
      console.error(`not ok - ${item.name}`)
      console.error(error instanceof Error ? error.message : error)
      results.push({ name: item.name, status: 'failed', error: error instanceof Error ? error.message : String(error) })
    }
  }

  mkdirSync('tmp', { recursive: true })
  writeFileSync('tmp/stat-modules-qa-report.json', JSON.stringify({
    generatedAt: new Date().toISOString(),
    total: tests.length,
    passed: tests.length - failed,
    failed,
    tolerances: { referenceTolerances: tolerance, toleranceByMethod },
    coverage: {
      goldenValueTests: ['simple regression', 'multiple regression', 'correlation', 'ANOVA', 'chi-square', 'confidence interval', 'one-sample t-test', 'two-sample Welch/paired tests', 'PCA', 'classification metrics', 'logistic regression', 'goodness-of-fit', 'bootstrap', 'permutation'],
      engineUnitTests: ['t-tests', 'ANOVA', 'chi-square', 'simple regression', 'multiple regression', 'regression diagnostics', 'correlation', 'PCA', 'classification', 'logistic regression', 'GOF', 'bootstrap', 'permutation'],
      edgeCaseTests: ['empty data', 'constant columns', 'missing values', 'tiny samples', 'high-cardinality categories', 'saturated binary proportions', 'perfect logistic separation'],
      numericalWarnings: ['approximate modules', 'small samples', 'missing/filtered rows', 'constant columns', 'high-cardinality categories', 'logistic separation'],
    },
    results,
  }, null, 2))

  if (failed) {
    console.error(`\n${failed}/${tests.length} Stat Modules QA tests failed.`)
    process.exitCode = 1
  } else {
    console.log(`\n${tests.length} Stat Modules QA tests passed.`)
  }
} finally {
  await server.close()
}
