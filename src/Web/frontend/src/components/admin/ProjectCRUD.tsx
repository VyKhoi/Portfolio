import { Plus, Edit2, Trash2, X, Loader2, FolderGit2, Save } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useAuthStore } from "../../store/authStore"
import { API_BASE_URL } from "../../lib/api"
import { AdminLoader, RefreshingBadge } from "./AdminLoader"

export function ProjectCRUD() {
  const queryClient = useQueryClient()
  const token = useAuthStore(state => state.token)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '', slug: '', summary: '', descriptionMdx: '', techStack: '',
    status: 'Published', order: 0, isFeatured: false
  })

  const { data: projects = [], isLoading, isFetching } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/content/projects`)
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    }
  })

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id)
      const res = await fetch(`${API_BASE_URL}/content/projects/${id}`, { 
        method: 'DELETE',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      })
      if (!res.ok) throw new Error("Failed to delete")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onSettled: () => setDeletingId(null)
  })

  const saveProject = useMutation({
    mutationFn: async (data: any) => {
      const isEdit = !!editingProject
      const url = isEdit 
        ? `${API_BASE_URL}/content/projects/${editingProject.id}`
        : `${API_BASE_URL}/content/projects`
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error("Failed to save project")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setIsModalOpen(false)
    }
  })

  const openModal = (project?: any) => {
    if (project) {
      setEditingProject(project)
      setFormData(project)
    } else {
      setEditingProject(null)
      setFormData({
        title: '', slug: '', summary: '', descriptionMdx: '', techStack: '',
        status: 'Published', order: projects.length + 1, isFeatured: false
      })
    }
    setIsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6 font-mono">
        <div className="flex items-center space-x-3 adm-text-accent">
          <FolderGit2 className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider">PROJECTS_REGISTRY</h1>
        </div>
        <AdminLoader label="LOADING_PROJECTS_REGISTRY..." variant="cards" rows={3} />
      </div>
    )
  }

  return (
    <div className="space-y-6 font-mono animate-in fade-in duration-200">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3 adm-text-accent">
          <FolderGit2 className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider">PROJECTS_REGISTRY</h1>
          <RefreshingBadge show={isFetching && !isLoading} />
        </div>
        <button
          onClick={() => openModal()}
          className="adm-btn-primary text-xs uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          <span>NEW_PROJECT</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {projects.map((proj: any) => (
          <div key={proj.id} className="flex items-center justify-between p-6 adm-card adm-card-hover rounded-lg">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="text-xl font-heading font-bold">{proj.title}</h3>
                <span className={proj.status === 'Published' ? 'adm-badge-accent' : 'adm-tag'}>
                  {proj.status}
                </span>
              </div>
              {proj.summary && (
                <p className="text-sm adm-text-secondary mb-2 font-sans">{proj.summary}</p>
              )}
              <div className="text-xs adm-text-muted">Tech Stack: {proj.techStack}</div>
            </div>
            <div className="flex space-x-2 shrink-0 ml-4">
              <button
                onClick={() => openModal(proj)}
                className="adm-btn-icon"
                aria-label="Chỉnh sửa dự án"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                disabled={deletingId === proj.id}
                onClick={() => { if (confirm("Are you sure?")) deleteProject.mutate(proj.id); }}
                className="adm-btn-icon adm-btn-icon-danger disabled:opacity-50"
                aria-label="Xóa dự án"
              >
                {deletingId === proj.id ? <Loader2 className="w-4 h-4 animate-spin adm-text-danger" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="p-8 border border-dashed adm-divider rounded-lg text-center adm-text-muted font-mono">
            NO_PROJECTS_FOUND
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          style={{ backgroundColor: "var(--adm-backdrop)" }}
        >
          <div className="adm-card rounded-lg w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6 pb-3 border-b adm-divider">
              <h2 className="text-lg font-bold adm-text-accent">
                {editingProject ? 'EDIT_PROJECT' : 'NEW_PROJECT'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="adm-btn-icon">
                <X className="w-4 h-4"/>
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); saveProject.mutate(formData); }} className="space-y-4">
              <div>
                <label className="adm-label">PROJECT_TITLE</label>
                <input
                  className="adm-input"
                  placeholder="Title"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="adm-label">SLUG</label>
                <input
                  className="adm-input"
                  placeholder="Slug (e.g. my-project)"
                  value={formData.slug}
                  onChange={e => setFormData({...formData, slug: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="adm-label">TECH_STACK</label>
                <input
                  className="adm-input"
                  placeholder="Tech Stack (e.g. React, .NET)"
                  value={formData.techStack}
                  onChange={e => setFormData({...formData, techStack: e.target.value})}
                />
              </div>
              <div>
                <label className="adm-label">SUMMARY</label>
                <input
                  className="adm-input"
                  placeholder="Summary"
                  value={formData.summary}
                  onChange={e => setFormData({...formData, summary: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t adm-divider">
                <button type="button" onClick={() => setIsModalOpen(false)} className="adm-btn-secondary text-xs">
                  CANCEL
                </button>
                <button type="submit" disabled={saveProject.isPending} className="adm-btn-primary text-xs">
                  {saveProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saveProject.isPending ? 'SAVING...' : 'SAVE_PROJECT'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
