import { expect, test } from '@playwright/test'
import { DISTRIBUTIONS } from '../src/lib/distributions'
import { DISTRIBUTION_EXPERIENCES } from '../src/lib/distributionExperiences'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('anveshak-onboarding-complete', 'true')
    localStorage.setItem('anveshak-tour-done', 'yes')
    localStorage.setItem('pref-workspace-mode', 'learn')
  })
})

test('every distribution lab shows its own scenario and experiment', async ({ page }) => {
  const seen = new Set<string>()
  for (const dist of DISTRIBUTIONS) {
    const experience = DISTRIBUTION_EXPERIENCES[dist.id]
    await page.goto(`/#/distributions/${dist.id}?tab=viz`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: experience.scenarioTitle }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Interactive experiment' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Probability explorer' })).toBeVisible()
    seen.add(experience.scenarioTitle)
  }
  expect(seen.size).toBe(DISTRIBUTIONS.length)
})

test('bernoulli tokens, dirichlet simplex, and comparison navigation work', async ({ page }) => {
  await page.goto('/#/distributions/bernoulli?tab=viz', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Run 1', exact: true }).click()
  await expect(page.getByText('Empirical p̂')).toBeVisible()

  await page.goto('/#/distributions/dirichlet?tab=viz', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Uncertainty about market shares' })).toBeVisible()
  await page.getByRole('button', { name: 'Drop 40 compositions' }).click()
  await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible()

  await page.getByRole('link', { name: /Beta/ }).first().click()
  await expect(page).toHaveURL(/#\/distributions\/beta/)
  await expect(page.getByRole('heading', { name: 'Unknown click-through probability' })).toBeVisible()
})

test('workbench and datasets routes stay intact', async ({ page }) => {
  await page.goto('/#/data/workbench', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('No dataset loaded', { exact: true })).toBeVisible()
  await page.goto('/#/data/upload', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Upload Data' })).toBeVisible()
})
