import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { MODULE_ORDER } from '../../analysis/catalog'
import { HomeAllModules } from './HomeAllModules'
import { MODULE_GROUPS, searchModuleGroups } from './homeCatalog'

describe('home all modules', () => {
  it('links every module to its first implemented analysis when expanded', () => {
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(HomeAllModules, { defaultExpanded: true })))

    expect(MODULE_GROUPS).toHaveLength(MODULE_ORDER.length)
    for (const group of MODULE_GROUPS) {
      expect(html).toContain(`href="/analysis/${group.items[0].id}"`)
    }
    expect(html).toContain('Search modules and analyses')
  })

  it('shows six modules collapsed by default', () => {
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(HomeAllModules)))
    const links = html.match(/href="\/analysis\/[^"]+"/g) ?? []
    expect(links).toHaveLength(6)
  })

  it('search matches module names and individual analyses', () => {
    expect(searchModuleGroups('survival').map((group) => group.module)).toContain('survival')
    const hits = searchModuleGroups('arima')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.every((group) => group.items.length > 0)).toBe(true)
    expect(searchModuleGroups('zzzz-no-match')).toHaveLength(0)
  })
})
