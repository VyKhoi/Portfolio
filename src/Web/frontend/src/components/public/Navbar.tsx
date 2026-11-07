import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { useLang, useT } from "../../lib/i18n"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const lang = useLang()
  const t = useT()

  const links = [
    { name: t.nav.about, href: "#about" },
    { name: t.nav.experience, href: "#experience" },
    { name: t.nav.contact, href: "#contact" },
  ]

  const languageLink = (
    <Link
      to={lang === "vi" ? "/en" : "/"}
      hrefLang={lang === "vi" ? "en" : "vi"}
      lang={lang === "vi" ? "en" : "vi"}
      aria-label={`${lang === "vi" ? "EN" : "VI"}: ${t.switchLabel}`}
      className="font-mono text-xs font-bold tracking-widest text-text-muted hover:text-primary transition-colors px-3 lg:px-0 h-full flex items-center"
    >
      {lang === "vi" ? "EN" : "VI"}
    </Link>
  )

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-obsidian/90 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between lg:grid lg:grid-cols-12 h-16 lg:h-20">

        {/* Logo - 3 cols on Desktop */}
        <div className="lg:col-span-3 flex items-center px-4 sm:px-6 lg:px-8 lg:border-r border-border h-full">
          <a href="#top" className="flex items-center gap-2.5 sm:gap-3 group">
            <img
              src="/favicon-96x96.png?v=2"
              alt="" 
              width={36}
              height={36}
              decoding="async"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-primary/40 group-hover:border-primary transition-all shadow-sm shrink-0"
            />
            <span className="font-mono font-bold text-base sm:text-lg md:text-xl tracking-tight text-text-main whitespace-nowrap">
              dangvykhoi<span className="text-primary">.com</span>
            </span>
          </a>
        </div>

        {/* Desktop Nav - 6 cols */}
        <div className="hidden lg:flex lg:col-span-6 items-center justify-center space-x-12 border-r border-border h-full">
          {links.map((link) => (
            <a key={link.name} href={link.href} className="font-mono text-xs font-bold tracking-widest text-text-muted hover:text-primary transition-colors">
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop CTA - 3 cols */}
        <div className="hidden lg:flex lg:col-span-3 items-center justify-end gap-6 px-6 lg:px-8 h-full">
          {languageLink}
          <a href="/cv.pdf" target="_blank" rel="noopener" className="font-mono text-xs font-bold tracking-widest text-primary hover:text-text-main transition-colors flex items-center group">
            <span className="mr-2">&gt;</span> {t.downloadCv}
            <div className="w-8 h-[1px] bg-primary ml-4 group-hover:w-12 transition-all duration-300" />
          </a>
        </div>

        {/* Mobile Toggle */}
        <div className="lg:hidden flex items-center justify-end border-l border-border h-full">
          {languageLink}
          <button
            className="text-text-main hover:text-primary transition-colors px-5 h-full flex items-center justify-center"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? t.closeMenu : t.openMenu}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out border-border bg-obsidian ${
          isOpen ? 'max-h-96 border-t opacity-100 visible' : 'max-h-0 opacity-0 invisible'
        }`}
      >
        <div className="flex flex-col">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="px-6 py-4 font-mono text-xs font-bold tracking-widest text-text-muted hover:text-primary hover:bg-surface transition-all border-b border-border block"
            >
              {link.name}
            </a>
          ))}
          <a href="/cv.pdf" target="_blank" rel="noopener" className="px-6 py-4 font-mono text-xs font-bold tracking-widest text-primary hover:bg-surface transition-all block">
            &gt; {t.downloadCv}
          </a>
        </div>
      </div>
    </nav>
  )
}
