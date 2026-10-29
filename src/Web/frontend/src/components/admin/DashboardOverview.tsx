import { useQuery } from "@tanstack/react-query"
import { Mail, Briefcase, Activity, CheckCircle2, Code, FolderGit2, BotMessageSquare, Loader2 } from "lucide-react"
import { API_BASE_URL } from "../../lib/api"
import { useAuthStore } from "../../store/authStore"
import { AdminLoader, RefreshingBadge } from "./AdminLoader"

export function DashboardOverview() {
  const token = useAuthStore(state => state.token)
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

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
        <h1 className="text-3xl font-heading font-bold text-white mb-8">SYSTEM_OVERVIEW</h1>
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
      color: "text-[#DEFF9A]",
    },
    {
      label: "EXPERIENCES",
      value: experiences.length,
      loading: loadingExp,
      icon: Briefcase,
      color: "text-[#DEFF9A]",
    },
    {
      label: "SKILLS_INDEXED",
      value: skills.length,
      loading: loadingSkills,
      icon: Code,
      color: "text-[#00E5FF]",
    },
    {
      label: "UNREAD_MESSAGES",
      value: unreadMessages,
      loading: loadingMsg,
      icon: Mail,
      color: "text-[#00E5FF]",
    },
    {
      label: "AI_CHAT_SESSIONS",
      value: sessions.length,
      loading: loadingAi,
      icon: BotMessageSquare,
      color: "text-[#DEFF9A]",
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-heading font-bold text-white">SYSTEM_OVERVIEW</h1>
        <RefreshingBadge show={isRefreshing} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="p-6 bg-[#121215] border border-[#27272A] rounded-lg hover:border-[#3F3F46] transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-400 font-mono text-sm">{card.label}</h3>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            {card.loading ? (
              <div className="h-10 w-20 bg-[#18181C] border border-[#27272A] rounded animate-pulse flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
              </div>
            ) : (
              <p className="text-4xl font-bold text-white">{card.value}</p>
            )}
          </div>
        ))}

        <div className="p-6 bg-[#121215] border border-[#27272A] rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-mono text-sm">SYSTEM_STATUS</h3>
            <Activity className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-500 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" /> ONLINE
          </p>
        </div>
      </div>
    </div>
  )
}
