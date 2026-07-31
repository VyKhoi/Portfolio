import { useState } from "react"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const links = [
    { name: "ABOUT", href: "#about" },
    { name: "EXPERIENCE", href: "#experience" },
    { name: "CONTACT", href: "#contact" },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-obsidian/90 backdrop-blur-md border-b border-border">
      <div className="grid grid-cols-2 lg:grid-cols-12 h-20">
        
        {/* Logo - 3 cols */}
        <div className="lg:col-span-3 flex items-center px-4 lg:px-8 border-r border-border h-full">
          <span className="font-heading font-bold text-xl md:text-2xl tracking-tighter text-text-main">
            KHOI<span className="text-primary">.</span>DEV
          </span>
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
        <div className="hidden lg:flex lg:col-span-3 items-center justify-end px-6 lg:px-8 h-full">
          <a href="/cv.pdf" target="_blank" className="font-mono text-xs font-bold tracking-widest text-primary hover:text-text-main transition-colors flex items-center group">
            <span className="mr-2">&gt;</span> DOWNLOAD_CV
            <div className="w-8 h-[1px] bg-primary ml-4 group-hover:w-12 transition-all duration-300" />
          </a>
        </div>

        {/* Mobile Toggle */}
        <div className="lg:hidden flex items-center justify-end px-6 h-full">
          <button 
            className="text-text-main focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out border-border bg-obsidian ${
          isOpen ? 'max-h-96 border-t opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col">
          {links.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              onClick={() => setIsOpen(false)}
              className="px-6 py-4 font-mono text-sm font-bold tracking-widest text-text-muted hover:text-primary hover:bg-surface transition-all border-b border-border block"
            >
              {link.name}
            </a>
          ))}
          <a href="/cv.pdf" target="_blank" className="px-6 py-4 font-mono text-sm font-bold tracking-widest text-primary hover:bg-surface transition-all block">
            DOWNLOAD_CV
          </a>
        </div>
      </div>
    </nav>
  )
}
