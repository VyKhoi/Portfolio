import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "../../store/authStore"
import { Trash2, CheckCircle, Clock, Inbox, Loader2 } from "lucide-react"
import { AdminLoader } from "./AdminLoader"

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: string
  createdAt: string
}

export function InboxTable() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()
  const baseUrl = "/api"
  const [busyId, setBusyId] = useState<string | null>(null)

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["inbox"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/contact/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
  })

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      setBusyId(id)
      const res = await fetch(`${baseUrl}/contact/messages/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "Read" }),
      })
      if (!res.ok) throw new Error("Failed to update status")
    },
    onSettled: () => {
      setBusyId(null)
      queryClient.invalidateQueries({ queryKey: ["inbox"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setBusyId(id)
      const res = await fetch(`${baseUrl}/contact/messages/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSettled: () => {
      setBusyId(null)
      queryClient.invalidateQueries({ queryKey: ["inbox"] })
    },
  })

  if (isLoading) {
    return <AdminLoader label="SCANNING_INBOX_QUEUE..." rows={4} />
  }

  return (
    <div className="font-mono">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6 sm:mb-8">
        <div className="flex items-center space-x-3">
          <Inbox className="w-6 h-6 sm:w-7 sm:h-7 adm-text-accent shrink-0" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight adm-text">
            INBOX_QUEUE
          </h1>
        </div>
        <span className="adm-badge-info">{messages.length} MESSAGES</span>
      </div>

      {/* Desktop / Tablet Table View */}
      <div className="hidden md:block adm-card rounded-lg overflow-hidden">
        <div className="overflow-x-auto adm-scroll">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="border-b adm-divider adm-text-muted text-xs"
                style={{ backgroundColor: "var(--adm-bg-elevated)" }}
              >
                <th className="p-4">STATUS</th>
                <th className="p-4">SENDER</th>
                <th className="p-4">MESSAGE</th>
                <th className="p-4">DATE</th>
                <th className="p-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y adm-divider text-sm">
              {messages.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center adm-text-muted">
                    NO_MESSAGES_IN_QUEUE
                  </td>
                </tr>
              )}
              {messages.map((m: ContactMessage) => {
                const isRead = m.status === "Read"
                const isRowBusy = busyId === m.id
                return (
                  <tr
                    key={m.id}
                    className="transition-colors"
                    style={{
                      backgroundColor: isRead
                        ? "transparent"
                        : "var(--adm-accent-soft)",
                      opacity: isRead ? 0.72 : 1,
                    }}
                  >
                    <td className="p-4 whitespace-nowrap">
                      {isRead ? (
                        <span className="inline-flex items-center space-x-1.5 adm-text-muted text-xs">
                          <CheckCircle className="w-4 h-4" />
                          <span>READ</span>
                        </span>
                      ) : (
                        <span className="adm-badge-accent">
                          <Clock className="w-3.5 h-3.5" />
                          <span>NEW</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-bold adm-text">{m.name}</div>
                      <div className="text-xs adm-text-muted">{m.email}</div>
                    </td>
                    <td className="p-4 max-w-md">
                      <p className="adm-text-secondary whitespace-pre-wrap text-xs leading-relaxed">
                        {m.message}
                      </p>
                    </td>
                    <td className="p-4 text-xs adm-text-muted whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="inline-flex space-x-2">
                        {!isRead && (
                          <button
                            type="button"
                            disabled={isRowBusy}
                            onClick={() => markReadMutation.mutate(m.id)}
                            title="Mark as Read"
                            className="adm-btn-icon disabled:opacity-50"
                          >
                            {isRowBusy && markReadMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isRowBusy}
                          onClick={() => deleteMutation.mutate(m.id)}
                          title="Delete"
                          className="adm-btn-icon adm-btn-icon-danger disabled:opacity-50"
                        >
                          {isRowBusy && deleteMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {messages.length === 0 && (
          <div className="adm-card p-8 rounded-lg text-center adm-text-muted text-xs">
            NO_MESSAGES_IN_QUEUE
          </div>
        )}
        {messages.map((m: ContactMessage) => {
          const isRead = m.status === "Read"
          const isRowBusy = busyId === m.id
          return (
            <div
              key={m.id}
              className="adm-card p-4 rounded-lg space-y-3"
              style={{
                borderLeft: isRead
                  ? undefined
                  : "3px solid var(--adm-accent)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                {isRead ? (
                  <span className="inline-flex items-center space-x-1.5 adm-text-muted text-xs">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>READ</span>
                  </span>
                ) : (
                  <span className="adm-badge-accent">
                    <Clock className="w-3.5 h-3.5" />
                    <span>NEW</span>
                  </span>
                )}
                <span className="text-[11px] adm-text-muted">
                  {new Date(m.createdAt).toLocaleString()}
                </span>
              </div>

              <div>
                <div className="font-bold text-sm adm-text">{m.name}</div>
                <div className="text-xs adm-text-info break-all">{m.email}</div>
              </div>

              <p className="adm-text-secondary text-xs leading-relaxed whitespace-pre-wrap p-3 rounded adm-elevated">
                {m.message}
              </p>

              <div className="flex justify-end gap-2 pt-1">
                {!isRead && (
                  <button
                    type="button"
                    disabled={isRowBusy}
                    onClick={() => markReadMutation.mutate(m.id)}
                    className="adm-btn-secondary text-xs py-1.5 px-3"
                  >
                    {isRowBusy && markReadMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 adm-text-accent" />
                    )}
                    <span>MARK_READ</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={isRowBusy}
                  onClick={() => deleteMutation.mutate(m.id)}
                  className="adm-btn-icon adm-btn-icon-danger disabled:opacity-50"
                  aria-label="Xóa tin nhắn"
                >
                  {isRowBusy && deleteMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
