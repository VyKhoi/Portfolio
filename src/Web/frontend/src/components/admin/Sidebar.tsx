import { Link, useLocation } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"
import { useAdminThemeStore } from "../../store/adminThemeStore"
import { Terminal, Inbox, FolderGit2, LogOut, User, Briefcase, Code, BotMessageSquare, Sun, Moon, ExternalLink } from "lucide-react"

export function Sidebar() {
  const { logout, user } = useAuthStore()
  const { theme, setTheme } = useAdminThemeStore()
  const location = useLocation()

  const links = [
    { name: "Overview", path: "/dashboard", icon: Terminal, exact: true },
    { name: "Profile", path: "/dashboard/profile", icon: User, exact: false },
    { name: "Experiences", path: "/dashboard/experiences", icon: Briefcase, exact: false },
    { name: "Skills", path: "/dashboard/skills", icon: Code, exact: false },
    { name: "Projects", path: "/dashboard/projects", icon: FolderGit2, exact: false },
    { name: "Inbox", path: "/dashboard/inbox", icon: Inbox, exact: false },
    { name: "AI Logs", path: "/dashboard/ai-logs", icon: BotMessageSquare, exact: false },
  ]

  return (
    <aside
      className="w-64 min-h-screen border-r adm-divider flex flex-col font-mono shrink-0 transition-colors duration-200"
      style={{ backgroundColor: "var(--adm-bg-sidebar)" }}
    >
      {/* Brand Header */}
      <div className="p-6 border-b adm-divider">
        <div className="flex items-center space-x-2 adm-text-accent font-bold text-lg mb-1.5">
          <Terminal className="w-5 h-5" />
          <span>ADMIN_CONSOLE</span>
        </div>
        <div className="text-xs adm-text-muted uppercase tracking-widest flex items-center justify-between">
          <span>SYS_ADMIN: {user?.name || "root"}</span>
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--adm-success)" }}
            title="Session Active"
          />
        </div>
      </div>

      {/* Segmented Dual-Theme Switcher */}
      <div className="px-4 pt-4">
        <div className="text-[10px] adm-text-muted uppercase tracking-widest mb-1.5 px-1">
          INTERFACE_THEME
        </div>
        <div
          className="grid grid-cols-2 p-1 rounded-md border adm-divider"
          style={{ backgroundColor: "var(--adm-bg-elevated)" }}
        >
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-bold transition-all cursor-pointer ${
              theme === "dark"
                ? "adm-badge-accent shadow-sm"
                : "adm-text-muted hover:opacity-80"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>DARK</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-bold transition-all cursor-pointer ${
              theme === "light"
                ? "adm-badge-accent shadow-sm"
                : "adm-text-muted hover:opacity-80"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>LIGHT</span>
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5">
        {links.map(link => {
          const isActive = link.exact 
            ? location.pathname === link.path
            : location.pathname.includes(link.path)
          return (
            <Link 
              key={link.name} 
              to={link.path}
              style={
                isActive
                  ? {
                      backgroundColor: "var(--adm-accent-soft)",
                      borderColor: "var(--adm-accent-border)",
                      color: "var(--adm-accent)",
                    }
                  : undefined
              }
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-md border transition-all ${
                isActive 
                  ? "font-bold shadow-xs" 
                  : "border-transparent adm-text-secondary hover:bg-[var(--adm-bg-hover)] hover:text-[var(--adm-text)]"
              }`}
            >
              <link.icon className="w-4 h-4" />
              <span className="uppercase text-xs tracking-wider">{link.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t adm-divider space-y-2">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-4 py-2.5 w-full rounded-md text-xs uppercase tracking-wider adm-btn-secondary"
        >
          <span>VIEW_LIVE_SITE</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button 
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-2.5 w-full text-left adm-text-secondary hover:text-[var(--adm-danger)] hover:bg-[var(--adm-danger-soft)] rounded-md transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="uppercase text-xs tracking-wider font-bold">TERMINATE_SESSION</span>
        </button>
      </div>
    </aside>
  )
}
