import { useAuthStore } from '../../store/authStore'

/** An API error the console can show as is: the backend already answers in Vietnamese ({ error }). */
export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const FALLBACK: Record<number, string> = {
  400: 'Dữ liệu chưa hợp lệ.',
  401: 'Phiên đăng nhập đã hết, đăng nhập lại nhé.',
  404: 'Không tìm thấy, có thể đã bị xoá.',
  409: 'Bị trùng với một mục đã có.',
  429: 'Thao tác nhanh quá, đợi một chút rồi thử lại.',
}

/** Fetch /api/<path> with the admin token. A 401 logs out so the console goes back to the login page. */
export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token
  let res: Response
  try {
    res = await fetch(`/api/${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    })
  } catch {
    throw new ApiError('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.', 0)
  }

  if (res.status === 401) useAuthStore.getState().logout()
  if (!res.ok) {
    let message = FALLBACK[res.status] ?? `Máy chủ báo lỗi (${res.status}).`
    try {
      const body = await res.json()
      if (typeof body?.error === 'string' && body.error) message = body.error
    } catch {
      // not JSON: keep the generic message
    }
    throw new ApiError(message, res.status)
  }
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export const send = <T = unknown>(path: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown) =>
  api<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) })

// ─── Shapes the console works with ───

export interface Profile {
  fullName: string
  title: string
  titleEn: string
  bio: string
  bioEn: string
  githubLink: string
  linkedinLink: string
  avatarKey: string
  cvPdfKey: string
}

export interface Experience {
  id: string
  role: string
  roleEn: string
  company: string
  companyEn: string
  period: string
  periodEn: string
  projectName: string
  projectNameEn: string
  highlights: string[]
  highlightsEn: string[]
  techStack: string[]
  order: number
}

export interface Skill {
  id: string
  name: string
  category: string
  order: number
}

export interface NowItem {
  label: string
  labelEn: string
  text: string
  textEn: string
}

export interface NowContent {
  updated: string
  items: NowItem[]
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  message: string
  status: 'Pending' | 'Read' | 'Replied'
  createdAt: string
}

export interface ChatSession {
  id: number
  sessionId: string
  startedAt: string
  lastMessageAt: string
  isTest: boolean
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  firstTokenMs: number | null
  totalMs: number | null
  createdAt: string
}

export interface Fact {
  id: string
  key: string
  label: string
  valueVi: string
  valueEn: string
  order: number
  enabled: boolean
}

export interface Status {
  inbox: { unread: number; total: number }
  chat: {
    sessions7d: number
    replies7d: number
    medianReplyMs: number | null
    medianFirstTokenMs: number | null
    refused7d: number
    days: { date: string; replies: number; medianMs: number | null }[]
  }
  ollama: { online: boolean; model: string; loaded: boolean; gpuPercent: number | null }
  build: { commit: string; time: string }
  serverTime: string
}

/** The site's skill groups, in display order, with the titles the public page uses (lib/i18n.ts). */
export const SKILL_GROUPS: { key: string; label: string }[] = [
  { key: 'Backend & Core', label: 'Backend' },
  { key: 'Architecture & Sec', label: 'Kiến trúc & Bảo mật' },
  { key: 'Databases', label: 'Cơ sở dữ liệu' },
  { key: 'Frontend', label: 'Frontend' },
  { key: 'DevOps & Cloud', label: 'DevOps' },
]

/** Vietnamese date + time, e.g. "14:05 · 10/11/2026". */
export function formatTime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())} · ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

/** "vừa xong", "5 phút trước", "3 giờ trước", "2 ngày trước", then the date. */
export function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} ngày trước`
  return formatTime(iso).split(' · ')[1]
}

export function seconds(ms: number | null | undefined) {
  return ms == null ? '—' : `${(ms / 1000).toFixed(1).replace('.', ',')} giây`
}
