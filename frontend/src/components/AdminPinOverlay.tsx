import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield } from 'lucide-react'

const ADMIN_PIN = '1234'

interface AdminPinOverlayProps { open: boolean; onSuccess: () => void; onClose: () => void }

export default function AdminPinOverlay({ open, onSuccess, onClose }: AdminPinOverlayProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  function handleInput(v: string) {
    if (v === 'clear') { setPin(''); setError(''); return }
    if (v === 'back') { setPin(prev => prev.slice(0, -1)); return }
    if (pin.length >= 4) return
    const newPin = pin + v
    setPin(newPin)
    if (newPin.length === 4) {
      if (newPin === ADMIN_PIN) { setError(''); setPin(''); onSuccess() }
      else { setError('Incorrect PIN. Try again.'); setTimeout(() => setPin(''), 50) }
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}>
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-xs mx-4 rounded-3xl border p-6 shadow-2xl" style={{
              background: 'rgba(255,255,255,0.95)',
              borderColor: 'var(--glass-border)',
              backdropFilter: 'blur(24px)',
            }}>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto mb-3">
                <Shield size={22} style={{ color: 'var(--accent)' }} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Admin Access</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Enter PIN to unlock admin panel</p>
            </div>
            <div className="flex justify-center gap-3 mb-5">
              {[0, 1, 2, 3].map(i => (
                <motion.div key={i}
                  className={`w-3 h-3 rounded-full border-2 transition-all duration-200 ${i < pin.length ? 'bg-indigo-500 border-indigo-400 scale-110' : ''}`}
                  style={{ borderColor: i < pin.length ? undefined : 'var(--text-4)' }}
                  animate={i < pin.length ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.2 }} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <button key={n} onClick={() => handleInput(String(n))}
                  className="h-12 rounded-xl text-lg font-semibold active:scale-95 transition-all border"
                  style={{ background: 'var(--badge-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>{n}</button>
              ))}
              <button onClick={() => handleInput('clear')} className="h-12 rounded-xl text-xs font-semibold active:scale-95 transition-all border"
                style={{ background: 'var(--badge-bg)', borderColor: 'var(--border)', color: 'var(--text-3)' }}>Clear</button>
              <button onClick={() => handleInput('0')} className="h-12 rounded-xl text-lg font-semibold active:scale-95 transition-all border"
                style={{ background: 'var(--badge-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>0</button>
              <button onClick={() => handleInput('back')} className="h-12 rounded-xl text-xs font-semibold active:scale-95 transition-all border"
                style={{ background: 'var(--badge-bg)', borderColor: 'var(--border)', color: 'var(--text-3)' }}>←</button>
            </div>
            {error && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-rose-600 text-center mt-2">{error}</motion.p>}
            <button onClick={onClose} className="w-full mt-3 text-[11px] font-medium py-2 rounded-xl transition-all" style={{ color: 'var(--text-3)' }}>Cancel</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
