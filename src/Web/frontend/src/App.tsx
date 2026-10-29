import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { motion } from 'framer-motion'
import React, { Suspense, lazy, useEffect, useState } from 'react'
import { Home } from './pages/public/Home'
import { AdminLoader } from './components/admin/AdminLoader'

// Code-split: the entire Admin console is loaded as a single cohesive bundle on /dashboard
// so public visitors don't download it, while switching between admin tabs is 0ms instant.
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })))
const CatChatbot = lazy(() => import('./components/CatChatbot').then(m => ({ default: m.CatChatbot })))

function AdminBootFallback() {
  return (
    <div className="min-h-screen bg-[#121215] text-white p-8">
      <div className="max-w-6xl mx-auto pt-8">
        <AdminLoader label="INITIALIZING_ADMIN_CONSOLE..." variant="grid" rows={6} />
      </div>
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
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <Suspense fallback={<AdminBootFallback />}>
              <AdminLayout />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DeferredChatbot />
    </Router>
  )
}

export default App
