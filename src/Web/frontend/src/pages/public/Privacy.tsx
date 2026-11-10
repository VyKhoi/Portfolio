import { useEffect } from "react"
import { Link } from "react-router-dom"
import { useLang } from "../../lib/i18n"
import { PRIVACY, PRIVACY_PATH } from "../../content/privacy"

export function Privacy() {
  const lang = useLang()
  const p = PRIVACY[lang]
  const other = lang === 'vi' ? 'en' : 'vi'

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = `${p.title} | Đặng Vỹ Khôi`
    document.querySelector('meta[name="description"]')?.setAttribute('content', p.description)
  }, [lang, p])

  return (
    <div className="bg-obsidian min-h-screen text-white">
      <header className="border-b border-border">
        <nav className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between font-mono text-sm">
          <Link to={lang === 'vi' ? '/vi' : '/'} className="text-text-main hover:text-primary transition-colors">{p.back}</Link>
          <Link to={PRIVACY_PATH[other]} lang={other} className="text-text-main hover:text-primary transition-colors">{p.switchLabel}</Link>
        </nav>
      </header>

      <main id="main" className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-5xl font-bold font-heading uppercase tracking-tight mb-3">{p.title}</h1>
        <p className="font-mono text-xs sm:text-sm text-text-muted mb-8">{p.updated}</p>
        <p className="text-text-main leading-relaxed mb-10">{p.intro}</p>

        {p.sections.map((section) => (
          <section key={section.title} className="mb-10">
            <h2 className="text-lg sm:text-xl font-bold font-heading text-primary uppercase tracking-wide mb-4">{section.title}</h2>
            <ul className="space-y-2.5 text-text-main leading-relaxed list-disc pl-5 marker:text-primary">
              {section.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        ))}

        <p className="font-mono text-xs sm:text-sm text-text-muted border-t border-border pt-6">{p.contact}</p>
      </main>
    </div>
  )
}
