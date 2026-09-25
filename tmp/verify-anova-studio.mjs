import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const BASE = 'http://127.0.0.1:5174'
const OUT = path.resolve('tmp/anova-verify')
const PAGES = [
  ['00-home', '/#/statistics/anova'],
  ['01-one-way', '/#/statistics/anova/one-way-anova'],
  ['02-table', '/#/statistics/anova/anova-table'],
  ['03-posthoc', '/#/statistics/anova/post-hoc-comparisons'],
  ['04-two-way', '/#/statistics/anova/two-way-anova'],
  ['05-rm', '/#/statistics/anova/repeated-measures-anova'],
  ['06-assumptions', '/#/statistics/anova/anova-assumptions'],
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

async function open(hash) {
  await page.goto(`${BASE}${hash}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForFunction(() => !document.body.innerText.includes('Loading workspace'), { timeout: 30_000 })
  await page.waitForTimeout(900)
  const crashed = await page.getByText('Something went wrong').count()
  if (crashed) throw new Error(`Crashed on ${hash}`)
}

for (const [name, hash] of PAGES) {
  await open(hash)
  const heading = await page.locator('main h1, h1').first().innerText()
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true, animations: 'disabled' })
  console.log(`ok ${name} :: ${heading}`)

  if (name === '01-one-way') {
    const slider = page.locator('input[type="range"]').nth(2)
    if (await slider.count()) {
      await slider.focus()
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(300)
    }
    const toggle = page.getByLabel('Show within-group deviations')
    if (await toggle.count()) await toggle.click()
  }
  if (name === '02-table') {
    const fCell = page.getByRole('button', { name: /^\d/ }).first()
    if (await fCell.count()) await fCell.click()
  }
  if (name === '03-posthoc') {
    const holm = page.getByLabel(/Pairwise t \+ Holm/)
    if (await holm.count()) await holm.click()
  }
  if (name === '04-two-way') {
    const select = page.locator('select').first()
    if (await select.count()) await select.selectOption('no-interaction')
  }
  if (name === '05-rm') {
    const centered = page.getByLabel('Subject-centered scores')
    if (await centered.count()) await centered.click()
  }
  if (name === '06-assumptions') {
    const select = page.locator('select').nth(1)
    if (await select.count()) await select.selectOption('levene')
  }
  if (name !== '00-home') {
    await page.waitForTimeout(280)
    await page.screenshot({ path: path.join(OUT, `${name}-interact.png`), fullPage: true, animations: 'disabled' })
  }
}

if (errors.length) {
  console.log('CONSOLE_ERRORS')
  for (const error of errors.slice(0, 30)) console.log(error)
} else {
  console.log('NO_CONSOLE_ERRORS')
}

await browser.close()
