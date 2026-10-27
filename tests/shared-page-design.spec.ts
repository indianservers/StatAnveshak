import { expect, test } from '@playwright/test'
import { STATISTICS_STUDIOS } from '../src/lib/statisticsStudios'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('anveshak-onboarding-complete', 'true')
    localStorage.setItem('anveshak-tour-done', 'yes')
    localStorage.setItem('home-tour-seen', 'true')
    localStorage.setItem('pref-workspace-mode', 'learn')
    localStorage.setItem('pref-motion', 'reduced')
  })
})

for (const studio of STATISTICS_STUDIOS) {
  test(`${studio.slug} uses the shared lab introduction`, async ({ page }, info) => {
    if (info.project.name === 'chromium') await page.setViewportSize({ width: 1536, height: 1024 })
    const lab = studio.labs[0]
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`/#/statistics/${studio.slug}/${lab.slug}`)
    await expect(page.getByRole('heading', { level: 1, name: lab.title, exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    const intro = page.locator('.unified-lab-intro')
    await expect(intro.getByRole('navigation', { name: `${studio.title} labs`, exact: true })).toBeVisible()
    await intro.getByRole('button', { name: 'Guide', exact: true }).click()
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Required inputs', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Close guide', exact: true }).click()
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    await expect.poll(() => page.locator('main').first().evaluate(element => element.scrollTop)).toBe(0)
    const modes = intro.getByRole('navigation', { name: 'Lab modes', exact: true })
    if (await modes.count()) {
      await modes.getByRole('button', { name: 'Learn', exact: true }).click()
      await expect(modes.getByRole('button', { name: 'Learn', exact: true })).toHaveAttribute('aria-current', 'page')
      await modes.getByRole('button', { name: 'Explore', exact: true }).click()
      await expect(modes.getByRole('button', { name: 'Explore', exact: true })).toHaveAttribute('aria-current', 'page')
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    expect(errors).toEqual([])
    if (['multivariate-statistics', 'regression', 'probability-foundations'].includes(studio.slug)) await page.screenshot({ path: `test-results/shared-design-${studio.slug}-${info.project.name}.png`, animations: 'disabled' })
  })
}

test('shared canvas works across the other page families', async ({ page }, info) => {
  if (info.project.name === 'chromium') await page.setViewportSize({ width: 1536, height: 1024 })
  for (const route of ['statistics', 'statistics/multivariate-statistics', 'data/upload', 'data/workbench', 'analysis', 'tools', 'distributions', 'learn/curriculum', 'reports', 'documentation', 'settings']) {
    await page.goto(`/#/${route}`)
    await expect(page.getByRole('navigation', { name: 'Page breadcrumb', exact: true })).toBeVisible()
    await expect(page.locator('.page-content')).not.toBeEmpty()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    if (['data/upload', 'statistics/multivariate-statistics'].includes(route)) await page.screenshot({ path: `test-results/shared-design-${route.replaceAll('/', '-')}-${info.project.name}.png`, animations: 'disabled' })
  }
})
