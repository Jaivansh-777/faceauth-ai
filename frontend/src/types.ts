export interface Stats {
  total_users: number
  total_logs: number
  success_logs: number
  failed_logs: number
  recent_logs: AuthLog[]
  recent_users: User[]
}

export interface AuthLog {
  id: number
  user_name: string
  confidence: number
  success: boolean
  timestamp: string
  camera_id?: string
}

export interface User {
  id: number
  name: string
  email: string
  is_active: boolean
  role: string
  embedding_count: number
  created_at: string
}

export interface EnrollResponse {
  user_id: number
  name: string
  samples_enrolled: number
}

export interface AuthResponse {
  status: 'granted' | 'denied'
  user: string
  confidence: number
  reason?: string
}

export interface DetectResponse {
  face_count: number
  status: 'no_face' | 'face_locked' | 'multiple_faces' | 'poor_quality' | 'error'
  message: string
}
