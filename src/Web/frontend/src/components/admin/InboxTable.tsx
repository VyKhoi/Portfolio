import { useState } from "react"
import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { Mail, CheckCircle2, Trash2, Loader2 } from "lucide-react"
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
      <div className="space-y-6">
        <h1 className="text-3xl font-heading font-bold">INBOX_QUEUE</h1>
        <AdminLoader label="LOADING_INBOX_QUEUE..." variant="table" rows={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-heading font-bold">INBOX_QUEUE</h1>
          <RefreshingBadge show={isFetching && !isLoading} />
        </div>
        <Badge variant="outline" className="text-[#00E5FF] border-[#00E5FF]">{messages.length} MESSAGES</Badge>
      </div>

      <div className="border border-[#27272A] rounded-lg bg-[#0A0A0C] overflow-hidden">
        <table className="w-full text-left font-mono text-sm">
          <thead className="bg-[#121215] text-zinc-400 border-b border-[#27272A]">
            <tr>
              <th className="p-4 font-normal uppercase">Status</th>
              <th className="p-4 font-normal uppercase">Sender</th>
              <th className="p-4 font-normal uppercase">Message</th>
              <th className="p-4 font-normal uppercase">Date</th>
              <th className="p-4 font-normal uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272A]">
            {messages.map((msg: any) => {
              const isRead = msg.status === "Read"
              const isRowBusy = busyId === msg.id
              return (
                <tr key={msg.id} className="hover:bg-[#18181C] transition-colors">
                  <td className="p-4">
                    {isRead ? (
                      <CheckCircle2 className="w-5 h-5 text-zinc-600" />
                    ) : (
                      <Mail className="w-5 h-5 text-[#DEFF9A]" />
                    )}
                  </td>
                  <td className="p-4 text-zinc-300">
                    <div>{msg.name}</div>
                    <div className="text-xs text-zinc-500">{msg.email}</div>
                  </td>
                  <td className={`p-4 ${isRead ? "text-zinc-500" : "text-white font-bold"} max-w-xs truncate`} title={msg.message}>
                    {msg.message}
                  </td>
                  <td className="p-4 text-zinc-500">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right flex justify-end space-x-2">
                    {!isRead && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={isRowBusy}
                        onClick={() => markAsRead.mutate(msg.id)}
                        className="h-8 text-xs uppercase text-[#00E5FF] hover:bg-[#00E5FF]/10"
                      >
                        {isRowBusy && markAsRead.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Mark Read"}
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      disabled={isRowBusy}
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this message?")) {
                          deleteMessage.mutate(msg.id)
                        }
                      }}
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-[#F43F5E] hover:bg-[#F43F5E]/10"
                    >
                      {isRowBusy && deleteMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin text-[#F43F5E]" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </td>
                </tr>
              )
            })}
            {messages.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500 font-mono">
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
