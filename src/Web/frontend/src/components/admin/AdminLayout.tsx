import React, { useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Sidebar } from "./Sidebar"
import { DashboardOverview } from "./DashboardOverview"
import { InboxTable } from "./InboxTable"
import { ProjectCRUD } from "./ProjectCRUD"
import { ProfileSettings } from "./ProfileSettings"
import { ExperienceCRUD } from "./ExperienceCRUD"
import { SkillCRUD } from "./SkillCRUD"
import { AIChatLogs } from "./AIChatLogs"
import { API_BASE_URL } from "../../lib/api"
import { useAuthStore } from "../../store/authStore"
import { useAdminThemeStore } from "../../store/adminThemeStore"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function AdminPrefetcher() {
  const token = useAuthStore(state => state.token)

  useEffect(() => {
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
    const fetchJson = async (path: string, auth = false) => {
      const res = await fetch(`${API_BASE_URL}${path}`, auth ? { headers: authHeaders } : undefined)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    }

    // Warm all admin caches in parallel so clicking between Sidebar tabs is instantaneous
    queryClient.prefetchQuery({ queryKey: ['profile'], queryFn: () => fetchJson('/content/profile') })
    queryClient.prefetchQuery({ queryKey: ['experiences'], queryFn: () => fetchJson('/content/experience') })
    queryClient.prefetchQuery({ queryKey: ['skills'], queryFn: () => fetchJson('/content/skills') })
    queryClient.prefetchQuery({ queryKey: ['projects'], queryFn: () => fetchJson('/content/projects', true) })
    queryClient.prefetchQuery({ queryKey: ['messages'], queryFn: () => fetchJson('/contact/messages', true) })
    queryClient.prefetchQuery({ queryKey: ['ai-sessions'], queryFn: () => fetchJson('/ai/sessions', true) })
  }, [token])

  return null
}

export function AdminLayout({ children }: { children?: React.ReactNode }) {
  const theme = useAdminThemeStore(state => state.theme)

  return (
    <QueryClientProvider client={queryClient}>
      <AdminPrefetcher />
      <div
        data-theme={theme}
        className="admin-theme flex min-h-screen"
      >
        <Sidebar />
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children ?? (
              <Routes>
                <Route index element={<DashboardOverview />} />
                <Route path="inbox" element={<InboxTable />} />
                <Route path="projects" element={<ProjectCRUD />} />
                <Route path="profile" element={<ProfileSettings />} />
                <Route path="experiences" element={<ExperienceCRUD />} />
                <Route path="skills" element={<SkillCRUD />} />
                <Route path="ai-logs" element={<AIChatLogs />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            )}
          </div>
        </main>
      </div>
    </QueryClientProvider>
  )
}
