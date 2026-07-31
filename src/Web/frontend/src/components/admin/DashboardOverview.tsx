import { useQuery } from "@tanstack/react-query"
import { Mail, Briefcase, Activity, CheckCircle2 } from "lucide-react"

export function DashboardOverview() {
  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/contact/messages`)
      if (!res.ok) throw new Error("Failed")
      return res.json()
    }
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/content/projects`)
      if (!res.ok) throw new Error("Failed")
      return res.json()
    }
  })

  const unreadMessages = messages.filter((m: any) => m.status === 'Pending').length

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading font-bold text-white mb-8">SYSTEM_OVERVIEW</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#121215] border border-[#27272A] rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-mono text-sm">TOTAL_PROJECTS</h3>
            <Briefcase className="w-5 h-5 text-[#DEFF9A]" />
          </div>
          <p className="text-4xl font-bold text-white">{projects.length}</p>
        </div>

        <div className="p-6 bg-[#121215] border border-[#27272A] rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-mono text-sm">UNREAD_MESSAGES</h3>
            <Mail className="w-5 h-5 text-[#00E5FF]" />
          </div>
          <p className="text-4xl font-bold text-white">{unreadMessages}</p>
        </div>

        <div className="p-6 bg-[#121215] border border-[#27272A] rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-mono text-sm">SYSTEM_STATUS</h3>
            <Activity className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-500 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6"/> ONLINE
          </p>
        </div>
      </div>
    </div>
  )
}
