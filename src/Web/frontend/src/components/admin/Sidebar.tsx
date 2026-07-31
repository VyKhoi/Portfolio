import { Link, useLocation } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"
import { Terminal, Inbox, FolderGit2, LogOut, User, Briefcase, Code, BotMessageSquare } from "lucide-react"

export function Sidebar() {
  const { logout, user } = useAuthStore()
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
    <div className="w-64 h-screen bg-[#0A0A0C] border-r border-[#27272A] flex flex-col font-mono">
      <div className="p-6 border-b border-[#27272A]">
        <div className="flex items-center space-x-2 text-[#DEFF9A] font-bold text-lg mb-2">
          <Terminal className="w-5 h-5" />
          <span>ADMIN_CONSOLE</span>
        </div>
        <div className="text-xs text-zinc-500 uppercase tracking-widest">
          SYS_ADMIN: {user?.name || "root"}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {links.map(link => {
          const isActive = link.exact 
            ? location.pathname === link.path
            : location.pathname.includes(link.path)
          return (
            <Link 
              key={link.name} 
              to={link.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                isActive 
                  ? "bg-[#18181C] text-[#DEFF9A] border border-[#3F3F46]" 
                  : "text-zinc-400 hover:text-white hover:bg-[#121215] border border-transparent"
              }`}
            >
              <link.icon className="w-4 h-4" />
              <span className="uppercase text-sm tracking-wider">{link.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-[#27272A]">
        <button 
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-3 w-full text-left text-zinc-400 hover:text-[#F43F5E] hover:bg-[#F43F5E]/10 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="uppercase text-sm tracking-wider">TERMINATE_SESSION</span>
        </button>
      </div>
    </div>
  )
}
