/* oxlint-disable react/only-export-components -- admin-only module of small shared pieces and hooks */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, GripVertical, Loader2, Plus, X } from 'lucide-react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ')

// ─── Toasts ─────────────────────────────────────────────

type Toast = { id: number; kind: 'ok' | 'error'; text: string }
const ToastContext = createContext<{ ok: (text: string) => void; error: (text: string) => void }>({
  ok: () => {},
  error: () => {},
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random()
    setToasts((list) => [...list.slice(-2), { id, kind, text }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), kind === 'ok' ? 2500 : 6000)
  }, [])
  const value = React.useMemo(() => ({ ok: (t: string) => push('ok', t), error: (t: string) => push('error', t) }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-24 sm:bottom-6 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 sm:w-96" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={cx(
              'flex items-start gap-3 border bg-surface px-4 py-3 font-body text-sm text-text-main shadow-[0_8px_30px_rgba(0,0,0,0.5)]',
              t.kind === 'ok' ? 'border-primary' : 'border-red-500',
            )}
          >
            {t.kind === 'ok' ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            ) : (
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-500" aria-hidden="true" />
            )}
            <span className="min-w-0 break-words">{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

// ─── Confirm dialog ─────────────────────────────────────

type ConfirmRequest = { title: string; text?: string; action: string; danger?: boolean; resolve: (ok: boolean) => void }
const ConfirmContext = createContext<(r: Omit<ConfirmRequest, 'resolve'>) => Promise<boolean>>(async () => false)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null)
  const ask = useCallback(
    (r: Omit<ConfirmRequest, 'resolve'>) => new Promise<boolean>((resolve) => setRequest({ ...r, resolve })),
    [],
  )
  const close = (ok: boolean) => {
    request?.resolve(ok)
    setRequest(null)
  }

  useEffect(() => {
    if (!request) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      {request && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={() => close(false)}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="w-full max-w-md border border-border bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-title" className="mb-2 font-heading text-xl font-bold text-text-main">{request.title}</h2>
            {request.text && <p className="mb-6 font-body text-sm leading-relaxed text-text-muted">{request.text}</p>}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => close(false)}>Huỷ</Button>
              <Button variant={request.danger ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus>
                {request.action}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => useContext(ConfirmContext)

// ─── Unsaved changes ────────────────────────────────────

let dirtyForms = 0

/** Warns before closing the tab, and lets the sidebar ask before leaving, while a form has unsaved edits. */
export function useUnsaved(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    dirtyForms++
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      dirtyForms--
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [dirty])
}

export const hasUnsavedChanges = () => dirtyForms > 0

/** Ctrl+S / Cmd+S saves the form on screen. */
export function useSaveShortcut(save: () => void, enabled: boolean) {
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        saveRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}

// ─── Layout pieces ──────────────────────────────────────

export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-text-main sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-text-muted sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, children, className, aside }: { title?: string; children: React.ReactNode; className?: string; aside?: React.ReactNode }) {
  return (
    <section className={cx('border border-border bg-surface', className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-text-muted">{title}</h2>
          {aside}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

export function Button({
  variant = 'primary',
  loading,
  icon,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; loading?: boolean; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={cx(
        'inline-flex h-10 items-center justify-center gap-2 px-4 font-mono text-xs font-bold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        variant === 'primary' && 'bg-primary text-black hover:bg-primary-hover',
        variant === 'secondary' && 'border border-border text-text-main hover:border-primary hover:text-primary',
        variant === 'ghost' && 'text-text-muted hover:text-primary',
        variant === 'danger' && 'border border-red-500/60 text-red-400 hover:bg-red-500 hover:text-black',
        className,
      )}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  )
}

export function IconButton({ label, children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={cx(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center border border-border text-text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-border disabled:hover:text-text-muted',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Badge({ tone = 'muted', children }: { tone?: 'primary' | 'muted' | 'ok' | 'warn'; children: React.ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-widest',
        tone === 'primary' && 'border-primary bg-primary/10 text-primary',
        tone === 'muted' && 'border-border text-text-muted',
        tone === 'ok' && 'border-emerald-500/50 text-emerald-400',
        tone === 'warn' && 'border-amber-500/50 text-amber-400',
      )}
    >
      {children}
    </span>
  )
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Đang tải">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-20 animate-pulse border border-border bg-surface" />
      ))}
    </div>
  )
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="border border-dashed border-border px-6 py-12 text-center">
      <p className="font-heading text-lg font-bold text-text-main">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md font-body text-sm text-text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorBox({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div className="flex flex-col gap-3 border border-red-500/50 bg-red-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-body text-sm text-text-main">{error instanceof Error ? error.message : 'Có lỗi khi tải dữ liệu.'}</p>
      {retry && <Button variant="secondary" onClick={retry}>Thử lại</Button>}
    </div>
  )
}

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; badge?: React.ReactNode }[] }) {
  return (
    <div role="tablist" className="mb-6 flex gap-1 overflow-x-auto border-b border-border admin-scroll">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cx(
            '-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest transition-colors',
            value === t.value ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main',
          )}
        >
          {t.label}
          {t.badge}
        </button>
      ))}
    </div>
  )
}

// ─── Form fields ────────────────────────────────────────

const inputClass =
  'w-full border border-border bg-obsidian px-3.5 py-2.5 font-body text-[15px] text-text-main placeholder:text-text-muted/60 transition-colors focus:border-primary focus:outline-none'

export function Field({
  label,
  hint,
  count,
  max,
  children,
  htmlFor,
}: {
  label: string
  hint?: React.ReactNode
  count?: number
  max?: number
  children: React.ReactNode
  htmlFor?: string
}) {
  const over = max != null && count != null && count > max
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="font-mono text-xs font-bold uppercase tracking-widest text-text-muted">
          {label}
        </label>
        {max != null && count != null && (
          <span className={cx('font-mono text-[11px]', over ? 'text-red-400' : 'text-text-muted/70')}>
            {count}/{max}
          </span>
        )}
      </div>
      {children}
      {hint && <p className="mt-1.5 font-body text-xs leading-relaxed text-text-muted">{hint}</p>}
    </div>
  )
}

let fieldIds = 0
const useFieldId = () => {
  const [id] = useState(() => `f${++fieldIds}`)
  return id
}

export function TextInput({ label, value, onChange, max, hint, placeholder, type = 'text', lang }: {
  label: string
  value: string
  onChange: (v: string) => void
  max?: number
  hint?: React.ReactNode
  placeholder?: string
  type?: string
  lang?: string
}) {
  const id = useFieldId()
  return (
    <Field label={label} hint={hint} count={value.length} max={max} htmlFor={id}>
      <input id={id} type={type} lang={lang} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
    </Field>
  )
}

export function TextArea({ label, value, onChange, max, hint, rows = 4, placeholder, lang }: {
  label: string
  value: string
  onChange: (v: string) => void
  max?: number
  hint?: React.ReactNode
  rows?: number
  placeholder?: string
  lang?: string
}) {
  const id = useFieldId()
  return (
    <Field label={label} hint={hint} count={value.length} max={max} htmlFor={id}>
      <textarea
        id={id}
        lang={lang}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(inputClass, 'min-h-[5.5rem] resize-y leading-relaxed [field-sizing:content]')}
      />
    </Field>
  )
}

export function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const id = useFieldId()
  return (
    <Field label={label} htmlFor={id}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cx(inputClass, 'cursor-pointer')}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  )
}

/** Vietnamese on the left, English on the right (stacked on phones), so both versions are edited side by side. */
export function Bilingual({ vi, en }: { vi: React.ReactNode; en: React.ReactNode }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="min-w-0 space-y-4">{vi}</div>
      <div className="min-w-0 space-y-4">{en}</div>
    </div>
  )
}

export function LangHeading() {
  return (
    <div className="mb-1 hidden gap-4 md:grid md:grid-cols-2">
      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary">Tiếng Việt · /vi</p>
      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary">English · /</p>
    </div>
  )
}

/** A list of short lines (highlights, points): edit, add, remove, move up / down. */
export function LinesEditor({ label, lines, onChange, max = 8, maxLength = 300, placeholder, lang }: {
  label: string
  lines: string[]
  onChange: (lines: string[]) => void
  max?: number
  maxLength?: number
  placeholder?: string
  lang?: string
}) {
  const set = (i: number, v: string) => onChange(lines.map((l, j) => (j === i ? v : l)))
  const move = (i: number, d: number) => {
    const next = [...lines]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next)
  }
  return (
    <Field label={label} hint={`Tối đa ${max} dòng, mỗi dòng ${maxLength} ký tự. Dòng trống tự bỏ khi lưu.`}>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <span className="mt-2.5 w-4 shrink-0 font-mono text-xs text-primary" aria-hidden="true">{'>'}</span>
            <textarea
              rows={2}
              lang={lang}
              value={line}
              aria-label={`${label} ${i + 1}`}
              onChange={(e) => set(i, e.target.value)}
              placeholder={placeholder}
              className={cx(inputClass, 'min-h-[2.75rem] resize-y py-2 text-sm leading-relaxed [field-sizing:content]', line.length > maxLength && 'border-red-500')}
            />
            <div className="flex shrink-0 flex-col gap-1">
              <IconButton label="Lên" disabled={i === 0} onClick={() => move(i, -1)} className="h-[1.3rem] w-7"><ArrowUp size={12} /></IconButton>
              <IconButton label="Xuống" disabled={i === lines.length - 1} onClick={() => move(i, 1)} className="h-[1.3rem] w-7"><ArrowDown size={12} /></IconButton>
            </div>
            <IconButton label="Xoá dòng" onClick={() => onChange(lines.filter((_, j) => j !== i))} className="w-7"><X size={14} /></IconButton>
          </div>
        ))}
        {lines.length < max && (
          <Button variant="ghost" icon={<Plus size={14} />} onClick={() => onChange([...lines, ''])} className="h-8 px-0">
            Thêm dòng
          </Button>
        )}
      </div>
    </Field>
  )
}

/** Short tags (tech names): type and press Enter or comma. */
export function TagsEditor({ label, tags, onChange, max = 12 }: { label: string; tags: string[]; onChange: (tags: string[]) => void; max?: number }) {
  const [draft, setDraft] = useState('')
  const id = useFieldId()
  const add = () => {
    const value = draft.trim().replace(/,$/, '')
    if (value && !tags.includes(value) && tags.length < max) onChange([...tags, value.slice(0, 30)])
    setDraft('')
  }
  return (
    <Field label={label} hint="Gõ rồi bấm Enter. Bấm × để bỏ." htmlFor={id}>
      <div className="flex flex-wrap items-center gap-1.5 border border-border bg-obsidian p-2 focus-within:border-primary">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 border border-border bg-surface px-2 py-1 font-mono text-xs text-text-main">
            {t}
            <button type="button" aria-label={`Bỏ ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))} className="text-text-muted hover:text-primary">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add()
            } else if (e.key === 'Backspace' && !draft && tags.length) {
              onChange(tags.slice(0, -1))
            }
          }}
          onBlur={add}
          placeholder={tags.length < max ? 'Thêm…' : ''}
          className="min-w-[6rem] flex-1 bg-transparent px-1 py-1 font-body text-sm text-text-main outline-none placeholder:text-text-muted/60"
        />
      </div>
    </Field>
  )
}

// ─── Drag to reorder ────────────────────────────────────

function SortableRow({ id, children, label }: { id: string; children: React.ReactNode; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx('flex items-stretch border border-border bg-surface', isDragging && 'relative z-10 border-primary shadow-[0_8px_30px_rgba(0,0,0,0.6)]')}
    >
      <button
        type="button"
        aria-label={`Kéo để đổi thứ tự: ${label}`}
        title="Kéo để đổi thứ tự (hoặc Space rồi ↑↓)"
        className="flex w-9 shrink-0 cursor-grab touch-none items-center justify-center border-r border-border text-text-muted hover:text-primary active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

/** Vertical list the user reorders by dragging the handle (mouse, touch or keyboard). */
export function SortableList<T extends { id: string }>({ items, onReorder, render, label }: {
  items: T[]
  onReorder: (items: T[]) => void
  render: (item: T) => React.ReactNode
  label: (item: T) => string
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = items.findIndex((i) => i.id === active.id)
    const to = items.findIndex((i) => i.id === over.id)
    onReorder(arrayMove(items, from, to))
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id} label={label(item)}>
              {render(item)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

/** Sticky save bar at the bottom of an edit form. */
export function SaveBar({ dirty, saving, onSave, onReset, note }: { dirty: boolean; saving: boolean; onSave: () => void; onReset?: () => void; note?: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-8 flex flex-col gap-3 border-t border-border bg-obsidian/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:-mx-10 lg:px-10">
      <p className="font-body text-xs text-text-muted">
        {dirty ? <span className="text-amber-400">Có thay đổi chưa lưu.</span> : 'Không có thay đổi.'} {note}
      </p>
      <div className="flex gap-2">
        {onReset && dirty && <Button variant="secondary" onClick={onReset} disabled={saving}>Bỏ thay đổi</Button>}
        <Button onClick={onSave} loading={saving} disabled={!dirty}>Lưu <span className="hidden font-normal normal-case tracking-normal opacity-70 sm:inline">(Ctrl+S)</span></Button>
      </div>
    </div>
  )
}
