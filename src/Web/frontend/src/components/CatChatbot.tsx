import React, { useCallback, useEffect, useState, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLang, useT } from '../lib/i18n';
import { PRIVACY_PATH } from '../content/privacy';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Messages are rendered as HTML (for **bold** / *italic*), so escape the raw text first.
const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const CatChatbot: React.FC = () => {
  const t = useT();
  const lang = useLang();
  const [sessionId, setSessionId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [showBubble, setShowBubble] = useState(true);

  const bubbleRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll the message list itself (not the page) so the latest message is in view
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Opening the chat lands on the latest message, not the top of an old conversation:
  // the list only exists while the window is open, so jump the moment it mounts
  // (stable callback: a new function each render would re-run it and yank the list down on every keystroke)
  const attachList = useCallback((el: HTMLDivElement | null) => {
    listRef.current = el;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Tapping the input: jump to the latest message, and again once a phone keyboard has resized the view
  const handleInputFocus = () => {
    scrollToBottom();
    setTimeout(() => scrollToBottom(), 350);
  };

  // Track the neko position and attach click listener
  useEffect(() => {
    let currentSessionId = localStorage.getItem('ai_chat_session_id');
    if (!currentSessionId) {
      // randomUUID only exists on HTTPS/localhost; plain-HTTP LAN visits use getRandomValues
      currentSessionId = crypto.randomUUID
        ? crypto.randomUUID()
        : Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem('ai_chat_session_id', currentSessionId);
    }
    setSessionId(currentSessionId);

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

    // Auto-dismiss initial greeting bubble after 4.5s
    const initialTimer = setTimeout(() => setShowBubble(false), 4500);

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
          nekoEl.style.pointerEvents = 'auto';
          nekoEl.style.cursor = 'pointer';
          nekoEl.addEventListener('click', clickHandler);
        }
      }

      if (bubbleRef.current) {
        const isNekoVisible = nekoEl && nekoEl.style.display !== 'none' && window.innerWidth >= 768;
        if (isNekoVisible && nekoEl) {
          const left = parseInt(nekoEl.style.left || '0', 10);
          const top = parseInt(nekoEl.style.top || '0', 10);

          if (left > 0) {
            bubbleRef.current.style.left = `${Math.max(12, Math.min(left - 70, window.innerWidth - 170))}px`;
            bubbleRef.current.style.top = `${Math.max(12, top - 48)}px`;
            bubbleRef.current.style.right = 'auto';
            bubbleRef.current.style.bottom = 'auto';
            bubbleRef.current.style.opacity = '1';
          } else {
            bubbleRef.current.style.opacity = '0';
          }
        } else {
          // Mobile / touch fallback: anchor neatly right above the bottom-right Sigma Cat avatar button
          bubbleRef.current.style.left = 'auto';
          bubbleRef.current.style.top = 'auto';
          bubbleRef.current.style.right = '16px';
          bubbleRef.current.style.bottom = '76px';
          bubbleRef.current.style.opacity = '1';
        }
      }

      frameId = requestAnimationFrame(trackCat);
    };

    frameId = requestAnimationFrame(trackCat);

    // Periodically show bubble every 25 seconds for 4.5 seconds
    const interval = setInterval(() => {
      setIsOpen((currentIsOpen) => {
        if (!currentIsOpen) {
          setShowBubble(true);
          setTimeout(() => setShowBubble(false), 4500);
        }
        return currentIsOpen;
      });
    }, 25000);

    return () => {
      clearTimeout(initialTimer);
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
          lang,
          websiteTrap: honeypot
        })
      });

      if (res.status === 429) {
        setMessages([
          ...updatedMessages,
          { role: 'assistant', content: t.chat.rateLimited }
        ]);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

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
            const parsed = JSON.parse(dataStr);
            accumulated = parsed.notice ?? accumulated + parsed.token;
            setMessages(prev => {
              const next = [...prev];
              next[next.length - 1] = { role: 'assistant', content: accumulated };
              return next;
            });
          }
        }
      }
    } catch (err) {
      console.error('Chat stream error:', err);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        const kept = last?.role === 'assistant' && !last.content ? prev.slice(0, -1) : prev;
        return [...kept, { role: 'assistant', content: t.chat.failed }];
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Speech bubble following animated cat or anchored above mobile button */}
      <AnimatePresence>
        {!isOpen && showBubble && (
          <m.div
            ref={bubbleRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'fixed',
              right: 16,
              bottom: 76,
              zIndex: 99998,
              pointerEvents: 'none',
              opacity: 0
            }}
            className="bg-surface text-text-main border border-primary font-mono text-xs font-bold px-3 py-2 rounded-none shadow-lg max-w-[165px] text-center"
          >
            {t.chat.bubble}
            <div className="absolute -bottom-2 right-5 md:left-1/2 md:-translate-x-1/2 border-solid border-t-primary border-t-8 border-x-transparent border-x-8 border-b-0"></div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button (Always visible when chat closed) */}
      <AnimatePresence>
        {!isOpen && (
          <m.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsOpen(true);
              setShowBubble(false);
            }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[99999] p-1 bg-surface border-2 border-primary/60 hover:border-primary text-white rounded-full shadow-[0_0_25px_rgba(255,92,0,0.3)] transition-all group flex items-center justify-center cursor-pointer"
            aria-label={t.chat.open}
          >
            <div className="relative">
              <img
                src="/sigma-cat-sm.webp"
                alt="Sigma Cat"
                width={44}
                height={44}
                decoding="async"
                className="w-11 h-11 rounded-full object-cover border border-primary"
              />
              <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-primary border-2 border-surface animate-pulse"></span>
            </div>
          </m.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-3 right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6 sm:w-[360px] h-[min(480px,calc(100dvh-24px))] bg-surface border border-border shadow-2xl rounded-none z-[99999] font-mono overflow-hidden flex flex-col"
          >
            <div className="bg-obsidian border-b border-border p-3.5 sm:p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src="/sigma-cat-sm.webp"
                    alt="Sigma Cat"
                    width={40}
                    height={40}
                    decoding="async"
                    className="w-10 h-10 rounded-full object-cover border-2 border-primary shadow-[0_0_15px_rgba(255,92,0,0.3)]"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary border-2 border-obsidian rounded-full"></span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                    Sigma Cat <span className="text-xs">😼</span>
                  </h3>
                  <p className="text-xs text-text-muted">{t.chat.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label={t.chat.close}
                className="text-text-muted hover:text-white transition-colors text-2xl leading-none px-2"
              >
                &times;
              </button>
            </div>

            <div ref={attachList} className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {messages.length === 0 && (
                <div className="text-center mt-6">
                  <div className="inline-block bg-obsidian border border-border text-text-muted text-xs px-4 py-2 rounded-full">
                    {t.chat.hint}
                  </div>
                </div>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] p-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-primary text-black rounded-none font-medium'
                        : 'bg-border text-text-main rounded-none'
                    }`}
                    dangerouslySetInnerHTML={{
                      __html: escapeHtml(m.content)
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    }}
                  >
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-border text-text-main p-4 rounded-none flex space-x-2">
                    <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                    <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-border bg-obsidian flex gap-2">
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
                aria-label={t.chat.inputLabel}
                value={input}
                onChange={e => setInput(e.target.value)}
                onFocus={handleInputFocus}
                maxLength={350}
                placeholder={cooldown ? t.chat.cooling : t.chat.placeholder}
                disabled={loading || cooldown}
                className="flex-1 min-w-0 bg-obsidian border border-border text-white text-sm rounded-none px-3.5 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-muted disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || cooldown || !input.trim()}
                aria-label={t.chat.send}
                className="bg-primary text-black px-4 py-2 rounded-none font-bold disabled:opacity-50 hover:bg-primary-hover transition-colors flex items-center justify-center min-w-[44px] shrink-0"
                title={cooldown ? t.chat.wait : t.chat.send}
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
            <p className="px-3 pb-2.5 pt-0 bg-obsidian text-[11px] leading-snug text-text-muted">
              {t.chat.notice}{' '}
              <Link to={PRIVACY_PATH[lang]} className="underline underline-offset-2 hover:text-primary">{t.chat.privacy}</Link>
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
};
