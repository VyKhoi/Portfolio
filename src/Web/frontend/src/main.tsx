import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { prefetchPublicContent } from './lib/contentCache'

// Kick off public API requests immediately in parallel with React tree mount
const contentPrefetch = prefetchPublicContent()

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

// Fade out the boot splash once the first frame is painted and web fonts are ready,
// so visitors never see unstyled text or a font swap. Fonts are capped at 1.2s so a
// slow font CDN never holds the page hostage.
function hideBootSplash() {
  const splash = document.getElementById('boot-splash')
  if (!splash) return
  splash.classList.add('is-hidden')
  splash.addEventListener('transitionend', () => splash.remove(), { once: true })
  setTimeout(() => splash.remove(), 1000) // fallback if transitionend never fires
}

const timeout = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

async function waitForFonts() {
  // The font stylesheet is loaded non-blocking (preload -> stylesheet), wait for it first
  const link = document.getElementById('font-css') as HTMLLinkElement | null
  if (link && link.rel !== 'stylesheet') {
    await new Promise<void>(resolve => {
      link.addEventListener('load', () => resolve(), { once: true })
      link.addEventListener('error', () => resolve(), { once: true })
    })
  }
  if (!document.fonts) return
  await Promise.all(
    ['700 1em "Space Grotesk"', '400 1em "Urbanist"', '400 1em "JetBrains Mono"']
      .map(font => document.fonts.load(font).catch(() => undefined)),
  )
}

const fontsReady = Promise.race([waitForFonts(), timeout(800)])
const dataReady = Promise.race([contentPrefetch, timeout(300)])

const painted = new Promise<void>(resolve =>
  requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
)

Promise.all([fontsReady, dataReady, painted]).then(hideBootSplash)
