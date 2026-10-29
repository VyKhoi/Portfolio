import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const CatChatbot: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [showBubble, setShowBubble] = useState(true);

  const bubbleRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Track the neko position and attach click listener
  useEffect(() => {
    // Initialize Session ID
    let currentSessionId = localStorage.getItem('ai_chat_session_id');
    if (!currentSessionId) {
      currentSessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      localStorage.setItem('ai_chat_session_id', currentSessionId);
    }
    setSessionId(currentSessionId);

    // Fetch conversation history from backend DB for this session
    const baseUrl = '/api';

    fetch(`${baseUrl}/ai/history/${currentSessionId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMessages(
            data.map((m: any) => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content
            }))
          );
        }
      })
      .catch((err) => console.error('Failed to load chat history:', err));

    let nekoEl: HTMLElement | null = null;
    let frameId: number;

    const clickHandler = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(true);
      setShowBubble(false);
    };

    const trackCat = () => {
      if (!nekoEl) {
        nekoEl = document.getElementById('neko-cat1');
        if (nekoEl) {
          nekoEl.style.pointerEvents = 'auto'; // Ensure it's clickable
          nekoEl.style.cursor = 'pointer';
          nekoEl.addEventListener('click', clickHandler);
        }
      }

      if (nekoEl && bubbleRef.current) {
        const left = parseInt(nekoEl.style.left || '0', 10);
        const top = parseInt(nekoEl.style.top || '0', 10);
        
        // Update DOM directly to avoid 60fps React re-renders
        if (left > 0) {
          bubbleRef.current.style.left = `${left - 70}px`;
          bubbleRef.current.style.top = `${top - 45}px`;
          bubbleRef.current.style.opacity = '1';
        } else {
          bubbleRef.current.style.opacity = '0';
        }
      }

      frameId = requestAnimationFrame(trackCat);
    };

    frameId = requestAnimationFrame(trackCat);

    // Randomly show bubble every 15 seconds for 5 seconds
    const interval = setInterval(() => {
      setIsOpen((currentIsOpen) => {
        if (!currentIsOpen) {
          setShowBubble(true);
          setTimeout(() => setShowBubble(false), 5000);
        }
        return currentIsOpen;
      });
    }, 15000);

    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(interval);
      if (nekoEl) {
        nekoEl.removeEventListener('click', clickHandler);
      }
    };
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || loading || cooldown) return;

    // Immediately reflect user message
    const updatedMessages = [...messages, { role: 'user' as const, content: trimmedInput }];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 3000);

    const baseUrl = '/api';

    try {
      const res = await fetch(`${baseUrl}/ai/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          message: trimmedInput,
          websiteTrap: honeypot,
          history: messages
        })
      });

      if (res.status === 429) {
        setMessages([
          ...updatedMessages,
          { role: 'assistant', content: "Gừừ... Meo meo cần thở xíu! Bạn đợi vài giây rồi hỏi tiếp nha 😼🐾" }
        ]);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Add placeholder assistant message that will be populated as tokens stream in
      setMessages([...updatedMessages, { role: 'assistant', content: '' }]);
      setLoading(false);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No readable stream');

      const decoder = new TextDecoder('utf-8');
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                accumulated = parsed.error;
              } else if (parsed.token) {
                accumulated += parsed.token;
              }
              setMessages(prev => {
                const next = [...prev];
                if (next.length > 0 && next[next.length - 1].role === 'assistant') {
                  next[next.length - 1] = {
                    ...next[next.length - 1],
                    content: accumulated
                  };
                }
                return next;
              });
            } catch {
              // Raw text chunk fallback
              accumulated += dataStr;
              setMessages(prev => {
                const next = [...prev];
                if (next.length > 0 && next[next.length - 1].role === 'assistant') {
                  next[next.length - 1] = {
                    ...next[next.length - 1],
                    content: accumulated
                  };
                }
                return next;
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat stream error:', err);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant' && !last.content) {
          const next = [...prev];
          next[next.length - 1] = {
            role: 'assistant',
            content: "Meow... Hệ thống đang bận xíu, bạn thử lại sau vài giây nhé 😼"
          };
          return next;
        }
        return [...prev, { role: 'assistant', content: "Meow... Hệ thống đang bận xíu, bạn thử lại sau vài giây nhé 😼" }];
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Speech bubble following animated cat */}
      <AnimatePresence>
        {!isOpen && showBubble && (
          <motion.div
            ref={bubbleRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'fixed',
              left: -999,
              top: -999,
              zIndex: 2147483646,
              pointerEvents: 'none',
              opacity: 0
            }}
            className="bg-white text-black text-xs font-bold px-3 py-2 rounded-lg shadow-lg max-w-[150px] text-center"
          >
            Hỏi gì về anh Khôi hong? Bấm vào em nè 😼
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-solid border-t-white border-t-8 border-x-transparent border-x-8 border-b-0"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button (Always visible when chat closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsOpen(true);
              setShowBubble(false);
            }}
            className="fixed bottom-6 right-6 z-[99999] p-1 bg-[#121215] border-2 border-[#DEFF9A]/60 hover:border-[#DEFF9A] text-white rounded-full shadow-[0_0_25px_rgba(222,255,154,0.3)] transition-all group flex items-center justify-center cursor-pointer"
            aria-label="Mở chat với Sigma Cat"
          >
            <div className="relative">
              <img 
                src="/sigma-cat-sm.png" 
                alt="Sigma Cat" 
                className="w-11 h-11 rounded-full object-cover border border-[#DEFF9A]"
              />
              <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-[#DEFF9A] border-2 border-[#121215] animate-pulse"></span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-[360px] max-w-[calc(100vw-32px)] bg-[#121215] border border-[#27272A] shadow-2xl rounded-xl z-[99999] font-mono overflow-hidden flex flex-col"
            style={{ height: '480px' }}
          >
            <div className="bg-[#18181C] border-b border-[#27272A] p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img 
                    src="/sigma-cat-sm.png" 
                    alt="Sigma Cat" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#DEFF9A] shadow-[0_0_15px_rgba(222,255,154,0.3)]"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#DEFF9A] border-2 border-[#18181C] rounded-full"></span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                    Sigma Cat <span className="text-xs">😼</span>
                  </h3>
                  <p className="text-xs text-zinc-400">Trợ lý AI Local (Qwen 1.5B)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors text-2xl leading-none px-2"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#27272A] scrollbar-track-transparent">
              {messages.length === 0 && (
                <div className="text-center mt-6">
                  <div className="inline-block bg-[#18181C] border border-[#27272A] text-zinc-400 text-xs px-4 py-2 rounded-full">
                    Gợi ý: Hỏi về kỹ năng, kinh nghiệm của anh Khôi! 😼
                  </div>
                </div>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] p-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
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
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#27272A] text-zinc-300 p-4 rounded-2xl rounded-tl-sm flex space-x-2">
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-[#27272A] bg-[#18181C] flex gap-2">
              {/* Anti-bot Honeypot field (hidden from real users) */}
              <input 
                type="text" 
                name="website_trap"
                value={honeypot}
                onChange={e => setHoneypot(e.target.value)}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                maxLength={350}
                placeholder={cooldown ? "Đang thở 3s..." : "Hỏi gì về anh Khôi... (tối đa 350 ký tự)"}
                disabled={loading || cooldown}
                className="flex-1 bg-[#0A0A0C] border border-[#27272A] text-white text-sm rounded-lg px-4 py-3 focus:border-[#DEFF9A] focus:ring-1 focus:ring-[#DEFF9A] outline-none transition-all placeholder:text-zinc-600 disabled:opacity-60"
              />
              <button 
                type="submit"
                disabled={loading || cooldown || !input.trim()}
                className="bg-[#DEFF9A] text-black px-4 py-2 rounded-lg font-bold disabled:opacity-50 hover:bg-[#c2f068] transition-colors flex items-center justify-center min-w-[44px]"
                title={cooldown ? "Vui lòng đợi 3s" : "Gửi tin nhắn"}
              >
                {cooldown ? (
                  <span className="text-xs font-mono font-bold">3s</span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
                  </svg>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
