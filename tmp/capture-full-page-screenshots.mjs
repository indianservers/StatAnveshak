import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const OUT_DIR = String.raw`E:\Edu Projects\Screenshots\Statistics - Stat Anveshak`
const PORT = 5188
const BASE = `http://127.0.0.1:${PORT}`
const ROOT = path.resolve(import.meta.dirname, '..')

function keysFrom(file, pattern) {
  const text = readFileSync(path.join(ROOT, file), 'utf8')
  return [...text.matchAll(pattern)].map((m) => m[1])
}

function slug(value) {
  return String(value)
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

const distributionIds = keysFrom('src/lib/distributions.ts', /id: '([a-z0-9_]+)'/g)
const syllabusKeys = keysFrom('src/lib/syllabusModules.ts', /key: '([a-z0-9_]+)'/g)
const computingKeys = keysFrom('src/lib/computingModules.ts', /key: '([a-z0-9_]+)'/g)
const statKeys = [...new Set(keysFrom('src/lib/statModules.ts', /key: '([a-z0-9_]+)'/g))]

const pages = [
  ['01-Workspace-Home', '/#/'],
  ['02-Workspace-Projects', '/#/projects'],
  ['03-Workspace-Solver', '/#/solver'],
  ['04-Data-Upload', '/#/data/upload'],
  ['05-Data-Preview', '/#/data/preview'],
  ['06-Data-Grid', '/#/data/grid'],
  ['07-Data-Clean-and-Transform', '/#/data/clean'],
  ['08-Data-Stats-Workbench', '/#/data/workbench'],
  ['09-Data-Query-Workbench', '/#/data/query'],
  ['10-Explore-Summary-Stats', '/#/explore/summary'],
  ['11-Explore-Charts', '/#/explore/charts'],
  ['12-Explore-Correlation', '/#/explore/correlation'],
  ['13-Explore-Frequency', '/#/explore/frequency'],
  ['14-Analysis-Distributions', '/#/distributions'],
  ['15-Analysis-Inference-Tests', '/#/inference'],
  ['16-Analysis-Regression', '/#/regression'],
  ['17-Analysis-Advanced', '/#/advanced'],
  ['18-Analysis-Stat-Modules', '/#/stat-modules'],
  ['19-Analysis-Syllabus-Modules', '/#/syllabus'],
  ['20-Analysis-CS-Modules', '/#/modules'],
  ['21-Output-Dashboard', '/#/dashboard'],
  ['22-Output-Export-and-Reports', '/#/reports'],
  ['23-Learn-Core-Statistics', '/#/learn'],
  ['24-Learn-Professional-Learning', '/#/professional-learning'],
  ['25-Learn-Documentation', '/#/documentation'],
  ['26-Learn-Sitemap', '/#/sitemap'],
  ['27-Settings', '/#/settings'],
  ['28-Page-Not-Found', '/#/definitely-not-a-real-route'],
  ...distributionIds.map((id, i) => [
    `29-Distribution-${String(i + 1).padStart(2, '0')}-${slug(id)}`,
    `/#/distributions/${id}`,
  ]),
  ...syllabusKeys.map((id, i) => [
    `30-Syllabus-${String(i + 1).padStart(2, '0')}-${slug(id)}`,
    `/#/syllabus/${id}`,
  ]),
  ...computingKeys.map((id, i) => [
    `31-CS-Module-${String(i + 1).padStart(2, '0')}-${slug(id)}`,
    `/#/modules/${id}`,
  ]),
  ...statKeys.map((id, i) => [
    `32-Stat-Module-${String(i + 1).padStart(2, '0')}-${slug(id)}`,
    `/#/stat-modules/${id}`,
  ]),
]

async function waitForServer(url, timeoutMs = 120_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(1500) })
      if (res.ok) return
    } catch {
      // keep waiting
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Server did not start at ${url}`)
}

async function expandScroll(page) {
  await page.evaluate(() => {
    const html = document.documentElement
    const body = document.body
    html.style.height = 'auto'
    html.style.overflow = 'visible'
    body.style.height = 'auto'
    body.style.overflow = 'visible'
    document.querySelectorAll('.h-screen, .overflow-hidden, .overflow-auto').forEach((el) => {
      el.style.height = 'auto'
      el.style.maxHeight = 'none'
      el.style.overflow = 'visible'
      el.style.minHeight = '0'
    })
    const main = document.querySelector('main')
    if (main) {
      main.style.height = 'auto'
      main.style.overflow = 'visible'
    }
  })
}

async function capture(page, name, hashPath) {
  await page.goto(`${BASE}${hashPath}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForTimeout(800)
  await page.locator('text=Loading workspace').waitFor({ state: 'hidden', timeout: 20_000 }).catch(() => {})
  const title = await page.title()
  if (!title.includes('StatAnveshak')) {
    throw new Error(`Wrong app at ${hashPath}: title="${title}"`)
  }
  await expandScroll(page)
  await page.waitForTimeout(400)
  const file = path.join(OUT_DIR, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled' })
  return file
}

function stopProcessTree(child) {
  if (!child?.pid) return
  spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', shell: true })
}

let vite
try {
  await mkdir(OUT_DIR, { recursive: true })

  vite = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    shell: true,
    stdio: 'pipe',
  })
  await waitForServer(BASE)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  await page.addInitScript(() => {
    localStorage.setItem('anveshak-onboarding-complete', 'true')
    localStorage.setItem('anveshak-tour-done', 'yes')
  })

  await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  const homeTitle = await page.title()
  if (!homeTitle.includes('StatAnveshak')) {
    throw new Error(`Refusing to capture. Expected StatAnveshak, got "${homeTitle}" at ${BASE}`)
  }
  await page.getByText('Student Marks', { exact: false }).first().waitFor({ timeout: 20_000 })
  console.log(`Confirmed StatAnveshak at ${BASE} with Student Marks loaded (${homeTitle})`)

  const manifest = []
  let failed = 0
  for (let i = 0; i < pages.length; i++) {
    const [name, hashPath] = pages[i]
    try {
      const file = await capture(page, name, hashPath)
      manifest.push({ ok: true, name, path: hashPath, file })
      console.log(`[${i + 1}/${pages.length}] ${name}`)
    } catch (error) {
      failed += 1
      manifest.push({ ok: false, name, path: hashPath, error: String(error) })
      console.error(`[${i + 1}/${pages.length}] FAIL ${name}: ${error}`)
    }
  }

  await writeFile(
    path.join(OUT_DIR, '_index.json'),
    JSON.stringify(
      {
        app: 'StatAnveshak',
        savedAt: new Date().toISOString(),
        folder: OUT_DIR,
        total: pages.length,
        captured: manifest.filter((item) => item.ok).length,
        failed,
        pages: manifest,
      },
      null,
      2,
    ),
  )

  await browser.close()
  console.log(`Done. ${pages.length - failed} captured, ${failed} failed.`)
  console.log(OUT_DIR)
} finally {
  stopProcessTree(vite)
}

if (!existsSync(OUT_DIR)) {
  throw new Error('Output folder was not created')
}
