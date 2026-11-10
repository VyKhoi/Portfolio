import { useEffect } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { m } from "framer-motion"
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react"
import { Navbar } from "../../components/public/Navbar"
import { Footer } from "../../components/public/Footer"
import { homePath, useLang, useT } from "../../lib/i18n"
import { PROJECTS, findProject, projectPath } from "../../content/projects"

export function ProjectPage() {
  const { slug } = useParams()
  const lang = useLang()
  const t = useT()
  const project = findProject(slug)
  const copy = project?.copy[lang]

  useEffect(() => {
    if (!copy) return
    document.documentElement.lang = lang
    document.title = copy.seoTitle
    document.querySelector('meta[name="description"]')?.setAttribute('content', copy.seoDescription)
  }, [lang, copy])

  if (!project || !copy) return <Navigate to={homePath(lang)} replace />

  const index = PROJECTS.indexOf(project)
  const next = PROJECTS[(index + 1) % PROJECTS.length]
  const home = homePath(lang)
  const external = !project.url[lang].startsWith('https://dangvykhoi.com')
  const meta = [
    { label: t.projects.year, value: project.year },
    { label: t.projects.status, value: t.projects.live, live: true },
    { label: t.projects.role, value: copy.role },
  ]

  return (
    <div className="bg-obsidian min-h-screen text-white selection:bg-primary selection:text-black">
      <a href="#main" className="skip-link">{t.skipToContent}</a>
      <Navbar />

      <main id="main">
        {/* Header */}
        <section className="relative pt-28 lg:pt-36 pb-12 md:pb-16 px-4 sm:px-6 lg:px-8 border-b border-border overflow-hidden">
          <div className="hidden lg:block absolute top-0 bottom-0 left-[10%] w-[1px] bg-border" />
          <div className="hidden lg:block absolute top-0 bottom-0 right-[10%] w-[1px] bg-border" />

          <div className="container mx-auto max-w-6xl relative z-10">
            <Link
              to={`${home}#projects`}
              className="mb-10 md:mb-14 inline-flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-text-muted hover:text-primary transition-colors"
            >
              <ArrowLeft size={14} aria-hidden="true" /> {t.projects.all}
            </Link>

            <m.div initial={{ opacity: 1, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }}>
              <p className="mb-5 font-mono text-xs sm:text-sm font-bold tracking-widest text-primary uppercase">
                {`${t.projectPrefix} ${String(index + 1).padStart(2, "0")} // ${t.projects.personal} // ${copy.kind}`}
              </p>
              <h1 className="mb-6 md:mb-8 font-heading font-bold uppercase tracking-tighter leading-[0.92] text-text-main text-[2.75rem] sm:text-[4rem] md:text-[5.5rem] lg:text-[7rem]">
                {copy.name}
              </h1>
              <p className="max-w-3xl border-l-2 border-primary pl-4 font-body text-lg sm:text-xl md:text-2xl leading-relaxed text-text-muted">
                {copy.tagline}
              </p>
            </m.div>

            <dl className="mt-10 md:mt-14 grid grid-cols-2 sm:grid-cols-[auto_auto_1fr] gap-px bg-border border border-border">
              {meta.map((item, i) => (
                <div key={item.label} className={`bg-obsidian px-5 py-4 sm:px-6 sm:py-5 ${i === meta.length - 1 ? "col-span-2 sm:col-span-1" : ""}`}>
                  <dt className="mb-1.5 font-mono text-xs font-bold tracking-widest text-text-muted uppercase">{item.label}</dt>
                  <dd className={`font-body text-base ${item.live ? "inline-flex items-center gap-2 font-mono font-bold tracking-widest text-primary text-sm" : "text-text-main"}`}>
                    {item.live && <span className="h-1.5 w-1.5 bg-primary" aria-hidden="true" />}
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              {external ? (
                <a
                  href={project.url[lang]}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex h-12 items-center gap-3 bg-primary px-6 font-mono text-xs sm:text-sm font-bold tracking-widest text-black uppercase hover:bg-primary-hover transition-colors"
                >
                  {copy.linkLabel} <ArrowUpRight size={18} aria-hidden="true" />
                </a>
              ) : (
                <Link
                  to={home}
                  className="inline-flex h-12 items-center gap-3 bg-primary px-6 font-mono text-xs sm:text-sm font-bold tracking-widest text-black uppercase hover:bg-primary-hover transition-colors"
                >
                  {copy.linkLabel} <ArrowRight size={18} aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Screenshot */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 md:py-20 bg-surface border-b border-border">
          <figure className="container mx-auto max-w-6xl">
            <div className="border border-border bg-obsidian">
              <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
                <span className="flex gap-1.5" aria-hidden="true">
                  <span className="h-2 w-2 bg-border" />
                  <span className="h-2 w-2 bg-border" />
                  <span className="h-2 w-2 bg-primary" />
                </span>
                <span className="truncate font-mono text-xs text-text-muted">{project.url[lang].replace("https://", "")}</span>
              </div>
              <img
                src={project.image[lang]}
                alt={copy.imageAlt}
                width={1200}
                height={750}
                fetchPriority="high"
                decoding="async"
                className="block h-auto w-full"
              />
            </div>
          </figure>
        </section>

        {/* Story */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="container mx-auto max-w-6xl divide-y divide-border border-y border-border">
            {copy.sections.map((section, i) => (
              <m.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5 }}
                className="grid md:grid-cols-12 gap-4 md:gap-12 py-10 md:py-14"
              >
                <h2 className="md:col-span-4 font-mono text-sm font-bold tracking-widest text-primary uppercase">
                  {`${String(i + 1).padStart(2, "0")} // ${section.title}`}
                </h2>
                <div className="md:col-span-8 space-y-6">
                  {section.text && (
                    <p className="font-body text-lg sm:text-xl leading-relaxed text-text-main">{section.text}</p>
                  )}
                  {section.points && (
                    <ul className="space-y-4">
                      {section.points.map((point) => (
                        <li key={point} className="flex items-start font-body text-base sm:text-lg leading-relaxed text-text-muted">
                          <span className="mr-3 mt-0.5 shrink-0 font-mono text-primary" aria-hidden="true">{">"}</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </m.div>
            ))}
          </div>
        </section>

        {/* Next project + contact */}
        <section className="px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
          <div className="container mx-auto max-w-6xl grid md:grid-cols-2 gap-px bg-border border border-border">
            <Link to={projectPath(next.slug, lang)} className="group bg-obsidian p-6 sm:p-10 hover:bg-surface transition-colors">
              <p className="mb-3 font-mono text-xs font-bold tracking-widest text-text-muted uppercase">{t.projects.next}</p>
              <p className="flex items-center justify-between gap-4 font-heading text-2xl sm:text-4xl font-bold uppercase tracking-tighter text-text-main group-hover:text-primary transition-colors">
                <span className="min-w-0 break-words">{next.copy[lang].name}</span>
                <ArrowRight className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </p>
            </Link>
            <div className="bg-obsidian p-6 sm:p-10 flex flex-col justify-between gap-6">
              <p className="font-body text-lg sm:text-xl leading-relaxed text-text-main">{t.projects.contact}</p>
              <Link
                to={`${home}#contact`}
                className="inline-flex w-fit h-11 items-center gap-2 border border-primary px-5 font-mono text-xs font-bold tracking-widest text-primary hover:bg-primary hover:text-black transition-colors"
              >
                {t.projects.contactButton} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
