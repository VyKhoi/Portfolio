import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  Terminal,
  Briefcase,
  Code,
  FolderGit2,
  Inbox,
  LogOut,
  Bot,
  User,
  Sun,
  Moon,
  ExternalLink,
  Menu,
  X,
} from "lucide-react"
import { useAuthStore } from "../../store/authStore"
import { useAdminThemeStore } from "../../store/adminThemeStore"

const ADMIN_LINKS = [
  { name: "OVERVIEW", shortName: "HOME", path: "/dashboard", icon: Terminal },
  { name: "PROFILE", shortName: "PROFILE", path: "/dashboard/profile", icon: User },
  { name: "EXPERIENCES", shortName: "EXP", path: "/dashboard/experience", icon: Briefcase },
  { name: "SKILLS", shortName: "SKILLS", path: "/dashboard/skills", icon: Code },
  { name: "PROJECTS", shortName: "PROJECTS", path: "/dashboard/projects", icon: FolderGit2 },
  { name: "INBOX", shortName: "INBOX", path: "/dashboard/inbox", icon: Inbox },
  { name: "AI LOGS", shortName: "AI LOGS", path: "/dashboard/ai-logs", icon: Bot },
]

export function Sidebar() {
  const location = useLocation()
  const logout = useAuthStore((state) => state.logout)
  const { theme, setTheme, toggleTheme } = useAdminThemeStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile drawer automatically on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const activeLink =
    ADMIN_LINKS.find((l) => l.path === location.pathname) || ADMIN_LINKS[0]

  const renderSidebarContent = (onItemClick?: () => void) => (
    <>
      <div className="p-5 sm:p-6 border-b adm-divider flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 adm-text-accent mb-1">
            <Terminal className="w-5 h-5" />
            <span className="font-bold tracking-wider">ADMIN_CONSOLE</span>
          </div>
          <div className="text-xs adm-text-muted">SYS_ADMIN: ROOT</div>
        </div>
        {onItemClick ? (
          <button
            type="button"
            onClick={onItemClick}
            className="adm-btn-icon lg:hidden"
            aria-label="Đóng menu"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: "var(--adm-success)" }}
            title="SYSTEM_ONLINE"
          />
        )}
      </div>

      {/* Dual-Theme Switcher */}
      <div className="px-4 pt-4 pb-2">
        <div className="text-[10px] font-bold uppercase tracking-widest adm-text-muted mb-2 px-1">
          INTERFACE_THEME
        </div>
        <div
          className="grid grid-cols-2 p-1 rounded-md border"
          style={{
            backgroundColor: "var(--adm-bg-elevated)",
            borderColor: "var(--adm-border)",
          }}
        >
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex items-center justify-center space-x-1.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
              theme === "dark"
                ? "adm-badge-accent shadow-xs"
                : "adm-text-muted hover:opacity-85"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>DARK</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex items-center justify-center space-x-1.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
              theme === "light"
                ? "adm-badge-accent shadow-xs"
                : "adm-text-muted hover:opacity-85"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>LIGHT</span>
          </button>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto adm-scroll">
        {ADMIN_LINKS.map((link) => {
          const Icon = link.icon
          const isActive = location.pathname === link.path
          return (
            <Link
              key={link.name}
              to={link.path}
              onClick={onItemClick}
              className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-all text-xs font-bold tracking-wider ${
                isActive ? "adm-badge-accent" : "adm-text-secondary"
              }`}
              style={
                !isActive
                  ? { border: "1px solid transparent" }
                  : undefined
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t adm-divider space-y-2">
        <Link
          to="/"
          onClick={onItemClick}
          className="adm-btn-secondary w-full text-xs font-bold tracking-wider"
        >
          <span>VIEW_LIVE_SITE</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <button
          type="button"
          onClick={() => {
            if (onItemClick) onItemClick()
            logout()
          }}
          className="flex items-center space-x-3 px-4 py-2.5 w-full text-left adm-text-muted hover:text-red-500 transition-colors rounded-md text-xs font-bold tracking-wider cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>TERMINATE_SESSION</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Permanent Left Sidebar */}
      <aside
        className="hidden lg:flex w-64 border-r adm-divider flex-col h-full font-mono text-sm select-none shrink-0"
        style={{ backgroundColor: "var(--adm-bg-sidebar)" }}
      >
        {renderSidebarContent()}
      </aside>

      {/* Mobile Top Header Bar */}
      <header
        className="lg:hidden flex items-center justify-between px-4 h-14 border-b adm-divider font-mono shrink-0 z-30"
        style={{ backgroundColor: "var(--adm-bg-sidebar)" }}
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="flex items-center space-x-1.5 adm-text-accent shrink-0">
            <Terminal className="w-4 h-4" />
            <span className="font-bold text-xs tracking-wider">ADMIN</span>
          </div>
          <span className="adm-text-muted text-xs">/</span>
          <span className="adm-badge-accent text-[11px] truncate">
            {activeLink.name}
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            className="adm-btn-icon"
            aria-label="Đổi giao diện Sáng / Tối"
            title={theme === "dark" ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 adm-text-accent" />
            ) : (
              <Moon className="w-4 h-4 adm-text-accent" />
            )}
          </button>
          <Link
            to="/"
            className="adm-btn-icon"
            aria-label="Mở trang chủ"
            title="Xem trang chủ"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="adm-btn-icon"
            aria-label="Mở menu quản trị"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex font-mono"
          style={{
            backgroundColor: "var(--adm-backdrop)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="w-72 max-w-[82vw] h-full border-r adm-divider flex flex-col text-sm select-none shadow-2xl"
            style={{ backgroundColor: "var(--adm-bg-sidebar)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {renderSidebarContent(() => setMobileOpen(false))}
          </aside>
        </div>
      )}

      {/* Mobile Bottom Quick-Navigation Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t adm-divider font-mono flex items-center justify-around px-1 py-1.5"
        style={{ backgroundColor: "var(--adm-bg-sidebar)" }}
      >
        {ADMIN_LINKS.map((link) => {
          const Icon = link.icon
          const isActive = location.pathname === link.path
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded min-w-[44px] transition-colors ${
                isActive ? "adm-text-accent font-bold" : "adm-text-muted"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[9px] tracking-tighter leading-none">
                {link.shortName}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
