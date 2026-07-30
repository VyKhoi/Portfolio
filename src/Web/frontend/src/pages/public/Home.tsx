import { Navbar } from "../../components/public/Navbar"
import { HeroSection } from "../../components/public/HeroSection"
import { AboutSection } from "../../components/public/AboutSection"
import { ProjectsBento } from "../../components/public/ProjectsBento"
import { ContactSection } from "../../components/public/ContactSection"
import { Footer } from "../../components/public/Footer"

export function Home() {
  return (
    <main className="bg-[#0A0A0C] min-h-screen text-white selection:bg-[#DEFF9A] selection:text-black">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <ProjectsBento />
      <ContactSection />
      <Footer />
    </main>
  )
}
