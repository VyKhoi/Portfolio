import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const input =
  'w-full border border-border bg-obsidian px-3.5 py-3 font-body text-[15px] text-text-main transition-colors focus:border-primary focus:outline-none'

export function Login() {
  const setToken = useAuthStore((s) => s.setToken)
  const token = useAuthStore((s) => s.token)
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = 'Đăng nhập | dangvykhoi.com'
    document.documentElement.lang = 'vi'
  }, [])
  useEffect(() => {
    if (token) navigate('/dashboard')
  }, [token, navigate])

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.token) setToken(data.token)
      else if (res.status === 429) setError('Sai quá nhiều lần. Đợi 15 phút rồi thử lại.')
      else if (res.status === 401) setError('Sai tên đăng nhập hoặc mật khẩu.')
      else setError('Đăng nhập chưa được, thử lại sau.')
    } catch {
      setError('Không kết nối được máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-obsidian px-4 py-16 text-text-main selection:bg-primary selection:text-black">
      <div className="pointer-events-none absolute inset-y-0 left-[10%] hidden w-px bg-border lg:block" />
      <div className="pointer-events-none absolute inset-y-0 right-[10%] hidden w-px bg-border lg:block" />
      <Link to="/" className="absolute left-4 top-4 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-text-muted hover:text-primary sm:left-6 sm:top-6">
        <ArrowLeft size={14} /> Về trang chủ
      </Link>

      <form onSubmit={login} className="relative w-full max-w-sm border border-border bg-surface p-7 sm:p-8">
        <div className="absolute -top-px left-0 right-0 h-0.5 bg-primary" />
        <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-primary">dangvykhoi.com</p>
        <h1 className="mb-8 font-heading text-3xl font-bold tracking-tight">Quản trị</h1>

        <div className="space-y-4">
          <div>
            <label htmlFor="login-user" className="mb-1.5 block font-mono text-xs font-bold uppercase tracking-widest text-text-muted">Tên đăng nhập</label>
            <input id="login-user" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor="login-pass" className="mb-1.5 block font-mono text-xs font-bold uppercase tracking-widest text-text-muted">Mật khẩu</label>
            <input id="login-pass" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
          </div>
        </div>

        {error && <p role="alert" className="mt-4 border border-red-500/50 bg-red-500/5 px-3 py-2 font-body text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 bg-primary font-mono text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Đăng nhập
        </button>
      </form>
    </div>
  )
}
