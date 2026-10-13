import { useState, type ReactNode } from 'react'
import { readLocal, writeLocal } from '../../lib/safeStorage'
import { HomePreferencesContext as Context, type HomeLevel } from './homePreferencesContext'

export function HomePreferences({ children }: { children: ReactNode }) {
  const [view, updateView] = useState<'beginner' | 'advanced'>(() => readLocal('home-view') === 'advanced' ? 'advanced' : 'beginner')
  const [topic, updateTopic] = useState(() => readLocal('home-topic', 'all'))
  const [level, updateLevel] = useState<HomeLevel>(() => {
    const saved = readLocal('home-level')
    return saved === 'intro' || saved === 'core' || saved === 'advanced' ? saved : 'all'
  })
  return <Context.Provider value={{ view, setView: (value) => { updateView(value); writeLocal('home-view', value) }, topic, setTopic: (value) => { updateTopic(value); writeLocal('home-topic', value) }, level, setLevel: (value) => { updateLevel(value); writeLocal('home-level', value) } }}>{children}</Context.Provider>
}

