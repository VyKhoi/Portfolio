import { Link } from "react-router-dom"
import { m } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { useLang, useT } from "../../lib/i18n"
import { PROJECTS, projectPath } from "../../content/projects"

// Khoi's own products; each card opens /projects/<slug>
export function ProjectsSection() {
  const lang = useLang()
  const t = useT()

  return (
    <section id="projects" className="relative py-16 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-obsidian overflow-hidden">
      <div className="geo-line-h top-0" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="mb-10 md:mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex items-center">
            <div className="w-8 sm:w-16 h-[2px] bg-primary mr-3 sm:mr-6 shrink-0" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading uppercase tracking-tighter text-text-main">
              {t.projects.title}
            </h2>
          </div>
          <p className="text-text-muted font-body text-base sm:text-lg max-w-md md:text-right">{t.projects.intro}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
          {PROJECTS.map((project, index) => {
            const copy = project.copy[lang]
            return (
              <m.div
                key={project.slug}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-obsidian"
              >
                <Link
                  to={projectPath(project.slug, lang)}
                  className="group flex h-full flex-col focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
                >
                  <div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-surface">
                    <img
                      src={project.thumb[lang]}
                      srcSet={`${project.thumb[lang]} 800w, ${project.image[lang]} 1200w`}
                      sizes="(min-width: 1152px) 575px, (min-width: 768px) 50vw, 100vw"
                      alt={copy.imageAlt}
                      width={1200}
                      height={750}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover object-top opacity-80 grayscale-[35%] transition-all duration-500 group-hover:scale-[1.03] group-hover:opacity-100 group-hover:grayscale-0"
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-6 sm:p-8 lg:p-10">
                    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs font-bold tracking-widest text-text-muted uppercase">
                      <span className="text-primary">{String(index + 1).padStart(2, "0")}</span>
                      <span className="text-border" aria-hidden="true">/</span>
                      <span>{copy.kind}</span>
                      <span className="text-border" aria-hidden="true">/</span>
                      <span className="inline-flex items-center gap-2 text-primary">
                        <span className="h-1.5 w-1.5 bg-primary" aria-hidden="true" />
                        {t.projects.live}
                      </span>
                    </div>
                    <h3 className="mb-4 font-heading text-3xl sm:text-4xl font-bold uppercase tracking-tighter text-text-main transition-colors group-hover:text-primary">
                      {copy.name}
                    </h3>
                    <p className="mb-8 font-body text-base sm:text-lg leading-relaxed text-text-muted">{copy.summary}</p>
                    <span className="mt-auto inline-flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-primary">
                      {t.projects.view}
                      <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </m.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
