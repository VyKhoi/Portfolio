import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import { send } from '../api'
import { Button, PageHeader, Panel, TextInput, useToast } from '../ui'

export function Account() {
  const toast = useToast()
  const { setToken, logout } = useAuthStore()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')

  const problem =
    next.length > 0 && next.length < 8 ? 'Mật khẩu mới cần ít nhất 8 ký tự.'
    : again.length > 0 && next !== again ? 'Hai ô mật khẩu mới chưa khớp.'
    : null

  const change = useMutation({
    mutationFn: () => send<{ token: string }>('auth/change-password', 'POST', { currentPassword: current, newPassword: next }),
    onSuccess: (res) => {
      if (res?.token) setToken(res.token)
      setCurrent('')
      setNext('')
      setAgain('')
      toast.ok('Đã đổi mật khẩu. Các máy khác đã bị đăng xuất.')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <>
      <PageHeader title="Tài khoản" description="Chỉ có một tài khoản quản trị (admin)." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Đổi mật khẩu">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!problem && current && next && next === again) change.mutate()
            }}
          >
            <TextInput label="Mật khẩu hiện tại" type="password" value={current} onChange={setCurrent} />
            <TextInput label="Mật khẩu mới" type="password" value={next} onChange={setNext} hint="Ít nhất 8 ký tự." />
            <TextInput label="Nhập lại mật khẩu mới" type="password" value={again} onChange={setAgain} />
            {problem && <p className="font-body text-sm text-red-400">{problem}</p>}
            <Button type="submit" loading={change.isPending} disabled={!current || !next || next !== again || !!problem}>
              Đổi mật khẩu
            </Button>
            <p className="font-body text-xs leading-relaxed text-text-muted">
              Đổi xong, mọi máy khác đang đăng nhập sẽ phải đăng nhập lại. Lưu ý: nếu GitHub Secret <span className="font-mono">ADMIN_PASSWORD</span> còn đặt,
              lần deploy sau mật khẩu sẽ trở về giá trị trong Secret.
            </p>
          </form>
        </Panel>
        <Panel title="Phiên đăng nhập">
          <p className="mb-4 font-body text-sm leading-relaxed text-text-muted">
            Phiên đăng nhập trên trình duyệt này giữ 3 ngày. Dùng máy lạ thì đăng xuất khi xong.
          </p>
          <Button variant="secondary" icon={<LogOut size={14} />} onClick={logout}>Đăng xuất máy này</Button>
        </Panel>
      </div>
    </>
  )
}
