import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const CatChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBubble, setShowBubble] = useState(true);

  const bubbleRef = useRef<HTMLDivElement>(null);

  // Track the neko position and attach click listener
  useEffect(() => {
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
    if (!input.trim() || loading) return;

    const newMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages
        })
      });

      if (!res.ok) throw new Error('API Error');
      const data = await res.json();

      setMessages([...newMessages, { role: 'assistant', content: data.response }]);
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'assistant', content: "Meow... Hệ thống đang bận xíu nha! Bạn thử lại sau nhé 🐾" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
            Có hỏi gì hong, bấm vào em nè 🐾
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-solid border-t-white border-t-8 border-x-transparent border-x-8 border-b-0"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-[350px] bg-[#121215] border border-[#27272A] shadow-2xl rounded-xl z-[99999] font-mono overflow-hidden flex flex-col"
            style={{ height: '450px' }}
          >
            <div className="bg-[#18181C] border-b border-[#27272A] p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#DEFF9A] flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(222,255,154,0.3)]">
                  🐱
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Mèo Code 🐾</h3>
                  <p className="text-xs text-zinc-400">Trợ lý ảo thông minh</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors text-xl"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#27272A] scrollbar-track-transparent">
              {messages.length === 0 && (
                <div className="text-center mt-6">
                  <div className="inline-block bg-[#18181C] border border-[#27272A] text-zinc-400 text-xs px-4 py-2 rounded-full">
                    Gợi ý: Hỏi về kỹ năng, kinh nghiệm của Khôi!
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
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-[#27272A] bg-[#18181C] flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-[#0A0A0C] border border-[#27272A] text-white text-sm rounded-lg px-4 py-3 focus:border-[#DEFF9A] focus:ring-1 focus:ring-[#DEFF9A] outline-none transition-all placeholder:text-zinc-600"
              />
              <button 
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-[#DEFF9A] text-black px-4 py-2 rounded-lg font-bold disabled:opacity-50 hover:bg-[#c2f068] transition-colors flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
