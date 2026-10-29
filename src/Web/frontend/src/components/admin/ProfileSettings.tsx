import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, User, Lock, KeyRound, Loader2 } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { API_BASE_URL } from '../../lib/api'
import { invalidateContentCache } from '../../lib/contentCache'
import { AdminLoader, RefreshingBadge } from './AdminLoader'

const EMPTY_PROFILE = {
  fullName: '',
  title: '',
  bio: '',
  avatarKey: '',
  cvPdfKey: '',
  githubLink: '',
  linkedinLink: ''
}

export function ProfileSettings() {
  const token = useAuthStore(state => state.token)
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [profile, setProfile] = useState(EMPTY_PROFILE)

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMessage, setPwdMessage] = useState('')
  const [pwdError, setPwdError] = useState('')

  const { data: fetchedProfile, isLoading, isFetching } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/content/profile`)
      if (!res.ok) throw new Error('Failed to load profile')
      return res.json()
    },
  })

  useEffect(() => {
    if (fetchedProfile) {
      setProfile({ ...EMPTY_PROFILE, ...fetchedProfile })
    }
  }, [fetchedProfile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`${API_BASE_URL}/content/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      })
      if (res.ok) {
        setMessage('PROFILE_UPDATED_SUCCESSFULLY')
        invalidateContentCache('profile')
        queryClient.invalidateQueries({ queryKey: ['profile'] })
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdMessage('')
    setPwdError('')

    if (newPassword !== confirmPassword) {
      setPwdError('Mật khẩu xác nhận không khớp!')
      return
    }

    if (newPassword.length < 8) {
      setPwdError('Mật khẩu mới phải có tối thiểu 8 ký tự!')
      return
    }

    setPwdLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json()
      if (res.ok) {
        setPwdMessage(data.message || 'PASSWORD_UPDATED_SUCCESSFULLY')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPwdError(data.error || 'FAILED_TO_UPDATE_PASSWORD')
      }
    } catch (err: any) {
      setPwdError(err.message || 'SYSTEM_ERROR')
    } finally {
      setPwdLoading(false)
      setTimeout(() => {
        setPwdMessage('')
        setPwdError('')
      }, 5000)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 font-mono space-y-6">
        <div className="flex items-center space-x-3 text-[#DEFF9A]">
          <User className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider">PROFILE_CONFIGURATION</h1>
        </div>
        <AdminLoader label="LOADING_SYSTEM_PROFILE..." variant="form" />
      </div>
    )
  }

  return (
    <div className="p-4 font-mono animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-8 max-w-2xl">
        <div className="flex items-center space-x-3 text-[#DEFF9A]">
          <User className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider">PROFILE_CONFIGURATION</h1>
        </div>
        <RefreshingBadge show={isFetching && !isLoading} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-[#121215] border border-[#27272A] p-6 rounded-lg max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">FULL_NAME</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={e => setProfile({...profile, fullName: e.target.value})}
                className="w-full bg-[#18181C] border border-[#27272A] p-3 text-white rounded focus:border-[#DEFF9A] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">TITLE</label>
              <input
                type="text"
                value={profile.title}
                onChange={e => setProfile({...profile, title: e.target.value})}
                className="w-full bg-[#18181C] border border-[#27272A] p-3 text-white rounded focus:border-[#DEFF9A] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">BIO</label>
            <textarea
              value={profile.bio}
              onChange={e => setProfile({...profile, bio: e.target.value})}
              rows={4}
              className="w-full bg-[#18181C] border border-[#27272A] p-3 text-white rounded focus:border-[#DEFF9A] outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">GITHUB_LINK</label>
              <input
                type="text"
                value={profile.githubLink}
                onChange={e => setProfile({...profile, githubLink: e.target.value})}
                className="w-full bg-[#18181C] border border-[#27272A] p-3 text-white rounded focus:border-[#DEFF9A] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">LINKEDIN_LINK</label>
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
              <label className="block text-xs text-zinc-400 mb-1">AVATAR_KEY</label>
              <input
                type="text"
                value={profile.avatarKey}
                onChange={e => setProfile({...profile, avatarKey: e.target.value})}
                className="w-full bg-[#18181C] border border-[#27272A] p-3 text-white rounded focus:border-[#DEFF9A] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">CV_PDF_KEY</label>
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
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'SAVING...' : 'SAVE_CONFIGURATION'}</span>
            </button>
          </div>
        </form>
      </motion.div>

      {/* Security & Password Management Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="bg-[#121215] border border-[#27272A] p-6 rounded-lg max-w-2xl mt-8"
      >
        <div className="flex items-center space-x-2 text-[#DEFF9A] mb-6">
          <KeyRound className="w-5 h-5" />
          <h2 className="text-lg font-bold tracking-wider">SECURITY_CONFIGURATION // CHANGE_PASSWORD</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">CURRENT_PASSWORD</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full bg-[#18181C] border border-[#27272A] p-3 text-white rounded focus:border-[#DEFF9A] outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">NEW_PASSWORD (MIN 8 CHARS)</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-[#18181C] border border-[#27272A] p-3 text-white rounded focus:border-[#DEFF9A] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">CONFIRM_NEW_PASSWORD</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-[#18181C] border border-[#27272A] p-3 text-white rounded focus:border-[#DEFF9A] outline-none"
                required
              />
            </div>
          </div>

          {pwdError && <div className="text-[#F43F5E] text-xs">{pwdError}</div>}
          {pwdMessage && <div className="text-[#DEFF9A] text-xs">{pwdMessage}</div>}

          <div className="pt-4 flex items-center justify-end border-t border-[#27272A]">
            <button
              type="submit"
              disabled={pwdLoading}
              className="flex items-center space-x-2 bg-[#DEFF9A] hover:bg-[#DEFF9A]/80 text-black px-6 py-2 font-bold rounded transition-colors disabled:opacity-50 text-xs"
            >
              {pwdLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>{pwdLoading ? 'UPDATING...' : 'UPDATE_PASSWORD'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
