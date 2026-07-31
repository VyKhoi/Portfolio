import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, User } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export function ProfileSettings() {
  const token = useAuthStore(state => state.token)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [profile, setProfile] = useState({
    fullName: '',
    title: '',
    bio: '',
    avatarKey: '',
    cvPdfKey: '',
    githubLink: '',
    linkedinLink: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://171.233.238.34:5000/api/content/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('http://171.233.238.34:5000/api/content/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      })
      if (res.ok) {
        setMessage('PROFILE_UPDATED_SUCCESSFULLY')
      } else {
        setMessage('ERROR_UPDATING_PROFILE')
      }
    } catch (err) {
      console.error(err)
      setMessage('SYSTEM_ERROR')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  if (loading) return <div className="p-8 text-[#DEFF9A]">LOADING_SYSTEM_PROFILE...</div>

  return (
    <div className="p-8 font-mono">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3 text-[#DEFF9A]">
          <User className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider">PROFILE_CONFIGURATION</h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#121215] border border-[#27272A] p-6 rounded-lg max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">FULL_NAME</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={e => setProfile({...profile, fullName: e.target.value})}
                className="w-full bg-[#18181C] border border-[#27272A] p-3 text-white rounded focus:border-[#DEFF9A] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">TITLE</label>
              <input
                type="text"
                value={profile.title}
                onChange={e => setProfile({...profile, title: e.target.value})}
                className="w-full bg-[#18181C] border border-[#27272A] p-3 text-white rounded focus:border-[#DEFF9A] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">BIO</label>
            <textarea
              value={profile.bio}
              onChange={e => setProfile({...profile, bio: e.target.value})}
              rows={4}
              className="w-full bg-[#18181C] border border-[#27272A] p-3 text-white rounded focus:border-[#DEFF9A] outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">GITHUB_LINK</label>
              <input
                type="text"
                value={profile.githubLink}
                onChange={e => setProfile({...profile, githubLink: e.target.value})}
                className="w-full bg-[#18181C] border border-[#27272A] p-3 text-white rounded focus:border-[#DEFF9A] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">LINKEDIN_LINK</label>
              <input
                type="text"
                value={profile.linkedinLink}
                onChange={e => setProfile({...profile, linkedinLink: e.target.value})}
                className="w-full bg-[#18181C] border border-[#27272A] p-3 text-white rounded focus:border-[#DEFF9A] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">AVATAR_KEY</label>
              <input
                type="text"
                value={profile.avatarKey}
                onChange={e => setProfile({...profile, avatarKey: e.target.value})}
                className="w-full bg-[#18181C] border border-[#27272A] p-3 text-white rounded focus:border-[#DEFF9A] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">CV_PDF_KEY</label>
              <input
                type="text"
                value={profile.cvPdfKey}
                onChange={e => setProfile({...profile, cvPdfKey: e.target.value})}
                className="w-full bg-[#18181C] border border-[#27272A] p-3 text-white rounded focus:border-[#DEFF9A] outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-[#27272A]">
            <div className="text-[#DEFF9A] text-sm">{message}</div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 bg-[#DEFF9A] hover:bg-[#DEFF9A]/80 text-black px-6 py-2 font-bold rounded transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'SAVING...' : 'SAVE_CONFIGURATION'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
