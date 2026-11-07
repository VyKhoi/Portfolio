import { Badge } from "../ui/Badge"
import { m } from "framer-motion"
import { useCachedContent } from '../../lib/contentCache';
import { pick, useLang, useT } from '../../lib/i18n';
import portfolio from '../../content/portfolio.json';

const DEFAULT_EXPERIENCES = portfolio.experiences;

const PROJECT_LINKS: Record<string, string> = {
  ChickenNote: "https://note.dangvykhoi.com/"
};

export function ProjectsBento() {
  const lang = useLang();
  const t = useT();
  const experiences = useCachedContent<any[]>(
    'experiences',
    DEFAULT_EXPERIENCES,
    data => Array.isArray(data) && data.length > 0,
  );

  if (!experiences.length) return null;

  return (
    <section id="experience" className="relative py-16 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-surface overflow-hidden">
      {/* Horizontal Line separating sections */}
      <div className="geo-line-h top-0" />

      <div className="container mx-auto max-w-6xl relative z-10">

        <div className="mb-12 md:mb-24 flex items-center">
          <div className="w-8 sm:w-16 h-[2px] bg-primary mr-3 sm:mr-6 shrink-0" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading uppercase tracking-tighter text-text-main">
            {t.experienceTitle}
          </h2>
        </div>

        <div className="relative">
          {/* Timeline Vertical Line */}
          <div className="absolute left-0 md:left-48 top-0 bottom-0 w-[1px] bg-border z-0" />

          <div className="space-y-12 md:space-y-24">
            {experiences.map((exp, index) => {
              const projectName = pick(exp, 'projectName', lang);
              const highlights = pick<string[]>(exp, 'highlights', lang) ?? [];
              return (
              <m.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                key={exp.id || index}
                className="relative grid md:grid-cols-12 gap-4 md:gap-12 items-start group"
              >

                {/* Timeline Node marker */}
                <div className="hidden md:block absolute left-48 w-3 h-3 bg-obsidian border-2 border-primary -translate-x-[6px] translate-y-2 rounded-none group-hover:bg-primary transition-colors" />

                {/* Period - Left col */}
                <div className="md:col-span-3 pt-1 relative z-10 bg-surface md:bg-transparent pr-4 inline-block md:block pl-4 sm:pl-6 md:pl-0">
                  <span className="block md:max-w-40 text-lg sm:text-xl md:text-2xl font-bold font-mono text-primary uppercase tracking-tighter">
                    {pick(exp, 'period', lang)}
                  </span>
                </div>

                {/* Content - Right col */}
                <div className="md:col-span-9 relative z-10 pl-4 sm:pl-6 md:pl-0 border-l md:border-l-0 border-border md:border-transparent">
                  <div className="border border-border p-5 sm:p-6 md:p-10 bg-obsidian hover:border-primary transition-colors duration-300 relative overflow-hidden group/card">
                    {/* Background accent on hover */}
                    <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover/card:translate-y-0 transition-transform duration-500 ease-out z-0" />

                    <div className="relative z-10">
                      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-3 sm:mb-4">
                        <h3 className="text-xl sm:text-2xl font-bold font-heading text-text-main uppercase">{pick(exp, 'role', lang)}</h3>
                        <div className="text-text-muted font-mono text-xs sm:text-sm tracking-widest mt-1.5 md:mt-0">{pick(exp, 'company', lang)}</div>
                      </div>

                      {projectName && (
                        <h4 className="text-base sm:text-xl font-bold font-heading mb-5 sm:mb-6 uppercase tracking-tighter text-primary">
                          {PROJECT_LINKS[exp.projectName] ? (
                            <a href={PROJECT_LINKS[exp.projectName]} target="_blank" rel="noopener" className="hover:underline">
                              [ {t.projectPrefix}: {projectName} → ]
                            </a>
                          ) : (
                            <>[ {t.projectPrefix}: {projectName} ]</>
                          )}
                        </h4>
                      )}

                      {highlights.length > 0 && (
                        <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                          {highlights.map((item: string, i: number) => (
                            <li key={i} className="text-text-muted text-sm sm:text-base leading-relaxed flex items-start font-body">
                              <span className="text-primary mr-2.5 sm:mr-3 mt-1 font-mono shrink-0">{`>`}</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {exp.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-5 sm:pt-6 border-t border-border">
                          {exp.techStack.map((t: string) => (
                            <Badge key={t} variant="secondary">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </m.div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  )
}
