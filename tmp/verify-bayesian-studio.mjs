import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const BASE = 'http://127.0.0.1:5174'
const OUT = path.resolve('tmp/bayesian-verify')
const PAGES = [
  ['00-home', '/#/statistics/bayesian-statistics'],
  ['01-foundations', '/#/statistics/bayesian-statistics/bayesian-foundations'],
  ['02-beta-binomial', '/#/statistics/bayesian-statistics/beta-binomial'],
  ['03-gamma-poisson', '/#/statistics/bayesian-statistics/gamma-poisson'],
  ['04-normal-normal', '/#/statistics/bayesian-statistics/normal-normal'],
  ['05-conjugate', '/#/statistics/bayesian-statistics/conjugate-priors'],
  ['06-map-mle', '/#/statistics/bayesian-statistics/map-vs-mle'],
  ['07-credible', '/#/statistics/bayesian-statistics/credible-intervals'],
  ['08-prediction', '/#/statistics/bayesian-statistics/bayesian-prediction'],
  ['09-vs-freq', '/#/statistics/bayesian-statistics/bayesian-vs-frequentist'],
  ['10-mcmc', '/#/statistics/bayesian-statistics/mcmc-intuition'],
]

await mkdir(OUT, { recursive: true })
const warm = await fetch(`${BASE}/`)
if (!warm.ok) throw new Error(`Warmup failed: ${warm.status}`)
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
page.setDefaultTimeout(90_000)
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})
await page.addInitScript(() => {
  localStorage.setItem('anveshak-onboarding-complete', 'true')
  localStorage.setItem('anveshak-tour-done', 'yes')
})

for (const [name, hash] of PAGES) {
  await page.goto(`${BASE}${hash}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForTimeout(900)
  const crashed = await page.getByText('Something went wrong').count()
  if (crashed) throw new Error(`Crashed on ${hash}`)
  const heading = await page.locator('h1').first().innerText()
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true, animations: 'disabled' })
  console.log(`ok ${name} :: ${heading}`)

  if (name !== '00-home') {
    const interact = page.getByRole('button', { name: /Interact/i })
    if (await interact.count()) {
      await interact.click()
      await page.waitForTimeout(400)
    }
    const slider = page.locator('input[type="range"]').first()
    if (await slider.count()) {
      await slider.focus()
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(250)
    }
    await page.screenshot({ path: path.join(OUT, `${name}-interact.png`), fullPage: true, animations: 'disabled' })
  }
}

if (errors.length) {
  console.log('CONSOLE_ERRORS')
  for (const error of errors.slice(0, 20)) console.log(error)
} else {
  console.log('NO_CONSOLE_ERRORS')
}

await browser.close()
