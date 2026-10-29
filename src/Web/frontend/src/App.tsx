import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { motion } from 'framer-motion'
import React, { Suspense, lazy, useEffect, useState } from 'react'
import { Home } from './pages/public/Home'

// Code-split: admin dashboard & chatbot are loaded on demand so public visitors
// only download what is needed to paint the homepage.
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })))
const InboxTable = lazy(() => import('./components/admin/InboxTable').then(m => ({ default: m.InboxTable })))
const ProjectCRUD = lazy(() => import('./components/admin/ProjectCRUD').then(m => ({ default: m.ProjectCRUD })))
const DashboardOverview = lazy(() => import('./components/admin/DashboardOverview').then(m => ({ default: m.DashboardOverview })))
const ProfileSettings = lazy(() => import('./components/admin/ProfileSettings').then(m => ({ default: m.ProfileSettings })))
const ExperienceCRUD = lazy(() => import('./components/admin/ExperienceCRUD').then(m => ({ default: m.ExperienceCRUD })))
const SkillCRUD = lazy(() => import('./components/admin/SkillCRUD').then(m => ({ default: m.SkillCRUD })))
const AIChatLogs = lazy(() => import('./components/admin/AIChatLogs').then(m => ({ default: m.AIChatLogs })))
const CatChatbot = lazy(() => import('./components/CatChatbot').then(m => ({ default: m.CatChatbot })))

function AdminFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#0A0A0C] font-mono text-xs text-zinc-400">
      LOADING_MODULE...
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(state => state.token)
  if (!token) return <Navigate to="/login" />
  return <>{children}</>
}

function Login() {
  const setToken = useAuthStore(state => state.setToken)
  const token = useAuthStore(state => state.token)
  const navigate = useNavigate()
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (token) {
      navigate('/dashboard')
    }
  }, [token, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const baseUrl = '/api';
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (res.ok && data.token) {
        setToken(data.token)
      } else {
        setError(data.error || "Login failed")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#0A0A0C]">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 bg-[#121215] border border-[#27272A] rounded-lg shadow-2xl w-full max-w-md font-mono"
      >
        <div className="flex items-center space-x-2 text-[#DEFF9A] mb-8 justify-center">
          <span className="font-bold text-xl">SYS_ADMIN // LOGIN</span>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="login-username" className="block text-xs text-zinc-400 mb-1">USERNAME</label>
            <input 
              id="login-username"
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-[#18181C] border border-[#27272A] p-3 text-white rounded focus:border-[#DEFF9A] outline-none transition-colors"
              required 
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-xs text-zinc-400 mb-1">PASSWORD</label>
            <input 
              id="login-password"
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#18181C] border border-[#27272A] p-3 text-white rounded focus:border-[#DEFF9A] outline-none transition-colors"
              required 
            />
          </div>
          {error && <div className="text-[#F43F5E] text-sm">{error}</div>}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#DEFF9A] hover:bg-[#DEFF9A]/80 text-black px-4 py-3 font-bold rounded transition-colors disabled:opacity-50"
          >
            {loading ? "AUTHENTICATING..." : "INITIATE_SESSION"}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

function DeferredChatbot() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1200)
    return () => clearTimeout(timer)
  }, [])

  if (!ready) return null
  return (
    <Suspense fallback={null}>
      <CatChatbot />
    </Suspense>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Suspense fallback={<AdminFallback />}>
              <AdminLayout>
                <Suspense fallback={<AdminFallback />}>
                  <Outlet />
                </Suspense>
              </AdminLayout>
            </Suspense>
          </ProtectedRoute>
        }>
          <Route index element={<DashboardOverview />} />
          <Route path="inbox" element={<InboxTable />} />
          <Route path="projects" element={<ProjectCRUD />} />
          <Route path="profile" element={<ProfileSettings />} />
          <Route path="experiences" element={<ExperienceCRUD />} />
          <Route path="skills" element={<SkillCRUD />} />
          <Route path="ai-logs" element={<AIChatLogs />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DeferredChatbot />
    </Router>
  )
}

export default App
