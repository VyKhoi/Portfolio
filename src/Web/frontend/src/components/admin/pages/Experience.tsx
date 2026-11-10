import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { api, send, type Experience as Job } from '../api'
import { useEditForm } from '../form'
import { CONTENT_KEYS } from '../publish'
import {
  Bilingual,
  Button,
  Empty,
  ErrorBox,
  IconButton,
  LangHeading,
  LinesEditor,
  PageHeader,
  Panel,
  SaveBar,
  Skeleton,
  SortableList,
  TagsEditor,
  TextInput,
  useConfirm,
  useToast,
} from '../ui'

type Draft = Omit<Job, 'id' | 'order'>

const EMPTY: Draft = {
  role: '', roleEn: '', company: '', companyEn: '', period: '', periodEn: '',
  projectName: '', projectNameEn: '', highlights: [], highlightsEn: [], techStack: [],
}

const toDraft = ({ id: _id, order: _order, ...rest }: Job): Draft => rest

/** The timeline card as the site shows it. */
function JobCard({ job, lang }: { job: Draft; lang: 'vi' | 'en' }) {
  const en = lang === 'en'
  const pick = (vi: string, enValue: string) => (en && enValue ? enValue : vi)
  const highlights = en && job.highlightsEn.length ? job.highlightsEn : job.highlights
  const project = pick(job.projectName, job.projectNameEn)
  return (
    <div className="border border-border bg-obsidian p-5">
      <p className="mb-2 font-mono text-sm font-bold uppercase tracking-tighter text-primary">{pick(job.period, job.periodEn) || '—'}</p>
      <div className="mb-3 flex flex-col gap-1">
        <p className="font-heading text-lg font-bold uppercase text-text-main">{pick(job.role, job.roleEn) || 'Vị trí'}</p>
        <p className="font-mono text-xs tracking-widest text-text-muted">{pick(job.company, job.companyEn)}</p>
      </div>
      {project && <p className="mb-3 font-heading text-sm font-bold uppercase tracking-tighter text-primary">[ {en ? 'PROJECT' : 'DỰ ÁN'}: {project} ]</p>}
      {highlights.filter(Boolean).length > 0 && (
        <ul className="space-y-1.5">
          {highlights.filter(Boolean).map((h, i) => (
            <li key={i} className="flex gap-2 font-body text-sm leading-relaxed text-text-muted"><span className="font-mono text-primary">{'>'}</span>{h}</li>
          ))}
        </ul>
      )}
      {job.techStack.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
          {job.techStack.map((t) => <span key={t} className="border border-border px-2 py-0.5 font-mono text-[11px] uppercase text-text-muted">{t}</span>)}
        </div>
      )}
    </div>
  )
}

function Editor({ job, onDone }: { job: Job | null; onDone: () => void }) {
  const isNew = job === null
  // Stable object: the form hook resets when its source changes
  const source = useMemo(() => (job ? toDraft(job) : EMPTY), [job])
  const form = useEditForm<Draft>(
    source,
    (d) => (isNew ? send('content/experiences', 'POST', d) : send(`content/experiences/${job!.id}`, 'PUT', d)),
    { onSaved: isNew ? onDone : undefined },
  )
  const d = form.value!
  const set = (changes: Partial<Draft>) => form.patch(changes)

  return (
    <>
      <PageHeader
        title={isNew ? 'Thêm kinh nghiệm' : 'Sửa kinh nghiệm'}
        description={isNew ? 'Việc mới được đặt lên đầu dòng thời gian.' : `${job!.role} · ${job!.company}`}
        actions={<Button variant="secondary" icon={<ArrowLeft size={14} />} onClick={onDone}>Danh sách</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="Nội dung">
          <div className="space-y-5">
            <LangHeading />
            <Bilingual vi={<TextInput label="Vị trí" value={d.role} onChange={(v) => set({ role: v })} max={100} lang="vi" />} en={<TextInput label="Role (EN)" value={d.roleEn} onChange={(v) => set({ roleEn: v })} max={100} lang="en" />} />
            <Bilingual vi={<TextInput label="Công ty" value={d.company} onChange={(v) => set({ company: v })} max={100} lang="vi" />} en={<TextInput label="Company (EN)" value={d.companyEn} onChange={(v) => set({ companyEn: v })} max={100} lang="en" />} />
            <Bilingual vi={<TextInput label="Thời gian" value={d.period} onChange={(v) => set({ period: v })} max={40} placeholder="05/2026 - Hiện tại" lang="vi" />} en={<TextInput label="Period (EN)" value={d.periodEn} onChange={(v) => set({ periodEn: v })} max={40} placeholder="05/2026 - Present" lang="en" />} />
            <Bilingual vi={<TextInput label="Tên dự án (tuỳ chọn)" value={d.projectName} onChange={(v) => set({ projectName: v })} max={100} lang="vi" />} en={<TextInput label="Project (EN)" value={d.projectNameEn} onChange={(v) => set({ projectNameEn: v })} max={100} lang="en" />} />
            <Bilingual vi={<LinesEditor label="Ý chính" lines={d.highlights} onChange={(v) => set({ highlights: v })} lang="vi" />} en={<LinesEditor label="Highlights (EN)" lines={d.highlightsEn} onChange={(v) => set({ highlightsEn: v })} lang="en" />} />
            <TagsEditor label="Công nghệ" tags={d.techStack} onChange={(v) => set({ techStack: v })} />
            <p className="font-body text-xs text-text-muted">Ô tiếng Anh để trống thì bản tiếng Anh dùng chữ tiếng Việt. Sigma Cat cũng đọc 3 ý chính đầu của mỗi việc.</p>
          </div>
        </Panel>
        <div className="space-y-3 xl:sticky xl:top-10 xl:self-start">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-text-muted">Xem trước</p>
          <JobCard job={d} lang="vi" />
          <JobCard job={d} lang="en" />
        </div>
      </div>
      <SaveBar
        dirty={form.dirty}
        saving={form.saving}
        onSave={form.submit}
        onReset={form.reset}
      />
    </>
  )
}

export function Experience() {
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const [params, setParams] = useSearchParams()
  const [order, setOrder] = useState<Job[] | null>(null)
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['experiences'], queryFn: () => api<Job[]>('content/experiences') })

  const refresh = () => CONTENT_KEYS.forEach((k) => qc.invalidateQueries({ queryKey: [k] }))
  const reorder = useMutation({
    mutationFn: (jobs: Job[]) => send('content/experiences/order', 'PUT', { ids: jobs.map((j) => j.id) }),
    onSuccess: () => {
      toast.ok('Đã đổi thứ tự.')
      refresh()
    },
    onError: (e: Error) => {
      toast.error(e.message)
      setOrder(null)
    },
    onSettled: () => setOrder(null),
  })
  const remove = useMutation({
    mutationFn: (id: string) => send(`content/experiences/${id}`, 'DELETE'),
    onSuccess: () => {
      toast.ok('Đã xoá.')
      refresh()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const editing = params.get('edit')
  const close = () => setParams({})
  if (editing) {
    if (editing === 'new') return <Editor job={null} onDone={close} />
    const job = data?.find((j) => j.id === editing)
    if (job) return <Editor key={job.id} job={job} onDone={close} />
  }

  const header = (
    <PageHeader
      title="Kinh nghiệm"
      description="Dòng thời gian trên trang chủ, trên cùng là việc mới nhất. Kéo ⋮⋮ để đổi thứ tự."
      actions={<Button icon={<Plus size={14} />} onClick={() => setParams({ edit: 'new' })}>Thêm</Button>}
    />
  )
  if (isLoading) return <>{header}<Skeleton rows={4} /></>
  if (error) return <>{header}<ErrorBox error={error} retry={() => refetch()} /></>

  const jobs = order ?? data ?? []
  if (jobs.length === 0) return <>{header}<Empty title="Chưa có kinh nghiệm nào" action={<Button onClick={() => setParams({ edit: 'new' })}>Thêm việc đầu tiên</Button>} /></>

  return (
    <>
      {header}
      <SortableList
        items={jobs}
        label={(j) => `${j.role}, ${j.company}`}
        onReorder={(next) => {
          setOrder(next)
          reorder.mutate(next)
        }}
        render={(j) => (
          <div className="flex items-center gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs font-bold uppercase text-primary">{j.period}</p>
              <p className="truncate font-heading text-base font-bold text-text-main">{j.role}</p>
              <p className="truncate font-body text-sm text-text-muted">
                {j.company}{j.projectName ? ` · ${j.projectName}` : ''} · {j.highlights.length} ý chính
              </p>
            </div>
            <IconButton label="Sửa" onClick={() => setParams({ edit: j.id })}><Pencil size={15} /></IconButton>
            <IconButton
              label="Xoá"
              className="hover:border-red-500 hover:text-red-400"
              onClick={async () => {
                if (await confirm({ title: 'Xoá kinh nghiệm này?', text: `${j.role} · ${j.company} sẽ biến khỏi trang sau lần xuất bản tới.`, action: 'Xoá', danger: true }))
                  remove.mutate(j.id)
              }}
            >
              <Trash2 size={15} />
            </IconButton>
          </div>
        )}
      />
    </>
  )
}
