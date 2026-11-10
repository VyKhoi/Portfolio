/* oxlint-disable react/only-export-components -- build-time entry, never hot-reloaded */
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { AppRoutes } from './App'
import { NotFound } from './pages/public/NotFound'

// Build-time render of the public pages, see scripts/prerender.mjs
export function render(url: string) {
  return renderToString(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>,
  )
}

// Read by scripts/prerender.mjs for the privacy pages' <head>
export { PRIVACY, PRIVACY_PATH } from './content/privacy'
export { PROJECTS, projectPath } from './content/projects'

// Static 404 page: rendered without the router and shipped without the app bundle
export function renderNotFound() {
  return renderToString(<NotFound />)
}
