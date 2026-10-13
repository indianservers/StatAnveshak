import { HomeHero } from '../components/home/HomeHero'
import { HomeSearch } from '../components/home/HomeSearch'
import { HomeStudiosSection } from '../components/home/HomeStudiosSection'
import { HomeDatasetStudio } from '../components/home/HomeDatasetStudio'
import { HomeAnalysisTools } from '../components/home/HomeAnalysisTools'
import { HomeAllModules } from '../components/home/HomeAllModules'
import { ANALYSIS_COUNT } from '../components/home/homeCatalog'
import { HomePreferences } from '../components/home/homePreferences'
import { useHomePreferences } from '../components/home/homePreferencesContext'
import { HomePersonal } from '../components/home/HomePersonal'
import { useStore } from '../store/useStore'

export function HomePage() {
  return <HomePreferences><HomeContent /></HomePreferences>
}

function HomeContent() {
  const { view } = useHomePreferences()
  const motion = useStore((state) => state.motion)
  return (
    <main className={`home-screen min-w-0 bg-slate-50/70 px-4 py-5 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8 ${motion === 'reduced' ? 'home-motion-paused' : ''}`}>
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
        <HomeSearch />
        <nav aria-label="Home sections" className="sticky top-0 z-20 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white/95 p-2 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">{[['Workspace', 'home-workspace'], ['Studios', 'home-studios-heading'], ['Datasets', 'home-datasets-heading'], ['Tools', 'home-tools-heading'], ['Modules', 'home-modules-heading']].map(([title, id]) => <button key={id} type="button" onClick={() => document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: motion === 'reduced' ? 'instant' : 'smooth' })} className="home-link flex min-h-11 items-center rounded-lg px-3 text-sm font-bold">{title}</button>)}</nav>
        <div id="home-workspace" className="scroll-mt-24"><HomePersonal /></div>
        {view === 'beginner' && <HomeHero analysisCount={ANALYSIS_COUNT} />}
        <HomeStudiosSection />
        <HomeDatasetStudio />
        <HomeAnalysisTools />
        <HomeAllModules />
      </div>
    </main>
  )
}
