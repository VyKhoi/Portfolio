import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "../../store/authStore"
import { Plus, Trash2, Edit2, FolderGit2, Loader2, ExternalLink } from "lucide-react"
import { AdminLoader } from "./AdminLoader"

interface Project {
  id: string
  title: string
  slug?: string
  summary?: string
  description?: string
  descriptionMdx?: string
  techStack?: string[]
  techStackJson?: string
  githubUrl?: string
  demoUrl?: string
  liveDemoUrl?: string
  coverImageKey?: string
  status: string
  order?: number
  isFeatured?: boolean
}

function getProjectTags(proj: Project): string[] {
  if (Array.isArray(proj.techStack) && proj.techStack.length > 0) {
    return proj.techStack
  }
  const raw = proj.techStackJson || ""
  if (!raw) return []
  const trimmed = raw.trim()
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map((s) => String(s).trim()).filter(Boolean)
      }
    } catch {
      // fallback
    }
  }
  return trimmed
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((s) => s.replace(/^["']|["']$/g, "").trim())
    .filter(Boolean)
}

export function ProjectCRUD() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()
  const baseUrl = "/api"

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProj, setEditingProj] = useState<Project | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    techStackText: ".NET 9, PostgreSQL, React, Docker",
    githubUrl: "",
    demoUrl: "",
    status: "Published",
  })

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/content/projects`)
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (newProj: any) => {
      const res = await fetch(`${baseUrl}/content/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newProj),
      })
      if (!res.ok) throw new Error("Failed to create")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (proj: any) => {
      const res = await fetch(`${baseUrl}/content/projects/${proj.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(proj),
      })
      if (!res.ok) throw new Error("Failed to update")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id)
      const res = await fetch(`${baseUrl}/content/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSettled: () => {
      setDeletingId(null)
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })

  const openModal = (proj?: Project) => {
    if (proj) {
      setEditingProj(proj)
      setFormData({
        title: proj.title || "",
        summary: proj.summary || proj.description || proj.descriptionMdx || "",
        techStackText: getProjectTags(proj).join(", "),
        githubUrl: proj.githubUrl || "",
        demoUrl: proj.demoUrl || proj.liveDemoUrl || "",
        status: proj.status || "Published",
      })
    } else {
      setEditingProj(null)
      setFormData({
        title: "",
        summary: "",
        techStackText: ".NET 9, PostgreSQL, React, Docker",
        githubUrl: "",
        demoUrl: "",
        status: "Published",
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProj(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const tags = formData.techStackText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const payload = {
      title: formData.title,
      slug: editingProj?.slug || "",
      summary: formData.summary,
      descriptionMdx: editingProj?.descriptionMdx || formData.summary,
      coverImageKey: editingProj?.coverImageKey || "",
      techStack: tags,
      githubUrl: formData.githubUrl,
      demoUrl: formData.demoUrl,
      status: formData.status,
      order: editingProj?.order ?? projects.length + 1,
      isFeatured: editingProj?.isFeatured ?? true,
    }

    if (editingProj) {
      updateMutation.mutate({ ...payload, id: editingProj.id })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  if (isLoading) {
    return <AdminLoader label="LOADING_PROJECTS_REGISTRY..." rows={3} />
  }

  return (
    <div className="font-mono">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
        <div className="flex items-center space-x-3">
          <FolderGit2 className="w-6 h-6 sm:w-7 sm:h-7 adm-text-accent shrink-0" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight adm-text">
            PROJECTS_REGISTRY
          </h1>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="adm-btn-primary text-xs w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>NEW_PROJECT</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {projects.map((proj: Project) => {
          const tags = getProjectTags(proj)
          const desc = proj.summary || proj.description || proj.descriptionMdx
          const demo = proj.demoUrl || proj.liveDemoUrl
          return (
            <div
              key={proj.id}
              className="adm-card adm-card-hover p-4 sm:p-6 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4"
            >
              <div className="space-y-2.5 flex-1 min-w-0 sm:pr-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h3 className="text-lg sm:text-xl font-bold adm-text">
                    {proj.title}
                  </h3>
                  <span
                    className={
                      proj.status === "Published"
                        ? "adm-badge-accent"
                        : "adm-tag"
                    }
                  >
                    {proj.status}
                  </span>
                </div>
                {desc && (
                  <p className="adm-text-secondary text-xs sm:text-sm leading-relaxed">
                    {desc}
                  </p>
                )}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((t) => (
                      <span key={t} className="adm-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {(proj.githubUrl || demo) && (
                  <div className="flex flex-wrap gap-4 pt-1 text-xs">
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="adm-text-info hover:underline inline-flex items-center gap-1"
                      >
                        <span>GITHUB</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {demo && (
                      <a
                        href={demo}
                        target="_blank"
                        rel="noreferrer"
                        className="adm-text-accent hover:underline inline-flex items-center gap-1"
                      >
                        <span>LIVE_DEMO</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 self-end sm:self-start shrink-0">
                <button
                  type="button"
                  onClick={() => openModal(proj)}
                  className="adm-btn-icon"
                  aria-label="Sửa dự án"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={deletingId === proj.id}
                  onClick={() => deleteMutation.mutate(proj.id)}
                  className="adm-btn-icon adm-btn-icon-danger disabled:opacity-50"
                  aria-label="Xóa dự án"
                >
                  {deletingId === proj.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4"
          style={{
            backgroundColor: "var(--adm-backdrop)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="adm-card p-5 sm:p-6 rounded-lg w-full max-w-lg max-h-[90dvh] overflow-y-auto adm-scroll">
            <h2 className="text-lg sm:text-xl font-bold adm-text-accent mb-5 sm:mb-6">
              {editingProj ? "EDIT_PROJECT" : "CREATE_NEW_PROJECT"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="adm-label">PROJECT_TITLE</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="adm-input"
                  required
                />
              </div>
              <div>
                <label className="adm-label">SUMMARY / DESCRIPTION</label>
                <textarea
                  value={formData.summary}
                  onChange={(e) =>
                    setFormData({ ...formData, summary: e.target.value })
                  }
                  className="adm-input h-24"
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
                  className="adm-input"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="adm-label">GITHUB_URL</label>
                  <input
                    type="text"
                    value={formData.githubUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, githubUrl: e.target.value })
                    }
                    className="adm-input"
                  />
                </div>
                <div>
                  <label className="adm-label">LIVE_DEMO_URL</label>
                  <input
                    type="text"
                    value={formData.demoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, demoUrl: e.target.value })
                    }
                    className="adm-input"
                  />
                </div>
              </div>
              <div>
                <label className="adm-label">STATUS</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="adm-input"
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>
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
                  <span>{isSaving ? "SAVING..." : "SAVE_PROJECT"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
