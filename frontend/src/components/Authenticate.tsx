import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, ScanFace, Fingerprint } from 'lucide-react'
import { useToast } from './Toast'
import { authenticateUser, detectFace } from '../api'
import type { DetectResponse } from '../types'
import ResultModal from './ResultModal'
import { startCamera, stopCamera, getCameraError as getCamErr } from '../camera'

export default function Authenticate() {
  const { toast } = useToast()
  const [cameraActive, setCameraActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; title: string; subtitle?: string; confidence?: number; reason?: string } | null>(null)
  const [faceStatus, setFaceStatus] = useState<DetectResponse | null>(null)
  const [cameraError, setCameraError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectRef = useRef<number>(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    init()
    return () => {
      mountedRef.current = false
      clearInterval(detectRef.current)
      stopCamera()
    }
  }, [])

  async function init() {
    setCameraError('')
    setCameraReady(false)
    await new Promise(r => setTimeout(r, 100))
    if (!mountedRef.current || !videoRef.current) return
    const ok = await startCamera(videoRef.current)
    if (!mountedRef.current) return
    if (ok) {
      setCameraActive(true)
      setCameraReady(true)
      startFaceDetection()
    } else {
      setCameraError(getCamErr())
      setCameraActive(false)
    }
  }

  function startFaceDetection() {
    clearInterval(detectRef.current)
    detectRef.current = window.setInterval(() => {
      const v = videoRef.current; const c = canvasRef.current
      if (!v || !c || processing || resultOpen) return
      c.width = 160; c.height = 120
      c.getContext('2d')!.drawImage(v, 0, 0, 160, 120)
      c.toBlob(blob => {
        if (!blob || !mountedRef.current) return
        detectFace(blob).then(setFaceStatus).catch(() => {})
      }, 'image/jpeg', 0.7)
    }, 600)
  }

  async function handleAuthenticate() {
    const v = videoRef.current; const c = canvasRef.current
    if (!v || !c || processing) return
    c.width = v.videoWidth || 640; c.height = v.videoHeight || 480
    c.getContext('2d')!.drawImage(v, 0, 0)
    setProcessing(true); clearInterval(detectRef.current)
    c.toBlob(async blob => {
      if (!blob) { toast('Capture failed', 'error'); setProcessing(false); startFaceDetection(); return }
      try {
        const d = await authenticateUser(blob)
        const ok = d.status === 'granted'
        setResult({ type: ok ? 'success' : 'error', title: ok ? 'ACCESS GRANTED' : 'ACCESS DENIED', subtitle: ok ? `Welcome, ${d.user || 'user'}` : (d.reason || 'Face not recognized'), confidence: d.confidence, reason: d.reason })
        setResultOpen(true)
        toast(ok ? 'Access granted' : (d.reason || 'Access denied'), ok ? 'success' : 'error')
      } catch {
        toast('Connection error. Please try again.', 'error')
      } finally { setProcessing(false) }
    }, 'image/jpeg', 0.85)
  }

  const handleResultClose = useCallback(() => {
    setResultOpen(false); setResult(null)
    startFaceDetection()
  }, [])

  const faceLocked = faceStatus?.status === 'face_locked'
  const noFace = faceStatus?.status === 'no_face'
  const multipleFaces = faceStatus?.status === 'multiple_faces'
  const poorQuality = faceStatus?.status === 'poor_quality'
  const canAuth = faceLocked && !processing && cameraReady

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <ScanFace size={15} style={{ color: 'var(--accent)' }} /> Face Verification
          </h3>
          <span className="text-[10px] font-mono px-2 py-1 rounded-lg border" style={{ color: 'var(--text-3)', background: 'var(--badge-bg)', borderColor: 'var(--border)' }}>Detect & Auth</span>
        </div>

        <div className="rounded-2xl overflow-hidden bg-black/5 border aspect-[4/3] relative" style={{ borderColor: 'var(--glass-border)' }}>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {noFace && !processing && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium text-amber-700"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              No face detected
            </motion.div>
          )}

          {multipleFaces && !processing && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium text-red-700"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              Multiple faces detected
            </motion.div>
          )}

          {poorQuality && !processing && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium text-amber-700"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              {faceStatus?.message || 'Poor quality'}
            </motion.div>
          )}

          {faceLocked && !processing && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: '#059669' }}>
              <Fingerprint size={10} /> Face locked
            </motion.div>
          )}

          {processing && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full" />
                <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Verifying identity...</span>
              </div>
            </div>
          )}

          <div className="absolute inset-0 pointer-events-none">
            <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] aspect-[3/4] rounded-[20px] face-capture-ring"
              animate={{
                borderColor: processing ? 'rgba(99,102,241,0.4)' : faceLocked ? 'rgba(16,185,129,0.5)' : 'rgba(99,102,241,0.2)',
                borderWidth: faceLocked ? 2 : 1.5,
              }}
              style={{ borderStyle: 'solid', transition: 'border-color 0.3s ease' }} />
            <motion.p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest font-medium"
              style={{ color: 'rgba(0,0,0,0.35)' }}
              animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
              {processing ? 'Verifying...' : multipleFaces ? 'Only one face allowed' : noFace ? 'No face detected' : poorQuality ? 'Poor quality' : faceLocked ? 'Face locked' : 'Look at the camera'}
            </motion.p>
          </div>

          {!cameraActive && !processing && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>Starting camera...</span>
              </div>
            </div>
          )}

          {cameraError && !cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <div className="text-center px-4">
                <p className="text-xs font-medium text-rose-600 mb-2">{cameraError}</p>
                <button onClick={init} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)' }}>
                  <Camera size={14} /> Retry
                </button>
              </div>
            </div>
          )}
        </div>

        {cameraActive && !processing && !resultOpen && (
          <div className="flex flex-col items-center gap-3 mt-4">
            <div className="flex items-center justify-center gap-2">
              <motion.span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}
                animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}>
                <span className={`w-2 h-2 rounded-full ${faceLocked ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`} />
                {noFace ? 'No face detected' : multipleFaces ? 'Multiple faces detected' : poorQuality ? (faceStatus?.message || 'Poor quality') : faceLocked ? 'Face locked — ready to authenticate' : 'Waiting for face...'}
              </motion.span>
            </div>

            <motion.button
              onClick={handleAuthenticate}
              disabled={!canAuth}
              whileTap={canAuth ? { scale: 0.95 } : {}}
              className={`flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all ${
                canAuth
                  ? 'text-white cursor-pointer'
                  : 'text-zinc-400 cursor-not-allowed opacity-50'
              }`}
              style={{
                background: canAuth
                  ? 'linear-gradient(135deg, #6366f1, #0ea5e9)'
                  : 'var(--input-bg)',
                border: canAuth ? 'none' : '1px solid var(--border)',
              }}>
              <ScanFace size={16} />
              {processing ? 'Verifying...' : 'Authenticate'}
            </motion.button>
          </div>
        )}
      </motion.div>

      <ResultModal open={resultOpen} type={result?.type || null} title={result?.title || ''} subtitle={result?.subtitle} confidence={result?.confidence} reason={result?.reason} onClose={handleResultClose} />
    </motion.div>
  )
}
