import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const BASE = 'http://127.0.0.1:5174'
const OUT = path.resolve('tmp/reg-verify')
const PAGES = [
  ['00-home', '/#/statistics/regression'],
  ['01-simple', '/#/statistics/regression/simple-linear-regression'],
  ['02-least-squares', '/#/statistics/regression/least-squares'],
  ['03-prediction', '/#/statistics/regression/prediction'],
  ['04-residuals', '/#/statistics/regression/residual-analysis'],
  ['05-gof', '/#/statistics/regression/goodness-of-fit'],
  ['06-intervals', '/#/statistics/regression/confidence-prediction-intervals'],
  ['07-multiple', '/#/statistics/regression/multiple-regression'],
  ['08-polynomial', '/#/statistics/regression/polynomial-regression'],
  ['09-categorical', '/#/statistics/regression/categorical-predictors'],
  ['10-interaction', '/#/statistics/regression/interaction-effects'],
  ['11-logistic', '/#/statistics/regression/logistic-regression-basics'],
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
  await page.waitForFunction(() => !document.body.innerText.includes('Loading workspace'), { timeout: 30_000 })
  await page.waitForTimeout(800)
  const crashed = await page.getByText('Something went wrong').count()
  if (crashed) throw new Error(`Crashed on ${hash}`)
  const heading = await page.locator('main h1, h1').first().innerText()
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true, animations: 'disabled' })
  console.log(`ok ${name} :: ${heading}`)

  if (name !== '00-home') {
    const slider = page.locator('input[type="range"]').first()
    if (await slider.count()) {
      await slider.focus()
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(280)
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
