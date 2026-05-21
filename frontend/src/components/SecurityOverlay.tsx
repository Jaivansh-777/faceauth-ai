import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldOff } from 'lucide-react'

let warningShown = false

export default function SecurityOverlay() {
  const [devToolsOpen, setDevToolsOpen] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (import.meta.env.DEV) return

    const handleContextMenu = (e: MouseEvent) => e.preventDefault()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) || (e.ctrlKey && e.key.toUpperCase() === 'U')) {
        e.preventDefault()
        if (!warningShown) { warningShown = true; setShowWarning(true); setTimeout(() => { setShowWarning(false); warningShown = false }, 4000) }
      }
    }

    let devtoolsInterval: number
    const checkDevTools = () => {
      const threshold = 160
      if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) setDevToolsOpen(true)
    }
    devtoolsInterval = window.setInterval(checkDevTools, 2000)

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    return () => { document.removeEventListener('contextmenu', handleContextMenu); document.removeEventListener('keydown', handleKeyDown); clearInterval(devtoolsInterval) }
  }, [])

  return (
    <>
      <AnimatePresence>
        {devToolsOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)' }}>
            <div className="text-center max-w-md mx-4">
              <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-6">
                <ShieldOff size={40} className="text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Developer Tools Detected</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>For security reasons, developer tools are not allowed while using FaceAuth AI. Please close all devtools panels to continue.</p>
              <button onClick={() => setDevToolsOpen(false)} className="px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)' }}>I've closed DevTools</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWarning && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] px-6 py-3 rounded-2xl border text-sm font-medium shadow-2xl"
            style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)', color: '#d97706', backdropFilter: 'blur(12px)' }}>
            Developer shortcuts are disabled in this application
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
