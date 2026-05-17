import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { findPageMeta, SITE_PAGES } from '../../lib/siteMap'

const SITE_NAME = 'StatAnveshak'
const BASE_URL = 'https://statanveshak.app'

export function SeoMetadata() {
  const location = useLocation()

  useEffect(() => {
    const meta = findPageMeta(location.pathname)
    const title = meta?.title ? `${meta.title} | ${SITE_NAME}` : SITE_NAME
    const description = meta?.description ?? 'Browser-only statistics learning, practice, analysis, and reporting workbench.'
    const keywords = meta?.keywords.join(', ') ?? 'statistics, data analytics, learning'
    const canonical = `${BASE_URL}/#${location.pathname}`

    document.title = title
    setMeta('description', description)
    setMeta('keywords', keywords)
    setMeta('application-name', SITE_NAME)
    setMeta('robots', 'index,follow')
    setProperty('og:title', title)
    setProperty('og:description', description)
    setProperty('og:type', 'website')
    setProperty('og:url', canonical)
    setLink('canonical', canonical)
    setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: meta?.title ?? SITE_NAME,
      description,
      url: canonical,
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: BASE_URL,
      },
      hasPart: SITE_PAGES.slice(0, 40).map((page) => ({
        '@type': 'WebPage',
        name: page.title,
        description: page.description,
        url: `${BASE_URL}/#${page.path}`,
      })),
    })
  }, [location.pathname])

  return null
}

function setMeta(name: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.name = name
    document.head.appendChild(element)
  }
  element.content = content
}

function setProperty(property: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }
  element.content = content
}

function setLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.rel = rel
    document.head.appendChild(element)
  }
  element.href = href
}

function setJsonLd(value: unknown) {
  let element = document.head.querySelector<HTMLScriptElement>('script[data-statanveshak-seo="page"]')
  if (!element) {
    element = document.createElement('script')
    element.type = 'application/ld+json'
    element.dataset.statanveshakSeo = 'page'
    document.head.appendChild(element)
  }
  element.textContent = JSON.stringify(value)
}
