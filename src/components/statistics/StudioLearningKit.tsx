import { labPath, type Studio } from '../../lib/statisticsStudios'
import { studioLabGuide } from '../../lib/guides/studioGuides'
import { StudioLearningPanel } from './StudioLearningPanel'
export function StudioLearningKit({ studio, activeLab }: { studio: Studio; activeLab?: string }) {
  if (studio.slug === 'anova') return null
  const labs = studio.labs.map(lab => ({ id: lab.slug, title: lab.title, level: lab.level, concepts: lab.concepts, href: labPath(studio.slug, lab.slug), guide: studioLabGuide(studio.slug, lab.slug)! }))
  return <StudioLearningPanel key={`${studio.slug}/${activeLab ?? 'home'}`} studio={studio.slug} title={studio.title} labs={labs} activeLab={activeLab} />
}
