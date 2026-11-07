import React, { Suspense, lazy } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAdminThemeStore } from '../../store/adminThemeStore'
import { AdminLoader } from './AdminLoader'

// Code-split: the entire Admin console is loaded as a single cohesive bundle on /dashboard
// so public visitors don't download it, while switching between admin tabs is 0ms instant.
const AdminLayout = lazy(() => import('./AdminLayout').then(m => ({ default: m.AdminLayout })))

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

export function AdminEntry() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<AdminBootFallback />}>
        <AdminLayout />
      </Suspense>
    </ProtectedRoute>
  )
}
