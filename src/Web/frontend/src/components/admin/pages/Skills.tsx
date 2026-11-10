import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { SKILL_GROUPS, api, send, type Skill } from '../api'
import { CONTENT_KEYS } from '../publish'
import { ErrorBox, IconButton, PageHeader, Panel, Skeleton, SortableList, useConfirm, useToast } from '../ui'

const input = 'min-w-0 flex-1 border border-border bg-obsidian px-3 py-2 font-body text-sm text-text-main focus:border-primary focus:outline-none'

function SkillRow({ skill, onSave, onDelete }: { skill: Skill; onSave: (s: Skill) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(skill.name)
  const [category, setCategory] = useState(skill.category)
  const save = () => {
    if (name.trim() && (name.trim() !== skill.name || category !== skill.category)) onSave({ ...skill, name: name.trim(), category })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 p-2">
        <input
          autoFocus
          value={name}
          maxLength={60}
          aria-label="Tên kỹ năng"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') setEditing(false)
          }}
          className={input}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Nhóm" className={`${input} flex-none cursor-pointer`}>
          {SKILL_GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
        </select>
        <IconButton label="Lưu" onClick={save}><Check size={15} /></IconButton>
        <IconButton label="Huỷ" onClick={() => setEditing(false)}><X size={15} /></IconButton>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="flex-1 truncate font-body text-[15px] text-text-main">{skill.name}</span>
      <IconButton label={`Sửa ${skill.name}`} onClick={() => setEditing(true)}><Pencil size={14} /></IconButton>
      <IconButton label={`Xoá ${skill.name}`} className="hover:border-red-500 hover:text-red-400" onClick={onDelete}><Trash2 size={14} /></IconButton>
    </div>
  )
}

function AddSkill({ category, onAdd }: { category: string; onAdd: (name: string) => void }) {
  const [name, setName] = useState('')
  const add = () => {
    if (name.trim()) onAdd(name.trim())
    setName('')
  }
  return (
    <div className="mt-2 flex gap-2">
      <input
        value={name}
        maxLength={60}
        placeholder="Thêm kỹ năng…"
        aria-label={`Thêm kỹ năng vào ${category}`}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && add()}
        className={input}
      />
      <IconButton label="Thêm" onClick={add} disabled={!name.trim()} className="h-[38px] w-[38px]"><Plus size={16} /></IconButton>
    </div>
  )
}

export function Skills() {
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const [pending, setPending] = useState<Skill[] | null>(null)
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['skills'], queryFn: () => api<Skill[]>('content/skills') })

  const done = (text: string) => () => {
    toast.ok(text)
    CONTENT_KEYS.forEach((k) => qc.invalidateQueries({ queryKey: [k] }))
  }
  const fail = (e: Error) => toast.error(e.message)

  const add = useMutation({ mutationFn: (s: { name: string; category: string }) => send('content/skills', 'POST', s), onSuccess: done('Đã thêm.'), onError: fail })
  const update = useMutation({ mutationFn: (s: Skill) => send(`content/skills/${s.id}`, 'PUT', { name: s.name, category: s.category }), onSuccess: done('Đã lưu.'), onError: fail })
  const remove = useMutation({ mutationFn: (id: string) => send(`content/skills/${id}`, 'DELETE'), onSuccess: done('Đã xoá.'), onError: fail })
  const reorder = useMutation({
    mutationFn: (all: Skill[]) => send('content/skills/order', 'PUT', { ids: all.map((s) => s.id) }),
    onSuccess: done('Đã đổi thứ tự.'),
    onError: fail,
    onSettled: () => setPending(null),
  })

  const header = <PageHeader title="Kỹ năng" description="Các ô kỹ năng ở mục Giới thiệu, theo 5 nhóm cố định (tên nhóm đã dịch sẵn 2 thứ tiếng). Kéo ⋮⋮ để đổi thứ tự trong nhóm." />
  if (isLoading) return <>{header}<Skeleton rows={5} /></>
  if (error) return <>{header}<ErrorBox error={error} retry={() => refetch()} /></>

  const skills = pending ?? data ?? []
  const groups = SKILL_GROUPS.map((g) => ({ ...g, items: skills.filter((s) => s.category === g.key) }))
  const orphans = skills.filter((s) => !SKILL_GROUPS.some((g) => g.key === s.category))

  const reorderGroup = (key: string, items: Skill[]) => {
    // The site lists skills by group, then by order: rebuild the full order group by group
    const all = SKILL_GROUPS.flatMap((g) => (g.key === key ? items : skills.filter((s) => s.category === g.key))).concat(orphans)
    setPending(all)
    reorder.mutate(all)
  }

  return (
    <>
      {header}
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <Panel key={g.key} title={g.label} aside={<span className="font-mono text-[11px] text-text-muted">{g.items.length}</span>}>
            {g.items.length === 0 ? (
              <p className="font-body text-sm text-text-muted">Nhóm trống: nhóm này sẽ không hiện trên trang.</p>
            ) : (
              <SortableList
                items={g.items}
                label={(s) => s.name}
                onReorder={(items) => reorderGroup(g.key, items)}
                render={(s) => (
                  <SkillRow
                    key={`${s.id}:${s.name}:${s.category}`}
                    skill={s}
                    onSave={(next) => update.mutate(next)}
                    onDelete={async () => {
                      if (await confirm({ title: `Xoá "${s.name}"?`, action: 'Xoá', danger: true })) remove.mutate(s.id)
                    }}
                  />
                )}
              />
            )}
            <AddSkill category={g.label} onAdd={(name) => add.mutate({ name, category: g.key })} />
          </Panel>
        ))}
      </div>
      {orphans.length > 0 && (
        <Panel title="Nhóm lạ (không hiện đúng trên trang)" className="mt-4 border-amber-500/50">
          <p className="mb-3 font-body text-sm text-amber-400">Bấm sửa để chuyển các kỹ năng này sang một nhóm có sẵn.</p>
          <div className="space-y-2">
            {orphans.map((s) => (
              <div key={s.id} className="border border-border">
                <SkillRow skill={s} onSave={(next) => update.mutate(next)} onDelete={() => remove.mutate(s.id)} />
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  )
}
