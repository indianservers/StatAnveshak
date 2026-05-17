import { CORE_SITE_PAGES, MODULE_SITE_PAGES, SITE_PAGES, type SitePageMeta } from './siteMap'

export type SiteCatalogEntry = {
  title: string
  path: string
  section: string
  description: string
  keywords: string[]
  priority: number
}

const toCatalogEntry = (page: SitePageMeta): SiteCatalogEntry => ({
  title: page.title,
  path: page.path,
  section: page.category,
  description: page.description,
  keywords: page.keywords,
  priority: page.priority ?? 0.5,
})

export const CORE_SITE_LINKS = CORE_SITE_PAGES.map(toCatalogEntry)
export const MODULE_SITE_LINKS = MODULE_SITE_PAGES.map(toCatalogEntry)
export const SITE_CATALOG = SITE_PAGES.map(toCatalogEntry)
