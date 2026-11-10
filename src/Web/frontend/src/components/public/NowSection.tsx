import { m } from "framer-motion"
import { useT } from "../../lib/i18n"

// A few lines on what Khoi is up to; update the text and date in lib/i18n.ts
export function NowSection() {
  const t = useT()

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
            {t.now.updated}
          </p>
        </div>

        <div className="lg:col-span-8 grid sm:grid-cols-2 gap-px bg-border border border-border">
          {t.now.items.map((item, idx) => (
            <div key={item.label} className="bg-obsidian p-6 sm:p-8 hover:bg-surface transition-colors">
              <m.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
              >
                <div className="mb-3 font-mono text-xs font-bold tracking-widest text-primary uppercase">
                  {`${String(idx + 1).padStart(2, "0")} // ${item.label}`}
                </div>
                <p className="font-body text-base sm:text-lg leading-relaxed text-text-main">{item.text}</p>
              </m.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
