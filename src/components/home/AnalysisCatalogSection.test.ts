import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { ANALYSIS_CATALOG } from '../../analysis/catalog'
import { AnalysisCatalogSection } from './AnalysisCatalogSection'

describe('home analysis catalog', () => {
  it('links to every implemented analysis from the workspace menu', () => {
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(AnalysisCatalogSection)))

    for (const analysis of ANALYSIS_CATALOG.filter((item) => item.implemented)) {
      expect(html).toContain(`href="/analysis/${analysis.id}"`)
    }
    expect(html).toContain('Search analysis tools')
  })
})
