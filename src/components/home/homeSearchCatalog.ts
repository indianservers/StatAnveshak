import { FEATURED_STUDIO, STATISTICS_STUDIOS, STUDIOS_ROOT } from '../../lib/statisticsStudios'
import { MODULE_GROUPS } from './homeCatalog'

export type HomeSearchEntry = { title: string; description: string; category: string; path: string; analyze?: boolean }

export const HOME_SEARCH_ENTRIES: HomeSearchEntry[] = [
  ...STATISTICS_STUDIOS.flatMap((studio) => [
    { title: studio.title, description: studio.tagline, category: 'Studio', path: `${STUDIOS_ROOT}/${studio.slug}` },
    ...studio.labs.map((lab) => ({ title: lab.title, description: `${studio.title} · ${lab.summary} ${lab.concepts.join(' ')}`, category: 'Lab', path: `${STUDIOS_ROOT}/${studio.slug}/${lab.slug}` })),
  ]),
  { title: FEATURED_STUDIO.title, description: FEATURED_STUDIO.tagline, category: 'Studio', path: FEATURED_STUDIO.path },
  ...MODULE_GROUPS.flatMap((group) => group.items.map((item) => ({ title: item.title, description: `${group.label} · ${item.description}`, category: 'Analysis', path: `/analysis/${item.id}`, analyze: true }))),
  ...[
    ['Upload dataset', 'Import data from a file', '/data/upload'],
    ['Data grid', 'View and edit your dataset', '/data/grid'],
    ['Clean data', 'Prepare data for analysis', '/data/clean'],
    ['SQL query', 'Query your dataset with SQL', '/data/query'],
    ['Charts', 'Visualize your data', '/explore/charts'],
  ].map(([title, description, path]) => ({ title, description, path, category: 'Data tool', analyze: true })),
]

export function searchHome(query: string): HomeSearchEntry[] {
  const aliases: Record<string, string> = { 'anova': 'anova', 'std': 'standard deviation', 'stdev': 'standard deviation', 'average': 'mean', 'bell curve': 'normal', 'linear model': 'regression', 'import': 'upload', 'chi square': 'chi', 't-test': 't test' }
  const normalized = aliases[query.trim().toLowerCase()] ?? query.trim().toLowerCase()
  const terms = normalized.split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  return HOME_SEARCH_ENTRIES.filter((entry) => terms.every((term) => `${entry.title} ${entry.description} ${entry.category}`.toLowerCase().replace(/[-–]/g, ' ').includes(term)))
    .sort((a, b) => Number(b.title.toLowerCase().includes(normalized)) - Number(a.title.toLowerCase().includes(normalized)))
}
