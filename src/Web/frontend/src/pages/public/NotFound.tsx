import { PROJECTS, projectPath } from "../../content/projects"

// Served by nginx for every unknown URL (dist/404.html). Rendered once at build time and shipped
// without the app bundle: plain links only, no hooks, no router.
export function NotFound() {
  return (
    <div className="relative min-h-dvh bg-obsidian text-text-main flex flex-col overflow-hidden selection:bg-primary selection:text-black">
      <div className="hidden lg:block absolute top-0 bottom-0 left-[10%] w-[1px] bg-border" />
      <div className="hidden lg:block absolute top-0 bottom-0 right-[10%] w-[1px] bg-border" />
      <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-[1px] bg-border" />

      <header className="relative z-10 h-16 lg:h-20 border-b border-border bg-obsidian/90 flex items-center px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-2.5 sm:gap-3 group">
          <img
            src="/favicon-96x96.png?v=2"
            alt=""
            width={36}
            height={36}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-primary/40 group-hover:border-primary transition-all shrink-0"
          />
          <span className="font-mono font-bold text-base sm:text-lg md:text-xl tracking-tight text-text-main whitespace-nowrap">
            dangvykhoi<span className="text-primary">.com</span>
          </span>
        </a>
      </header>

      <main id="main" className="relative z-10 flex-1 flex items-center px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="container mx-auto max-w-6xl grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7">
            <p className="mb-5 font-mono text-xs sm:text-sm font-bold tracking-widest text-primary uppercase">
              {"Error 404 // Page not found"}
            </p>
            <h1 className="font-heading font-bold leading-[0.85] tracking-tighter text-[7rem] sm:text-[10rem] md:text-[13rem] lg:text-[15rem]">
              40<span className="text-outline-primary">4</span>
            </h1>
          </div>

          <div className="lg:col-span-5 bg-obsidian">
            <p className="mb-2 font-body text-lg sm:text-xl leading-relaxed text-text-main border-l-2 border-primary pl-4">
              This page does not exist, or it has moved.
            </p>
            <p lang="vi" className="mb-8 font-body text-base sm:text-lg leading-relaxed text-text-muted pl-[1.125rem]">
              Trang này không tồn tại hoặc đã được chuyển đi.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-10">
              <a
                href="/"
                className="inline-flex h-12 items-center justify-center bg-primary px-4 font-mono text-xs font-bold tracking-widest text-black uppercase hover:bg-primary-hover transition-colors"
              >
                Back home
              </a>
              <a
                href="/vi"
                lang="vi"
                className="inline-flex h-12 items-center justify-center border border-primary px-4 font-mono text-xs font-bold tracking-widest text-primary uppercase hover:bg-primary hover:text-black transition-colors"
              >
                Về trang chủ
              </a>
            </div>

            <p className="mb-3 font-mono text-xs font-bold tracking-widest text-text-muted uppercase">
              {"Or have a look at // Hoặc xem thử"}
            </p>
            <ul className="border border-border divide-y divide-border">
              {PROJECTS.map((project) => (
                <li key={project.slug}>
                  <a
                    href={projectPath(project.slug, "en")}
                    className="group flex items-center justify-between gap-4 bg-obsidian px-5 py-4 hover:bg-surface transition-colors"
                  >
                    <span className="min-w-0">
                      <span className="block font-heading text-lg sm:text-xl font-bold uppercase tracking-tighter text-text-main group-hover:text-primary transition-colors">
                        {project.copy.en.name}
                      </span>
                      <span className="block font-mono text-xs tracking-widest text-text-muted uppercase">{project.copy.en.kind}</span>
                    </span>
                    <span className="font-mono text-xl text-primary transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-6 px-8 border-t border-border bg-obsidian text-center font-mono text-sm text-text-muted">
        © Đặng Vỹ Khôi
      </footer>
    </div>
  )
}
