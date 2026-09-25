import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const BASE = 'http://127.0.0.1:5174'
const OUT = path.resolve('tmp/ca-verify')
const PAGES = [
  ['00-home', '/#/statistics/correlation-association'],
  ['01-scatter', '/#/statistics/correlation-association/scatter-plot-explorer'],
  ['02-covariance', '/#/statistics/correlation-association/covariance'],
  ['03-pearson', '/#/statistics/correlation-association/pearson-correlation'],
  ['04-spearman', '/#/statistics/correlation-association/spearman-rank-correlation'],
  ['05-kendall', '/#/statistics/correlation-association/kendall-tau'],
  ['06-matrix', '/#/statistics/correlation-association/correlation-matrix'],
  ['07-partial', '/#/statistics/correlation-association/partial-correlation'],
  ['08-causation', '/#/statistics/correlation-association/correlation-vs-causation'],
]

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
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
  await page.waitForTimeout(700)
  const crashed = await page.getByText('Something went wrong').count()
  if (crashed) throw new Error(`Crashed on ${hash}`)
  const heading = await page.locator('main h1, h1').first().innerText()
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true, animations: 'disabled' })
  console.log(`ok ${name} :: ${heading}`)

  if (name !== '00-home') {
    const explore = page.getByRole('button', { name: /Explore/i })
    if (await explore.count()) {
      await explore.click()
      await page.waitForTimeout(350)
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
