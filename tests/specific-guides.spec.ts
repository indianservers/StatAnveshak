import { expect, test } from '@playwright/test'
import { STATISTICS_STUDIOS } from '../src/lib/statisticsStudios'
import { TOOL_FEATURES } from '../src/components/tools/toolCatalog'
import { DISTRIBUTIONS } from '../src/lib/distributions'
import { COMPUTING_MODULES } from '../src/lib/computingModules'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('anveshak-onboarding-complete', 'true')
    localStorage.setItem('anveshak-tour-done', 'yes')
    localStorage.setItem('home-tour-seen', 'true')
    localStorage.setItem('pref-workspace-mode', 'learn')
    localStorage.setItem('pref-motion', 'reduced')
  })
})
test('every Hub feature exposes its own guide', async ({ page }) => {
  test.setTimeout(120_000)
  for (const feature of TOOL_FEATURES) {
    await page.goto(`/#/tools?feature=${feature.id}`)
    const summary = page.locator('summary').filter({ hasText: `Guide · ${feature.title}` }).first()
    await expect(summary).toBeVisible()
    await summary.click()
    await expect(summary.locator('..').getByRole('heading', { name: 'Required inputs', exact: true })).toBeVisible()
    await expect(summary.locator('..').getByRole('heading', { name: 'Method limits', exact: true })).toBeVisible()
  }
})
for (const studio of STATISTICS_STUDIOS) test(`${studio.slug} has guides on its home and lab`, async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`/#/statistics/${studio.slug}`)
  await expect(page.locator('#studio-specific-guides-content summary')).toHaveCount(studio.labs.length)
  const lab = studio.labs[0]
  await page.goto(`/#/statistics/${studio.slug}/${lab.slug}`)
  const summary = page.locator('summary').filter({ hasText: `Guide · ${lab.title}` }).first()
  await expect(summary).toBeVisible()
  await summary.click()
  await expect(summary.locator('..').getByRole('heading', { name: 'Algorithm and calculation', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})
test('algorithm selections replace the calculation guide', async ({ page }, info) => {
  await page.goto('/#/tools?feature=clustering')
  await page.getByLabel('Algorithm', { exact: true }).selectOption('dbscan')
  const summary = page.locator('summary').filter({ hasText: /Guide · .*DBSCAN/ })
  await summary.click()
  await expect(summary.locator('..')).toContainText('dense neighborhoods')
  await page.getByLabel('Algorithm', { exact: true }).selectOption('kmeans')
  const replacement = page.locator('summary').filter({ hasText: /Guide · .*K-means/ })
  await replacement.click()
  await expect(replacement.locator('..')).toContainText('centroid updates')
  await expect(replacement.locator('..')).not.toContainText('dense neighborhoods')
  await page.screenshot({ path: `tmp/specific-guide-${info.project.name}.png` })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
  await page.goto('/#/tools?feature=impute')
  await page.getByLabel('Preparation method').selectOption('median')
  const median = page.locator('summary').filter({ hasText: /Guide · .* · median/ })
  await median.click()
  await expect(median.locator('..')).toContainText('middle value')
})
test('every distribution has its own model guide', async ({ page }) => {
  test.setTimeout(120_000)
  for (const dist of DISTRIBUTIONS) {
    await page.goto(`/#/distributions/${dist.id}`)
    const summary = page.locator('summary').filter({ hasText: 'Guide ·' }).first()
    await expect(summary).toBeVisible()
    await summary.click()
    await expect(summary.locator('..').getByRole('heading', { name: 'Method limits', exact: true })).toBeVisible()
  }
})
test('computing guides follow the selected hash and collision algorithms', async ({ page }, info) => {
  for (const module of COMPUTING_MODULES) {
    await page.goto(`/#/modules/${module.key}`)
    await expect(page.locator('summary').filter({ hasText: `Guide · ${module.title}` }).first()).toBeVisible()
  }
  await page.goto('/#/modules/hashing')
  await page.getByRole('combobox', { name: 'Hash method', exact: true }).selectOption('multiplication')
  await page.getByRole('combobox', { name: 'Collision method', exact: true }).selectOption('quadratic')
  const summary = page.locator('summary').filter({ hasText: 'Guide · Multiplication method · Quadratic probing' })
  await summary.click()
  await expect(summary.locator('..')).toContainText('golden-ratio')
  await expect(summary.locator('..')).toContainText('(h + i²) mod m')
  await page.evaluate(() => localStorage.setItem('pref-theme', 'dark'))
  await page.reload()
  const guide = page.locator('summary').filter({ hasText: 'Guide · Hashing' }).first()
  await guide.click()
  await guide.scrollIntoViewIfNeeded()
  const bounds = await guide.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1)
  await page.screenshot({ path: `tmp/specific-guide-computing-${info.project.name}.png` })
})
test('Stat Modules explains its actual fixed method', async ({ page }) => {
  await page.goto('/#/stat-modules/train_test_cv')
  const summary = page.locator('summary').filter({ hasText: 'Guide · Train/Test Split and Cross-Validation Module' })
  await expect(summary).toBeVisible()
  await summary.click()
  await expect(summary.locator('..')).toContainText('not k-fold cross-validation')
  await page.goto('/#/stat-modules/seasonal_decomposition')
  await page.reload()
  const spectral = page.locator('summary').filter({ hasText: 'Guide · Seasonal Decomposition Module' })
  await spectral.click()
  await expect(spectral.locator('..')).toContainText('actually runs spectral analysis')
})
