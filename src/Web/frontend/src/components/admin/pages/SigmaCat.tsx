import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Plus, RotateCcw, Send, Trash2 } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import { api, formatTime, seconds, send, timeAgo, type ChatMessage, type ChatSession, type Fact, type Status } from '../api'
import { Badge, Bilingual, Button, Empty, ErrorBox, IconButton, LangHeading, PageHeader, Panel, Skeleton, SortableList, Tabs, TextArea, TextInput, useConfirm, useToast } from '../ui'

type Tab = 'facts' | 'chats' | 'stats' | 'try'

// ─── Facts ──────────────────────────────────────────────

type FactDraft = Omit<Fact, 'id'>
const EMPTY_FACT: FactDraft = { key: '', label: '', valueVi: '', valueEn: '', order: 100, enabled: true }

function FactForm({ fact, onClose }: { fact: Fact | null; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [d, setD] = useState<FactDraft>(fact ? { key: fact.key, label: fact.label, valueVi: fact.valueVi, valueEn: fact.valueEn, order: fact.order, enabled: fact.enabled } : EMPTY_FACT)
  const save = useMutation({
    mutationFn: () => (fact ? send(`ai/facts/${fact.id}`, 'PUT', d) : send('ai/facts', 'POST', d)),
    onSuccess: () => {
      toast.ok('Đã lưu. Sigma Cat dùng ngay từ câu hỏi tiếp theo.')
      qc.invalidateQueries({ queryKey: ['facts'] })
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })
  return (
    <Panel title={fact ? `Sửa: ${fact.label}` : 'Thông tin mới'}>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput label="Tên thông tin" value={d.label} onChange={(v) => setD({ ...d, label: v })} max={60} placeholder="Sở thích" hint="Sigma Cat đọc tên này." />
          <TextInput label="Mã (không dấu, duy nhất)" value={d.key} onChange={(v) => setD({ ...d, key: v.replace(/[^a-zA-Z0-9_-]/g, '') })} max={40} placeholder="hobbies" />
        </div>
        <LangHeading />
        <Bilingual
          vi={<TextArea label="Nội dung" value={d.valueVi} onChange={(v) => setD({ ...d, valueVi: v })} rows={3} lang="vi" />}
          en={<TextArea label="Content (EN)" value={d.valueEn} onChange={(v) => setD({ ...d, valueEn: v })} rows={3} lang="en" />}
        />
        <label className="flex items-center gap-2 font-body text-sm text-text-main">
          <input type="checkbox" checked={d.enabled} onChange={(e) => setD({ ...d, enabled: e.target.checked })} className="h-4 w-4 accent-primary" />
          Đang dùng (bỏ tick để Sigma Cat tạm quên thông tin này)
        </label>
        <div className="flex gap-2">
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!d.key || !d.label || !d.valueVi}>Lưu</Button>
          <Button variant="secondary" onClick={onClose}>Huỷ</Button>
        </div>
      </div>
    </Panel>
  )
}

function Facts() {
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<Fact | 'new' | null>(null)
  const [pending, setPending] = useState<Fact[] | null>(null)
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['facts'], queryFn: () => api<Fact[]>('ai/facts') })

  const update = useMutation({
    mutationFn: (f: Fact) => send(`ai/facts/${f.id}`, 'PUT', { key: f.key, label: f.label, valueVi: f.valueVi, valueEn: f.valueEn, order: f.order, enabled: f.enabled }),
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => qc.invalidateQueries({ queryKey: ['facts'] }),
  })
  const remove = useMutation({
    mutationFn: (id: string) => send(`ai/facts/${id}`, 'DELETE'),
    onSuccess: () => {
      toast.ok('Đã xoá.')
      qc.invalidateQueries({ queryKey: ['facts'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (editing) return <FactForm fact={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
  if (isLoading) return <Skeleton rows={4} />
  if (error) return <ErrorBox error={error} retry={() => refetch()} />

  const facts = pending ?? data ?? []
  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl font-body text-sm text-text-muted">
          Những điều Sigma Cat biết mà trang không ghi (năm sinh, liên hệ…). Kinh nghiệm và hồ sơ nó tự đọc từ các mục nội dung. Kéo ⋮⋮ để xếp thứ tự trong lời nhắc.
        </p>
        <Button icon={<Plus size={14} />} onClick={() => setEditing('new')}>Thêm</Button>
      </div>
      {facts.length === 0 ? (
        <Empty title="Chưa có thông tin nào" />
      ) : (
        <SortableList
          items={facts}
          label={(f) => f.label}
          onReorder={async (next) => {
            setPending(next)
            const changed = next.map((f, i) => ({ ...f, order: i + 1 })).filter((f, i) => f.order !== facts[i]?.order || f.id !== facts[i]?.id)
            try {
              await Promise.all(changed.map((f) => update.mutateAsync(f)))
              toast.ok('Đã đổi thứ tự.')
            } finally {
              setPending(null)
            }
          }}
          render={(f) => (
            <div className={`flex items-start gap-3 px-4 py-3 ${f.enabled ? '' : 'opacity-50'}`}>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-body text-sm font-semibold text-text-main">
                  {f.label}
                  {!f.enabled && <Badge>Tạm tắt</Badge>}
                </p>
                <p className="mt-0.5 font-body text-sm text-text-muted">{f.valueVi}</p>
              </div>
              <label className="mt-1 flex shrink-0 cursor-pointer items-center" title={f.enabled ? 'Đang dùng' : 'Đang tắt'}>
                <input
                  type="checkbox"
                  checked={f.enabled}
                  aria-label={`Dùng thông tin ${f.label}`}
                  onChange={(e) => update.mutate({ ...f, enabled: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
              </label>
              <IconButton label="Sửa" onClick={() => setEditing(f)}><Pencil size={14} /></IconButton>
              <IconButton
                label="Xoá"
                className="hover:border-red-500 hover:text-red-400"
                onClick={async () => {
                  if (await confirm({ title: `Xoá "${f.label}"?`, text: 'Sigma Cat sẽ không còn biết thông tin này.', action: 'Xoá', danger: true })) remove.mutate(f.id)
                }}
              >
                <Trash2 size={14} />
              </IconButton>
            </div>
          )}
        />
      )}
    </>
  )
}

// ─── Conversations ──────────────────────────────────────

function Transcript({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const { data, isLoading, error } = useQuery({ queryKey: ['chat', sessionId], queryFn: () => api<ChatMessage[]>(`ai/sessions/${sessionId}/messages`) })
  const remove = useMutation({
    mutationFn: () => send(`ai/sessions/${sessionId}`, 'DELETE'),
    onSuccess: () => {
      toast.ok('Đã xoá hội thoại.')
      qc.invalidateQueries({ queryKey: ['chat-sessions'] })
      onBack()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-text-muted hover:text-primary lg:hidden">
          <ArrowLeft size={14} /> Danh sách
        </button>
        <span className="truncate font-mono text-xs text-text-muted">#{sessionId}</span>
        <Button
          variant="danger"
          className="h-8 px-3"
          icon={<Trash2 size={13} />}
          loading={remove.isPending}
          onClick={async () => {
            if (await confirm({ title: 'Xoá hội thoại này?', text: 'Dùng khi khách yêu cầu xoá dữ liệu. Không khôi phục được.', action: 'Xoá', danger: true })) remove.mutate()
          }}
        >
          Xoá
        </Button>
      </div>
      <div className="admin-scroll max-h-[65vh] space-y-3 overflow-y-auto p-4">
        {isLoading && <Skeleton rows={2} />}
        {error && <ErrorBox error={error} />}
        {data?.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3.5 py-2.5 ${m.role === 'user' ? 'bg-primary text-black' : 'border border-border bg-obsidian text-text-main'}`}>
              <p className="whitespace-pre-wrap break-words font-body text-sm leading-relaxed">{m.content}</p>
              <p className={`mt-1 font-mono text-[10px] ${m.role === 'user' ? 'text-black/60' : 'text-text-muted'}`}>
                {formatTime(m.createdAt)}
                {m.role === 'assistant' && m.totalMs != null && ` · chữ đầu ${seconds(m.firstTokenMs)}, xong ${seconds(m.totalMs)}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Chats() {
  const [params, setParams] = useSearchParams()
  const [showTests, setShowTests] = useState(false)
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['chat-sessions'], queryFn: () => api<ChatSession[]>('ai/sessions') })
  const selected = params.get('session')
  const open = (id: string | null) => setParams(id ? { tab: 'chats', session: id } : { tab: 'chats' })

  if (isLoading) return <Skeleton rows={4} />
  if (error) return <ErrorBox error={error} retry={() => refetch()} />
  const sessions = (data ?? []).filter((s) => showTests || !s.isTest)

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className={selected ? 'hidden lg:block' : ''}>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-body text-sm text-text-muted">{sessions.length} hội thoại · giữ 90 ngày</p>
          <label className="flex items-center gap-2 font-body text-xs text-text-muted">
            <input type="checkbox" checked={showTests} onChange={(e) => setShowTests(e.target.checked)} className="accent-primary" />
            Hiện phiên hỏi thử
          </label>
        </div>
        {sessions.length === 0 ? (
          <Empty title="Chưa có hội thoại" />
        ) : (
          <ul className="admin-scroll max-h-[70vh] divide-y divide-border overflow-y-auto border border-border">
            {sessions.map((s) => (
              <li key={s.sessionId}>
                <button type="button" onClick={() => open(s.sessionId)} className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface ${selected === s.sessionId ? 'bg-surface' : ''}`}>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-mono text-xs text-text-main">#{s.sessionId.slice(0, 8)}</span>
                    {s.isTest && <Badge>Thử</Badge>}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-text-muted">{timeAgo(s.lastMessageAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={selected ? '' : 'hidden lg:block'}>
        {selected ? (
          <Transcript key={selected} sessionId={selected} onBack={() => open(null)} />
        ) : (
          <div className="flex min-h-48 items-center justify-center border border-dashed border-border font-body text-sm text-text-muted">Chọn một hội thoại để đọc.</div>
        )}
      </div>
    </div>
  )
}

// ─── Numbers ────────────────────────────────────────────

function Stats() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['status'], queryFn: () => api<Status>('admin/status') })
  if (isLoading) return <Skeleton rows={3} />
  if (error || !data) return <ErrorBox error={error} retry={() => refetch()} />
  const c = data.chat
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Hội thoại 7 ngày', c.sessions7d],
          ['Câu trả lời', c.replies7d],
          ['Chữ đầu (trung vị)', seconds(c.medianFirstTokenMs)],
          ['Trọn câu (trung vị)', seconds(c.medianReplyMs)],
        ].map(([label, value]) => (
          <div key={label as string} className="border border-border bg-surface p-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-text-muted">{label}</p>
            <p className="mt-2 font-heading text-3xl font-bold text-text-main">{value}</p>
          </div>
        ))}
      </div>
      <Panel title="Theo ngày (giờ Việt Nam, không tính phiên hỏi thử)">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-widest text-text-muted">
              <th className="py-2 font-bold">Ngày</th>
              <th className="py-2 text-right font-bold">Câu trả lời</th>
              <th className="py-2 text-right font-bold">Trọn câu (trung vị)</th>
            </tr>
          </thead>
          <tbody>
            {[...c.days].reverse().map((d) => (
              <tr key={d.date} className="border-b border-border last:border-0">
                <td className="py-2 text-text-main">{d.date.slice(8)}/{d.date.slice(5, 7)}</td>
                <td className="py-2 text-right text-text-main">{d.replies}</td>
                <td className="py-2 text-right text-text-muted">{seconds(d.medianMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 font-body text-xs text-text-muted">
          Model {data.ollama.model}{data.ollama.gpuPercent != null ? `, ${data.ollama.gpuPercent}% trên GPU` : ''}. Bị chặn vì hỏi dồn: {c.refused7d} lượt.
        </p>
      </Panel>
    </>
  )
}

// ─── Ask a test question ────────────────────────────────

const newTestSession = () => `admintest-${Math.random().toString(36).slice(2, 12)}`

function Try() {
  const qc = useQueryClient()
  const token = useAuthStore((s) => s.token)
  const [session, setSession] = useState(newTestSession)
  const [lang, setLang] = useState<'vi' | 'en'>('vi')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant' | 'notice'; text: string; ms?: number }[]>([])
  const [busy, setBusy] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const scroll = () => requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }))

  const ask = async () => {
    const question = input.trim()
    if (!question || busy) return
    setInput('')
    setBusy(true)
    setMessages((m) => [...m, { role: 'user', text: question }, { role: 'assistant', text: '' }])
    scroll()
    const started = performance.now()
    try {
      const res = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-Admin-Test': '1' },
        body: JSON.stringify({ sessionId: session, message: question, lang }),
      })
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''
        for (const event of events) {
          const data = event.replace(/^data: /, '').trim()
          if (!data || data === '[DONE]') continue
          const parsed = JSON.parse(data)
          setMessages((m) => {
            const next = [...m]
            const last = next[next.length - 1]
            if (parsed.token) next[next.length - 1] = { ...last, text: last.text + parsed.token }
            if (parsed.notice) next[next.length - 1] = { role: 'notice', text: parsed.notice }
            return next
          })
          scroll()
        }
      }
      const ms = Math.round(performance.now() - started)
      setMessages((m) => m.map((x, i) => (i === m.length - 1 && x.role === 'assistant' ? { ...x, ms } : x)))
    } catch {
      setMessages((m) => [...m.slice(0, -1), { role: 'notice', text: 'Không gọi được Sigma Cat. Model có thể đang khởi động.' }])
    } finally {
      setBusy(false)
      qc.invalidateQueries({ queryKey: ['chat-sessions'] })
    }
  }

  return (
    <div className="border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <p className="font-body text-sm text-text-muted">Hỏi như một khách. Không tính giới hạn, không gửi Telegram, không vào số liệu.</p>
        <div className="flex items-center gap-2">
          <select value={lang} onChange={(e) => setLang(e.target.value as 'vi' | 'en')} aria-label="Ngôn ngữ trang" className="h-9 border border-border bg-obsidian px-2 font-mono text-xs text-text-main">
            <option value="vi">Trang /vi</option>
            <option value="en">Trang /</option>
          </select>
          <Button variant="secondary" className="h-9" icon={<RotateCcw size={13} />} onClick={() => { setSession(newTestSession()); setMessages([]) }}>
            Phiên mới
          </Button>
        </div>
      </div>
      <div ref={listRef} className="admin-scroll h-[50vh] min-h-72 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && <p className="pt-10 text-center font-body text-sm text-text-muted">Thử hỏi: “Anh Khôi đang làm gì?” hoặc “What is ChickenNote?”</p>}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3.5 py-2.5 font-body text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-primary text-black' : m.role === 'notice' ? 'border border-amber-500/50 text-amber-300' : 'border border-border bg-obsidian text-text-main'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{m.text || (busy && i === messages.length - 1 ? '…' : '')}</p>
              {m.ms != null && <p className="mt-1 font-mono text-[10px] text-text-muted">{seconds(m.ms)}</p>}
            </div>
          </div>
        ))}
      </div>
      <form
        className="flex gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault()
          ask()
        }}
      >
        <input
          value={input}
          maxLength={350}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi Sigma Cat…"
          aria-label="Câu hỏi thử"
          className="min-w-0 flex-1 border border-border bg-obsidian px-3.5 py-2.5 font-body text-sm text-text-main focus:border-primary focus:outline-none"
        />
        <Button type="submit" loading={busy} disabled={!input.trim()} icon={<Send size={14} />}>Hỏi</Button>
      </form>
    </div>
  )
}

export function SigmaCat() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'facts'
  const tabs = useMemo(
    () => [
      { value: 'facts' as Tab, label: 'Thông tin' },
      { value: 'chats' as Tab, label: 'Hội thoại' },
      { value: 'stats' as Tab, label: 'Số liệu' },
      { value: 'try' as Tab, label: 'Hỏi thử' },
    ],
    [],
  )
  return (
    <>
      <PageHeader title="Sigma Cat" description="Trợ lý mèo trên trang: trợ lý của anh, không phải anh. Model chạy trên máy ở nhà." />
      <Tabs value={tab} onChange={(t) => setParams({ tab: t })} tabs={tabs} />
      {tab === 'facts' && <Facts />}
      {tab === 'chats' && <Chats />}
      {tab === 'stats' && <Stats />}
      {tab === 'try' && <Try />}
    </>
  )
}
