import { expect, test } from '@playwright/test'

test('confidence ellipse opens at the top after navigating from a scrolled studio', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('anveshak-onboarding-complete', 'true')
    localStorage.setItem('anveshak-tour-done', 'yes')
    localStorage.setItem('home-tour-seen', 'true')
    localStorage.setItem('pref-workspace-mode', 'learn')
    localStorage.setItem('pref-motion', 'reduced')
  })
  await page.goto('/#/statistics/multivariate-statistics')
  const link = page.locator('a[href="#/statistics/multivariate-statistics/confidence-ellipse"]').first()
  await expect(link).toBeVisible()
  await link.scrollIntoViewIfNeeded()
  const main = page.locator('main').first()
  await main.evaluate(element => { element.scrollTop = 500 })
  await expect.poll(() => main.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
  // Activate the link without Playwright scrolling it back into view first.
  await link.evaluate(element => (element as HTMLAnchorElement).click())
  await expect(page).toHaveURL(/\/confidence-ellipse$/)
  await expect(page.getByRole('heading', { name: /confidence ellipse/i }).first()).toBeVisible()
  await expect.poll(() => main.evaluate(element => element.scrollTop)).toBe(0)
})
