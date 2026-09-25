import path from 'node:path'
import { chromium } from '@playwright/test'

const BASE = 'http://127.0.0.1:5174'
const OUT = path.resolve('tmp/bayesian-verify')
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
page.setDefaultTimeout(90_000)
await page.addInitScript(() => {
  localStorage.setItem('anveshak-onboarding-complete', 'true')
  localStorage.setItem('anveshak-tour-done', 'yes')
})

await page.goto(`${BASE}/#/statistics/bayesian-statistics/gamma-poisson`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(800)
await page.screenshot({ path: path.join(OUT, '03-gamma-fixed.png'), fullPage: true, animations: 'disabled' })

await page.goto(`${BASE}/#/statistics/bayesian-statistics/mcmc-intuition`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(600)
await page.getByRole('button', { name: /Batch 1,000/i }).click()
await page.waitForTimeout(800)
const footer = await page.locator('footer').first().innerText()
console.log('FOOTER', footer.replace(/\s+/g, ' '))
await page.screenshot({ path: path.join(OUT, '10-mcmc-batch.png'), fullPage: true, animations: 'disabled' })

await page.goto(`${BASE}/#/statistics/bayesian-statistics/conjugate-priors`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(600)
await page.screenshot({ path: path.join(OUT, '05-conjugate.png'), fullPage: true, animations: 'disabled' })

await browser.close()
console.log('done')
