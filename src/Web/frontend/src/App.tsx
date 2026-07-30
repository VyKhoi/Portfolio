import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { motion } from 'framer-motion'
import React from 'react'
import { Home } from './pages/public/Home'
import { AdminLayout } from './components/admin/AdminLayout'
import { InboxTable } from './components/admin/InboxTable'
import { ProjectCRUD } from './components/admin/ProjectCRUD'
import { DashboardOverview } from './components/admin/DashboardOverview'
import { ProfileSettings } from './components/admin/ProfileSettings'
import { ExperienceCRUD } from './components/admin/ExperienceCRUD'
import { SkillCRUD } from './components/admin/SkillCRUD'
import { useNavigate } from 'react-router-dom'

const queryClient = new QueryClient()

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(state => state.token)
  if (!token) return <Navigate to="/login" />
  return <>{children}</>
}

function Login() {
  const setToken = useAuthStore(state => state.setToken)
  const token = useAuthStore(state => state.token)
  const navigate = useNavigate()
  const [username, setUsername] = React.useState('admin')
  const [password, setPassword] = React.useState('Admin@123')
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
      const res = await fetch("http://localhost:5000/identity/api/auth/login", {
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
            <label className="block text-xs text-zinc-500 mb-1">USERNAME</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-[#18181C] border border-[#27272A] p-3 text-white rounded focus:border-[#DEFF9A] outline-none transition-colors"
              required 
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">PASSWORD</label>
            <input 
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AdminLayout>
                <Outlet />
              </AdminLayout>
            </ProtectedRoute>
          }>
            <Route index element={<DashboardOverview />} />
            <Route path="inbox" element={<InboxTable />} />
            <Route path="projects" element={<ProjectCRUD />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="experiences" element={<ExperienceCRUD />} />
            <Route path="skills" element={<SkillCRUD />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
