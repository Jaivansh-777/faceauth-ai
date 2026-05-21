import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Fingerprint } from 'lucide-react'

interface ResultModalProps {
  open: boolean; type: 'success' | 'error' | null; title: string; subtitle?: string
  confidence?: number; reason?: string; onClose: () => void; autoClose?: number
}

export default function ResultModal({ open, type, title, subtitle, confidence, reason, onClose, autoClose = 3000 }: ResultModalProps) {
  useEffect(() => { if (!open || !autoClose) return; const t = setTimeout(onClose, autoClose); return () => clearTimeout(t) }, [open, autoClose, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.85, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }} onClick={e => e.stopPropagation()}
            className="relative overflow-hidden rounded-3xl border p-8 max-w-sm w-full text-center shadow-2xl"
            style={{
              background: type === 'success' ? 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(255,255,255,0.9))' : 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(255,255,255,0.9))',
              borderColor: type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
              backdropFilter: 'blur(24px)',
            }}>
            <div className="absolute inset-0 pointer-events-none">
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full opacity-10 ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ filter: 'blur(60px)' }} />
            </div>
            <div className="relative">
              {type === 'success' ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={44} className="text-emerald-500" />
                </motion.div>
              ) : (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center mx-auto mb-4">
                  <XCircle size={44} className="text-red-500" />
                </motion.div>
              )}
              <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className={`text-xl font-bold ${type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>{title}</motion.h2>
              {subtitle && <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>{subtitle}</motion.p>}
              {confidence != null && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                  className="flex items-center justify-center gap-2 mt-3 text-xs" style={{ color: 'var(--text-2)' }}>
                  <Fingerprint size={12} /> Confidence: {confidence}%
                </motion.div>
              )}
              {reason && <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>{reason}</motion.p>}
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} onClick={onClose}
                className={`mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                }`}>Dismiss</motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
