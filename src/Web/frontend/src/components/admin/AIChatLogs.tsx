import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, BotMessageSquare } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../lib/api';

interface ChatSession {
  sessionId: string;
  startedAt: string;
  lastMessageAt: string;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export function AIChatLogs() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const token = useAuthStore(state => state.token);

  // Fetch all sessions
  const { data: sessions = [], isLoading: isLoadingSessions, isFetching: isFetchingSessions } = useQuery<ChatSession[]>({
    queryKey: ['ai-sessions'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/ai/sessions`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (!res.ok) throw new Error('Failed to fetch sessions');
      return res.json();
    },
    refetchInterval: 10000
  });

  // Fetch messages for selected session
  const { data: messages = [], isLoading: isLoadingMessages, isFetching: isFetchingMessages } = useQuery<ChatMessage[]>({
    queryKey: ['ai-messages', selectedSessionId],
    queryFn: async () => {
      if (!selectedSessionId) return [];
      const res = await fetch(`${API_BASE_URL}/ai/sessions/${selectedSessionId}/messages`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!selectedSessionId,
    refetchInterval: 5000
  });

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4 font-mono animate-in fade-in duration-200">
      {/* LEFT COLUMN: Sessions List */}
      <div className="w-1/3 adm-card rounded-lg flex flex-col overflow-hidden">
        <div
          className="p-4 border-b adm-divider flex items-center justify-between"
          style={{ backgroundColor: "var(--adm-bg-elevated)" }}
        >
          <div>
            <h2 className="adm-text-accent font-bold flex items-center gap-2">
              <BotMessageSquare className="w-4 h-4" />
              <span>AI_SESSIONS</span>
            </h2>
            <p className="text-xs adm-text-muted mt-0.5">Live chat history with Sigma Cat</p>
          </div>
          {isFetchingSessions && !isLoadingSessions && (
            <Loader2 className="w-4 h-4 adm-text-accent animate-spin" />
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {isLoadingSessions ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 rounded adm-elevated space-y-2 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-3 w-24 adm-skeleton rounded" />
                    <div className="h-2.5 w-14 adm-skeleton rounded" />
                  </div>
                  <div className="h-2.5 w-16 adm-skeleton rounded" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="adm-text-muted text-center text-xs mt-8">No chat sessions found.</p>
          ) : (
            sessions.map((session) => {
              const isSelected = selectedSessionId === session.sessionId;
              return (
                <div 
                  key={session.sessionId}
                  onClick={() => setSelectedSessionId(session.sessionId)}
                  style={
                    isSelected
                      ? {
                          backgroundColor: "var(--adm-accent-soft)",
                          borderColor: "var(--adm-accent-border)",
                        }
                      : undefined
                  }
                  className={`p-3 rounded cursor-pointer transition-colors border ${
                    isSelected
                      ? ''
                      : 'border-transparent hover:bg-[var(--adm-bg-hover)] hover:border-[var(--adm-border)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold truncate w-32 ${isSelected ? 'adm-text-accent' : ''}`}
                      title={session.sessionId}
                    >
                      {session.sessionId.split('-')[0]}...
                    </span>
                    <span className="text-[10px] adm-text-secondary">
                      {new Date(session.lastMessageAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-[10px] adm-text-muted">
                    {new Date(session.lastMessageAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Messages List */}
      <div className="w-2/3 adm-card rounded-lg flex flex-col overflow-hidden">
        {selectedSessionId ? (
          <>
            <div
              className="p-4 border-b adm-divider flex items-center justify-between"
              style={{ backgroundColor: "var(--adm-bg-elevated)" }}
            >
              <div>
                <h3 className="font-bold text-sm">SESSION_TRANSCRIPT</h3>
                <p className="text-xs adm-text-muted">ID: {selectedSessionId}</p>
              </div>
              <div className="flex items-center gap-2">
                {isFetchingMessages && !isLoadingMessages && (
                  <Loader2 className="w-3.5 h-3.5 adm-text-accent animate-spin" />
                )}
                <span className="adm-badge-accent">LIVE</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages ? (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <div className="h-12 w-56 adm-elevated rounded-2xl animate-pulse" />
                  </div>
                  <div className="flex justify-start">
                    <div className="h-20 w-72 adm-elevated rounded-2xl animate-pulse" />
                  </div>
                  <div className="flex justify-end">
                    <div className="h-10 w-44 adm-elevated rounded-2xl animate-pulse" />
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <p className="adm-text-muted text-center text-xs">No messages yet.</p>
              ) : (
                messages.map((m) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    key={m.id} 
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      style={
                        m.role === 'user'
                          ? {
                              backgroundColor: "var(--adm-accent)",
                              color: "var(--adm-btn-fg)",
                            }
                          : {
                              backgroundColor: "var(--adm-bg-elevated)",
                              borderColor: "var(--adm-border)",
                              color: "var(--adm-text)",
                            }
                      }
                      className={`max-w-[75%] p-3.5 text-sm leading-relaxed shadow-xs whitespace-pre-wrap ${
                        m.role === 'user' 
                          ? 'rounded-2xl rounded-tr-sm font-semibold' 
                          : 'border rounded-2xl rounded-tl-sm'
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: m.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      }}
                    >
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center adm-text-muted">
            <BotMessageSquare className="w-10 h-10 mb-3 adm-text-accent opacity-80" />
            <p className="text-sm font-bold">SELECT_A_SESSION_TO_INSPECT_TRANSCRIPT</p>
          </div>
        )}
      </div>
    </div>
  );
}
