import { m } from "framer-motion"
import { pick, useLang, useT } from "../../lib/i18n"
import portfolio from "../../content/portfolio.json"

const now = portfolio.now
// "2026-11-10" → "11/2026"
const updated = now.updated.slice(5, 7) + "/" + now.updated.slice(0, 4)

// A few lines on what Khoi is up to: edited in the admin console (Now), built into the page
export function NowSection() {
  const t = useT()
  const lang = useLang()

  return (
    <section id="now" className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-obsidian overflow-hidden border-t border-border">
      <div className="container mx-auto max-w-6xl relative z-10 grid lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-4">
          <div className="flex items-center mb-4">
            <div className="w-8 sm:w-16 h-[2px] bg-primary mr-3 sm:mr-6 shrink-0" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading uppercase tracking-tighter text-text-main">
              {t.now.title}
            </h2>
          </div>
          <p className="font-mono text-xs font-bold tracking-widest text-text-muted uppercase pl-11 sm:pl-[5.5rem]">
            {t.now.updated} {updated}
          </p>
        </div>

        <div className="lg:col-span-8 grid sm:grid-cols-2 gap-px bg-border border border-border">
          {now.items.map((item, idx) => (
            <div key={idx} className="bg-obsidian p-6 sm:p-8 hover:bg-surface transition-colors">
              <m.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
              >
                <div className="mb-3 font-mono text-xs font-bold tracking-widest text-primary uppercase">
                  {`${String(idx + 1).padStart(2, "0")} // ${pick(item, "label", lang)}`}
                </div>
                <p className="font-body text-base sm:text-lg leading-relaxed text-text-main">{pick(item, "text", lang)}</p>
              </m.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
