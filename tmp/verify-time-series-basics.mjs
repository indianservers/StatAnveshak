import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const BASE = 'http://127.0.0.1:5174'
const OUT = path.resolve('tmp/ts-verify')
const PAGES = [
  ['00-home', '/#/statistics/time-series-basics'],
  ['01-time-plot', '/#/statistics/time-series-basics/time-plot'],
  ['02-trend', '/#/statistics/time-series-basics/trend'],
  ['03-seasonality', '/#/statistics/time-series-basics/seasonality'],
  ['04-moving-average', '/#/statistics/time-series-basics/moving-average'],
  ['05-autocorrelation', '/#/statistics/time-series-basics/autocorrelation'],
  ['06-acf-pacf', '/#/statistics/time-series-basics/acf-pacf'],
  ['07-stationarity', '/#/statistics/time-series-basics/stationarity'],
  ['08-white-noise', '/#/statistics/time-series-basics/white-noise-random-walk'],
  ['09-arima', '/#/statistics/time-series-basics/ar-ma-arima-intuition'],
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
  await page.waitForTimeout(900)
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
    const toggle = page.locator('input[type="checkbox"]').first()
    if (await toggle.count()) {
      await toggle.click()
      await page.waitForTimeout(200)
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
