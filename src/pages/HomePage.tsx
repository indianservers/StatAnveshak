import { HomeHero } from '../components/home/HomeHero'
import { HomeStudiosSection } from '../components/home/HomeStudiosSection'
import { HomeDatasetStudio } from '../components/home/HomeDatasetStudio'
import { HomeAnalysisTools } from '../components/home/HomeAnalysisTools'
import { HomeAllModules } from '../components/home/HomeAllModules'
import { ANALYSIS_COUNT } from '../components/home/homeCatalog'

export function HomePage() {
  return (
    <main className="min-w-0 bg-slate-50/70 px-4 py-5 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
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
