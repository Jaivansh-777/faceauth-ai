import { motion } from 'framer-motion'
import { Home, ScanFace } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="w-24 h-24 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto mb-6">
          <ScanFace size={48} style={{ color: 'var(--accent)' }} />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="text-7xl font-bold mb-2" style={{ color: 'var(--text)' }}>404</motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="text-lg mb-1" style={{ color: 'var(--text-2)' }}>Face not found</motion.p>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="text-sm mb-8" style={{ color: 'var(--text-3)' }}>The page you're looking for doesn't exist or has been moved.</motion.p>
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' }))}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg shadow-indigo-500/25" style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)' }}>
          <Home size={16} /> Back to Dashboard
        </motion.button>
      </div>
    </motion.div>
  )
}
