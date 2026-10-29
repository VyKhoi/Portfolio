import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, X, Save, Briefcase, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { API_BASE_URL } from '../../lib/api'
import { invalidateContentCache } from '../../lib/contentCache'
import { AdminLoader, RefreshingBadge } from './AdminLoader'

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
  const token = useAuthStore(state => state.token)
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExp, setEditingExp] = useState<Experience | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<Partial<Experience>>({
    role: '',
    company: '',
    period: '',
    projectName: '',
    highlights: [],
    techStack: [],
    order: 0
  })

  const { data: experiences = [], isLoading, isFetching } = useQuery<Experience[]>({
    queryKey: ['experiences'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/content/experience`)
      if (!res.ok) throw new Error('Failed to fetch experiences')
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<Experience>) => {
      const isEdit = !!editingExp
      const url = isEdit 
        ? `${API_BASE_URL}/content/experience/${editingExp.id}`
        : `${API_BASE_URL}/content/experience`
        
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to save experience')
      return res.json()
    },
    onSuccess: () => {
      setIsModalOpen(false)
      invalidateContentCache('experiences')
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id)
      const res = await fetch(`${API_BASE_URL}/content/experience/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to delete experience')
      return res.json()
    },
    onSuccess: () => {
      invalidateContentCache('experiences')
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
    },
    onSettled: () => setDeletingId(null)
  })

  const handleOpenModal = (exp?: Experience) => {
    if (exp) {
      setEditingExp(exp)
      setFormData(exp)
    } else {
      setEditingExp(null)
      setFormData({
        role: '',
        company: '',
        period: '',
        projectName: '',
        highlights: [],
        techStack: [],
        order: experiences.length
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(formData)
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this experience?')) return
    deleteMutation.mutate(id)
  }

  if (isLoading) {
    return (
      <div className="p-4 font-mono space-y-6">
        <div className="flex items-center space-x-3 adm-text-accent">
          <Briefcase className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider">EXPERIENCE_MANAGER</h1>
        </div>
        <AdminLoader label="LOADING_EXPERIENCES..." variant="cards" rows={3} />
      </div>
    )
  }

  return (
    <div className="p-4 font-mono animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3 adm-text-accent">
          <Briefcase className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider">EXPERIENCE_MANAGER</h1>
          <RefreshingBadge show={isFetching && !isLoading} />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="adm-btn-primary text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>ADD_EXPERIENCE</span>
        </button>
      </div>

      <div className="grid gap-4">
        {experiences.map(exp => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="adm-card adm-card-hover p-6 rounded-lg flex items-start justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h3 className="adm-text-accent text-xl font-bold">{exp.role}</h3>
                <span className="adm-text-secondary text-sm">@ {exp.company}</span>
              </div>
              <div className="adm-text-muted text-xs font-bold uppercase tracking-wider mb-4">{exp.period}</div>
              
              <div className="mb-4">
                <div className="text-[11px] adm-text-muted uppercase tracking-wider mb-0.5">PROJECT</div>
                <div className="font-semibold">{exp.projectName || 'N/A'}</div>
              </div>

              {exp.techStack?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {exp.techStack.map(tech => (
                    <span key={tech} className="adm-tag">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2 shrink-0 ml-4">
              <button 
                onClick={() => handleOpenModal(exp)}
                className="adm-btn-icon"
                aria-label="Chỉnh sửa kinh nghiệm"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDelete(exp.id)}
                disabled={deletingId === exp.id}
                className="adm-btn-icon adm-btn-icon-danger disabled:opacity-50"
                aria-label="Xóa kinh nghiệm"
              >
                {deletingId === exp.id ? <Loader2 className="w-4 h-4 animate-spin adm-text-danger" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-xs"
            style={{ backgroundColor: "var(--adm-backdrop)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="adm-card rounded-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 border-b adm-divider">
                <h2 className="adm-text-accent font-bold">
                  {editingExp ? 'EDIT_EXPERIENCE' : 'NEW_EXPERIENCE'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="adm-btn-icon"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto flex-1">
                <form id="expForm" onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="adm-label">ROLE</label>
                      <input
                        type="text"
                        required
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                        className="adm-input"
                      />
                    </div>
                    <div>
                      <label className="adm-label">COMPANY</label>
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={e => setFormData({...formData, company: e.target.value})}
                        className="adm-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="adm-label">PERIOD</label>
                      <input
                        type="text"
                        required
                        value={formData.period}
                        onChange={e => setFormData({...formData, period: e.target.value})}
                        placeholder="e.g. 2021 - Present"
                        className="adm-input"
                      />
                    </div>
                    <div>
                      <label className="adm-label">PROJECT_NAME</label>
                      <input
                        type="text"
                        value={formData.projectName}
                        onChange={e => setFormData({...formData, projectName: e.target.value})}
                        className="adm-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="adm-label">TECH_STACK (comma separated)</label>
                    <input
                      type="text"
                      value={formData.techStack?.join(', ')}
                      onChange={e => setFormData({...formData, techStack: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                      className="adm-input"
                    />
                  </div>

                  <div>
                    <label className="adm-label">ORDER</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                      className="adm-input"
                    />
                  </div>
                </form>
              </div>

              <div className="p-4 border-t adm-divider flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="adm-btn-secondary text-xs"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  form="expForm"
                  disabled={saveMutation.isPending}
                  className="adm-btn-primary text-xs"
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saveMutation.isPending ? 'SAVING...' : 'SAVE_CHANGES'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
