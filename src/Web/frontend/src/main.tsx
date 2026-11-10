import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AppRoutes } from './App.tsx'

const root = document.getElementById('root')!
const prerendered = root.dataset.prerendered === 'true'

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

const app = (
  <StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>
)

if (prerendered) {
  hydrateRoot(root, app)
} else {
  createRoot(root).render(app)
}

// The cursor cat is a desktop toy: never block the page for it, skip it on touch screens
if (prerendered && window.matchMedia('(pointer: fine)').matches) {
  const loadCat = () => {
    const script = document.createElement('script')
    script.src = '/oneko.js?v=3'
    document.body.appendChild(script)
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadCat, { timeout: 3000 })
  } else {
    setTimeout(loadCat, 1500)
  }
}
