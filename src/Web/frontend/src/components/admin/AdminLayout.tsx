import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import {
  Bot,
  Briefcase,
  CircleUser,
  Code2,
  ExternalLink,
  FolderGit2,
  Inbox as InboxIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { api, type Status } from './api'
import { usePublishState } from './publish'
import { ConfirmProvider, ToastProvider, hasUnsavedChanges } from './ui'
import { Overview } from './pages/Overview'
import { Inbox } from './pages/Inbox'
import { Profile } from './pages/Profile'
import { Experience } from './pages/Experience'
import { Skills } from './pages/Skills'
import { Projects, ProjectEditor } from './pages/Projects'
import { Now } from './pages/Now'
import { SigmaCat } from './pages/SigmaCat'
import { Account } from './pages/Account'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: true, retry: 1 },
  },
})

const NAV: { group?: string; items: { to: string; label: string; icon: typeof Bot; end?: boolean }[] }[] = [
  {
    items: [
      { to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard, end: true },
      { to: '/dashboard/inbox', label: 'Hộp thư', icon: InboxIcon },
    ],
  },
  {
    group: 'Nội dung trang',
    items: [
      { to: '/dashboard/profile', label: 'Hồ sơ', icon: UserRound },
      { to: '/dashboard/experience', label: 'Kinh nghiệm', icon: Briefcase },
      { to: '/dashboard/skills', label: 'Kỹ năng', icon: Code2 },
      { to: '/dashboard/projects', label: 'Dự án', icon: FolderGit2 },
      { to: '/dashboard/now', label: 'Now', icon: Sparkles },
    ],
  },
  {
    group: 'Trợ lý',
    items: [{ to: '/dashboard/sigma-cat', label: 'Sigma Cat', icon: Bot }],
  },
  {
    items: [{ to: '/dashboard/account', label: 'Tài khoản', icon: CircleUser }],
  },
]

function PublishIndicator() {
  const { data } = usePublishState()
  if (!data || data.state === 'unknown') return null
  const published = data.state === 'published'
  return (
    <div className="border border-border px-3 py-2.5" title="Trang tĩnh là bản Google và khách mở lần đầu nhận được">
      <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest">
        <span className={`h-1.5 w-1.5 ${published ? 'bg-emerald-400' : 'animate-pulse bg-amber-400'}`} aria-hidden="true" />
        <span className={published ? 'text-emerald-400' : 'text-amber-400'}>{published ? 'Đã xuất bản' : 'Chờ xuất bản'}</span>
      </p>
      <p className="mt-1 font-body text-[11px] leading-snug text-text-muted">
        {published ? 'Trang đang chạy khớp với nội dung ở đây.' : 'Sửa đổi lên trang trong khoảng 30 phút.'}
      </p>
    </div>
  )
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const logout = useAuthStore((s) => s.logout)
  const { data: status } = useQuery({ queryKey: ['status'], queryFn: () => api<Status>('admin/status'), refetchInterval: 60_000 })
  const unread = status?.inbox.unread ?? 0

  const guard = (e: { preventDefault: () => void }) => {
    if (hasUnsavedChanges() && !window.confirm('Có thay đổi chưa lưu. Rời trang này?')) e.preventDefault()
    else onNavigate?.()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <img src="/favicon-96x96.png?v=2" alt="" width={28} height={28} className="h-7 w-7 rounded-full border border-primary/40" />
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-bold text-text-main">dangvykhoi<span className="text-primary">.com</span></p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Quản trị</p>
        </div>
      </div>

      <nav className="admin-scroll flex-1 overflow-y-auto px-3 py-4" aria-label="Mục quản trị">
        {NAV.map((section, i) => (
          <div key={i} className={i > 0 ? 'mt-5' : ''}>
            {section.group && <p className="mb-2 px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted/70">{section.group}</p>}
            {section.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={guard}
                className={({ isActive }) =>
                  `group flex items-center gap-3 border-l-2 px-3 py-2.5 font-body text-[15px] transition-colors ${
                    isActive ? 'border-primary bg-surface text-text-main' : 'border-transparent text-text-muted hover:bg-surface hover:text-text-main'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={isActive ? 'text-primary' : 'text-text-muted group-hover:text-primary'} aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    {to === '/dashboard/inbox' && unread > 0 && (
                      <span className="min-w-5 bg-primary px-1.5 text-center font-mono text-[11px] font-bold text-black" aria-label={`${unread} tin chưa đọc`}>
                        {unread}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-border p-3">
        <PublishIndicator />
        <a
          href="/"
          target="_blank"
          rel="noopener"
          className="flex items-center justify-between border border-border px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-text-muted transition-colors hover:border-primary hover:text-primary"
        >
          Xem trang <ExternalLink size={14} aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={() => {
            if (!hasUnsavedChanges() || window.confirm('Có thay đổi chưa lưu. Vẫn đăng xuất?')) logout()
          }}
          className="flex w-full items-center gap-2 px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest text-text-muted transition-colors hover:text-red-400"
        >
          <LogOut size={14} aria-hidden="true" /> Đăng xuất
        </button>
      </div>
    </div>
  )
}

function Shell() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    document.title = 'Quản trị | dangvykhoi.com'
    document.documentElement.lang = 'vi'
  }, [])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="min-h-dvh bg-obsidian text-text-main selection:bg-primary selection:text-black">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-obsidian lg:block">
        <Sidebar />
      </aside>

      {/* Phone / tablet: top bar + drawer */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-obsidian/95 px-4 backdrop-blur lg:hidden">
        <p className="font-mono text-sm font-bold">dangvykhoi<span className="text-primary">.com</span> <span className="text-text-muted">/ quản trị</span></p>
        <button type="button" onClick={() => setOpen(true)} aria-label="Mở menu" className="flex h-10 w-10 items-center justify-center text-text-main hover:text-primary">
          <Menu size={22} />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-border bg-obsidian">
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng menu" className="absolute right-2 top-3 z-10 flex h-10 w-10 items-center justify-center text-text-muted hover:text-primary">
              <X size={20} />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="profile" element={<Profile />} />
            <Route path="experience" element={<Experience />} />
            <Route path="skills" element={<Skills />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:slug" element={<ProjectEditor />} />
            <Route path="now" element={<Now />} />
            <Route path="sigma-cat" element={<SigmaCat />} />
            <Route path="account" element={<Account />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export function AdminLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <Shell />
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
