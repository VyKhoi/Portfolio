import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { prefetchPublicContent } from './lib/contentCache'

// Kick off public API requests immediately in parallel with React tree mount
prefetchPublicContent()

// After a redeploy, old hashed chunks are removed. If a tab opened before the deploy
// tries to lazy-load one, reload once to fetch the fresh build instead of breaking.
window.addEventListener('vite:preloadError', (event) => {
  const key = 'vite-preload-reloaded'
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, '1')
    event.preventDefault()
    window.location.reload()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
