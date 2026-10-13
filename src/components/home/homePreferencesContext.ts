import { createContext, useContext } from 'react'
export type HomeLevel = 'all' | 'intro' | 'core' | 'advanced'
type Preferences = { view: 'beginner' | 'advanced'; setView: (value: 'beginner' | 'advanced') => void; topic: string; setTopic: (value: string) => void; level: HomeLevel; setLevel: (value: HomeLevel) => void }
export const HomePreferencesContext = createContext<Preferences>({ view: 'beginner', setView: () => {}, topic: 'all', setTopic: () => {}, level: 'all', setLevel: () => {} })
export const useHomePreferences = () => useContext(HomePreferencesContext)
