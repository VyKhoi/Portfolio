import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, X, Save, Code, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { API_BASE_URL } from '../../lib/api'
import { invalidateContentCache } from '../../lib/contentCache'
import { AdminLoader, RefreshingBadge } from './AdminLoader'

interface Skill {
  id: string
  name: string
  category: string
  iconSvgKey: string
  proficiencyLevel: number
  order: number
}

export function SkillCRUD() {
  const token = useAuthStore(state => state.token)
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<Partial<Skill>>({
    name: '',
    category: '',
    iconSvgKey: '',
    proficiencyLevel: 50,
    order: 0
  })

  const { data: skills = [], isLoading, isFetching } = useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/content/skills`)
      if (!res.ok) throw new Error('Failed to fetch skills')
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<Skill>) => {
      const isEdit = !!editingSkill
      const url = isEdit 
        ? `${API_BASE_URL}/content/skills/${editingSkill.id}`
        : `${API_BASE_URL}/content/skills`
        
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to save skill')
      return res.json()
    },
    onSuccess: () => {
      setIsModalOpen(false)
      invalidateContentCache('skills')
      queryClient.invalidateQueries({ queryKey: ['skills'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id)
      const res = await fetch(`${API_BASE_URL}/content/skills/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to delete skill')
      return res.json()
    },
    onSuccess: () => {
      invalidateContentCache('skills')
      queryClient.invalidateQueries({ queryKey: ['skills'] })
    },
    onSettled: () => setDeletingId(null)
  })

  const handleOpenModal = (skill?: Skill) => {
    if (skill) {
      setEditingSkill(skill)
      setFormData(skill)
    } else {
      setEditingSkill(null)
      setFormData({
        name: '',
        category: '',
        iconSvgKey: '',
        proficiencyLevel: 50,
        order: skills.length
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(formData)
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this skill?')) return
    deleteMutation.mutate(id)
  }

  if (isLoading) {
    return (
      <div className="p-4 font-mono space-y-6">
        <div className="flex items-center space-x-3 adm-text-accent">
          <Code className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider">SKILLS_MATRIX</h1>
        </div>
        <AdminLoader label="LOADING_SKILLS_MATRIX..." variant="grid" rows={6} />
      </div>
    )
  }

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    const cat = skill.category || 'Uncategorized'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(skill)
    return acc
  }, {} as Record<string, Skill[]>)

  return (
    <div className="p-4 font-mono animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3 adm-text-accent">
          <Code className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider">SKILLS_MATRIX</h1>
          <RefreshingBadge show={isFetching && !isLoading} />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="adm-btn-primary text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>ADD_SKILL</span>
        </button>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedSkills).map(([category, catSkills]) => (
          <div key={category}>
            <h2 className="text-sm font-bold adm-text-secondary mb-4 border-b adm-divider pb-2 uppercase tracking-widest">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catSkills.map(skill => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="adm-card adm-card-hover p-4 rounded-lg flex items-center justify-between"
                >
                  <div className="flex-1 mr-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">{skill.name}</span>
                      <span className="text-xs adm-text-accent font-bold">{skill.proficiencyLevel}%</span>
                    </div>
                    <div className="w-full adm-elevated rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-1.5 rounded-full transition-all" 
                        style={{
                          width: `${skill.proficiencyLevel}%`,
                          backgroundColor: "var(--adm-accent)",
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-1.5 shrink-0">
                    <button 
                      onClick={() => handleOpenModal(skill)}
                      className="adm-btn-icon"
                      aria-label="Chỉnh sửa kỹ năng"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(skill.id)}
                      disabled={deletingId === skill.id}
                      className="adm-btn-icon adm-btn-icon-danger disabled:opacity-50"
                      aria-label="Xóa kỹ năng"
                    >
                      {deletingId === skill.id ? <Loader2 className="w-3.5 h-3.5 animate-spin adm-text-danger" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
        {skills.length === 0 && <div className="adm-text-muted">NO_SKILLS_FOUND.</div>}
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
              className="adm-card rounded-lg w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b adm-divider">
                <h2 className="adm-text-accent font-bold">
                  {editingSkill ? 'EDIT_SKILL' : 'NEW_SKILL'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="adm-btn-icon"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-5">
                <form id="skillForm" onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="adm-label">SKILL_NAME</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="adm-input"
                    />
                  </div>
                  <div>
                    <label className="adm-label">CATEGORY</label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      placeholder="e.g. Frontend, Backend, Tools"
                      className="adm-input"
                    />
                  </div>
                  
                  <div>
                    <label className="adm-label flex justify-between">
                      <span>PROFICIENCY_LEVEL</span>
                      <span className="adm-text-accent font-bold">{formData.proficiencyLevel}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.proficiencyLevel}
                      onChange={e => setFormData({...formData, proficiencyLevel: parseInt(e.target.value)})}
                      className="w-full cursor-pointer"
                      style={{ accentColor: "var(--adm-accent)" }}
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
                  form="skillForm"
                  disabled={saveMutation.isPending}
                  className="adm-btn-primary text-xs"
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saveMutation.isPending ? 'SAVING...' : 'SAVE'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
