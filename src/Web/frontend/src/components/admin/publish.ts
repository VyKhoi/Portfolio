import { useQuery } from '@tanstack/react-query'
import { api } from './api'

export type PublishState = { state: 'published' | 'pending' | 'unknown'; builtAt?: string }

// Key order differs between jsonb and the exported file; compare values, not text
function same(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => same(x, b[i]))
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a as object)
    const kb = Object.keys(b as object)
    return ka.length === kb.length && ka.every((k) => same((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
  }
  return false
}

/**
 * Do the static pages (what Google and first-time visitors get) show what the database holds?
 * The build writes /content-snapshot.json; scripts/publish-content.sh rebuilds within 30 minutes when they differ.
 */
export function usePublishState() {
  return useQuery({
    queryKey: ['publish'],
    refetchInterval: 60_000,
    queryFn: async (): Promise<PublishState> => {
      try {
        const res = await fetch(`/content-snapshot.json?t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return { state: 'unknown' }
        const snapshot = await res.json()
        const [profile, experiences, skills, now, projects] = await Promise.all(
          ['content/profile', 'content/experiences', 'content/skills', 'content/now', 'content/projects'].map((p) => api(p)),
        )
        const live = { profile, experiences, skills, now, projects }
        return { state: same(live, snapshot.content) ? 'published' : 'pending', builtAt: snapshot.builtAt }
      } catch {
        return { state: 'unknown' }
      }
    },
  })
}

/** Content queries + the publish check, refreshed after every save. */
export const CONTENT_KEYS = ['profile', 'experiences', 'skills', 'now', 'projects', 'publish'] as const
