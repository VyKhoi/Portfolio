import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "../../store/authStore"
import { Plus, Trash2, Edit2, Code, Loader2 } from "lucide-react"
import { AdminLoader } from "./AdminLoader"

interface Skill {
  id: string
  category: string
  name: string
  proficiencyLevel: number
}

export function SkillCRUD() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()
  const baseUrl = "/api"

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    category: "Backend & Core",
    name: "",
    proficiencyLevel: 85,
  })

  const { data: skills = [], isLoading } = useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/content/skills`)
      if (!res.ok) throw new Error("Failed to fetch skills")
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (newSkill: any) => {
      const res = await fetch(`${baseUrl}/content/skills`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newSkill),
      })
      if (!res.ok) throw new Error("Failed to create")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (skill: Skill) => {
      const res = await fetch(`${baseUrl}/content/skills/${skill.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(skill),
      })
      if (!res.ok) throw new Error("Failed to update")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id)
      const res = await fetch(`${baseUrl}/content/skills/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSettled: () => {
      setDeletingId(null)
      queryClient.invalidateQueries({ queryKey: ["skills"] })
    },
  })

  const openModal = (skill?: Skill) => {
    if (skill) {
      setEditingSkill(skill)
      setFormData({
        category: skill.category,
        name: skill.name,
        proficiencyLevel: skill.proficiencyLevel,
      })
    } else {
      setEditingSkill(null)
      setFormData({
        category: "Backend & Core",
        name: "",
        proficiencyLevel: 85,
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingSkill(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingSkill) {
      updateMutation.mutate({ ...formData, id: editingSkill.id })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  if (isLoading) {
    return <AdminLoader label="INDEXING_SKILLS_MATRIX..." variant="grid" rows={6} />
  }

  const grouped = skills.reduce((acc: Record<string, Skill[]>, s: Skill) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {})

  return (
    <div className="font-mono">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
        <div className="flex items-center space-x-3">
          <Code className="w-6 h-6 sm:w-7 sm:h-7 adm-text-accent shrink-0" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight adm-text">
            SKILLS_MATRIX
          </h1>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="adm-btn-primary text-xs w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>ADD_SKILL</span>
        </button>
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-xs font-bold adm-text-muted uppercase tracking-widest border-b adm-divider pb-2">
              {category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {(items as Skill[]).map((skill) => (
                <div
                  key={skill.id}
                  className="adm-card adm-card-hover p-4 rounded-lg flex justify-between items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2 mb-2">
                      <h4 className="font-bold text-sm sm:text-base adm-text truncate">
                        {skill.name}
                      </h4>
                      <span className="text-xs adm-text-accent font-bold shrink-0">
                        {skill.proficiencyLevel}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 adm-skeleton rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${skill.proficiencyLevel}%`,
                          backgroundColor: "var(--adm-accent)",
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex space-x-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openModal(skill)}
                      className="adm-btn-icon"
                      aria-label="Sửa kỹ năng"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === skill.id}
                      onClick={() => deleteMutation.mutate(skill.id)}
                      className="adm-btn-icon adm-btn-icon-danger disabled:opacity-50"
                      aria-label="Xóa kỹ năng"
                    >
                      {deletingId === skill.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
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
          <div className="adm-card p-5 sm:p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold adm-text-accent mb-5 sm:mb-6">
              {editingSkill ? "EDIT_SKILL" : "NEW_SKILL"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="adm-label">CATEGORY</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="Backend & Core, Databases, DevOps & Cloud..."
                  className="adm-input"
                  required
                />
              </div>
              <div>
                <label className="adm-label">SKILL_NAME</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="adm-input"
                  required
                />
              </div>
              <div>
                <label className="adm-label">
                  PROFICIENCY ({formData.proficiencyLevel}%)
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={formData.proficiencyLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      proficiencyLevel: Number(e.target.value),
                    })
                  }
                  className="w-full"
                  style={{ accentColor: "var(--adm-accent)" }}
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
                  <span>{isSaving ? "SAVING..." : "SAVE_SKILL"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
