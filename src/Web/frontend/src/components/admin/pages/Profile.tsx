import { useQuery } from '@tanstack/react-query'
import { api, send, type Profile as ProfileData } from '../api'
import { useEditForm } from '../form'
import { Bilingual, ErrorBox, LangHeading, PageHeader, Panel, SaveBar, Skeleton, TextArea, TextInput } from '../ui'

/** The hero block as it looks on the site, in one language. */
function HeroPreview({ p, lang }: { p: ProfileData; lang: 'vi' | 'en' }) {
  const parts = p.fullName.trim().split(/\s+/)
  const last = parts.pop() ?? ''
  const title = lang === 'en' ? p.titleEn || p.title : p.title
  const bio = lang === 'en' ? p.bioEn || p.bio : p.bio
  return (
    <div className="border border-border bg-obsidian p-5">
      <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">{lang === 'en' ? 'dangvykhoi.com/' : 'dangvykhoi.com/vi'}</p>
      <p className="font-heading text-3xl font-bold uppercase leading-[0.95] tracking-tighter text-text-main break-words">
        {parts.join(' ')} <span className="text-outline-primary">{last}</span>
      </p>
      <p className="mt-3 font-mono text-xs uppercase tracking-widest text-primary">{title}</p>
      <p className="mt-3 border-l-2 border-primary pl-3 font-body text-sm leading-relaxed text-text-muted">{bio}</p>
    </div>
  )
}

export function Profile() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['profile'], queryFn: () => api<ProfileData>('content/profile') })
  const form = useEditForm(data, (p) => send('content/profile', 'PUT', p))
  const p = form.value

  const header = <PageHeader title="Hồ sơ" description="Tên, chức danh và lời giới thiệu ở đầu trang chủ. Ảnh chân dung và file CV là file trong repo (nhờ em thay)." />
  if (isLoading) return <>{header}<Skeleton rows={3} /></>
  if (error || !p) return <>{header}<ErrorBox error={error} retry={() => refetch()} /></>

  return (
    <>
      {header}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Panel title="Thông tin">
            <div className="space-y-4">
              <TextInput label="Họ tên" value={p.fullName} onChange={(v) => form.patch({ fullName: v })} max={80} hint="Viết hoa có dấu. Chữ cuối được tô viền cam trên trang." />
              <LangHeading />
              <Bilingual
                vi={<TextInput label="Chức danh" value={p.title} onChange={(v) => form.patch({ title: v })} max={120} lang="vi" />}
                en={<TextInput label="Title (EN)" value={p.titleEn} onChange={(v) => form.patch({ titleEn: v })} max={120} lang="en" />}
              />
              <Bilingual
                vi={<TextArea label="Giới thiệu" value={p.bio} onChange={(v) => form.patch({ bio: v })} max={600} rows={5} lang="vi" />}
                en={<TextArea label="Bio (EN)" value={p.bioEn} onChange={(v) => form.patch({ bioEn: v })} max={600} rows={5} lang="en" hint="Để trống thì bản tiếng Anh dùng chữ tiếng Việt." />}
              />
            </div>
          </Panel>

          <Panel title="Liên kết">
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="GitHub" type="url" value={p.githubLink} onChange={(v) => form.patch({ githubLink: v })} placeholder="https://github.com/…" />
              <TextInput label="LinkedIn" type="url" value={p.linkedinLink} onChange={(v) => form.patch({ linkedinLink: v })} placeholder="https://linkedin.com/in/…" />
            </div>
          </Panel>
        </div>

        <div className="space-y-3 xl:sticky xl:top-10 xl:self-start">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-text-muted">Xem trước</p>
          <HeroPreview p={p} lang="vi" />
          <HeroPreview p={p} lang="en" />
        </div>
      </div>
      <SaveBar dirty={form.dirty} saving={form.saving} onSave={form.submit} onReset={form.reset} />
    </>
  )
}
