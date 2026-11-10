// Khoi's own products: the Projects section and /projects/<slug> (+ /vi/projects/<slug>).
// The words live in the database (admin console → Dự án); projects.json is written from the API at build time
// (scripts/export-content.py) and is only a fallback for local development.
// A new slug also needs: an nginx.conf projects location, images in public/projects/, a row in the database.
import type { Lang } from '../lib/i18n'
import projects from './projects.json'

export interface ProjectSection {
  title: string
  text?: string
  points?: string[]
}

export interface ProjectCopy {
  name: string
  kind: string
  summary: string
  tagline: string
  role: string
  linkLabel: string
  sections: ProjectSection[]
  seoTitle: string
  seoDescription: string
  imageAlt: string
}

export interface Project {
  slug: string
  year: string
  url: Record<Lang, string>
  // Screenshots: 1200px for the project page, 800px for the home cards. Bump ?v= when a file changes (served with a 30-day cache)
  image: Record<Lang, string>
  thumb: Record<Lang, string>
  ogImage: Record<Lang, string>
  // schema.org type of the product itself, for the project page JSON-LD
  schemaType: 'WebApplication' | 'WebSite'
  copy: Record<Lang, ProjectCopy>
}

export const PROJECTS = projects as Project[]

export const PROJECT_SLUGS = PROJECTS.map((p) => p.slug)

export function projectPath(slug: string, lang: Lang) {
  return `${lang === 'vi' ? '/vi' : ''}/projects/${slug}`
}

export function findProject(slug: string | undefined) {
  return PROJECTS.find((p) => p.slug === slug)
}
