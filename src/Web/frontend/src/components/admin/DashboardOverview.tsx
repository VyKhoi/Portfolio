import { useQuery } from "@tanstack/react-query"
import { Activity, FolderGit2, Mail, Briefcase, Code, Bot, CheckCircle2 } from "lucide-react"
import { useAuthStore } from "../../store/authStore"
import { AdminLoader } from "./AdminLoader"

export function DashboardOverview() {
  const token = useAuthStore((state) => state.token)
  const baseUrl = "/api"
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  const { data: projects = [], isLoading: l1 } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/content/projects`)
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
  })

  const { data: experiences = [], isLoading: l2 } = useQuery({
    queryKey: ["experiences"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/content/experiences`)
      if (!res.ok) throw new Error("Failed to fetch experiences")
      return res.json()
    },
  })

  const { data: skills = [], isLoading: l3 } = useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/content/skills`)
      if (!res.ok) throw new Error("Failed to fetch skills")
      return res.json()
    },
  })

  const { data: inbox = [], isLoading: l4 } = useQuery({
    queryKey: ["inbox"],
    queryFn: async () => {
      if (!token) return []
      const res = await fetch(`${baseUrl}/contact/messages`, {
        headers: authHeaders,
      })
      if (!res.ok) throw new Error("Failed to fetch inbox")
      return res.json()
    },
  })

  const { data: aiSessions = [], isLoading: l5 } = useQuery({
    queryKey: ["ai-sessions"],
    queryFn: async () => {
      if (!token) return []
      const res = await fetch(`${baseUrl}/ai/sessions`, {
        headers: authHeaders,
      })
      if (!res.ok) throw new Error("Failed to fetch ai sessions")
      return res.json()
    },
  })

  const isLoading = l1 || l2 || l3 || l4 || l5

  if (isLoading) {
    return <AdminLoader label="LOADING_SYSTEM_TELEMETRY..." variant="grid" rows={6} />
  }

  const unreadMessages = Array.isArray(inbox)
    ? inbox.filter((m: any) => m.status !== "Read").length
    : 0

  const cards = [
    {
      label: "TOTAL_PROJECTS",
      value: Array.isArray(projects) ? projects.length : 0,
      icon: FolderGit2,
      tone: "accent",
    },
    {
      label: "EXPERIENCES",
      value: Array.isArray(experiences) ? experiences.length : 0,
      icon: Briefcase,
      tone: "accent",
    },
    {
      label: "SKILLS_INDEXED",
      value: Array.isArray(skills) ? skills.length : 0,
      icon: Code,
      tone: "info",
    },
    {
      label: "UNREAD_MESSAGES",
      value: unreadMessages,
      icon: Mail,
      tone: "info",
    },
    {
      label: "AI_CHAT_SESSIONS",
      value: Array.isArray(aiSessions) ? aiSessions.length : 0,
      icon: Bot,
      tone: "accent",
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 sm:mb-2 adm-text">
          SYSTEM_OVERVIEW
        </h1>
        <p className="adm-text-muted font-mono text-xs sm:text-sm break-words">
          REALTIME_TELEMETRY_AND_CONTENT_METRICS
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {cards.map((card) => {
          const Icon = card.icon
          const iconClass =
            card.tone === "info" ? "adm-text-info" : "adm-text-accent"
          return (
            <div
              key={card.label}
              className="p-5 sm:p-6 adm-card adm-card-hover rounded-lg"
            >
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div className="adm-text-muted font-mono text-xs uppercase tracking-wider">
                  {card.label}
                </div>
                <Icon className={`w-5 h-5 shrink-0 ${iconClass}`} />
              </div>
              <div className="text-3xl sm:text-4xl font-bold font-heading adm-text">
                {card.value}
              </div>
            </div>
          )
        })}

        <div className="p-5 sm:p-6 adm-card adm-card-hover rounded-lg">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <div className="adm-text-muted font-mono text-xs uppercase tracking-wider">
              SYSTEM_STATUS
            </div>
            <Activity className="w-5 h-5 adm-text-success shrink-0" />
          </div>
          <div className="flex items-center space-x-2 text-xl sm:text-2xl font-bold font-mono adm-text-success pt-1">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            <span>ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  )
}
