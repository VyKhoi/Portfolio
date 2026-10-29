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
  const [isErrorMsg, setIsErrorMsg] = useState(false)
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
    setIsErrorMsg(false)
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
        setIsErrorMsg(true)
        setMessage('ERROR_UPDATING_PROFILE')
      }
    } catch (err) {
      console.error(err)
      setIsErrorMsg(true)
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
        <div className="flex items-center space-x-3 adm-text-accent">
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
        <div className="flex items-center space-x-3 adm-text-accent">
          <User className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-wider">PROFILE_CONFIGURATION</h1>
        </div>
        <RefreshingBadge show={isFetching && !isLoading} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="adm-card p-6 rounded-lg max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="adm-label">FULL_NAME</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={e => setProfile({...profile, fullName: e.target.value})}
                className="adm-input"
              />
            </div>
            <div>
              <label className="adm-label">TITLE</label>
              <input
                type="text"
                value={profile.title}
                onChange={e => setProfile({...profile, title: e.target.value})}
                className="adm-input"
              />
            </div>
          </div>

          <div>
            <label className="adm-label">BIO</label>
            <textarea
              value={profile.bio}
              onChange={e => setProfile({...profile, bio: e.target.value})}
              rows={4}
              className="adm-input resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="adm-label">GITHUB_LINK</label>
              <input
                type="text"
                value={profile.githubLink}
                onChange={e => setProfile({...profile, githubLink: e.target.value})}
                className="adm-input"
              />
            </div>
            <div>
              <label className="adm-label">LINKEDIN_LINK</label>
              <input
                type="text"
                value={profile.linkedinLink}
                onChange={e => setProfile({...profile, linkedinLink: e.target.value})}
                className="adm-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="adm-label">AVATAR_KEY</label>
              <input
                type="text"
                value={profile.avatarKey}
                onChange={e => setProfile({...profile, avatarKey: e.target.value})}
                className="adm-input"
              />
            </div>
            <div>
              <label className="adm-label">CV_PDF_KEY</label>
              <input
                type="text"
                value={profile.cvPdfKey}
                onChange={e => setProfile({...profile, cvPdfKey: e.target.value})}
                className="adm-input"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t adm-divider">
            <div className={`text-sm font-bold ${isErrorMsg ? 'adm-text-danger' : 'adm-text-success'}`}>
              {message}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="adm-btn-primary text-xs"
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
        className="adm-card p-6 rounded-lg max-w-2xl mt-8"
      >
        <div className="flex items-center space-x-2 adm-text-accent mb-6">
          <KeyRound className="w-5 h-5" />
          <h2 className="text-lg font-bold tracking-wider">SECURITY_CONFIGURATION // CHANGE_PASSWORD</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="adm-label">CURRENT_PASSWORD</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="adm-input"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="adm-label">NEW_PASSWORD (MIN 8 CHARS)</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="adm-input"
                required
              />
            </div>
            <div>
              <label className="adm-label">CONFIRM_NEW_PASSWORD</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="adm-input"
                required
              />
            </div>
          </div>

          {pwdError && <div className="adm-text-danger text-xs font-bold">{pwdError}</div>}
          {pwdMessage && <div className="adm-text-success text-xs font-bold">{pwdMessage}</div>}

          <div className="pt-4 flex items-center justify-end border-t adm-divider">
            <button
              type="submit"
              disabled={pwdLoading}
              className="adm-btn-primary text-xs"
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
