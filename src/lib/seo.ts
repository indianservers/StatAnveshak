import { useEffect } from 'react'

export type SeoMetadata = {
  title: string
  description: string
  keywords?: string[]
  path?: string
  type?: 'website' | 'article'
}

const SITE_NAME = 'Anveshak'
const DEFAULT_DESCRIPTION = 'Browser-only statistics and data analytics workbench for learning, analysis, reporting, and teaching.'

const ensureMeta = (selector: string, attrs: Record<string, string>) => {
  let node = document.head.querySelector<HTMLMetaElement>(selector)
  if (!node) {
    node = document.createElement('meta')
    Object.entries(attrs).forEach(([key, value]) => node?.setAttribute(key, value))
    document.head.appendChild(node)
  }
  return node
}

const setMetaContent = (selector: string, attrs: Record<string, string>, content: string) => {
  const node = ensureMeta(selector, attrs)
  node.setAttribute('content', content)
}

export function absoluteUrl(path = '/') {
  const origin = window.location.origin
  const base = window.location.pathname.replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${origin}${base}/#${normalized}`
}

export function applySeoMetadata(metadata: SeoMetadata) {
  const title = metadata.title.includes(SITE_NAME) ? metadata.title : `${metadata.title} | ${SITE_NAME}`
  const description = metadata.description || DEFAULT_DESCRIPTION
  const keywords = metadata.keywords?.filter(Boolean).join(', ')
  const url = absoluteUrl(metadata.path)

  document.title = title
  setMetaContent('meta[name="description"]', { name: 'description' }, description)
  setMetaContent('meta[name="robots"]', { name: 'robots' }, 'index, follow')
  setMetaContent('meta[property="og:title"]', { property: 'og:title' }, title)
  setMetaContent('meta[property="og:description"]', { property: 'og:description' }, description)
  setMetaContent('meta[property="og:type"]', { property: 'og:type' }, metadata.type ?? 'website')
  setMetaContent('meta[property="og:url"]', { property: 'og:url' }, url)
  setMetaContent('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary')
  setMetaContent('meta[name="twitter:title"]', { name: 'twitter:title' }, title)
  setMetaContent('meta[name="twitter:description"]', { name: 'twitter:description' }, description)
  if (keywords) setMetaContent('meta[name="keywords"]', { name: 'keywords' }, keywords)

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', url)
}

export function useSeoMetadata(metadata: SeoMetadata) {
  useEffect(() => {
    applySeoMetadata(metadata)
  }, [metadata.title, metadata.description, metadata.path, metadata.type, metadata.keywords?.join('|')])
}
