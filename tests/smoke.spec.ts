import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('anveshak-onboarding-complete', 'true')
    localStorage.setItem('anveshak-tour-done', 'yes')
  })
})

test('loads teaching studio and runs a simulation', async ({ page }) => {
  await page.goto('/learn')
  await expect(page.getByRole('heading', { name: 'Statistics Learning Studio' })).toBeVisible()
  await page.getByRole('button', { name: 'Run' }).click()
  await expect(page.getByText('Sandbox history', { exact: true })).toBeVisible()
  await expect(page.getByText('Accessible Formula and Visual')).toBeVisible()
})

test('opens global test recommender', async ({ page }) => {
  await page.goto('/learn')
  await expect(page.getByRole('heading', { name: 'Statistics Learning Studio' })).toBeVisible()
  await page.evaluate(() => window.dispatchEvent(new Event('open-test-recommender')))
  await expect(page.getByRole('heading', { name: 'Test Recommender' })).toBeVisible()
  await expect(page.getByText('Recommended analysis')).toBeVisible()
})

test('upload page exposes multi-file import queue affordance', async ({ page }) => {
  await page.goto('/data/upload')
  await expect(page.getByRole('heading', { name: 'Upload Data' })).toBeVisible()
  await expect(page.getByText('Drop one or more files here')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Load Sample Data' })).toBeVisible()
})
