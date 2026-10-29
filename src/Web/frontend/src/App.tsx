import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useAdminThemeStore } from './store/adminThemeStore'
import { motion } from 'framer-motion'
import { Sun, Moon, Loader2, ArrowLeft } from 'lucide-react'
import React, { Suspense, lazy, useEffect, useState } from 'react'
import { Home } from './pages/public/Home'
import { AdminLoader } from './components/admin/AdminLoader'

// Code-split: the entire Admin console is loaded as a single cohesive bundle on /dashboard
// so public visitors don't download it, while switching between admin tabs is 0ms instant.
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })))
const CatChatbot = lazy(() => import('./components/CatChatbot').then(m => ({ default: m.CatChatbot })))

function AdminBootFallback() {
  const theme = useAdminThemeStore(state => state.theme)
  return (
    <div data-theme={theme} className="admin-theme min-h-dvh p-4 sm:p-8">
      <div className="max-w-6xl mx-auto pt-4 sm:pt-8">
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
  const { theme, toggleTheme } = useAdminThemeStore()
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
    <div data-theme={theme} className="admin-theme flex min-h-dvh items-center justify-center relative px-4 py-16 font-mono">
      <Link
        to="/"
        className="adm-btn-secondary absolute top-4 left-4 sm:top-6 sm:left-6 text-xs font-bold uppercase tracking-wider"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>LIVE_SITE</span>
      </Link>

      <button
        type="button"
        onClick={toggleTheme}
        className="adm-btn-secondary absolute top-4 right-4 sm:top-6 sm:right-6 text-xs font-bold uppercase tracking-wider"
        aria-label="Chuyển đổi giao diện Sáng / Tối"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4 adm-text-accent" /> : <Moon className="w-4 h-4 adm-text-accent" />}
        <span>{theme === 'dark' ? 'LIGHT_MODE' : 'DARK_MODE'}</span>
      </button>

      <motion.div 
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 sm:p-8 adm-card rounded-lg w-full max-w-md"
      >
        <div className="flex items-center space-x-2 adm-text-accent mb-2 justify-center">
          <span className="font-bold text-lg sm:text-xl tracking-wider">SYS_ADMIN // LOGIN</span>
        </div>
        <p className="text-center text-[11px] sm:text-xs adm-text-muted mb-6 sm:mb-8 break-words">
          AUTHENTICATION_REQUIRED_FOR_CONSOLE_ACCESS
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="login-username" className="adm-label">USERNAME</label>
            <input 
              id="login-username"
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="adm-input"
              required 
            />
          </div>
          <div>
            <label htmlFor="login-password" className="adm-label">PASSWORD</label>
            <input 
              id="login-password"
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="adm-input"
              required 
            />
          </div>
          {error && <div className="adm-text-danger text-sm font-bold">{error}</div>}
          <button 
            type="submit"
            disabled={loading}
            className="adm-btn-primary w-full py-3 mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? "AUTHENTICATING..." : "INITIATE_SESSION"}</span>
          </button>
        </form>
      </motion.div>
    </div>
  )
}

function DeferredChatbot() {
  const [ready, setReady] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1200)
    return () => clearTimeout(timer)
  }, [])

  // Only display Sigma Cat visitor widget on the public portfolio page
  if (location.pathname.startsWith('/login') || location.pathname.startsWith('/dashboard')) {
    return null
  }

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
