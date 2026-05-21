import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, User, Mail, Image, Fingerprint, RefreshCw, Check, Upload } from 'lucide-react'
import { useToast } from './Toast'
import { enrollUser, detectFace } from '../api'
import type { DetectResponse } from '../types'
import ResultModal from './ResultModal'
import { startCamera, stopCamera, getCameraError as getCamErr } from '../camera'

const SAMPLES_NEEDED = 5

export default function Enroll() {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [samples, setSamples] = useState<Blob[]>([])
  const [cameraActive, setCameraActive] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])
  const [faceStatus, setFaceStatus] = useState<DetectResponse | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; title: string; subtitle?: string } | null>(null)
  const [cameraError, setCameraError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectRef = useRef<number>(0)
  const detectErrorAtRef = useRef(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    init()
    return () => {
      mountedRef.current = false
      clearInterval(detectRef.current)
      stopCamera()
      previews.forEach(p => URL.revokeObjectURL(p))
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
      startDetection()
    } else {
      setCameraError(getCamErr())
      setCameraActive(false)
    }
  }

  function startDetection() {
    clearInterval(detectRef.current)
    detectRef.current = window.setInterval(() => {
      const v = videoRef.current; const c = canvasRef.current
      if (!v || !c || submitting) return
      if (samples.length >= SAMPLES_NEEDED) {
        clearInterval(detectRef.current)
        return
      }
      const now = Date.now()
      if (now - detectErrorAtRef.current < 3000) return
      c.width = 160; c.height = 120
      c.getContext('2d')!.drawImage(v, 0, 0, 160, 120)
      c.toBlob(blob => {
        if (!blob || !mountedRef.current) return
        detectFace(blob).then(setFaceStatus).catch(() => {
          detectErrorAtRef.current = Date.now()
        })
      }, 'image/jpeg', 0.7)
    }, 1000)
  }

  function captureSample() {
    const v = videoRef.current; const c = canvasRef.current
    if (!v || !c || capturing) return
    setCapturing(true)
    c.width = v.videoWidth || 640; c.height = v.videoHeight || 480
    c.getContext('2d')!.drawImage(v, 0, 0)
    c.toBlob(blob => {
      if (!blob) { setCapturing(false); return }
      const url = URL.createObjectURL(blob)
      setSamples(prev => [...prev, blob!])
      setPreviews(prev => [...prev, url])
      setCapturing(false)
    }, 'image/jpeg', 0.85)
  }

  async function handleSubmit() {
    if (samples.length < SAMPLES_NEEDED || !name.trim()) return
    setSubmitting(true); clearInterval(detectRef.current)
    try {
      const res = await enrollUser(name.trim(), email.trim(), samples)
      setResult({ type: 'success', title: 'Enrollment Complete', subtitle: `${res.name} enrolled · ID: ${res.user_id} · ${res.samples_enrolled} samples` })
      setResultOpen(true); toast(`Enrolled: ${res.name}`)
      setSamples([]); setPreviews(prev => { prev.forEach(p => URL.revokeObjectURL(p)); return [] }); setName(''); setEmail('')
    } catch (e: any) {
      setResult({ type: 'error', title: 'Enrollment Failed', subtitle: e.message || 'Something went wrong' })
      setResultOpen(true); toast(e.message || 'Enrollment failed', 'error')
    } finally { setSubmitting(false); startDetection() }
  }

  const handleResultClose = useCallback(() => {
    setResultOpen(false); setResult(null)
    if (cameraActive) startDetection()
  }, [cameraActive])

  const handleRetake = useCallback(() => {
    setSamples([]); setPreviews(prev => { prev.forEach(p => URL.revokeObjectURL(p)); return [] })
    setFaceStatus(null); setCapturing(false)
    if (cameraActive) startDetection()
  }, [cameraActive])

  const faceLocked = faceStatus?.status === 'face_locked'
  const noFace = faceStatus?.status === 'no_face'
  const multipleFaces = faceStatus?.status === 'multiple_faces'
  const poorQuality = faceStatus?.status === 'poor_quality'
  const canCapture = faceLocked && samples.length < SAMPLES_NEEDED && !capturing
  const readyToSubmit = samples.length >= SAMPLES_NEEDED

  const progress = Math.min((samples.length / SAMPLES_NEEDED) * 100, 100)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 lg:p-6">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--text)' }}>
            <User size={15} style={{ color: 'var(--accent)' }} /> Identity Details
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                className="w-full px-3 py-2.5 border rounded-xl text-sm placeholder-zinc-400 focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/10 transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>Email (optional)</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                  className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm placeholder-zinc-400 focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/10 transition-all" />
              </div>
            </div>
          </div>

          {previews.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[11px] mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
                <Image size={12} /> Captured samples
              </p>
              <div className="flex gap-2 flex-wrap">
                {previews.map((url, i) => (
                  <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-14 h-14 rounded-xl overflow-hidden border-2 relative" style={{ borderColor: 'var(--glass-border)' }}>
                    <img src={url} alt={`Sample ${i + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0.5 right-0.5 text-[8px] font-bold text-white bg-black/50 px-1 rounded">{i + 1}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {cameraActive && (
            <div className="mt-5 pt-4 border-t flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
              <div className="relative w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="3" />
                  <motion.circle cx="20" cy="20" r="17" fill="none"
                    stroke={readyToSubmit ? '#10b981' : '#6366f1'}
                    strokeWidth="3" strokeDasharray={`${progress * 1.07} 999`} strokeLinecap="round"
                    className="transition-all duration-500" />
                </svg>
                <span className="text-[10px] font-bold relative" style={{ color: 'var(--text)' }}>{samples.length}</span>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                {samples.length} of {SAMPLES_NEEDED} samples captured
                {capturing && ' — capturing...'}
              </span>
            </div>
          )}

          {readyToSubmit && name.trim() && (
            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onClick={handleSubmit} disabled={submitting}
              className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)' }}>
              <Upload size={15} /> {submitting ? 'Submitting...' : 'Submit Enrollment'}
            </motion.button>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Camera size={15} style={{ color: 'var(--accent-2)' }} /> Face Capture
            </h3>
            <div className="flex items-center gap-2">
              {readyToSubmit && (
                <button onClick={handleRetake} className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all hover:bg-[var(--surface-hover)]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
                  <RefreshCw size={10} /> Retake
                </button>
              )}
              <span className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full border ${
                readyToSubmit ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>{samples.length} / {SAMPLES_NEEDED}</span>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden bg-black/5 border aspect-[4/3] relative" style={{ borderColor: 'var(--glass-border)' }}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            {cameraActive && samples.length > 0 && samples.length < SAMPLES_NEEDED && (
              <div className="absolute top-3 left-3 flex gap-1.5">
                {Array.from({ length: SAMPLES_NEEDED }).map((_, i) => (
                  <motion.div key={i} className="w-2 h-2 rounded-full" initial={false}
                    animate={{ scale: i < samples.length ? 1 : 0.6, opacity: i < samples.length ? 1 : 0.4 }}
                    style={{ background: i < samples.length ? '#10b981' : 'rgba(0,0,0,0.15)' }} />
                ))}
              </div>
            )}

            {noFace && !readyToSubmit && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium text-amber-700"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                No face detected
              </div>
            )}

            {multipleFaces && !readyToSubmit && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium text-red-700"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                Multiple faces detected
              </div>
            )}

            {poorQuality && !readyToSubmit && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium text-amber-700"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                {faceStatus?.message || 'Poor quality'}
              </div>
            )}

            {capturing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium text-emerald-700"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <Fingerprint size={10} /> Capturing...
              </motion.div>
            )}

            {submitting && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full" />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Submitting enrollment...</span>
                </div>
              </div>
            )}

            <div className="absolute inset-0 pointer-events-none">
              <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] aspect-[3/4] rounded-[20px] face-capture-ring"
                animate={{
                  borderColor: readyToSubmit ? 'rgba(16,185,129,0.5)' : faceLocked ? 'rgba(16,185,129,0.4)' : 'rgba(99,102,241,0.25)',
                  borderWidth: (faceLocked || readyToSubmit) ? 2 : 1.5,
                }}
                style={{ borderStyle: 'solid', transition: 'border-color 0.3s ease' }} />
              <motion.p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest font-medium"
                style={{ color: 'rgba(0,0,0,0.35)' }}
                animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
                {submitting ? 'Submitting...' : readyToSubmit ? 'Ready to submit' : multipleFaces ? 'Only one face allowed' : noFace ? 'No face detected' : faceLocked ? 'Face locked' : 'Center your face'}
              </motion.p>
            </div>

            {!cameraActive && !submitting && !cameraError && (
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

          {cameraActive && !submitting && (
            <div className="flex flex-col items-center gap-3 mt-4">
              <div className="flex items-center justify-center gap-2">
                <motion.span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}
                  animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}>
                  <span className={`w-2 h-2 rounded-full ${readyToSubmit ? 'bg-emerald-500' : faceLocked ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`} />
                  {readyToSubmit ? 'All samples collected' : noFace ? 'No face detected' : multipleFaces ? 'Multiple faces detected' : poorQuality ? (faceStatus?.message || 'Poor quality') : faceLocked ? 'Face locked — ready to capture' : 'Waiting for face...'}
                </motion.span>
              </div>

              {!readyToSubmit && (
                <motion.button
                  onClick={captureSample}
                  disabled={!canCapture}
                  whileTap={canCapture ? { scale: 0.95 } : {}}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg transition-all ${
                    canCapture
                      ? 'text-white cursor-pointer'
                      : 'text-zinc-400 cursor-not-allowed opacity-50'
                  }`}
                  style={{
                    background: canCapture
                      ? 'linear-gradient(135deg, #6366f1, #0ea5e9)'
                      : 'var(--input-bg)',
                    border: canCapture ? 'none' : '1px solid var(--border)',
                  }}>
                  <Camera size={15} />
                  {capturing ? 'Capturing...' : `Capture Sample ${samples.length + 1}`}
                </motion.button>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <ResultModal open={resultOpen} type={result?.type || null} title={result?.title || ''} subtitle={result?.subtitle} onClose={handleResultClose} />
    </motion.div>
  )
}
