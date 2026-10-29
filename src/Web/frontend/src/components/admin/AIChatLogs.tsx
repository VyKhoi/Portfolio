import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "../../store/authStore"
import { MessageSquare, Bot, User, Clock, ArrowLeft } from "lucide-react"
import { AdminLoader } from "./AdminLoader"

interface ChatSession {
  id: string
  sessionId: string
  startedAt: string
  lastMessageAt: string
}

interface ChatMessage {
  id: string
  sessionId: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

export function AIChatLogs() {
  const token = useAuthStore((state) => state.token)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const baseUrl = "/api"

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ["ai-sessions"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/ai/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
  })

  // Auto-select latest session on desktop so the transcript panel is immediately populated
  useEffect(() => {
    if (
      !selectedSession &&
      Array.isArray(sessions) &&
      sessions.length > 0 &&
      typeof window !== "undefined" &&
      window.innerWidth >= 1024
    ) {
      setSelectedSession(sessions[0].sessionId)
    }
  }, [sessions, selectedSession])

  const { data: messages = [], isFetching: loadingMessages } = useQuery({
    queryKey: ["ai-messages", selectedSession],
    queryFn: async () => {
      if (!selectedSession) return []
      const res = await fetch(
        `${baseUrl}/ai/sessions/${selectedSession}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
    enabled: !!selectedSession,
  })

  if (loadingSessions) {
    return <AdminLoader label="LOADING_AI_SESSIONS..." rows={5} />
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:h-[calc(100dvh-4rem)] font-mono">
      {/* Sessions List (Hidden on mobile when viewing a specific transcript) */}
      <div
        className={`adm-card rounded-lg flex-col overflow-hidden h-[calc(100dvh-9.5rem)] lg:h-auto ${
          selectedSession ? "hidden lg:flex" : "flex"
        }`}
      >
        <div
          className="p-4 border-b adm-divider flex items-center justify-between"
          style={{ backgroundColor: "var(--adm-bg-elevated)" }}
        >
          <div>
            <h2 className="text-base sm:text-lg font-bold adm-text-accent flex items-center gap-2">
              <Bot className="w-5 h-5" /> AI_SESSIONS
            </h2>
            <p className="text-xs adm-text-muted mt-0.5">
              Live chat history with Sigma Cat
            </p>
          </div>
          <span className="adm-badge-info">{sessions.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y adm-divider adm-scroll">
          {sessions.length === 0 && (
            <div className="p-6 text-center adm-text-muted text-sm">
              NO_CHAT_SESSIONS_RECORDED
            </div>
          )}
          {sessions.map((s: ChatSession) => {
            const isSelected = selectedSession === s.sessionId
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => setSelectedSession(s.sessionId)}
                className="w-full text-left p-4 transition-colors flex flex-col gap-1 cursor-pointer"
                style={{
                  backgroundColor: isSelected
                    ? "var(--adm-accent-soft)"
                    : "transparent",
                  borderLeft: isSelected
                    ? "3px solid var(--adm-accent)"
                    : "3px solid transparent",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold adm-text flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 adm-text-accent" />
                    {s.sessionId.substring(0, 10)}...
                  </span>
                  <span className="text-[11px] adm-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(s.lastMessageAt).toLocaleTimeString()}
                  </span>
                </div>
                <span className="text-[11px] adm-text-muted">
                  {new Date(s.lastMessageAt).toLocaleDateString()}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Messages View */}
      <div
        className={`lg:col-span-2 adm-card rounded-lg flex-col overflow-hidden h-[calc(100dvh-9.5rem)] lg:h-auto ${
          selectedSession ? "flex" : "hidden lg:flex"
        }`}
      >
        <div
          className="p-3.5 sm:p-4 border-b adm-divider flex justify-between items-center gap-2"
          style={{ backgroundColor: "var(--adm-bg-elevated)" }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setSelectedSession(null)}
              className="lg:hidden adm-btn-secondary py-1.5 px-2.5 text-xs font-bold shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>BACK</span>
            </button>
            <div className="min-w-0">
              <h3 className="font-bold adm-text text-xs sm:text-sm truncate">
                {selectedSession
                  ? `SESSION // ${selectedSession.substring(0, 14)}...`
                  : "SELECT_A_SESSION"}
              </h3>
              <p className="text-[11px] sm:text-xs adm-text-muted">
                {messages.length} messages in transcript
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 adm-scroll">
          {!selectedSession && (
            <div className="h-full flex flex-col items-center justify-center adm-text-muted text-sm gap-2">
              <Bot className="w-10 h-10 opacity-40 adm-text-accent" />
              <span>SELECT_A_SESSION_TO_INSPECT_TRANSCRIPT</span>
            </div>
          )}

          {selectedSession && loadingMessages && (
            <AdminLoader label="FETCHING_TRANSCRIPT..." rows={4} />
          )}

          {selectedSession &&
            !loadingMessages &&
            messages.map((m: ChatMessage) => {
              const isUser = m.role === "user"
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 sm:gap-3 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full adm-badge-accent flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className="max-w-[82%] sm:max-w-[75%] p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed"
                    style={
                      isUser
                        ? {
                            backgroundColor: "var(--adm-accent-soft)",
                            border: "1px solid var(--adm-accent-border)",
                            color: "var(--adm-text)",
                          }
                        : {
                            backgroundColor: "var(--adm-bg-elevated)",
                            border: "1px solid var(--adm-border)",
                            color: "var(--adm-text)",
                          }
                    }
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {m.content}
                    </div>
                    <div className="text-[10px] adm-text-muted mt-1.5 text-right">
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full adm-elevated flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 adm-text-secondary" />
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
