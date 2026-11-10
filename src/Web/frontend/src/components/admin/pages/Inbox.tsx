import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Mail, Trash2 } from 'lucide-react'
import { api, formatTime, send, timeAgo, type ContactMessage } from '../api'
import { Badge, Button, Empty, ErrorBox, PageHeader, Skeleton, Tabs, useConfirm, useToast } from '../ui'

const STATUS_LABEL: Record<ContactMessage['status'], string> = { Pending: 'Chưa đọc', Read: 'Đã đọc', Replied: 'Đã trả lời' }

export function Inbox() {
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['inbox'], queryFn: () => api<ContactMessage[]>('contact/messages') })

  const selectedId = params.get('id')
  const selected = data?.find((m) => m.id === selectedId) ?? null
  const select = (id: string | null) => setParams(id ? { id } : {}, { replace: !id })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['inbox'] })
    qc.invalidateQueries({ queryKey: ['status'] })
  }

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContactMessage['status'] }) => send(`contact/messages/${id}/status`, 'PATCH', { status }),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  })
  const remove = useMutation({
    mutationFn: (id: string) => send(`contact/messages/${id}`, 'DELETE'),
    onSuccess: () => {
      toast.ok('Đã xoá tin nhắn.')
      select(null)
      refresh()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // Opening a message marks it read
  const { mutate: mark } = setStatus
  useEffect(() => {
    if (selected?.status === 'Pending') mark({ id: selected.id, status: 'Read' })
  }, [selected?.id, selected?.status, mark])

  const list = (data ?? []).filter((m) => filter === 'all' || m.status === 'Pending')
  const unread = (data ?? []).filter((m) => m.status === 'Pending').length

  const reply = (m: ContactMessage) => {
    const body = `\n\n---\n${m.name} viết lúc ${formatTime(m.createdAt)}:\n${m.message}`
    window.location.href = `mailto:${m.email}?subject=${encodeURIComponent('Re: Tin nhắn từ dangvykhoi.com')}&body=${encodeURIComponent(body)}`
    if (m.status !== 'Replied') setStatus.mutate({ id: m.id, status: 'Replied' })
  }

  const header = (
    <PageHeader
      title="Hộp thư"
      description="Tin nhắn khách gửi từ form liên hệ. Được giữ 12 tháng rồi tự xoá (theo trang Chính sách). Khách yêu cầu xoá thì xoá ở đây."
    />
  )
  if (isLoading) return <>{header}<Skeleton rows={4} /></>
  if (error) return <>{header}<ErrorBox error={error} retry={() => refetch()} /></>

  return (
    <>
      {header}
      {(data ?? []).length === 0 ? (
        <Empty title="Chưa có tin nhắn nào" text="Khi có người gửi form liên hệ, tin nhắn hiện ở đây và anh nhận email + Telegram báo." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* List: hidden on phones while a message is open */}
          <div className={selected ? 'hidden lg:block' : ''}>
            <Tabs
              value={filter}
              onChange={setFilter}
              tabs={[
                { value: 'all', label: 'Tất cả' },
                { value: 'unread', label: 'Chưa đọc', badge: unread > 0 ? <Badge tone="primary">{unread}</Badge> : undefined },
              ]}
            />
            {list.length === 0 ? (
              <p className="font-body text-sm text-text-muted">Đã đọc hết.</p>
            ) : (
              <ul className="divide-y divide-border border border-border">
                {list.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => select(m.id)}
                      className={`block w-full px-4 py-3 text-left transition-colors hover:bg-surface ${m.id === selectedId ? 'bg-surface' : ''}`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className={`flex min-w-0 items-center gap-2 font-body text-sm ${m.status === 'Pending' ? 'font-bold text-text-main' : 'text-text-main'}`}>
                          {m.status === 'Pending' && <span className="h-1.5 w-1.5 shrink-0 bg-primary" aria-label="chưa đọc" />}
                          <span className="truncate">{m.name}</span>
                        </span>
                        <span className="shrink-0 font-mono text-[11px] text-text-muted">{timeAgo(m.createdAt)}</span>
                      </span>
                      <span className="mt-1 block truncate font-body text-sm text-text-muted">{m.message}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={selected ? '' : 'hidden lg:block'}>
            {selected ? (
              <article className="border border-border bg-surface">
                <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
                  <button type="button" onClick={() => select(null)} className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-text-muted hover:text-primary lg:hidden">
                    <ArrowLeft size={14} /> Danh sách
                  </button>
                  <Badge tone={selected.status === 'Replied' ? 'ok' : selected.status === 'Pending' ? 'primary' : 'muted'}>{STATUS_LABEL[selected.status]}</Badge>
                  <span className="font-mono text-[11px] text-text-muted">{formatTime(selected.createdAt)}</span>
                </div>
                <div className="p-5">
                  <h2 className="font-heading text-2xl font-bold text-text-main">{selected.name}</h2>
                  <a href={`mailto:${selected.email}`} className="font-mono text-sm text-primary hover:underline">{selected.email}</a>
                  <p className="mt-5 whitespace-pre-wrap break-words font-body text-base leading-relaxed text-text-main">{selected.message}</p>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
                  <Button icon={<Mail size={14} />} onClick={() => reply(selected)}>Trả lời qua email</Button>
                  {selected.status !== 'Pending' && (
                    <Button variant="secondary" onClick={() => setStatus.mutate({ id: selected.id, status: 'Pending' })}>Đánh dấu chưa đọc</Button>
                  )}
                  <Button
                    variant="danger"
                    icon={<Trash2 size={14} />}
                    loading={remove.isPending}
                    onClick={async () => {
                      if (await confirm({ title: 'Xoá tin nhắn này?', text: `Tin của ${selected.name} sẽ bị xoá hẳn khỏi cơ sở dữ liệu (bản backup cũ tự hết sau 14 ngày).`, action: 'Xoá', danger: true }))
                        remove.mutate(selected.id)
                    }}
                  >
                    Xoá
                  </Button>
                </div>
              </article>
            ) : (
              <div className="flex h-full min-h-48 items-center justify-center border border-dashed border-border font-body text-sm text-text-muted">
                Chọn một tin nhắn để đọc.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
