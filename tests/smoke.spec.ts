import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('anveshak-onboarding-complete', 'true')
    localStorage.setItem('anveshak-tour-done', 'yes')
    localStorage.setItem('pref-workspace-mode', 'learn')
  })
})

const gotoApp = async (page: import('@playwright/test').Page, path: string) => {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
}

test('loads teaching studio and runs a simulation', async ({ page }) => {
  await gotoApp(page, '/#/learn')
  await expect(page.getByRole('heading', { name: 'Statistics Learning Studio' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Central limit theorem' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await expect(page.getByText('Sandbox history', { exact: true })).toBeVisible()
  await expect(page.getByText('Accessible Formula and Visual')).toBeVisible()
  await page.getByRole('button', { name: 'Law of large numbers' }).click()
  await expect(page.getByRole('heading', { name: 'Law of large numbers' })).toBeVisible()
})

test('opens global test recommender', async ({ page }) => {
  await gotoApp(page, '/#/learn')
  await expect(page.getByRole('heading', { name: 'Statistics Learning Studio' })).toBeVisible()
  await page.evaluate(() => window.dispatchEvent(new Event('open-test-recommender')))
  await expect(page.getByRole('heading', { name: 'Test Recommender' })).toBeVisible()
  await expect(page.getByText('Recommended analysis')).toBeVisible()
})

test('professional learning workspace exposes practice and decision tools', async ({ page }) => {
  await gotoApp(page, '/#/professional-learning')
  await expect(page.getByRole('heading', { name: /Statistics Learning Paths/ })).toBeVisible()
  await page.getByRole('button', { name: 'Practice' }).click()
  await expect(page.getByText('Categorized Practice Engine')).toBeVisible()
  await page.getByRole('button', { name: 'Decision Wizard' }).click()
  await expect(page.getByText('Which Test Should I Use?')).toBeVisible()
  await page.getByRole('button', { name: 'Share' }).click()
  await expect(page.getByText('Project Bundle')).toBeVisible()
  await expect(page.getByText('Classroom Submission')).toBeVisible()
})

test('documentation and sitemap pages expose SEO metadata', async ({ page }) => {
  await gotoApp(page, '/#/documentation')
  await expect(page.getByRole('heading', { level: 1, name: 'Documentation' })).toBeVisible()
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /documentation/i)

  await gotoApp(page, '/#/sitemap')
  await expect(page.getByRole('heading', { level: 1, name: 'Sitemap' })).toBeVisible()
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1)
})

test('upload page exposes multi-file import queue affordance', async ({ page }) => {
  await gotoApp(page, '/#/data/upload')
  await expect(page.getByRole('heading', { name: 'Upload Data' })).toBeVisible()
  await expect(page.getByText('Drop one or more files here')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Load Sample Data' })).toBeVisible()
})

test('sample dataset renders rows in the data grid', async ({ page }) => {
  await gotoApp(page, '/#/data/upload')
  await page.getByRole('button', { name: /Student Marks/ }).click()
  await expect(page).toHaveURL(/#\/data\/preview/)

  await gotoApp(page, '/#/data/grid')
  await expect(page.locator('.ag-header-cell-text', { hasText: 'student_id' })).toBeVisible()
  await expect(page.locator('.ag-center-cols-container .ag-row').first()).toBeVisible()

  const renderedRows = await page.locator('.ag-center-cols-container .ag-row').count()
  expect(renderedRows).toBeGreaterThan(0)
})

test('statistics workbench route is available', async ({ page }) => {
  await gotoApp(page, '/#/data/workbench')
  await expect(page.getByText('No dataset loaded', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Go to datasets page' })).toBeVisible()
})

test('learn home starts the CLT lab in one click', async ({ page }) => {
  await gotoApp(page, '/#/')
  await expect(page.getByText('Start here')).toBeVisible()
  await page.getByRole('link', { name: /Watch sample means pile into a bell/ }).click()
  await expect(page.getByRole('heading', { name: 'Distributions' })).toBeVisible()
  await expect(page.getByText(/tightens immediately/)).toBeVisible()
})

test('learn dashboard is a lesson wall', async ({ page }) => {
  await gotoApp(page, '/#/dashboard')
  await expect(page.getByRole('heading', { name: 'Lesson wall' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Distributions' }).first()).toBeVisible()
})

test('classroom assigns a chapter and hides the picture until reveal', async ({ page }) => {
  await gotoApp(page, '/#/classroom')
  await expect(page.getByRole('heading', { name: /Assign a chapter/ })).toBeVisible()
  await page.getByRole('button', { name: 'Practice' }).click()
  await expect(page.getByText('Practice — picture hidden')).toBeVisible()
  await page.getByRole('button', { name: 'Reveal the picture' }).click()
  await expect(page.getByText('Picture is on stage')).toBeVisible()

  await gotoApp(page, '/#/learn/compound?prior=0.02&sens=0.95&fpr=0.05&practice=base-rate-trap')
  await expect(page.getByText('Practice — picture hidden')).toBeVisible()
  await expect(page.getByText('The stage stays empty until you reveal the picture.')).toBeVisible()
  await page.getByRole('button', { name: 'Reveal the picture' }).click()
  await expect(page.getByRole('heading', { name: 'Compound probability' })).toBeVisible()
})

test('unknown routes show a recovery page', async ({ page }) => {
  await gotoApp(page, '/#/definitely-not-a-real-route')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await expect(page.getByRole('main').getByRole('link', { name: 'Home' })).toBeVisible()
})

test('settings exposes storage and preference controls', async ({ page }) => {
  await gotoApp(page, '/#/settings')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(page.getByText('Browser Storage (IndexedDB)')).toBeVisible()
  await expect(page.getByRole('button', { name: /Reset Local Preferences/ })).toBeVisible()
})

test('query workbench route is available', async ({ page }) => {
  await gotoApp(page, '/#/data/query')
  await expect(page.getByText('No dataset loaded', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Go to datasets page' })).toBeVisible()
})

test('solver page includes Karl Pearson practice set', async ({ page }) => {
  await gotoApp(page, '/#/solver')
  await expect(page.getByRole('heading', { name: 'Solver' })).toBeVisible()
  await expect(page.getByText('How to solve problems like these')).toBeVisible()
  await expect(page.getByRole('button', { name: /Pearson Correlation/ }).first()).toBeVisible()
  await expect(page.getByText('25 examples').first()).toBeVisible()
  await expect(page.getByText('Pearson Correlation Example 01')).toBeVisible()
  await expect(page.getByText('Pearson r')).toBeVisible()
  await page.getByRole('button', { name: 'Steps' }).click()
  await expect(page.getByRole('heading', { name: 'Steps' })).toBeVisible()
})

test('analysis workspace runs descriptive statistics', async ({ page }) => {
  await gotoApp(page, '/#/analysis/descriptives.statistics')
  await expect(page.getByRole('heading', { name: 'Descriptive Statistics' }).first()).toBeVisible()
  await expect(page.getByText('JASP modules')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run analysis' })).toBeVisible()
  await page.getByRole('button', { name: 'Run analysis' }).click()
  await expect(page.getByRole('heading', { name: 'Descriptive Statistics' }).nth(1)).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('Shapiro–Wilk')).toBeVisible()
})

test('analysis workspace runs one-sample t-test after loading Student Marks', async ({ page }) => {
  await gotoApp(page, '/#/data/upload')
  await page.getByRole('button', { name: /Student Marks/ }).click()
  await expect(page).toHaveURL(/#\/data\/preview/)
  await gotoApp(page, '/#/analysis/t.oneSample')
  await expect(page.getByRole('heading', { name: 'One Sample T-Test' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Run analysis' }).click()
  await expect(page.getByText('One-sample t-test')).toBeVisible({ timeout: 20_000 })
})

test('analysis workspace runs linear regression after loading Student Marks', async ({ page }) => {
  await gotoApp(page, '/#/data/upload')
  await page.getByRole('button', { name: /Student Marks/ }).click()
  await expect(page).toHaveURL(/#\/data\/preview/)
  await gotoApp(page, '/#/analysis/regression.linear')
  await expect(page.getByRole('heading', { name: 'Linear Regression' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Run analysis' }).click()
  await expect(page.getByText('Model fit')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('Coefficients')).toBeVisible()
})
