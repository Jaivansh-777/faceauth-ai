import type { Stats, AuthLog, User, EnrollResponse, AuthResponse, DetectResponse } from './types'

const API = import.meta.env.VITE_API_URL || ''

async function handleResponse<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const d = await r.json().catch(() => ({}))
    throw new Error(d.detail || `Request failed (${r.status})`)
  }
  return r.json()
}

export async function fetchStats(): Promise<Stats> {
  const r = await fetch(`${API}/stats`)
  return handleResponse<Stats>(r)
}

export async function fetchLogs(success?: string): Promise<AuthLog[]> {
  const params = new URLSearchParams({ limit: '100' })
  if (success) params.set('success', success)
  const r = await fetch(`${API}/logs/?${params}`)
  return handleResponse<AuthLog[]>(r)
}

export async function fetchUsers(): Promise<User[]> {
  const r = await fetch(`${API}/users/`)
  return handleResponse<User[]>(r)
}

export async function deleteUser(id: number): Promise<void> {
  const r = await fetch(`${API}/users/${id}`, { method: 'DELETE' })
  if (!r.ok) {
    const d = await r.json().catch(() => ({}))
    throw new Error(d.detail || 'Delete failed')
  }
}

export async function enrollUser(name: string, email: string, samples: Blob[]): Promise<EnrollResponse> {
  const fd = new FormData()
  fd.append('name', name)
  fd.append('email', email)
  samples.forEach((b, i) => fd.append('files', b, `s_${i}.jpg`))
  const r = await fetch(`${API}/enroll/`, { method: 'POST', body: fd })
  return handleResponse<EnrollResponse>(r)
}

export async function authenticateUser(blob: Blob): Promise<AuthResponse> {
  const fd = new FormData()
  fd.append('file', blob, 'auth.jpg')
  fd.append('camera_id', 'webcam')
  const r = await fetch(`${API}/auth/`, { method: 'POST', body: fd })
  return handleResponse<AuthResponse>(r)
}

export async function detectFace(blob: Blob): Promise<DetectResponse> {
  const fd = new FormData()
  fd.append('file', blob, 'detect.jpg')
  const r = await fetch(`${API}/detect/`, { method: 'POST', body: fd })
  return handleResponse<DetectResponse>(r)
}
