import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('anveshak-onboarding-complete', 'true')
    localStorage.setItem('anveshak-tour-done', 'yes')
  })
})

test('loads teaching studio and runs a simulation', async ({ page }) => {
  await page.goto('/#/learn')
  await expect(page.getByRole('heading', { name: 'Statistics Learning Studio' })).toBeVisible()
  await page.getByRole('button', { name: 'Run' }).click()
  await expect(page.getByText('Sandbox history', { exact: true })).toBeVisible()
  await expect(page.getByText('Accessible Formula and Visual')).toBeVisible()
})

test('opens global test recommender', async ({ page }) => {
  await page.goto('/#/learn')
  await expect(page.getByRole('heading', { name: 'Statistics Learning Studio' })).toBeVisible()
  await page.evaluate(() => window.dispatchEvent(new Event('open-test-recommender')))
  await expect(page.getByRole('heading', { name: 'Test Recommender' })).toBeVisible()
  await expect(page.getByText('Recommended analysis')).toBeVisible()
})

test('upload page exposes multi-file import queue affordance', async ({ page }) => {
  await page.goto('/#/data/upload')
  await expect(page.getByRole('heading', { name: 'Upload Data' })).toBeVisible()
  await expect(page.getByText('Drop one or more files here')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Load Sample Data' })).toBeVisible()
})

test('statistics workbench route is available', async ({ page }) => {
  await page.goto('/#/data/workbench')
  await expect(page.getByText('No dataset loaded', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Upload Data' })).toBeVisible()
})

test('unknown routes show a recovery page', async ({ page }) => {
  await page.goto('/#/definitely-not-a-real-route')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await expect(page.getByRole('main').getByRole('link', { name: 'Home' })).toBeVisible()
})

test('settings exposes storage and preference controls', async ({ page }) => {
  await page.goto('/#/settings')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(page.getByText('Browser Storage (IndexedDB)')).toBeVisible()
  await expect(page.getByRole('button', { name: /Reset Local Preferences/ })).toBeVisible()
})

test('query workbench route is available', async ({ page }) => {
  await page.goto('/#/data/query')
  await expect(page.getByText('No dataset loaded', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Upload Data' })).toBeVisible()
})

test('solver page includes Karl Pearson practice set', async ({ page }) => {
  await page.goto('/#/solver')
  await expect(page.getByRole('heading', { name: 'Solver' })).toBeVisible()
  await expect(page.getByText('How to solve problems like these')).toBeVisible()
  await expect(page.getByRole('button', { name: /Pearson Correlation/ }).first()).toBeVisible()
  await expect(page.getByText('25 examples').first()).toBeVisible()
  await expect(page.getByText('Pearson Correlation Example 01')).toBeVisible()
  await expect(page.getByText('Pearson r')).toBeVisible()
  await page.getByRole('button', { name: 'Steps' }).click()
  await expect(page.getByRole('heading', { name: 'Steps' })).toBeVisible()
})
