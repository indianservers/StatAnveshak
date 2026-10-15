import { HomeHero } from '../components/home/HomeHero'
import { HomeStudiosSection } from '../components/home/HomeStudiosSection'
import { HomeDatasetStudio } from '../components/home/HomeDatasetStudio'
import { HomeAnalysisTools } from '../components/home/HomeAnalysisTools'
import { HomeAllModules } from '../components/home/HomeAllModules'
import { ANALYSIS_COUNT } from '../components/home/homeCatalog'
import { HomePreferences } from '../components/home/homePreferences'
import { useStore } from '../store/useStore'

export function HomePage() {
  return <HomePreferences><HomeContent /></HomePreferences>
}

function HomeContent() {
  const motion = useStore((state) => state.motion)
  return (
    <main className={`home-screen min-w-0 bg-slate-50/70 px-4 py-5 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8 ${motion === 'reduced' ? 'home-motion-paused' : ''}`}>
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
        <HomeHero analysisCount={ANALYSIS_COUNT} />
        <HomeStudiosSection />
        <HomeDatasetStudio />
        <HomeAnalysisTools />
        <HomeAllModules />
      </div>
    </main>
  )
}
