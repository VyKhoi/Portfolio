import { useState } from "react"
import { Mail, CheckCircle2, Trash2, Loader2, Inbox } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "../../store/authStore"
import { API_BASE_URL } from "../../lib/api"
import { AdminLoader, RefreshingBadge } from "./AdminLoader"

export function InboxTable() {
  const queryClient = useQueryClient()
  const token = useAuthStore(state => state.token)
  const [busyId, setBusyId] = useState<string | null>(null)

  const { data: messages = [], isLoading, isFetching } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/contact/messages`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      })
      if (!res.ok) throw new Error("Failed to fetch messages")
      return res.json()
    }
  })

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      setBusyId(id)
      const res = await fetch(`${API_BASE_URL}/contact/messages/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: 'Read' })
      })
      if (!res.ok) throw new Error("Failed to update status")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
    onSettled: () => setBusyId(null)
  })

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      setBusyId(id)
      const res = await fetch(`${API_BASE_URL}/contact/messages/${id}`, {
        method: 'DELETE',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      })
      if (!res.ok) throw new Error("Failed to delete message")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
    onSettled: () => setBusyId(null)
  })

  if (isLoading) {
    return (
      <div className="space-y-6 font-mono">
        <div className="flex items-center space-x-3 adm-text-accent">
          <Inbox className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider">INBOX_QUEUE</h1>
        </div>
        <AdminLoader label="LOADING_INBOX_QUEUE..." variant="table" rows={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6 font-mono animate-in fade-in duration-200">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3 adm-text-accent">
          <Inbox className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider">INBOX_QUEUE</h1>
          <RefreshingBadge show={isFetching && !isLoading} />
        </div>
        <span className="adm-badge-info">{messages.length} MESSAGES</span>
      </div>

      <div className="adm-card rounded-lg overflow-hidden">
        <table className="w-full text-left font-mono text-sm">
          <thead
            className="adm-text-muted border-b adm-divider text-xs"
            style={{ backgroundColor: "var(--adm-bg-elevated)" }}
          >
            <tr>
              <th className="p-4 font-bold uppercase tracking-wider">Status</th>
              <th className="p-4 font-bold uppercase tracking-wider">Sender</th>
              <th className="p-4 font-bold uppercase tracking-wider">Message</th>
              <th className="p-4 font-bold uppercase tracking-wider">Date</th>
              <th className="p-4 font-bold uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y adm-divider">
            {messages.map((msg: any) => {
              const isRead = msg.status === "Read"
              const isRowBusy = busyId === msg.id
              return (
                <tr key={msg.id} className="hover:bg-[var(--adm-bg-hover)] transition-colors">
                  <td className="p-4">
                    {isRead ? (
                      <CheckCircle2 className="w-5 h-5 adm-text-muted" />
                    ) : (
                      <Mail className="w-5 h-5 adm-text-accent" />
                    )}
                  </td>
                  <td className="p-4">
                    <div className={isRead ? "adm-text-secondary" : "font-bold"}>{msg.name}</div>
                    <div className="text-xs adm-text-muted">{msg.email}</div>
                  </td>
                  <td className={`p-4 max-w-xs truncate ${isRead ? "adm-text-muted" : "font-bold"}`} title={msg.message}>
                    {msg.message}
                  </td>
                  <td className="p-4 adm-text-muted text-xs">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right flex justify-end space-x-2">
                    {!isRead && (
                      <button
                        disabled={isRowBusy}
                        onClick={() => markAsRead.mutate(msg.id)}
                        className="adm-badge-info cursor-pointer hover:opacity-85 disabled:opacity-50"
                      >
                        {isRowBusy && markAsRead.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "MARK_READ"}
                      </button>
                    )}
                    <button
                      disabled={isRowBusy}
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this message?")) {
                          deleteMessage.mutate(msg.id)
                        }
                      }}
                      className="adm-btn-icon adm-btn-icon-danger disabled:opacity-50"
                      aria-label="Xóa tin nhắn"
                    >
                      {isRowBusy && deleteMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin adm-text-danger" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              )
            })}
            {messages.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center adm-text-muted font-mono">
                  NO_MESSAGES_IN_QUEUE
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
