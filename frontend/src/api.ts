import type { Stats, AuthLog, User, EnrollResponse, AuthResponse, DetectResponse } from './types'

const API = import.meta.env.VITE_API_URL || ''
const TIMEOUT_MS = 15000
const MAX_RETRIES = 2

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function fetchWithTimeout(url: string, opts: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const r = await fetch(url, { ...opts, signal: controller.signal })
    return r
  } finally {
    clearTimeout(timer)
  }
}

async function handleResponse<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const d = await r.json().catch(() => ({}))
    throw new ApiError(d.detail || `Request failed (${r.status})`, r.status)
  }
  return r.json()
}

async function apiFetch<T>(url: string, opts: RequestInit = {}, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetchWithTimeout(url, opts)
      return handleResponse<T>(r)
    } catch (err: any) {
      const isLast = attempt === retries
      if (err instanceof ApiError) throw err
      if (err.name === 'AbortError') {
        if (isLast) throw new ApiError('Request timed out. Backend may be starting up.', 0)
        continue
      }
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        if (isLast) throw new ApiError('Cannot reach server. Check your connection or try again.', 0)
        continue
      }
      if (isLast) throw new ApiError(err.message || 'Network error', 0)
    }
  }
  throw new ApiError('Request failed after retries', 0)
}

export async function fetchStats(): Promise<Stats> {
  return apiFetch<Stats>(`${API}/stats`)
}

export async function fetchLogs(success?: string): Promise<AuthLog[]> {
  const params = new URLSearchParams({ limit: '100' })
  if (success) params.set('success', success)
  return apiFetch<AuthLog[]>(`${API}/logs/?${params}`)
}

export async function fetchUsers(): Promise<User[]> {
  return apiFetch<User[]>(`${API}/users/`)
}

export async function deleteUser(id: number): Promise<void> {
  await apiFetch<void>(`${API}/users/${id}`, { method: 'DELETE' })
}

export async function enrollUser(name: string, email: string, samples: Blob[]): Promise<EnrollResponse> {
  const fd = new FormData()
  fd.append('name', name)
  fd.append('email', email)
  samples.forEach((b, i) => fd.append('files', b, `s_${i}.jpg`))
  return apiFetch<EnrollResponse>(`${API}/enroll/`, { method: 'POST', body: fd })
}

export async function authenticateUser(blob: Blob): Promise<AuthResponse> {
  const fd = new FormData()
  fd.append('file', blob, 'auth.jpg')
  fd.append('camera_id', 'webcam')
  return apiFetch<AuthResponse>(`${API}/auth/`, { method: 'POST', body: fd })
}

export async function detectFace(blob: Blob): Promise<DetectResponse> {
  const fd = new FormData()
  fd.append('file', blob, 'detect.jpg')
  return apiFetch<DetectResponse>(`${API}/detect/`, { method: 'POST', body: fd })
}
