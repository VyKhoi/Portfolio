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
    <div className="bg-[#0A0A0C] min-h-screen text-white">
      <header className="border-b border-[#27272A]">
        <nav className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between font-mono text-sm">
          <Link to={lang === 'vi' ? '/vi' : '/'} className="text-zinc-300 hover:text-[#DEFF9A] transition-colors">{p.back}</Link>
          <Link to={PRIVACY_PATH[other]} lang={other} className="text-zinc-300 hover:text-[#DEFF9A] transition-colors">{p.switchLabel}</Link>
        </nav>
      </header>

      <main id="main" className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-5xl font-bold font-heading uppercase tracking-tight mb-3">{p.title}</h1>
        <p className="font-mono text-xs sm:text-sm text-zinc-400 mb-8">{p.updated}</p>
        <p className="text-zinc-300 leading-relaxed mb-10">{p.intro}</p>

        {p.sections.map((section) => (
          <section key={section.title} className="mb-10">
            <h2 className="text-lg sm:text-xl font-bold font-heading text-[#DEFF9A] uppercase tracking-wide mb-4">{section.title}</h2>
            <ul className="space-y-2.5 text-zinc-300 leading-relaxed list-disc pl-5 marker:text-[#DEFF9A]">
              {section.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        ))}

        <p className="font-mono text-xs sm:text-sm text-zinc-400 border-t border-[#27272A] pt-6">{p.contact}</p>
      </main>
    </div>
  )
}
