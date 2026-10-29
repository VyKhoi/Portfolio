import { useEffect, useState } from 'react';
import { ContentApi } from './api';

// Stale-while-revalidate cache for public homepage content.
// - Returning visitors render the last known content instantly (no text "jumping").
// - Requests are de-duplicated and kicked off before React mounts (see main.tsx),
//   so first-time visitors get real data in parallel with the JS bundle.

const PREFIX = 'content-cache:v2:';

const fetchers = {
  profile: ContentApi.getProfile,
  experiences: ContentApi.getExperiences,
  skills: ContentApi.getSkills,
} as const;

export type ContentKey = keyof typeof fetchers;

const inflight = new Map<ContentKey, Promise<unknown>>();

export function readCache<T>(key: ContentKey): T | undefined {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

function writeCache(key: ContentKey, data: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data));
  } catch {
    /* storage full / disabled: ignore */
  }
}

export function fetchContent<T>(key: ContentKey): Promise<T> {
  let p = inflight.get(key) as Promise<T> | undefined;
  if (!p) {
    p = (fetchers[key]() as Promise<T>).then(data => {
      writeCache(key, data);
      return data;
    });
    p.catch(() => inflight.delete(key)); // allow retry on failure
    inflight.set(key, p);
  }
  return p;
}

export function hasCachedContent(): boolean {
  return (Object.keys(fetchers) as ContentKey[]).every(k => readCache(k) !== undefined);
}

export function prefetchPublicContent(): Promise<void> {
  return Promise.allSettled(
    (Object.keys(fetchers) as ContentKey[]).map(k => fetchContent(k)),
  ).then(() => undefined);
}

export function useCachedContent<T>(
  key: ContentKey,
  fallback: T,
  isValid: (data: T) => boolean = () => true,
): T {
  const [data, setData] = useState<T>(() => {
    const cached = readCache<T>(key);
    return cached !== undefined && isValid(cached) ? cached : fallback;
  });

  useEffect(() => {
    let alive = true;
    fetchContent<T>(key)
      .then(fresh => {
        if (!alive || !isValid(fresh)) return;
        setData(prev => (JSON.stringify(prev) === JSON.stringify(fresh) ? prev : fresh));
      })
      .catch(err => console.warn(`Using fallback content for "${key}":`, err));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return data;
}
