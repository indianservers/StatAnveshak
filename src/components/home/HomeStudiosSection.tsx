import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Network } from 'lucide-react'
import { STATISTICS_STUDIOS, STUDIOS_ROOT, TOTAL_LAB_COUNT, TOTAL_STUDIO_COUNT } from '../../lib/statisticsStudios'
import { StudioIconStyles } from '../visual/StudioIcons'
import { DistributionsStudioCard, StudioCard } from '../statistics/StudioCard'
import { HOME_ACTION_CLASS, HomeSection } from './HomeSection'

/** The Distributions Studio sits after Random Variables, where distributions are introduced. */
const DISTRIBUTIONS_AFTER = 'random-variables'

export function HomeStudiosSection() {
  return (
    <HomeSection
      id="home-studios-heading"
      icon={Network}
      iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300"
      title="Probability & Statistics Studios"
      description={`${TOTAL_STUDIO_COUNT} interactive studios and ${TOTAL_LAB_COUNT} labs, from fundamentals to advanced topics.`}
      action={(
        <Link to={STUDIOS_ROOT} className={HOME_ACTION_CLASS}>
          Open studios home <ArrowRight size={15} aria-hidden />
        </Link>
      )}
    >
      <StudioIconStyles />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {STATISTICS_STUDIOS.map((studio) => (
          <Fragment key={studio.slug}>
            <StudioCard studio={studio} />
            {studio.slug === DISTRIBUTIONS_AFTER && <DistributionsStudioCard />}
          </Fragment>
        ))}
      </div>
    </HomeSection>
  )
}
