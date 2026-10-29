import { useEffect } from "react"
import { Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query"
import { Sidebar } from "./Sidebar"
import { DashboardOverview } from "./DashboardOverview"
import { ExperienceCRUD } from "./ExperienceCRUD"
import { SkillCRUD } from "./SkillCRUD"
import { ProjectCRUD } from "./ProjectCRUD"
import { InboxTable } from "./InboxTable"
import { AIChatLogs } from "./AIChatLogs"
import { ProfileSettings } from "./ProfileSettings"
import { useAuthStore } from "../../store/authStore"
import { useAdminThemeStore } from "../../store/adminThemeStore"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function AdminPrefetcher() {
  const qc = useQueryClient()
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    const baseUrl = "/api"
    const authHeaders: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {}

    qc.prefetchQuery({
      queryKey: ["profile"],
      queryFn: async () => {
        const res = await fetch(`${baseUrl}/content/profile`)
        if (!res.ok) throw new Error("Failed to fetch profile")
        return res.json()
      },
    })
    qc.prefetchQuery({
      queryKey: ["experiences"],
      queryFn: async () => {
        const res = await fetch(`${baseUrl}/content/experience`)
        if (!res.ok) throw new Error("Failed to fetch experiences")
        return res.json()
      },
    })
    qc.prefetchQuery({
      queryKey: ["skills"],
      queryFn: async () => {
        const res = await fetch(`${baseUrl}/content/skills`)
        if (!res.ok) throw new Error("Failed to fetch skills")
        return res.json()
      },
    })
    qc.prefetchQuery({
      queryKey: ["projects"],
      queryFn: async () => {
        const res = await fetch(`${baseUrl}/content/projects`)
        if (!res.ok) throw new Error("Failed to fetch projects")
        return res.json()
      },
    })

    if (token) {
      qc.prefetchQuery({
        queryKey: ["inbox"],
        queryFn: async () => {
          const res = await fetch(`${baseUrl}/contact/messages`, {
            headers: authHeaders,
          })
          if (!res.ok) throw new Error("Failed to fetch inbox")
          return res.json()
        },
      })
      qc.prefetchQuery({
        queryKey: ["ai-sessions"],
        queryFn: async () => {
          const res = await fetch(`${baseUrl}/ai/sessions`, {
            headers: authHeaders,
          })
          if (!res.ok) throw new Error("Failed to fetch ai sessions")
          return res.json()
        },
      })
    }
  }, [qc, token])

  return null
}

export function AdminLayout() {
  const theme = useAdminThemeStore((state) => state.theme)

  return (
    <QueryClientProvider client={queryClient}>
      <AdminPrefetcher />
      <div
        data-theme={theme}
        className="admin-theme flex flex-col lg:flex-row h-dvh overflow-hidden"
      >
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6 sm:pb-24 lg:p-8 lg:pb-8 adm-scroll">
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/" element={<DashboardOverview />} />
              <Route path="/profile" element={<ProfileSettings />} />
              <Route path="/experience" element={<ExperienceCRUD />} />
              <Route path="/skills" element={<SkillCRUD />} />
              <Route path="/projects" element={<ProjectCRUD />} />
              <Route path="/inbox" element={<InboxTable />} />
              <Route path="/ai-logs" element={<AIChatLogs />} />
            </Routes>
          </div>
        </main>
      </div>
    </QueryClientProvider>
  )
}
