import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { api, seconds, timeAgo, type ChatSession, type ContactMessage, type Status } from '../api'
import { usePublishState } from '../publish'
import { Badge, ErrorBox, PageHeader, Panel, Skeleton } from '../ui'

function Stat({ label, value, note, to }: { label: string; value: React.ReactNode; note?: string; to?: string }) {
  const body = (
    <>
      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-text-muted">{label}</p>
      <p className="mt-3 font-heading text-4xl font-bold tracking-tight text-text-main">{value}</p>
      {note && <p className="mt-1 font-body text-xs text-text-muted">{note}</p>}
    </>
  )
  return to ? (
    <Link to={to} className="block border border-border bg-surface p-5 transition-colors hover:border-primary">{body}</Link>
  ) : (
    <div className="border border-border bg-surface p-5">{body}</div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
      <span className="font-body text-sm text-text-muted">{label}</span>
      <span className="text-right font-body text-sm text-text-main">{children}</span>
    </div>
  )
}

/** Seven bars, one per day: how many questions Sigma Cat answered. */
function ChatChart({ days }: { days: Status['chat']['days'] }) {
  const max = Math.max(1, ...days.map((d) => d.replies))
  return (
    <div>
      <div className="flex h-28 items-end gap-2" role="img" aria-label={`Số câu trả lời 7 ngày: ${days.map((d) => d.replies).join(', ')}`}>
        {days.map((d) => (
          <div key={d.date} className="flex h-full flex-1 flex-col justify-end" title={`${d.date.slice(8)}/${d.date.slice(5, 7)}: ${d.replies} câu, ${seconds(d.medianMs)}`}>
            <span className="mb-1 text-center font-mono text-[11px] text-text-muted">{d.replies || ''}</span>
            <div className="bg-primary/80" style={{ height: `${Math.max(d.replies ? 6 : 1, (d.replies / max) * 100)}%`, opacity: d.replies ? 1 : 0.25 }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 border-t border-border pt-2">
        {days.map((d) => (
          <span key={d.date} className="flex-1 text-center font-mono text-[10px] text-text-muted">{d.date.slice(8)}/{d.date.slice(5, 7)}</span>
        ))}
      </div>
    </div>
  )
}

export function Overview() {
  const status = useQuery({ queryKey: ['status'], queryFn: () => api<Status>('admin/status'), refetchInterval: 60_000 })
  const inbox = useQuery({ queryKey: ['inbox'], queryFn: () => api<ContactMessage[]>('contact/messages') })
  const sessions = useQuery({ queryKey: ['chat-sessions'], queryFn: () => api<ChatSession[]>('ai/sessions') })
  const publish = usePublishState()

  if (status.isLoading) return <><PageHeader title="Tổng quan" /><Skeleton rows={4} /></>
  if (status.error || !status.data) return <><PageHeader title="Tổng quan" /><ErrorBox error={status.error} retry={() => status.refetch()} /></>

  const s = status.data
  const latestMessages = (inbox.data ?? []).slice(0, 5)
  const latestChats = (sessions.data ?? []).filter((c) => !c.isTest).slice(0, 5)

  return (
    <>
      <PageHeader title="Tổng quan" description="Số liệu thật từ máy chủ, cập nhật mỗi phút." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Tin chưa đọc" value={s.inbox.unread} note={`${s.inbox.total} tin trong hộp thư`} to="/dashboard/inbox" />
        <Stat label="Khách hỏi Sigma Cat" value={s.chat.sessions7d} note={`${s.chat.replies7d} câu trả lời, 7 ngày`} to="/dashboard/sigma-cat" />
        <Stat label="Thời gian trả lời" value={seconds(s.chat.medianReplyMs)} note={`chữ đầu sau ${seconds(s.chat.medianFirstTokenMs)} (trung vị)`} />
        <Stat label="Bị chặn vì hỏi dồn" value={s.chat.refused7d} note="lượt, 7 ngày (từ lần khởi động gần nhất)" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Panel title="Sigma Cat · 7 ngày" className="lg:col-span-3">
          <ChatChart days={s.chat.days} />
        </Panel>

        <Panel title="Hệ thống" className="lg:col-span-2">
          <Row label="API">
            <Badge tone="ok">Đang chạy</Badge>
          </Row>
          <Row label="Model AI">
            {s.ollama.online ? (
              <span className="flex flex-col items-end gap-1">
                <span className="font-mono text-xs">{s.ollama.model}</span>
                {s.ollama.loaded ? (
                  <Badge tone={s.ollama.gpuPercent ? 'ok' : 'warn'}>{s.ollama.gpuPercent ? `${s.ollama.gpuPercent}% trên GPU` : 'Chạy bằng CPU'}</Badge>
                ) : (
                  <Badge tone="warn">Chưa nạp</Badge>
                )}
              </span>
            ) : (
              <Badge tone="warn">Không kết nối được</Badge>
            )}
          </Row>
          <Row label="Trang tĩnh">
            {publish.data?.state === 'published' && <Badge tone="ok">Đã xuất bản</Badge>}
            {publish.data?.state === 'pending' && <Badge tone="warn">Chờ xuất bản</Badge>}
            {(!publish.data || publish.data.state === 'unknown') && <span className="text-text-muted">—</span>}
          </Row>
          <Row label="Bản đang chạy">
            {s.build.commit ? (
              <a href={`https://github.com/vykhoi/Portfolio/commit/${s.build.commit}`} target="_blank" rel="noopener" className="font-mono text-xs text-primary hover:underline">
                {s.build.commit}
              </a>
            ) : (
              <span className="text-text-muted">—</span>
            )}
            {s.build.time && <span className="block font-body text-xs text-text-muted">deploy {timeAgo(s.build.time)}</span>}
          </Row>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Tin nhắn mới" aside={<Link to="/dashboard/inbox" className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary hover:underline">Tất cả</Link>}>
          {latestMessages.length === 0 ? (
            <p className="font-body text-sm text-text-muted">Chưa có tin nhắn.</p>
          ) : (
            <ul className="-my-1">
              {latestMessages.map((m) => (
                <li key={m.id}>
                  <Link to={`/dashboard/inbox?id=${m.id}`} className="group flex items-center gap-3 py-2">
                    {m.status === 'Pending' && <span className="h-1.5 w-1.5 shrink-0 bg-primary" aria-label="chưa đọc" />}
                    <span className={`min-w-0 flex-1 truncate font-body text-sm ${m.status === 'Pending' ? 'font-semibold text-text-main' : 'text-text-muted'} group-hover:text-primary`}>
                      {m.name}: {m.message}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-text-muted">{timeAgo(m.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Hội thoại gần đây" aside={<Link to="/dashboard/sigma-cat?tab=chats" className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary hover:underline">Tất cả</Link>}>
          {latestChats.length === 0 ? (
            <p className="font-body text-sm text-text-muted">Chưa có ai hỏi Sigma Cat.</p>
          ) : (
            <ul className="-my-1">
              {latestChats.map((c) => (
                <li key={c.sessionId}>
                  <Link to={`/dashboard/sigma-cat?tab=chats&session=${c.sessionId}`} className="group flex items-center justify-between gap-3 py-2">
                    <span className="truncate font-mono text-xs text-text-muted group-hover:text-primary">#{c.sessionId.slice(0, 8)}</span>
                    <span className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-text-muted">
                      {timeAgo(c.lastMessageAt)} <ArrowRight size={12} aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}
