import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'
import { Suspense, lazy, useEffect, useState } from 'react'
import { Home } from './pages/public/Home'
import { Privacy } from './pages/public/Privacy'

// Login and admin stay out of the public bundle
const AdminEntry = lazy(() => import('./components/admin/AdminEntry').then(m => ({ default: m.AdminEntry })))
const Login = lazy(() => import('./components/admin/Login').then(m => ({ default: m.Login })))
const CatChatbot = lazy(() => import('./components/CatChatbot').then(m => ({ default: m.CatChatbot })))

const adminFallback = <div className="min-h-dvh bg-obsidian" />

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

export function AppRoutes() {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vi" element={<Home />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/vi/privacy" element={<Privacy />} />
          <Route path="/login" element={
            <Suspense fallback={adminFallback}>
              <Login />
            </Suspense>
          } />
          <Route path="/dashboard/*" element={
            <Suspense fallback={adminFallback}>
              <AdminEntry />
            </Suspense>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <DeferredChatbot />
      </MotionConfig>
    </LazyMotion>
  )
}
