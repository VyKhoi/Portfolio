import React, { Suspense, lazy } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

// The whole admin console is one lazy bundle: public visitors never download it
const AdminLayout = lazy(() => import('./AdminLayout').then((m) => ({ default: m.AdminLayout })))

function BootFallback() {
  return (
    <div className="min-h-dvh bg-obsidian lg:pl-64">
      <div className="mx-auto max-w-[1100px] space-y-3 px-4 py-10 sm:px-6 lg:px-10" aria-busy="true" aria-label="Đang tải trang quản trị">
        <div className="h-10 w-48 animate-pulse bg-surface" />
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-24 animate-pulse border border-border bg-surface" />)}
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" />
  return <>{children}</>
}

export function AdminEntry() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<BootFallback />}>
        <AdminLayout />
      </Suspense>
    </ProtectedRoute>
  )
}
