import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "../../store/authStore"
import { Plus, Trash2, Edit2, Briefcase, Loader2 } from "lucide-react"
import { AdminLoader } from "./AdminLoader"

interface Experience {
  id: string
  role: string
  company: string
  period: string
  projectName: string
  highlights: string[]
  techStack: string[]
  order: number
}

export function ExperienceCRUD() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()
  const baseUrl = "/api"

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExp, setEditingExp] = useState<Experience | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    role: "",
    company: "",
    period: "",
    projectName: "",
    highlightsText: "",
    techStackText: "",
    order: 1,
  })

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ["experiences"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/content/experiences`)
      if (!res.ok) throw new Error("Failed to fetch experiences")
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (newExp: any) => {
      const res = await fetch(`${baseUrl}/content/experiences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newExp),
      })
      if (!res.ok) throw new Error("Failed to create")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiences"] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (exp: any) => {
      const res = await fetch(`${baseUrl}/content/experiences/${exp.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(exp),
      })
      if (!res.ok) throw new Error("Failed to update")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiences"] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id)
      const res = await fetch(`${baseUrl}/content/experiences/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSettled: () => {
      setDeletingId(null)
      queryClient.invalidateQueries({ queryKey: ["experiences"] })
    },
  })

  const openModal = (exp?: Experience) => {
    if (exp) {
      setEditingExp(exp)
      setFormData({
        role: exp.role,
        company: exp.company,
        period: exp.period,
        projectName: exp.projectName,
        highlightsText: (exp.highlights || []).join("\n"),
        techStackText: (exp.techStack || []).join(", "),
        order: exp.order,
      })
    } else {
      setEditingExp(null)
      setFormData({
        role: "",
        company: "",
        period: "",
        projectName: "",
        highlightsText: "",
        techStackText: "",
        order: experiences.length + 1,
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingExp(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      role: formData.role,
      company: formData.company,
      period: formData.period,
      projectName: formData.projectName,
      highlights: formData.highlightsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      techStack: formData.techStackText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      order: Number(formData.order),
    }

    if (editingExp) {
      updateMutation.mutate({ ...payload, id: editingExp.id })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  if (isLoading) {
    return <AdminLoader label="FETCHING_EXPERIENCE_RECORDS..." rows={3} />
  }

  return (
    <div className="font-mono">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
        <div className="flex items-center space-x-3">
          <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 adm-text-accent shrink-0" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight adm-text">
            EXPERIENCE_RECORDS
          </h1>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="adm-btn-primary text-xs w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>ADD_EXPERIENCE</span>
        </button>
      </div>

      <div className="space-y-4">
        {experiences.map((exp: Experience) => (
          <div
            key={exp.id}
            className="adm-card adm-card-hover p-4 sm:p-6 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4"
          >
            <div className="space-y-2 flex-1 min-w-0 sm:pr-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="adm-badge-accent">#{exp.order}</span>
                <h3 className="text-lg sm:text-xl font-bold adm-text">
                  {exp.role}
                </h3>
                <span className="adm-text-muted text-xs sm:text-sm">
                  @ {exp.company}
                </span>
              </div>
              <div className="adm-text-info text-xs font-bold">
                {exp.period} // [ {exp.projectName} ]
              </div>
              <ul className="text-xs adm-text-secondary space-y-1.5 list-disc list-inside pt-1">
                {(exp.highlights || []).map((h, i) => (
                  <li key={i} className="leading-relaxed">
                    {h}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {(exp.techStack || []).map((t) => (
                  <span key={t} className="adm-tag">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex space-x-2 self-end sm:self-start shrink-0">
              <button
                type="button"
                onClick={() => openModal(exp)}
                className="adm-btn-icon"
                aria-label="Chỉnh sửa kinh nghiệm"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={deletingId === exp.id}
                onClick={() => deleteMutation.mutate(exp.id)}
                className="adm-btn-icon adm-btn-icon-danger disabled:opacity-50"
                aria-label="Xóa kinh nghiệm"
              >
                {deletingId === exp.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4"
          style={{
            backgroundColor: "var(--adm-backdrop)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="adm-card p-5 sm:p-6 rounded-lg w-full max-w-2xl max-h-[90dvh] overflow-y-auto adm-scroll">
            <h2 className="text-lg sm:text-xl font-bold adm-text-accent mb-5 sm:mb-6">
              {editingExp ? "EDIT_EXPERIENCE" : "NEW_EXPERIENCE"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="adm-label">ROLE</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="adm-input"
                    required
                  />
                </div>
                <div>
                  <label className="adm-label">COMPANY</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    className="adm-input"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="adm-label">PERIOD</label>
                  <input
                    type="text"
                    value={formData.period}
                    onChange={(e) =>
                      setFormData({ ...formData, period: e.target.value })
                    }
                    placeholder="2024 - Present"
                    className="adm-input"
                    required
                  />
                </div>
                <div>
                  <label className="adm-label">PROJECT_NAME</label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) =>
                      setFormData({ ...formData, projectName: e.target.value })
                    }
                    className="adm-input"
                    required
                  />
                </div>
                <div>
                  <label className="adm-label">ORDER</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: Number(e.target.value),
                      })
                    }
                    className="adm-input"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="adm-label">HIGHLIGHTS (ONE PER LINE)</label>
                <textarea
                  value={formData.highlightsText}
                  onChange={(e) =>
                    setFormData({ ...formData, highlightsText: e.target.value })
                  }
                  className="adm-input h-32"
                  required
                />
              </div>
              <div>
                <label className="adm-label">
                  TECH_STACK (COMMA SEPARATED)
                </label>
                <input
                  type="text"
                  value={formData.techStackText}
                  onChange={(e) =>
                    setFormData({ ...formData, techStackText: e.target.value })
                  }
                  placeholder=".NET 8, C#, PostgreSQL, Docker"
                  className="adm-input"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t adm-divider">
                <button
                  type="button"
                  onClick={closeModal}
                  className="adm-btn-secondary text-xs w-full sm:w-auto"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="adm-btn-primary text-xs w-full sm:w-auto"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? "SAVING..." : "SAVE_RECORD"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
