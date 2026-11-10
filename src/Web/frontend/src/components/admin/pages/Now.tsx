import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { api, send, type NowContent, type NowItem } from '../api'
import { useEditForm } from '../form'
import { Bilingual, Button, ErrorBox, IconButton, LangHeading, PageHeader, Panel, SaveBar, Skeleton, TextArea, TextInput } from '../ui'

export function Now() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['now'], queryFn: () => api<NowContent>('content/now') })
  const form = useEditForm<NowContent>(data, (n) => send('content/now', 'PUT', { items: n.items }), {
    savedText: 'Đã lưu, ngày cập nhật đổi sang hôm nay. Trang sẽ cập nhật trong khoảng 30 phút.',
  })

  const header = (
    <PageHeader
      title="Now"
      description="Vài dòng anh đang làm gì, ở cuối trang chủ. Lưu là ngày “Cập nhật” tự đổi sang hôm nay. Nên sửa mỗi tháng một lần cho trang có vẻ còn sống."
    />
  )
  if (isLoading) return <>{header}<Skeleton rows={4} /></>
  if (error || !form.value) return <>{header}<ErrorBox error={error} retry={() => refetch()} /></>

  const items = form.value.items
  const setItems = (next: NowItem[]) => form.patch({ items: next })
  const set = (i: number, changes: Partial<NowItem>) => setItems(items.map((it, j) => (j === i ? { ...it, ...changes } : it)))
  const move = (i: number, d: number) => {
    const next = [...items]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    setItems(next)
  }
  const updated = form.value.updated

  return (
    <>
      {header}
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-text-muted">
        Đang hiện: “Cập nhật {updated.slice(5, 7)}/{updated.slice(0, 4)}”
      </p>
      <div className="space-y-4">
        {items.map((item, i) => (
          <Panel
            key={i}
            title={`${String(i + 1).padStart(2, '0')} // ${item.label || 'Dòng mới'}`}
            aside={
              <div className="flex gap-1">
                <IconButton label="Lên" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={14} /></IconButton>
                <IconButton label="Xuống" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDown size={14} /></IconButton>
                <IconButton label="Xoá dòng" disabled={items.length === 1} className="hover:border-red-500 hover:text-red-400" onClick={() => setItems(items.filter((_, j) => j !== i))}>
                  <Trash2 size={14} />
                </IconButton>
              </div>
            }
          >
            <div className="space-y-4">
              <LangHeading />
              <Bilingual
                vi={<TextInput label="Nhãn" value={item.label} onChange={(v) => set(i, { label: v })} max={30} lang="vi" placeholder="Công việc" />}
                en={<TextInput label="Label (EN)" value={item.labelEn} onChange={(v) => set(i, { labelEn: v })} max={30} lang="en" placeholder="Work" />}
              />
              <Bilingual
                vi={<TextArea label="Nội dung" value={item.text} onChange={(v) => set(i, { text: v })} max={160} rows={2} lang="vi" />}
                en={<TextArea label="Text (EN)" value={item.textEn} onChange={(v) => set(i, { textEn: v })} max={160} rows={2} lang="en" />}
              />
            </div>
          </Panel>
        ))}
      </div>
      {items.length < 6 && (
        <Button variant="secondary" icon={<Plus size={14} />} className="mt-4" onClick={() => setItems([...items, { label: '', labelEn: '', text: '', textEn: '' }])}>
          Thêm dòng
        </Button>
      )}
      <SaveBar dirty={form.dirty} saving={form.saving} onSave={form.submit} onReset={form.reset} note="Trang chủ đẹp nhất với 4 dòng." />
    </>
  )
}
