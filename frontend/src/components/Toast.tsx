import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, XCircle } from 'lucide-react'

interface Toast { id: number; message: string; type: 'success' | 'error' }
interface ToastContextValue { toast: (message: string, type?: 'success' | 'error') => void }

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })
export const useToast = () => useContext(ToastContext)
let nextId = 0

const toastVariants = {
  initial: { opacity: 0, x: 120, scale: 0.9 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 120, scale: 0.9 },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])
  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium border"
              style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(16px)',
                borderColor: t.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
              }}
            >
              {t.type === 'success' ? <CheckCircle size={16} className="shrink-0 text-emerald-500" /> : <XCircle size={16} className="shrink-0 text-red-500" />}
              <span className="flex-1" style={{ color: 'var(--text)' }}>{t.message}</span>
              <button onClick={() => remove(t.id)} className="opacity-40 hover:opacity-80 transition-opacity" style={{ color: 'var(--text)' }}>
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
