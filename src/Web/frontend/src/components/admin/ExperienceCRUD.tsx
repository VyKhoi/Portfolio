import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, X, Save, Briefcase } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

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
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExp, setEditingExp] = useState<Experience | null>(null)
  
  const [formData, setFormData] = useState<Partial<Experience>>({
    role: '',
    company: '',
    period: '',
    projectName: '',
    highlights: [],
    techStack: [],
    order: 0
  })

  useEffect(() => {
    fetchExperiences()
  }, [])

  const fetchExperiences = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/content/experience`)
      const data = await res.json()
      setExperiences(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const isEdit = !!editingExp
      const url = isEdit 
        ? `${import.meta.env.VITE_API_URL}/api/content/experience/${editingExp.id}`
        : `${import.meta.env.VITE_API_URL}/api/content/experience`
        
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setIsModalOpen(false)
        fetchExperiences()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this experience?')) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/content/experience/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) fetchExperiences()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="p-8 text-[#DEFF9A]">LOADING_EXPERIENCES...</div>

  return (
    <div className="p-8 font-mono">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3 text-[#DEFF9A]">
          <Briefcase className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider">EXPERIENCE_MANAGER</h1>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-[#DEFF9A] hover:bg-[#DEFF9A]/80 text-black px-4 py-2 font-bold rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>ADD_EXPERIENCE</span>
        </button>
      </div>

      <div className="grid gap-4">
        {experiences.map(exp => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#121215] border border-[#27272A] p-6 rounded-lg flex items-start justify-between"
          >
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-[#DEFF9A] text-xl font-bold">{exp.role}</h3>
                <span className="text-zinc-500 text-sm">@ {exp.company}</span>
              </div>
              <div className="text-zinc-400 text-sm mb-4">{exp.period}</div>
              
              <div className="mb-4">
                <div className="text-xs text-zinc-500 mb-1">PROJECT</div>
                <div className="text-white">{exp.projectName || 'N/A'}</div>
              </div>

              {exp.techStack?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {exp.techStack.map(tech => (
                    <span key={tech} className="bg-[#18181C] border border-[#27272A] text-xs text-zinc-300 px-2 py-1 rounded">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => handleOpenModal(exp)}
                className="p-2 text-zinc-400 hover:text-[#DEFF9A] bg-[#18181C] hover:bg-[#27272A] rounded transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDelete(exp.id)}
                className="p-2 text-zinc-400 hover:text-[#F43F5E] bg-[#18181C] hover:bg-[#27272A] rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121215] border border-[#27272A] rounded-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#27272A]">
                <h2 className="text-[#DEFF9A] font-bold">
                  {editingExp ? 'EDIT_EXPERIENCE' : 'NEW_EXPERIENCE'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1">
                <form id="expForm" onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">ROLE</label>
                      <input
                        type="text"
                        required
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                        className="w-full bg-[#18181C] border border-[#27272A] p-2 text-white rounded outline-none focus:border-[#DEFF9A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">COMPANY</label>
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={e => setFormData({...formData, company: e.target.value})}
                        className="w-full bg-[#18181C] border border-[#27272A] p-2 text-white rounded outline-none focus:border-[#DEFF9A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">PERIOD</label>
                      <input
                        type="text"
                        required
                        value={formData.period}
                        onChange={e => setFormData({...formData, period: e.target.value})}
                        placeholder="e.g. 2021 - Present"
                        className="w-full bg-[#18181C] border border-[#27272A] p-2 text-white rounded outline-none focus:border-[#DEFF9A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">PROJECT_NAME</label>
                      <input
                        type="text"
                        value={formData.projectName}
                        onChange={e => setFormData({...formData, projectName: e.target.value})}
                        className="w-full bg-[#18181C] border border-[#27272A] p-2 text-white rounded outline-none focus:border-[#DEFF9A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">TECH_STACK (comma separated)</label>
                    <input
                      type="text"
                      value={formData.techStack?.join(', ')}
                      onChange={e => setFormData({...formData, techStack: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                      className="w-full bg-[#18181C] border border-[#27272A] p-2 text-white rounded outline-none focus:border-[#DEFF9A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">ORDER</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                      className="w-full bg-[#18181C] border border-[#27272A] p-2 text-white rounded outline-none focus:border-[#DEFF9A]"
                    />
                  </div>
                </form>
              </div>

              <div className="p-4 border-t border-[#27272A] flex justify-end">
                <button
                  type="submit"
                  form="expForm"
                  className="flex items-center space-x-2 bg-[#DEFF9A] hover:bg-[#DEFF9A]/80 text-black px-4 py-2 font-bold rounded transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>SAVE_CHANGES</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
