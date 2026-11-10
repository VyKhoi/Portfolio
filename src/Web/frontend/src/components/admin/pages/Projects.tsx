import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Plus, Trash2 } from 'lucide-react'
import type { Project, ProjectCopy, ProjectSection } from '../../../content/projects'
import { api, send } from '../api'
import { useEditForm } from '../form'
import { Button, Empty, ErrorBox, IconButton, LinesEditor, PageHeader, Panel, SaveBar, Skeleton, Tabs, TextArea, TextInput } from '../ui'

const useProjects = () => useQuery({ queryKey: ['projects'], queryFn: () => api<Project[]>('content/projects') })

const SECTION_HINT = 'Gợi ý 4 mục: Vấn đề · Ý tưởng · Cách làm · Điều rút ra. Mỗi mục có đoạn văn, danh sách ý, hoặc cả hai.'

export function Projects() {
  const { data, isLoading, error, refetch } = useProjects()
  const header = (
    <PageHeader
      title="Dự án"
      description="Sản phẩm của riêng anh: thẻ ở trang chủ và trang /projects/… Sửa chữ, link ở đây. Thêm dự án mới hoặc đổi ảnh thì nhờ em (cần file ảnh và cấu hình nginx)."
    />
  )
  if (isLoading) return <>{header}<Skeleton rows={2} /></>
  if (error) return <>{header}<ErrorBox error={error} retry={() => refetch()} /></>
  if (!data?.length) return <>{header}<Empty title="Chưa có dự án" /></>

  return (
    <>
      {header}
      <div className="grid gap-4 md:grid-cols-2">
        {data.map((p, i) => (
          <Link key={p.slug} to={p.slug} className="group border border-border bg-surface transition-colors hover:border-primary">
            <img src={p.thumb.vi} alt="" width={800} height={500} className="aspect-[16/10] w-full border-b border-border object-cover object-top opacity-80 transition-opacity group-hover:opacity-100" />
            <div className="p-5">
              <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-text-muted">
                {String(i + 1).padStart(2, '0')} / {p.copy.vi.kind} / {p.year}
              </p>
              <p className="font-heading text-2xl font-bold uppercase tracking-tighter text-text-main group-hover:text-primary">{p.copy.vi.name}</p>
              <p className="mt-2 font-body text-sm leading-relaxed text-text-muted">{p.copy.vi.summary}</p>
              <p className="mt-4 font-mono text-[11px] font-bold uppercase tracking-widest text-primary">Sửa →</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

function SectionsEditor({ sections, onChange, lang }: { sections: ProjectSection[]; onChange: (s: ProjectSection[]) => void; lang: 'vi' | 'en' }) {
  const set = (i: number, changes: Partial<ProjectSection>) => onChange(sections.map((s, j) => (j === i ? { ...s, ...changes } : s)))
  const move = (i: number, d: number) => {
    const next = [...sections]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next)
  }
  return (
    <div className="space-y-4">
      <p className="font-body text-xs text-text-muted">{SECTION_HINT}</p>
      {sections.map((s, i) => (
        <div key={i} className="border border-border bg-obsidian p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary">{String(i + 1).padStart(2, '0')} //</span>
            <div className="flex-1" />
            <IconButton label="Lên" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={14} /></IconButton>
            <IconButton label="Xuống" disabled={i === sections.length - 1} onClick={() => move(i, 1)}><ArrowDown size={14} /></IconButton>
            <IconButton label="Xoá mục" disabled={sections.length === 1} className="hover:border-red-500 hover:text-red-400" onClick={() => onChange(sections.filter((_, j) => j !== i))}>
              <Trash2 size={14} />
            </IconButton>
          </div>
          <div className="space-y-4">
            <TextInput label="Tên mục" value={s.title} onChange={(v) => set(i, { title: v })} max={60} lang={lang} />
            <TextArea label="Đoạn văn (tuỳ chọn)" value={s.text ?? ''} onChange={(v) => set(i, { text: v })} max={1200} rows={4} lang={lang} />
            <LinesEditor label="Các ý (tuỳ chọn)" lines={s.points ?? []} onChange={(v) => set(i, { points: v })} lang={lang} />
          </div>
        </div>
      ))}
      {sections.length < 6 && (
        <Button variant="secondary" icon={<Plus size={14} />} onClick={() => onChange([...sections, { title: '', text: '', points: [] }])}>
          Thêm mục
        </Button>
      )}
    </div>
  )
}

function CopyEditor({ copy, onChange, lang }: { copy: ProjectCopy; onChange: (c: ProjectCopy) => void; lang: 'vi' | 'en' }) {
  const set = (changes: Partial<ProjectCopy>) => onChange({ ...copy, ...changes })
  return (
    <div className="space-y-6">
      <Panel title="Thẻ trên trang chủ + đầu trang dự án">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Tên" value={copy.name} onChange={(v) => set({ name: v })} max={60} lang={lang} />
            <TextInput label="Loại" value={copy.kind} onChange={(v) => set({ kind: v })} max={40} lang={lang} hint="Ví dụ: Ghi chú online" />
          </div>
          <TextArea label="Tóm tắt (thẻ ở trang chủ)" value={copy.summary} onChange={(v) => set({ summary: v })} max={220} rows={2} lang={lang} />
          <TextArea label="Câu giới thiệu (dưới tên, trang dự án)" value={copy.tagline} onChange={(v) => set({ tagline: v })} max={200} rows={2} lang={lang} />
          <TextArea label="Phần tôi làm" value={copy.role} onChange={(v) => set({ role: v })} max={200} rows={2} lang={lang} />
          <TextInput label="Chữ trên nút" value={copy.linkLabel} onChange={(v) => set({ linkLabel: v })} max={40} lang={lang} />
        </div>
      </Panel>
      <Panel title="Các mục trong trang">
        <SectionsEditor sections={copy.sections} onChange={(sections) => set({ sections })} lang={lang} />
      </Panel>
      <Panel title="Google + chia sẻ link">
        <div className="space-y-4">
          <TextInput label="Tiêu đề trên Google" value={copy.seoTitle} onChange={(v) => set({ seoTitle: v })} max={80} lang={lang} hint="Nên dưới 60 ký tự để không bị cắt." />
          <TextArea label="Mô tả trên Google" value={copy.seoDescription} onChange={(v) => set({ seoDescription: v })} max={200} rows={3} lang={lang} hint="Nên 120–160 ký tự." />
          <TextInput label="Mô tả ảnh (cho người khiếm thị)" value={copy.imageAlt} onChange={(v) => set({ imageAlt: v })} max={160} lang={lang} />
        </div>
      </Panel>
    </div>
  )
}

/** Google result preview: what the title and description look like in search. */
function SearchPreview({ url, copy }: { url: string; copy: ProjectCopy }) {
  return (
    <div className="border border-border bg-[#f8f9fa] p-4 text-left">
      <p className="truncate font-[Arial] text-xs text-[#4d5156]">{url.replace('https://', '').replace(/\//g, ' › ')}</p>
      <p className="mt-1 line-clamp-1 font-[Arial] text-lg leading-snug text-[#1a0dab]">{copy.seoTitle || 'Tiêu đề'}</p>
      <p className="mt-1 line-clamp-2 font-[Arial] text-sm leading-snug text-[#4d5156]">{copy.seoDescription || 'Mô tả'}</p>
    </div>
  )
}

type Draft = Omit<Project, 'slug'>

export function ProjectEditor() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useProjects()
  const project = data?.find((p) => p.slug === slug)
  const source = useMemo<Draft | undefined>(() => {
    if (!project) return undefined
    const { slug: _slug, ...rest } = project
    return rest
  }, [project])
  const form = useEditForm<Draft>(source, (d) => send(`content/projects/${slug}`, 'PUT', d))
  const [lang, setLang] = useState<'vi' | 'en'>('vi')

  if (isLoading) return <Skeleton rows={4} />
  if (error) return <ErrorBox error={error} retry={() => refetch()} />
  if (!project || !form.value) return <Empty title="Không có dự án này" action={<Button onClick={() => navigate('/dashboard/projects')}>Về danh sách</Button>} />

  const d = form.value
  const pagePath = (l: 'vi' | 'en') => `${l === 'vi' ? '/vi' : ''}/projects/${slug}`

  return (
    <>
      <PageHeader
        title={d.copy.vi.name}
        description={<>Trang <span className="font-mono text-text-main">/projects/{slug}</span> và bản /vi. Đường dẫn cố định vì Google đã biết.</>}
        actions={
          <>
            <Button variant="secondary" icon={<ArrowLeft size={14} />} onClick={() => navigate('/dashboard/projects')}>Danh sách</Button>
            <a href={pagePath(lang)} target="_blank" rel="noopener" className="inline-flex h-10 items-center gap-2 border border-border px-4 font-mono text-xs font-bold uppercase tracking-widest text-text-main hover:border-primary hover:text-primary">
              Xem trang <ExternalLink size={14} />
            </a>
          </>
        }
      />

      <Panel title="Chung" className="mb-6">
        <div className="grid gap-4 md:grid-cols-3">
          <TextInput label="Năm" value={d.year} onChange={(v) => form.patch({ year: v })} max={4} />
          <TextInput label="Link (bản Việt)" type="url" value={d.url.vi} onChange={(v) => form.patch({ url: { ...d.url, vi: v } })} />
          <TextInput label="Link (bản Anh)" type="url" value={d.url.en} onChange={(v) => form.patch({ url: { ...d.url, en: v } })} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {(['vi', 'en'] as const).flatMap((l) => [
            { src: d.image[l], label: `Ảnh trang (${l})` },
            { src: d.ogImage[l], label: `Ảnh chia sẻ (${l})` },
          ]).map((img) => (
            <figure key={img.label}>
              <img src={img.src} alt="" className="aspect-[16/10] w-full border border-border object-cover object-top" />
              <figcaption className="mt-1 font-mono text-[10px] uppercase tracking-widest text-text-muted">{img.label}</figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-3 font-body text-xs text-text-muted">Ảnh là file trong repo (<span className="font-mono">public/projects/</span>). Muốn đổi ảnh thì nhờ em chụp lại.</p>
      </Panel>

      <Tabs
        value={lang}
        onChange={setLang}
        tabs={[
          { value: 'vi', label: 'Tiếng Việt · /vi' },
          { value: 'en', label: 'English · /' },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <CopyEditor key={lang} copy={d.copy[lang]} lang={lang} onChange={(c) => form.patch({ copy: { ...d.copy, [lang]: c } })} />
        <div className="space-y-3 xl:sticky xl:top-10 xl:self-start">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-text-muted">Trên Google</p>
          <SearchPreview url={`https://dangvykhoi.com${pagePath(lang)}`} copy={d.copy[lang]} />
          <p className="pt-2 font-mono text-[11px] font-bold uppercase tracking-widest text-text-muted">Thẻ ở trang chủ</p>
          <div className="border border-border bg-obsidian">
            <img src={d.thumb[lang]} alt="" className="aspect-[16/10] w-full border-b border-border object-cover object-top" />
            <div className="p-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">{d.copy[lang].kind}</p>
              <p className="mt-1 font-heading text-xl font-bold uppercase tracking-tighter text-text-main">{d.copy[lang].name}</p>
              <p className="mt-2 font-body text-sm leading-relaxed text-text-muted">{d.copy[lang].summary}</p>
            </div>
          </div>
        </div>
      </div>
      <SaveBar dirty={form.dirty} saving={form.saving} onSave={form.submit} onReset={form.reset} />
    </>
  )
}
