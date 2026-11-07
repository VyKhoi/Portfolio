import { m } from "framer-motion"
import { useCachedContent } from '../../lib/contentCache';
import { useT } from '../../lib/i18n';
import portfolio from '../../content/portfolio.json';

const DEFAULT_SKILLS = portfolio.skills;

export function AboutSection() {
  const t = useT();
  const skills = useCachedContent<any[]>(
    'skills',
    DEFAULT_SKILLS,
    data => Array.isArray(data) && data.length > 0,
  );

  // Group skills by category
  const categories = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill.name);
    return acc;
  }, {} as Record<string, string[]>);

  const SKILL_CATEGORIES = Object.entries(categories).map(([title, items]) => ({ title: t.skillCategories[title] ?? title, items }));

  return (
    <section id="about" className="relative py-16 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-obsidian overflow-hidden">
      <div className="geo-line-h top-0" />

      <div className="container mx-auto max-w-6xl grid lg:grid-cols-2 gap-12 md:gap-16 lg:gap-24 relative z-10">

        {/* Left: Education & Info */}
        <div>
          <div className="mb-8 md:mb-12 flex items-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading uppercase tracking-tighter text-text-main">
              {t.education}
            </h2>
            <div className="flex-grow h-[1px] bg-border ml-4 sm:ml-6" />
          </div>

          <m.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="border-l-4 border-primary pl-5 sm:pl-6 py-2 mb-12 md:mb-16"
          >
            <h3 className="text-xl sm:text-2xl font-bold font-heading text-text-main uppercase mb-2">{t.degree}</h3>
            <div className="text-primary font-mono text-xs sm:text-sm uppercase tracking-widest mb-4">{t.school}</div>
            <ul className="space-y-3 text-sm sm:text-base text-text-muted font-body">
              {t.eduPoints.map(point => (
                <li key={point} className="flex items-start"><span className="text-primary mr-2 font-mono">{`>`}</span> {point}</li>
              ))}
            </ul>
          </m.div>

          <div className="mb-8 md:mb-12 flex items-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading uppercase tracking-tighter text-text-main">
              {t.mindset}
            </h2>
            <div className="flex-grow h-[1px] bg-border ml-4 sm:ml-6" />
          </div>

          <div className="space-y-4 sm:space-y-6">
            {t.mindsetItems.map(item => (
              <m.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="border border-border p-5 sm:p-6 bg-surface hover:border-primary transition-colors"
              >
                <h3 className="text-primary font-mono text-xs sm:text-sm uppercase tracking-widest mb-2.5 sm:mb-3">{item.title}</h3>
                <p className="text-sm sm:text-base text-text-muted leading-relaxed">{item.text}</p>
              </m.div>
            ))}
          </div>
        </div>

        {/* Right: Skills Grid */}
        <div id="skills">
          <div className="mb-8 md:mb-12 flex items-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading uppercase tracking-tighter text-text-main">
              {t.skills}
            </h2>
            <div className="flex-grow h-[1px] bg-border ml-4 sm:ml-6" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border">
            {SKILL_CATEGORIES.map((skillGroup, idx) => (
              <m.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                key={skillGroup.title}
                className="bg-obsidian p-6 sm:p-8 hover:bg-surface transition-colors"
              >
                <h3 className="font-mono text-xs font-bold text-primary uppercase tracking-widest mb-4 sm:mb-6">
                  {skillGroup.title}
                </h3>
                <ul className="space-y-3 sm:space-y-4">
                  {(skillGroup.items as string[]).map((skill: string) => (
                    <li key={skill} className="text-text-main font-body text-sm font-bold flex items-center">
                      <div className="w-1.5 h-1.5 bg-border mr-3 rounded-none shrink-0" />
                      <span>{skill}</span>
                    </li>
                  ))}
                </ul>
              </m.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
