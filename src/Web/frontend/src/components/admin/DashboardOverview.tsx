import { useQuery } from "@tanstack/react-query"
import { Mail, Briefcase, Activity, CheckCircle2, Code, FolderGit2, BotMessageSquare, Loader2 } from "lucide-react"
import { API_BASE_URL } from "../../lib/api"
import { useAuthStore } from "../../store/authStore"
import { AdminLoader, RefreshingBadge } from "./AdminLoader"

export function DashboardOverview() {
  const token = useAuthStore(state => state.token)
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

  const { data: messages = [], isLoading: loadingMsg, isFetching: fetchingMsg } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/contact/messages`, { headers: authHeaders })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const { data: projects = [], isLoading: loadingProj, isFetching: fetchingProj } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/content/projects`, { headers: authHeaders })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const { data: experiences = [], isLoading: loadingExp } = useQuery({
    queryKey: ['experiences'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/content/experience`)
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const { data: skills = [], isLoading: loadingSkills } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/content/skills`)
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const { data: sessions = [], isLoading: loadingAi } = useQuery({
    queryKey: ['ai-sessions'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/ai/sessions`, { headers: authHeaders })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const isInitialLoading = loadingMsg && loadingProj && loadingExp && loadingSkills
  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-heading font-bold mb-8">SYSTEM_OVERVIEW</h1>
        <AdminLoader label="LOADING_SYSTEM_METRICS..." variant="grid" rows={6} />
      </div>
    )
  }

  const unreadMessages = messages.filter((m: any) => m.status === 'Pending').length
  const isRefreshing = (fetchingMsg || fetchingProj) && !isInitialLoading

  const cards = [
    {
      label: "TOTAL_PROJECTS",
      value: projects.length,
      loading: loadingProj,
      icon: FolderGit2,
      colorClass: "adm-text-accent",
    },
    {
      label: "EXPERIENCES",
      value: experiences.length,
      loading: loadingExp,
      icon: Briefcase,
      colorClass: "adm-text-accent",
    },
    {
      label: "SKILLS_INDEXED",
      value: skills.length,
      loading: loadingSkills,
      icon: Code,
      colorClass: "adm-text-info",
    },
    {
      label: "UNREAD_MESSAGES",
      value: unreadMessages,
      loading: loadingMsg,
      icon: Mail,
      colorClass: "adm-text-info",
    },
    {
      label: "AI_CHAT_SESSIONS",
      value: sessions.length,
      loading: loadingAi,
      icon: BotMessageSquare,
      colorClass: "adm-text-accent",
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold">SYSTEM_OVERVIEW</h1>
          <p className="text-xs font-mono adm-text-muted mt-1">
            REALTIME_TELEMETRY_AND_CONTENT_METRICS
          </p>
        </div>
        <RefreshingBadge show={isRefreshing} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="p-6 adm-card adm-card-hover rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="adm-text-secondary font-mono text-xs font-bold tracking-wider">{card.label}</h2>
              <card.icon className={`w-5 h-5 ${card.colorClass}`} />
            </div>
            {card.loading ? (
              <div className="h-10 w-20 adm-elevated rounded animate-pulse flex items-center justify-center">
                <Loader2 className="w-4 h-4 adm-text-muted animate-spin" />
              </div>
            ) : (
              <p className="text-4xl font-bold font-heading">{card.value}</p>
            )}
          </div>
        ))}

        <div className="p-6 adm-card adm-card-hover rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="adm-text-secondary font-mono text-xs font-bold tracking-wider">SYSTEM_STATUS</h2>
            <Activity className="w-5 h-5 adm-text-success" />
          </div>
          <p className="text-2xl font-bold adm-text-success flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-6 h-6" /> ONLINE
          </p>
        </div>
      </div>
    </div>
  )
}
