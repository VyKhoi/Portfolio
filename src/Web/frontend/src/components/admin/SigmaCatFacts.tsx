import React, { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Cat, Edit2, Loader2, Plus, Trash2 } from "lucide-react"
import { useAuthStore } from "../../store/authStore"
import { AdminLoader } from "./AdminLoader"

interface Fact {
  id: string
  key: string
  label: string
  valueVi: string
  valueEn: string
  order: number
  enabled: boolean
}

interface SourceStats {
  source: string
  replies: number
  averageFirstTokenMs: number | null
  averageTotalMs: number | null
}

const EMPTY_FORM = { key: "", label: "", valueVi: "", valueEn: "", order: 100, enabled: true }

const seconds = (ms: number | null) => (ms == null ? "-" : `${(ms / 1000).toFixed(1)}s`)

export function SigmaCatFacts() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()
  const baseUrl = "/api/ai"
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [error, setError] = useState("")

  const { data: facts = [], isLoading } = useQuery<Fact[]>({
    queryKey: ["ai-facts"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/facts`, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
  })

  const { data: stats = [] } = useQuery<SourceStats[]>({
    queryKey: ["ai-stats"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/stats`, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (fact: typeof EMPTY_FORM) => {
      const res = await fetch(`${baseUrl}/facts${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PUT" : "POST",
        headers,
        body: JSON.stringify(fact),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `HTTP ${res.status}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-facts"] })
      closeModal()
    },
    onError: (err: Error) => setError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${baseUrl}/facts/${id}`, { method: "DELETE", headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-facts"] }),
  })

  const openModal = (fact?: Fact) => {
    setEditingId(fact?.id ?? null)
    setFormData(fact ? { ...EMPTY_FORM, ...fact } : EMPTY_FORM)
    setError("")
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const { key, label, valueVi, valueEn, order, enabled } = formData
    saveMutation.mutate({ key, label, valueVi, valueEn, order, enabled })
  }

  if (isLoading) return <AdminLoader label="LOADING_SIGMA_CAT..." rows={5} />

  return (
    <div className="space-y-5 font-mono">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold adm-text-accent flex items-center gap-2">
            <Cat className="w-5 h-5" /> SIGMA_CAT
          </h1>
          <p className="text-xs adm-text-muted mt-1">
            What Sigma Cat knows besides profile, experience and skills. Edits apply on the next message.
          </p>
        </div>
        <button type="button" onClick={() => openModal()} className="adm-btn-primary text-xs shrink-0">
          <Plus className="w-3.5 h-3.5" />
          <span>NEW_FACT</span>
        </button>
      </div>

      {stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.source} className="adm-card rounded-lg p-4">
              <div className="adm-label">{s.source.toUpperCase()} // LAST_7_DAYS</div>
              <div className="text-sm adm-text">
                {s.replies} replies · first word {seconds(s.averageFirstTokenMs)} · full reply {seconds(s.averageTotalMs)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="adm-card rounded-lg divide-y adm-divider">
        {facts.map((fact) => (
          <div key={fact.id} className="p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold adm-text">{fact.label}</span>
                <span className="adm-tag">{fact.key}</span>
                {!fact.enabled && <span className="adm-badge-info">OFF</span>}
              </div>
              <p className="text-xs adm-text-secondary mt-1.5 break-words">VI: {fact.valueVi}</p>
              <p className="text-xs adm-text-muted mt-1 break-words">EN: {fact.valueEn}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button type="button" aria-label={`Edit ${fact.label}`} onClick={() => openModal(fact)} className="adm-btn-icon">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Delete ${fact.label}`}
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (window.confirm(`Delete "${fact.label}"?`)) deleteMutation.mutate(fact.id)
                }}
                className="adm-btn-icon-danger"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4"
          style={{ backgroundColor: "var(--adm-backdrop)", backdropFilter: "blur(4px)" }}
        >
          <div className="adm-card p-5 sm:p-6 rounded-lg w-full max-w-lg max-h-full overflow-y-auto">
            <h2 className="text-lg font-bold adm-text-accent mb-5">{editingId ? "EDIT_FACT" : "NEW_FACT"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="adm-label">KEY</label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    className="adm-input"
                    required
                  />
                </div>
                <div>
                  <label className="adm-label">LABEL (ENGLISH)</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="adm-input"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="adm-label">VALUE_VI</label>
                <textarea
                  rows={3}
                  value={formData.valueVi}
                  onChange={(e) => setFormData({ ...formData, valueVi: e.target.value })}
                  className="adm-input"
                />
              </div>
              <div>
                <label className="adm-label">VALUE_EN (GOES INTO THE PROMPT)</label>
                <textarea
                  rows={3}
                  value={formData.valueEn}
                  onChange={(e) => setFormData({ ...formData, valueEn: e.target.value })}
                  className="adm-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="adm-label">ORDER</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="adm-input"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm adm-text pb-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    style={{ accentColor: "var(--adm-accent)" }}
                  />
                  ENABLED
                </label>
              </div>
              {error && <div className="adm-text-danger text-sm font-bold">{error}</div>}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t adm-divider">
                <button type="button" onClick={closeModal} className="adm-btn-secondary text-xs w-full sm:w-auto">
                  CANCEL
                </button>
                <button type="submit" disabled={saveMutation.isPending} className="adm-btn-primary text-xs w-full sm:w-auto">
                  {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saveMutation.isPending ? "SAVING..." : "SAVE_FACT"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
