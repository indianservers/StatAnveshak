import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './registerServiceWorker'

// A tab kept open across deployments can still request a chunk from the previous build.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const key = 'statanveshak-last-chunk-reload'
  const lastReload = Number(sessionStorage.getItem(key) || 0)
  if (Date.now() - lastReload < 30_000) return
  sessionStorage.setItem(key, String(Date.now()))
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registerServiceWorker()
