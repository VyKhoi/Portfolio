import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, X, Save, Code } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

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
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  
  const [formData, setFormData] = useState<Partial<Skill>>({
    name: '',
    category: '',
    iconSvgKey: '',
    proficiencyLevel: 50,
    order: 0
  })

  useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/content/skills`)
      const data = await res.json()
      setSkills(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const isEdit = !!editingSkill
      const url = isEdit 
        ? `${import.meta.env.VITE_API_URL}/api/content/skills/${editingSkill.id}`
        : `${import.meta.env.VITE_API_URL}/api/content/skills`
        
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
        fetchSkills()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this skill?')) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/content/skills/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) fetchSkills()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="p-8 text-[#DEFF9A]">LOADING_SKILLS...</div>

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    const cat = skill.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="p-8 font-mono">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3 text-[#DEFF9A]">
          <Code className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider">SKILLS_MATRIX</h1>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-[#DEFF9A] hover:bg-[#DEFF9A]/80 text-black px-4 py-2 font-bold rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>ADD_SKILL</span>
        </button>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedSkills).map(([category, catSkills]) => (
          <div key={category}>
            <h2 className="text-lg text-white mb-4 border-b border-[#27272A] pb-2 uppercase tracking-widest">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catSkills.map(skill => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#121215] border border-[#27272A] p-4 rounded-lg flex items-center justify-between hover:border-[#DEFF9A]/50 transition-colors"
                >
                  <div className="flex-1 mr-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-[#DEFF9A] font-bold">{skill.name}</span>
                    </div>
                    {/* Progress bar for proficiency */}
                    <div className="w-full bg-[#18181C] rounded-full h-1.5">
                      <div 
                        className="bg-[#DEFF9A] h-1.5 rounded-full" 
                        style={{ width: `${skill.proficiencyLevel}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => handleOpenModal(skill)}
                      className="p-1.5 text-zinc-400 hover:text-[#DEFF9A] rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(skill.id)}
                      className="p-1.5 text-zinc-400 hover:text-[#F43F5E] rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
        {skills.length === 0 && <div className="text-zinc-500">NO_SKILLS_FOUND.</div>}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121215] border border-[#27272A] rounded-lg w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#27272A]">
                <h2 className="text-[#DEFF9A] font-bold">
                  {editingSkill ? 'EDIT_SKILL' : 'NEW_SKILL'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4">
                <form id="skillForm" onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">SKILL_NAME</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-[#18181C] border border-[#27272A] p-2 text-white rounded outline-none focus:border-[#DEFF9A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">CATEGORY</label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      placeholder="e.g. Frontend, Backend, Tools"
                      className="w-full bg-[#18181C] border border-[#27272A] p-2 text-white rounded outline-none focus:border-[#DEFF9A]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1 flex justify-between">
                      <span>PROFICIENCY_LEVEL</span>
                      <span className="text-[#DEFF9A]">{formData.proficiencyLevel}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.proficiencyLevel}
                      onChange={e => setFormData({...formData, proficiencyLevel: parseInt(e.target.value)})}
                      className="w-full accent-[#DEFF9A]"
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
                  form="skillForm"
                  className="flex items-center space-x-2 bg-[#DEFF9A] hover:bg-[#DEFF9A]/80 text-black px-4 py-2 font-bold rounded transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>SAVE</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
