import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { Mail, CheckCircle2, Trash2 } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export function InboxTable() {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/contact/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    }
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/contact/messages/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Read' })
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/contact/messages/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error("Failed to delete message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  });

  if (isLoading) {
    return <div className="text-zinc-500 font-mono">LOADING_QUEUE...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-heading font-bold">INBOX_QUEUE</h1>
        <Badge variant="outline" className="text-[#00E5FF] border-[#00E5FF]">{messages.length} MESSAGES</Badge>
      </div>

      <div className="border border-[#27272A] rounded-lg bg-[#0A0A0C] overflow-hidden">
        <table className="w-full text-left font-mono text-sm">
          <thead className="bg-[#121215] text-zinc-500 border-b border-[#27272A]">
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
              const isRead = msg.status === "Read";
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
                    <div className="text-xs text-zinc-600">{msg.email}</div>
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
                        onClick={() => markAsRead.mutate(msg.id)}
                        className="h-8 text-xs uppercase text-[#00E5FF] hover:bg-[#00E5FF]/10"
                      >
                        Mark Read
                      </Button>
                    )}
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this message?")) {
                            deleteMessage.mutate(msg.id);
                          }
                        }}
                        className="h-8 w-8 p-0 text-zinc-500 hover:text-[#F43F5E] hover:bg-[#F43F5E]/10"
                      >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
