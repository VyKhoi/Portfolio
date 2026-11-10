import { useEffect } from "react"
import { Navbar } from "../../components/public/Navbar"
import { HeroSection } from "../../components/public/HeroSection"
import { AboutSection } from "../../components/public/AboutSection"
import { ProjectsSection } from "../../components/public/ProjectsSection"
import { NowSection } from "../../components/public/NowSection"
import { ProjectsBento } from "../../components/public/ProjectsBento"
import { ContactSection } from "../../components/public/ContactSection"
import { Footer } from "../../components/public/Footer"
import { useLang, useT } from "../../lib/i18n"
import seo from "../../content/seo.json"

export function Home() {
  const lang = useLang()
  const t = useT()

  // The static HTML already has these; keep them right after switching language in the browser
  useEffect(() => {
    document.documentElement.lang = lang
    document.title = seo[lang].title
    document.querySelector('meta[name="description"]')?.setAttribute('content', seo[lang].description)
  }, [lang])

  return (
    <div className="bg-obsidian min-h-screen text-white selection:bg-primary selection:text-black">
      <a href="#main" className="skip-link">{t.skipToContent}</a>
      <Navbar />
      <main id="main">
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <ProjectsBento />
        <NowSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}
