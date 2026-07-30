export function Footer() {
  return (
    <footer className="py-8 px-8 bg-[#0A0A0C] border-t border-[#27272A] text-center">
      <div className="container mx-auto">
        <p className="text-zinc-500 font-mono text-sm">
          © {new Date().getFullYear()} ARCHITECT. SYSTEM_VERSION: 1.0.0
        </p>
      </div>
    </footer>
  )
}
