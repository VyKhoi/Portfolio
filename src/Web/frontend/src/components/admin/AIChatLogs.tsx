import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
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
    <div className="flex h-[calc(100vh-8rem)] gap-4 font-mono animate-in fade-in duration-200">
      {/* LEFT COLUMN: Sessions List */}
      <div className="w-1/3 bg-[#121215] border border-[#27272A] rounded-lg shadow-lg flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#27272A] bg-[#18181C] flex items-center justify-between">
          <div>
            <h2 className="text-[#DEFF9A] font-bold">🤖 AI SESSIONS</h2>
            <p className="text-xs text-zinc-400">Live chat history with Sigma Cat 😼</p>
          </div>
          {isFetchingSessions && !isLoadingSessions && (
            <Loader2 className="w-4 h-4 text-[#DEFF9A] animate-spin" />
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-[#27272A]">
          {isLoadingSessions ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 rounded bg-[#0A0A0C] border border-[#27272A] space-y-2 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-3 w-24 bg-[#27272A] rounded" />
                    <div className="h-2.5 w-14 bg-[#18181C] rounded" />
                  </div>
                  <div className="h-2.5 w-16 bg-[#18181C] rounded" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-zinc-500 text-center text-xs mt-8">No chat sessions found.</p>
          ) : (
            sessions.map((session) => (
              <div 
                key={session.sessionId}
                onClick={() => setSelectedSessionId(session.sessionId)}
                className={`p-3 rounded cursor-pointer transition-colors border ${
                  selectedSessionId === session.sessionId 
                    ? 'bg-[#18181C] border-[#DEFF9A]/50' 
                    : 'bg-[#0A0A0C] border-transparent hover:border-[#27272A]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-300 truncate w-32" title={session.sessionId}>
                    {session.sessionId.split('-')[0]}...
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {new Date(session.lastMessageAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500">
                  {new Date(session.lastMessageAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Messages List */}
      <div className="w-2/3 bg-[#121215] border border-[#27272A] rounded-lg shadow-lg flex flex-col overflow-hidden">
        {selectedSessionId ? (
          <>
            <div className="p-4 border-b border-[#27272A] bg-[#18181C] flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-sm">Session Details</h3>
                <p className="text-xs text-zinc-400">ID: {selectedSessionId}</p>
              </div>
              <div className="flex items-center gap-2">
                {isFetchingMessages && !isLoadingMessages && (
                  <Loader2 className="w-3.5 h-3.5 text-[#DEFF9A] animate-spin" />
                )}
                <span className="text-xs bg-[#DEFF9A] text-black px-2 py-1 rounded font-bold">LIVE</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#27272A]">
              {isLoadingMessages ? (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <div className="h-12 w-56 bg-[#18181C] border border-[#27272A] rounded-2xl animate-pulse" />
                  </div>
                  <div className="flex justify-start">
                    <div className="h-20 w-72 bg-[#18181C] border border-[#27272A] rounded-2xl animate-pulse" />
                  </div>
                  <div className="flex justify-end">
                    <div className="h-10 w-44 bg-[#18181C] border border-[#27272A] rounded-2xl animate-pulse" />
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <p className="text-zinc-500 text-center text-xs">No messages yet.</p>
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
                      className={`max-w-[75%] p-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                        m.role === 'user' 
                          ? 'bg-[#DEFF9A] text-black rounded-2xl rounded-tr-sm font-medium' 
                          : 'bg-[#27272A] text-zinc-200 rounded-2xl rounded-tl-sm'
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
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <span className="text-4xl mb-4">🕵️</span>
            <p className="text-sm">Select a session to spy on the chat</p>
          </div>
        )}
      </div>
    </div>
  );
}
